"use client";

import React, { useEffect, useRef, useState } from "react";
import type { InferenceSession } from "onnxruntime-web";
import { parseSmilesToGraph } from "@/lib/smiles";
import { ImageGenerationLoader } from "@/components/magic/ui";
import { PeriodicTableModal } from "@/components/PeriodicTableModal";

interface GNode {
  element: string;
  charge: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface GEdge {
  u: number;
  v: number;
  bond_type: number;
}
interface GraphState {
  nodes: GNode[];
  edges: GEdge[];
  physics: boolean;
  dragIdx: number;
  bondStart: number;
  hoverIdx: number;
  mouse: { x: number; y: number };
  readOnly: boolean;
}

const PALETTE = ["C", "N", "O", "Cl", "Br", "F", "S", "P", "Na+", "OH-", "Fe", "H"];
const ATOM_COLORS: Record<string, string> = {
  C: "#94a3b8", N: "#60a5fa", O: "#f87171", Cl: "#4ade80",
  Br: "#fb923c", F: "#2dd4bf", S: "#facc15", P: "#c084fc",
  H: "#e2e8f0", Na: "#818cf8", Fe: "#fbbf24",
};
const MODEL_URL = "https://media.githubusercontent.com/media/ihatebaselines/purcar.me/refs/heads/main/models/phc-1.onnx?v=phc-1-onnx-3";
const MODEL_SIZE = 203_328_124;
const ELEMENTS = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ");
const ATOMIC_NUMBERS = Object.fromEntries(ELEMENTS.map((element, index) => [element, index + 1]));
const TYPICAL_VALENCE: Record<string, number> = {
  H: 1, C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, S: 2, P: 3, B: 3, Si: 4,
};

function parseAtomToken(tok: string) {
  tok = tok.trim();
  if (!tok) return { element: "C", charge: 0 };
  const m = tok.match(/^([A-Za-z]+)([+-]\d*|\d*[+-])?$/);
  if (!m) return { element: tok, charge: 0 };
  let ch = 0;
  if (m[2]) {
    if (m[2] === "+") ch = 1;
    else if (m[2] === "-") ch = -1;
    else if (m[2].endsWith("+")) ch = parseInt(m[2]) || 1;
    else if (m[2].endsWith("-")) ch = -(parseInt(m[2]) || 1);
    else ch = parseInt(m[2]) || 0;
  }
  return { element: m[1], charge: ch };
}

function formatAtomToken(n: { element: string; charge: number }) {
  if (!n.charge) return n.element;
  if (n.charge === 1) return n.element + "+";
  if (n.charge === -1) return n.element + "-";
  return n.element + (n.charge > 0 ? `+${n.charge}` : `${n.charge}`);
}

export default function StudioPage() {
  const [tool, setTool] = useState<"select" | "add" | "bond" | "erase">("select");
  const [currentAtom, setCurrentAtom] = useState("C");
  const [currentCharge, setCurrentCharge] = useState(0);
  const [ptOpen, setPtOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keepAll, setKeepAll] = useState(false);
  const [status, setStatus] = useState("PHC-1 runs in your browser · first prediction fetches the model.");

  const [smilesA, setSmilesA] = useState("CC(=O)Cl");
  const [smilesB, setSmilesB] = useState("CN");
  const [predSmiles, setPredSmiles] = useState("-");
  const sessionRef = useRef<InferenceSession | null>(null);
  const modelLoadRef = useRef<Promise<InferenceSession> | null>(null);

  const [nodesText, setNodesText] = useState({ A: "", B: "", C: "" });
  const [edgesText, setEdgesText] = useState({ A: "", B: "", C: "" });
  const [stats, setStats] = useState({ A: "0V / 0E", B: "0V / 0E", C: "0V / 0E" });
  const [phys, setPhys] = useState({ A: true, B: true, C: true });

  const canvasRefs = {
    A: useRef<HTMLCanvasElement>(null),
    B: useRef<HTMLCanvasElement>(null),
    C: useRef<HTMLCanvasElement>(null),
  };

  const graphsRef = useRef<Record<"A" | "B" | "C", GraphState>>({
    A: { nodes: [], edges: [], physics: true, dragIdx: -1, bondStart: -1, hoverIdx: -1, mouse: { x: 0, y: 0 }, readOnly: false },
    B: { nodes: [], edges: [], physics: true, dragIdx: -1, bondStart: -1, hoverIdx: -1, mouse: { x: 0, y: 0 }, readOnly: false },
    C: { nodes: [], edges: [], physics: true, dragIdx: -1, bondStart: -1, hoverIdx: -1, mouse: { x: 0, y: 0 }, readOnly: true },
  });

  const toolRef = useRef(tool);
  const atomRef = useRef({ element: currentAtom, charge: currentCharge });
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { atomRef.current = { element: currentAtom, charge: currentCharge }; }, [currentAtom, currentCharge]);

  function syncTextFromGraph(k: "A" | "B" | "C") {
    const g = graphsRef.current[k];
    setNodesText((p) => ({ ...p, [k]: g.nodes.map(formatAtomToken).join(" ") }));
    setEdgesText((p) => ({ ...p, [k]: g.edges.map((e) => `${e.u} ${e.v} ${e.bond_type}`).join("\n") }));
    setStats((p) => ({ ...p, [k]: `${g.nodes.length}V / ${g.edges.length}E` }));
  }

  function setGraphData(k: "A" | "B" | "C", data: { nodes?: { element: string; charge: number; x: number; y: number }[]; edges?: GEdge[] }) {
    const g = graphsRef.current[k];
    const c = canvasRefs[k].current;
    const w = c?.width || 520, h = c?.height || 320;
    const nodes = data?.nodes || [];
    if (!nodes.length) {
      g.nodes = []; g.edges = [];
      syncTextFromGraph(k);
      return;
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); });
    const scale = Math.min((w - 100) / Math.max(maxX - minX, 40), (h - 100) / Math.max(maxY - minY, 40), 1.4);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    g.nodes = nodes.map((n) => ({ element: n.element || "C", charge: n.charge || 0, x: w / 2 + (n.x - cx) * scale, y: h / 2 + (n.y - cy) * scale, vx: 0, vy: 0 }));
    g.edges = (data.edges || []).map((e) => ({ u: e.u, v: e.v, bond_type: e.bond_type || 1 }));
    syncTextFromGraph(k);
  }

  function syncFromText(k: "A" | "B", nTxt: string, eTxt: string) {
    setNodesText((p) => ({ ...p, [k]: nTxt }));
    setEdgesText((p) => ({ ...p, [k]: eTxt }));
    const g = graphsRef.current[k];
    const c = canvasRefs[k].current;
    const cx = (c?.width || 520) / 2, cy = (c?.height || 320) / 2;
    const tokens = nTxt.trim().split(/[\s,]+/).filter(Boolean);
    g.nodes = tokens.map((tok, i) => {
      const p = parseAtomToken(tok), o = g.nodes[i];
      return { element: p.element, charge: p.charge, x: o ? o.x : cx + Math.cos(i * 1.3) * 70, y: o ? o.y : cy + Math.sin(i * 1.3) * 70, vx: 0, vy: 0 };
    });
    const edges: GEdge[] = [];
    eTxt.trim().split("\n").forEach((l) => {
      const p = l.trim().split(/[\s,]+/);
      if (p.length >= 2) {
        const u = parseInt(p[0]), v = parseInt(p[1]), b = p[2] ? Math.max(1, Math.min(4, parseInt(p[2]) || 1)) : 1;
        if (!isNaN(u) && !isNaN(v) && u >= 0 && v >= 0 && u < g.nodes.length && v < g.nodes.length && u !== v) edges.push({ u, v, bond_type: b });
      }
    });
    g.edges = edges;
    setStats((p) => ({ ...p, [k]: `${g.nodes.length}V / ${g.edges.length}E` }));
  }

  async function getModelSession() {
    if (sessionRef.current) return sessionRef.current;
    if (modelLoadRef.current) return modelLoadRef.current;

    const loadPromise = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      ort.env.wasm.wasmPaths = "/onnxruntime/";
      ort.env.wasm.proxy = true;

      setStatus("Fetching PHC-1 model…");
      let cache: Cache | null = null;
      let response: Response | undefined;
      let shouldCache = false;
      try {
        cache = await caches.open("purcar-phc-1-model-v2");
        response = await cache.match(MODEL_URL);
      } catch {
        cache = null;
      }
      if (!response) {
        response = await fetch(MODEL_URL, { cache: "force-cache" });
        shouldCache = true;
      }
      if (!response.ok) {
        const detail = (await response.text()).trim();
        throw new Error(detail || `Model fetch failed (${response.status})`);
      }

      const reportedSize = Number(response.headers.get("content-length")) || MODEL_SIZE;
      if (reportedSize !== MODEL_SIZE) {
        if (cache) await cache.delete(MODEL_URL).catch(() => false);
        throw new Error(`PHC-1 model size mismatch (${reportedSize.toLocaleString()} bytes).`);
      }
      const modelBytes = new Uint8Array(MODEL_SIZE);
      // Clone before locking the response body with getReader().
      const cacheResponse = cache && shouldCache ? response.clone() : null;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("PHC-1 response did not include a readable body. Please retry.");
      const cacheWrite = cacheResponse
        ? cache!.put(MODEL_URL, cacheResponse).then(() => true, () => false)
        : null;
      let received = 0;
      let lastUpdate = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (received + value.byteLength > MODEL_SIZE) {
            throw new Error("PHC-1 response was larger than expected. Please retry.");
          }
          modelBytes.set(value, received);
          received += value.byteLength;
          const now = Date.now();
          if (now - lastUpdate > 180 || received >= MODEL_SIZE) {
            const fetched = `${(received / 1024 / 1024).toFixed(0)} MB`;
            const percent = ` · ${Math.min(99, Math.round(received / MODEL_SIZE * 100))}%`;
            setStatus(`Fetching PHC-1 · ${fetched}${percent}`);
            lastUpdate = now;
          }
        }
      } catch (error) {
        if (cacheWrite) await cacheWrite;
        if (cache) await cache.delete(MODEL_URL).catch(() => false);
        throw error;
      }
      if (received !== MODEL_SIZE) {
        if (cacheWrite) await cacheWrite;
        if (cache) await cache.delete(MODEL_URL).catch(() => false);
        throw new Error(`PHC-1 fetch was incomplete (${received.toLocaleString()} of ${MODEL_SIZE.toLocaleString()} bytes). Please retry.`);
      }
      if (cacheWrite) await cacheWrite;

      setStatus("Starting ONNX Runtime WebAssembly…");
      const session = await ort.InferenceSession.create(modelBytes, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "basic",
      });
      sessionRef.current = session;
      setStatus("PHC-1 ready · running privately in this browser.");
      return session;
    })();

    modelLoadRef.current = loadPromise;
    try {
      return await loadPromise;
    } finally {
      modelLoadRef.current = null;
    }
  }

  async function loadSmiles(k: "A" | "B", smi: string) {
    if (!smi.trim()) { graphsRef.current[k].nodes = []; graphsRef.current[k].edges = []; syncTextFromGraph(k); return; }
    try {
      const res = await fetch("/api/smiles_to_graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ smiles: smi.trim() }) });
      if (!res.ok) throw new Error("Backend unavailable");
      const d = await res.json();
      if (d.error) { setStatus(d.error); return; }
      setGraphData(k, d);
    } catch {
      try {
        const parsed = parseSmilesToGraph(smi.trim());
        setGraphData(k, parsed);
        setStatus(`Loaded ${parsed.nodes.length} atoms · ${parsed.edges.length} bonds (in-browser SMILES parser).`);
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Could not parse SMILES.");
      }
    }
  }

  async function predict() {
    setLoading(true);
    try {
      const ort = await import("onnxruntime-web/wasm");
      const session = await getModelSession();
      const gA = graphsRef.current.A, gB = graphsRef.current.B;
      const offsetB = gA.nodes.length;
      const combinedNodes = [
        ...gA.nodes.map((node) => ({ ...node, x: node.x * 0.5 })),
        ...gB.nodes.map((node) => ({ ...node, x: 260 + node.x * 0.5 })),
      ];
      const combinedEdges = [
        ...gA.edges,
        ...gB.edges.map((edge) => ({ ...edge, u: edge.u + offsetB, v: edge.v + offsetB })),
      ];
      const nodeCount = combinedNodes.length;
      if (!nodeCount) throw new Error("Add at least one atom before predicting.");

      const source: number[] = [];
      const destination: number[] = [];
      const edgeTypes: number[] = [];
      const degree = new Array(nodeCount).fill(0);
      const bondOrder = new Array(nodeCount).fill(0);
      const aromatic = new Array(nodeCount).fill(0);
      for (const edge of combinedEdges) {
        if (edge.u < 0 || edge.v < 0 || edge.u >= nodeCount || edge.v >= nodeCount || edge.u === edge.v) continue;
        const modelType = Math.max(1, Math.min(4, edge.bond_type)) - 1;
        source.push(edge.u, edge.v);
        destination.push(edge.v, edge.u);
        edgeTypes.push(modelType, modelType);
        degree[edge.u] += 1;
        degree[edge.v] += 1;
        const order = edge.bond_type === 4 ? 1.5 : edge.bond_type;
        bondOrder[edge.u] += order;
        bondOrder[edge.v] += order;
        if (edge.bond_type === 4) aromatic[edge.u] = aromatic[edge.v] = 1;
      }

      const atoms = new BigInt64Array(nodeCount);
      const atomFeatures = new Float32Array(nodeCount * 4);
      combinedNodes.forEach((node, index) => {
        atoms[index] = BigInt(ATOMIC_NUMBERS[node.element] || 6);
        const valence = TYPICAL_VALENCE[node.element] ?? 0;
        const hydrogens = Math.max(0, Math.round(valence - bondOrder[index] + node.charge));
        atomFeatures[index * 4] = node.charge;
        atomFeatures[index * 4 + 1] = aromatic[index];
        atomFeatures[index * 4 + 2] = hydrogens;
        atomFeatures[index * 4 + 3] = degree[index];
      });

      const edgeCount = source.length;
      const edgeIndex = new BigInt64Array(edgeCount * 2);
      const edgeTypeTensor = new BigInt64Array(edgeCount);
      for (let index = 0; index < edgeCount; index++) {
        edgeIndex[index] = BigInt(source[index]);
        edgeIndex[edgeCount + index] = BigInt(destination[index]);
        edgeTypeTensor[index] = BigInt(edgeTypes[index]);
      }

      setStatus("Predicting locally with PHC-1…");
      const outputs = await session.run({
        x: new ort.Tensor("int64", atoms, [nodeCount]),
        edge_index: new ort.Tensor("int64", edgeIndex, [2, edgeCount]),
        edge_type: new ort.Tensor("int64", edgeTypeTensor, [edgeCount]),
        atom_feats: new ort.Tensor("float32", atomFeatures, [nodeCount, 4]),
      });
      const bondLogits = outputs.bond_logits.data as Float32Array;
      const chargeLogits = outputs.charge_logits.data as Float32Array;
      const predictedNodes = combinedNodes.map((node, index) => {
        let bestCharge = 0, bestScore = -Infinity;
        for (let chargeIndex = 0; chargeIndex < 11; chargeIndex++) {
          const score = chargeLogits[index * 11 + chargeIndex];
          if (score > bestScore) { bestScore = score; bestCharge = chargeIndex; }
        }
        return { ...node, charge: bestCharge - 5 };
      });
      const predictedEdges: GEdge[] = [];
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          let bestClass = 0, bestScore = -Infinity;
          for (let bondClass = 0; bondClass < 5; bondClass++) {
            const forward = bondLogits[(i * nodeCount + j) * 5 + bondClass];
            const reverse = bondLogits[(j * nodeCount + i) * 5 + bondClass];
            const score = 0.5 * (forward + reverse);
            if (score > bestScore) { bestScore = score; bestClass = bondClass; }
          }
          if (bestClass > 0) predictedEdges.push({ u: i, v: j, bond_type: bestClass });
        }
      }

      let productNodes = predictedNodes;
      let productEdges = predictedEdges;
      if (!keepAll && predictedNodes.length) {
        const adjacency = predictedNodes.map(() => [] as number[]);
        predictedEdges.forEach(({ u, v }) => { adjacency[u].push(v); adjacency[v].push(u); });
        const visited = new Set<number>();
        let largest: number[] = [];
        for (let start = 0; start < nodeCount; start++) {
          if (visited.has(start)) continue;
          const component: number[] = [], queue = [start];
          visited.add(start);
          while (queue.length) {
            const current = queue.shift()!;
            component.push(current);
            for (const next of adjacency[current]) if (!visited.has(next)) { visited.add(next); queue.push(next); }
          }
          if (component.length > largest.length) largest = component;
        }
        const remap = new Map(largest.map((oldIndex, newIndex) => [oldIndex, newIndex]));
        productNodes = largest.map((index) => predictedNodes[index]);
        productEdges = predictedEdges
          .filter((edge) => remap.has(edge.u) && remap.has(edge.v))
          .map((edge) => ({ ...edge, u: remap.get(edge.u)!, v: remap.get(edge.v)! }));
      }

      setGraphData("C", { nodes: productNodes, edges: productEdges });
      setPredSmiles(`${productNodes.length} atoms · ${productEdges.length} bonds`);
      setStatus("Prediction complete · ONNX WASM · kept on this device.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PHC-1 could not run in this browser.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRandom(kind: "organic" | "inorganic") {
    try {
      const res = await fetch(`/api/random_test?kind=${kind}`);
      const d = await res.json();
      if (d.error) { setStatus(d.error); return; }
      setSmilesA(d.smiles_a || "");
      setSmilesB(d.smiles_b || "");
      setKeepAll(!!d.keep_all);
      setGraphData("A", d.graph_a);
      setGraphData("B", d.graph_b);
      await predict();
    } catch {
      setStatus("Random dataset examples need the chemistry service. The loaded graphs still work in-browser.");
    }
  }

  useEffect(() => {
    setGraphData("A", {
      nodes: [
        { element: "C", charge: 0, x: 150, y: 160 },
        { element: "C", charge: 0, x: 235, y: 160 },
        { element: "O", charge: 0, x: 320, y: 160 },
        { element: "Cl", charge: 0, x: 405, y: 160 },
      ],
      edges: [{ u: 0, v: 1, bond_type: 1 }, { u: 1, v: 2, bond_type: 2 }, { u: 1, v: 3, bond_type: 1 }],
    });
    setGraphData("B", {
      nodes: [{ element: "C", charge: 0, x: 215, y: 160 }, { element: "N", charge: 0, x: 305, y: 160 }],
      edges: [{ u: 0, v: 1, bond_type: 1 }],
    });
    let raf = 0;
    const loop = () => {
      (["A", "B", "C"] as const).forEach((k) => {
        const g = graphsRef.current[k];
        const c = canvasRefs[k].current;
        if (!c) return;
        const w = c.width, h = c.height;
        if (g.physics && g.nodes.length) {
          for (let i = 0; i < g.nodes.length; i++) {
            if (i === g.dragIdx) continue;
            const a = g.nodes[i];
            let fx = (w / 2 - a.x) * 0.008, fy = (h / 2 - a.y) * 0.008;
            for (let j = 0; j < g.nodes.length; j++) {
              if (i === j) continue;
              const dx = a.x - g.nodes[j].x, dy = a.y - g.nodes[j].y;
              const d2 = Math.max(16, dx * dx + dy * dy), d = Math.sqrt(d2), rep = 1400 / d2;
              fx += (dx / d) * rep; fy += (dy / d) * rep;
            }
            a.vx = (a.vx + fx) * 0.8; a.vy = (a.vy + fy) * 0.8;
          }
          g.edges.forEach((e) => {
            const a = g.nodes[e.u], b = g.nodes[e.v];
            if (!a || !b) return;
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(Math.hypot(dx, dy), 1), f = (d - 62) * 0.055;
            if (e.u !== g.dragIdx) { a.vx += (dx / d) * f; a.vy += (dy / d) * f; }
            if (e.v !== g.dragIdx) { b.vx -= (dx / d) * f; b.vy -= (dy / d) * f; }
          });
          g.nodes.forEach((a, i) => {
            if (i !== g.dragIdx) {
              a.x = Math.max(24, Math.min(w - 24, a.x + a.vx));
              a.y = Math.max(24, Math.min(h - 24, a.y + a.vy));
            }
          });
        }
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        g.edges.forEach((e) => {
          const a = g.nodes[e.u], b = g.nodes[e.v];
          if (!a || !b) return;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.max(Math.hypot(dx, dy), 1), nx = -dy / len, ny = dx / len;
          ctx.strokeStyle = "#6d91a8"; ctx.lineWidth = 2.25; ctx.setLineDash([]);
          if (e.bond_type === 1) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          else if (e.bond_type === 2) { [-3.5, 3.5].forEach((o) => { ctx.beginPath(); ctx.moveTo(a.x + nx * o, a.y + ny * o); ctx.lineTo(b.x + nx * o, b.y + ny * o); ctx.stroke(); }); }
          else if (e.bond_type === 3) { [-5, 0, 5].forEach((o) => { ctx.beginPath(); ctx.moveTo(a.x + nx * o, a.y + ny * o); ctx.lineTo(b.x + nx * o, b.y + ny * o); ctx.stroke(); }); }
          else { ctx.strokeStyle = "#287eae"; ctx.beginPath(); ctx.moveTo(a.x + nx * 2.5, a.y + ny * 2.5); ctx.lineTo(b.x + nx * 2.5, b.y + ny * 2.5); ctx.stroke(); }
        });
        if (g.bondStart >= 0 && g.nodes[g.bondStart]) {
          ctx.strokeStyle = "#287eae"; ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(g.nodes[g.bondStart].x, g.nodes[g.bondStart].y); ctx.lineTo(g.mouse.x, g.mouse.y); ctx.stroke(); ctx.setLineDash([]);
        }
        g.nodes.forEach((n, idx) => {
          const col = ATOM_COLORS[n.element] || "#cbd5e1";
          const hot = idx === g.hoverIdx || idx === g.bondStart || idx === g.dragIdx;
          ctx.beginPath(); ctx.arc(n.x, n.y, 17, 0, Math.PI * 2); ctx.fillStyle = hot ? "#e6f6ff" : "#ffffff"; ctx.fill();
          ctx.lineWidth = hot ? 3 : 2; ctx.strokeStyle = hot ? "#176b99" : col; ctx.stroke();
          ctx.fillStyle = "#123751"; ctx.font = "bold 12px JetBrains Mono, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(formatAtomToken(n), n.x, n.y);
        });
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function bindCanvas(k: "A" | "B" | "C") {
    const getPos = (c: HTMLCanvasElement, e: React.MouseEvent) => {
      const r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    };
    const hit = (g: GraphState, x: number, y: number) => {
      for (let i = g.nodes.length - 1; i >= 0; i--) if (Math.hypot(g.nodes[i].x - x, g.nodes[i].y - y) <= 19) return i;
      return -1;
    };
    return {
      onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => {
        // This callback runs in response to pointer input, outside render.
        // eslint-disable-next-line react-hooks/refs
        const c = e.currentTarget, g = graphsRef.current[k], { x, y } = getPos(c, e), ni = hit(g, x, y);
        g.mouse = { x, y };
        if (g.readOnly) { if (ni >= 0) g.dragIdx = ni; return; }
        if (toolRef.current === "erase" && ni >= 0) {
          g.nodes.splice(ni, 1);
          g.edges = g.edges.filter((ed) => ed.u !== ni && ed.v !== ni).map((ed) => ({ u: ed.u > ni ? ed.u - 1 : ed.u, v: ed.v > ni ? ed.v - 1 : ed.v, bond_type: ed.bond_type }));
          syncTextFromGraph(k); return;
        }
        if ((toolRef.current === "bond" || e.shiftKey) && ni >= 0) { g.bondStart = ni; return; }
        if (toolRef.current === "add" && ni < 0) {
          // This callback runs in response to pointer input, outside render.
          // eslint-disable-next-line react-hooks/refs
          g.nodes.push({ element: atomRef.current.element, charge: atomRef.current.charge, x, y, vx: 0, vy: 0 });
          syncTextFromGraph(k); return;
        }
        if (ni >= 0) g.dragIdx = ni;
      },
      onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => {
        const c = e.currentTarget, g = graphsRef.current[k], { x, y } = getPos(c, e);
        g.mouse = { x, y }; g.hoverIdx = hit(g, x, y);
        if (g.dragIdx >= 0 && g.nodes[g.dragIdx]) { g.nodes[g.dragIdx].x = x; g.nodes[g.dragIdx].y = y; g.nodes[g.dragIdx].vx = 0; g.nodes[g.dragIdx].vy = 0; }
      },
      onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => {
        const c = e.currentTarget, g = graphsRef.current[k];
        if (g.bondStart >= 0) {
          const { x, y } = getPos(c, e), t = hit(g, x, y);
          if (t >= 0 && t !== g.bondStart) {
            const idx = g.edges.findIndex((ed) => (ed.u === g.bondStart && ed.v === t) || (ed.u === t && ed.v === g.bondStart));
            if (idx >= 0) { if (g.edges[idx].bond_type < 4) g.edges[idx].bond_type += 1; else g.edges.splice(idx, 1); }
            else g.edges.push({ u: g.bondStart, v: t, bond_type: 1 });
            syncTextFromGraph(k);
          }
          g.bondStart = -1;
        }
        g.dragIdx = -1;
      },
    };
  }

  return (
    <main className="studio-page max-w-[1560px] mx-auto px-5 py-5 pb-28">
      <div className="studio-heading">
        <div><span className="studio-kicker">PURCAR HEXOCHEM · PHC / 001</span><h1>HexoChemStudio1.2</h1><p>Build a reaction, then explore what the model predicts.</p></div>
        <div className="studio-heading-mark" aria-hidden="true"><span>PHC</span><i>✳</i></div>
      </div>
      <div className="studio-toolbar flex flex-wrap items-center justify-between gap-3 p-3.5 mb-3 rounded-xl border border-white/10 bg-[#101215]">
        <div className="flex flex-wrap items-center gap-2">
          {(["select", "add", "bond", "erase"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`studio-button px-3 py-1.5 rounded text-xs font-semibold border ${
                tool === t ? "studio-button-active bg-[#4a9390] border-[#4a9390] text-white" : "bg-[#15181c] border-white/15 text-zinc-300"
              }`}
            >
              {t === "select" ? "Move / Drag" : t === "add" ? "Add Atom" : t === "bond" ? "Add / Cycle Bond" : "Delete"}
            </button>
          ))}
          <span className="text-zinc-600">|</span>
          {PALETTE.map((tok) => (
            <button
              key={tok}
              onClick={() => { const p = parseAtomToken(tok); setCurrentAtom(p.element); setCurrentCharge(p.charge); setTool("add"); }}
              className={`studio-button studio-atom-button px-2 py-1 rounded text-xs border ${
                tok === formatAtomToken({ element: currentAtom, charge: currentCharge })
                  ? "studio-button-active bg-[#4a9390] border-[#4a9390] text-white"
                  : "bg-[#15181c] border-white/10 text-zinc-300"
              }`}
            >
              {tok}
            </button>
          ))}
          <button onClick={() => setPtOpen(true)} className="studio-button studio-periodic-button px-3 py-1 rounded text-xs border border-[#4a9390] text-[#5cb0ac] font-semibold">
            Periodic Table (118)
          </button>
        </div>

        <div className="studio-action-row flex flex-wrap items-center gap-2">
          <button onClick={() => loadRandom("organic")} className="studio-button px-3 py-1.5 rounded text-xs bg-[#15181c] border border-white/15">Random Organic</button>
          <button onClick={() => loadRandom("inorganic")} className="studio-button px-3 py-1.5 rounded text-xs bg-[#15181c] border border-white/15">Random Inorganic</button>
          <label className="studio-checkbox flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={keepAll} onChange={(e) => setKeepAll(e.target.checked)} className="accent-[#4a9390]" />
            all fragments
          </label>
          <button onClick={() => fetch("/api/reload", { method: "POST" }).then(() => setStatus("Reloaded checkpoint"))} className="studio-button px-3 py-1.5 rounded text-xs bg-[#15181c] border border-white/15">
            Reload Model
          </button>
          <button onClick={predict} className="studio-button studio-predict-button px-4 py-1.5 rounded text-xs font-bold bg-[#4a9390] hover:bg-[#5cb0ac] text-white">
            Predict A + B &rarr; C
          </button>
        </div>
      </div>

      <p className="studio-status text-xs text-zinc-400 mb-3" role="status">{status}</p>

      <div className="studio-workspace grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(["A", "B"] as const).map((k) => (
          <div key={k} className="studio-panel studio-reactant-panel rounded-xl border border-white/10 bg-[#101215] overflow-hidden flex flex-col">
            <div className="studio-panel-header px-3.5 py-2.5 border-b border-white/10 bg-[#15181c] flex items-center justify-between">
              <span className="studio-panel-title text-sm font-semibold"><span className="studio-panel-index">0{k === "A" ? "1" : "2"}</span> Reactant {k} <span className="studio-stat text-xs text-zinc-400 font-normal ml-1">{stats[k]}</span></span>
              <button
                onClick={() => { graphsRef.current[k].physics = !graphsRef.current[k].physics; setPhys((p) => ({ ...p, [k]: graphsRef.current[k].physics })); }}
                className="studio-button studio-physics-button px-2 py-1 rounded text-[11px] bg-[#0b0c0e] border border-white/15"
              >
                Physics: {phys[k] ? "ON" : "OFF"}
              </button>
            </div>
            <div className="studio-smiles-row p-2 border-b border-white/10 flex gap-1.5 bg-[#0b0c0e]">
              <input
                value={k === "A" ? smilesA : smilesB}
                onChange={(e) => (k === "A" ? setSmilesA(e.target.value) : setSmilesB(e.target.value))}
                aria-label={`Reactant ${k} SMILES`}
                className="studio-smiles-input flex-1 px-2 py-1 rounded bg-[#101215] border border-white/15 text-xs"
              />
              <button onClick={() => loadSmiles(k, k === "A" ? smilesA : smilesB)} className="studio-button px-2.5 py-1 rounded text-xs bg-[#15181c] border border-white/15">Load</button>
            </div>
            <div className="studio-canvas-wrap"><canvas ref={canvasRefs[k]} width={520} height={320} className="studio-canvas w-full h-[320px] bg-[#0b0c0e] block cursor-crosshair" {...bindCanvas(k)} /><span className="studio-canvas-hint">Drag atoms · Shift + drag to bond</span></div>
            <details className="studio-advanced">
              <summary>Advanced graph data <span>{stats[k]}</span></summary>
              <div className="studio-advanced-fields p-2.5 grid grid-cols-2 gap-2">
              <div>
                <label className="studio-field-label block text-[11px] text-zinc-400 mb-1">Node labels</label>
                <textarea rows={4} value={nodesText[k]} onChange={(e) => syncFromText(k, e.target.value, edgesText[k])} className="studio-textarea w-full p-1.5 rounded bg-[#0b0c0e] border border-white/15 text-xs" />
              </div>
              <div>
                <label className="studio-field-label block text-[11px] text-zinc-400 mb-1">Edges (u v [1-4])</label>
                <textarea rows={4} value={edgesText[k]} onChange={(e) => syncFromText(k, nodesText[k], e.target.value)} className="studio-textarea w-full p-1.5 rounded bg-[#0b0c0e] border border-white/15 text-xs" />
              </div>
              </div>
            </details>
          </div>
        ))}

        {/* Product C */}
        <div className="studio-panel studio-product-panel rounded-xl border border-white/10 bg-[#101215] overflow-hidden flex flex-col">
          <div className="studio-panel-header px-3.5 py-2.5 border-b border-white/10 bg-[#15181c] flex items-center justify-between">
            <span className="studio-panel-title studio-product-title text-sm font-semibold"><span className="studio-panel-index">03</span> Product C <span className="studio-stat text-xs text-zinc-400 font-normal ml-1">{stats.C}</span></span>
            <span className="studio-physics-button px-2 py-1 rounded text-[11px] border border-white/15">ONNX · WASM</span>
          </div>
          <div className="studio-product-smiles p-2 border-b border-white/10 flex justify-between items-center bg-[#0b0c0e] text-xs">
            <span>Predicted graph</span>
            <code className="truncate max-w-[260px]">{predSmiles}</code>
          </div>
          <div className="studio-canvas-wrap relative">
            <canvas ref={canvasRefs.C} width={520} height={320} className="studio-canvas w-full h-[320px]" {...bindCanvas("C")} />
            {predSmiles === "-" && <span className="studio-canvas-empty">Run a prediction to see the product graph</span>}
            <ImageGenerationLoader active={loading} />
          </div>
          <div className="studio-product-meta p-3 border-t border-white/10 bg-[#15181c] text-xs space-y-2">
            <div className="flex justify-between"><span>Inference</span><code className="truncate max-w-[240px]">On this device · model stays in browser</code></div>
          </div>
        </div>
      </div>

      <PeriodicTableModal
        open={ptOpen}
        currentAtom={currentAtom}
        charge={currentCharge}
        onChargeChange={setCurrentCharge}
        onSelect={(sym) => { setCurrentAtom(sym); setTool("add"); }}
        onClose={() => setPtOpen(false)}
      />
    </main>
  );
}
