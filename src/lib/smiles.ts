export interface SmilesNode {
  element: string;
  charge: number;
  x: number;
  y: number;
}

export interface SmilesEdge {
  u: number;
  v: number;
  bond_type: number;
}

function parseBracketAtom(content: string): { element: string; charge: number; aromatic: boolean } {
  // Strip leading isotope digits
  let i = 0;
  while (i < content.length && content[i] >= "0" && content[i] <= "9") i++;

  let element = "C";
  let aromatic = false;
  if (i < content.length) {
    const ch = content[i];
    if (ch >= "a" && ch <= "z") {
      aromatic = true;
      element = ch.toUpperCase();
      i++;
    } else if (ch >= "A" && ch <= "Z") {
      element = ch;
      i++;
      if (i < content.length && content[i] >= "a" && content[i] <= "z") {
        element += content[i];
        i++;
      }
    }
  }

  let charge = 0;
  const plusIdx = content.indexOf("+", i);
  const minusIdx = content.indexOf("-", i);
  if (plusIdx !== -1) {
    const rest = content.slice(plusIdx + 1);
    const numMatch = rest.match(/^\d+/);
    if (numMatch) charge = parseInt(numMatch[0], 10);
    else {
      charge = 1;
      for (let j = plusIdx + 1; j < content.length && content[j] === "+"; j++) charge++;
    }
  } else if (minusIdx !== -1) {
    const rest = content.slice(minusIdx + 1);
    const numMatch = rest.match(/^\d+/);
    if (numMatch) charge = -parseInt(numMatch[0], 10);
    else {
      charge = -1;
      for (let j = minusIdx + 1; j < content.length && content[j] === "-"; j++) charge--;
    }
  }

  return { element, charge, aromatic };
}

export function parseSmilesToGraph(smiles: string): { nodes: SmilesNode[]; edges: SmilesEdge[] } {
  const s = smiles.trim();
  const nodes: SmilesNode[] = [];
  const edges: SmilesEdge[] = [];
  const isAromatic: boolean[] = [];

  const branchStack: (number | null)[] = [];
  const rings = new Map<string, { atom: number; bond: number | null }>();
  let prevAtom: number | null = null;
  let pendingBond: number | null = null;

  let i = 0;
  while (i < s.length) {
    const ch = s[i];

    if (ch === " " || ch === "\t") { i++; continue; }
    if (ch === ".") { prevAtom = null; pendingBond = null; i++; continue; }
    if (ch === "(") { branchStack.push(prevAtom); i++; continue; }
    if (ch === ")") { prevAtom = branchStack.pop() ?? null; pendingBond = null; i++; continue; }
    if (ch === "-") { pendingBond = 1; i++; continue; }
    if (ch === "=") { pendingBond = 2; i++; continue; }
    if (ch === "#") { pendingBond = 3; i++; continue; }
    if (ch === ":") { pendingBond = 4; i++; continue; }
    if (ch === "/" || ch === "\\") { i++; continue; }

    // Ring closure: %NN or single digit
    if (ch === "%" || (ch >= "0" && ch <= "9")) {
      let key = ch;
      if (ch === "%") {
        key = s.slice(i, i + 3);
        i += 3;
      } else {
        i++;
      }
      if (prevAtom !== null) {
        const open = rings.get(key);
        if (open !== undefined) {
          const bondType = pendingBond ?? open.bond ?? (isAromatic[open.atom] && isAromatic[prevAtom] ? 4 : 1);
          edges.push({ u: open.atom, v: prevAtom, bond_type: bondType });
          rings.delete(key);
        } else {
          rings.set(key, { atom: prevAtom, bond: pendingBond });
        }
        pendingBond = null;
      }
      continue;
    }

    let element = "C";
    let charge = 0;
    let aromatic = false;

    if (ch === "[") {
      const end = s.indexOf("]", i + 1);
      if (end === -1) throw new Error("Unclosed '[' in SMILES.");
      const parsed = parseBracketAtom(s.slice(i + 1, end));
      element = parsed.element;
      charge = parsed.charge;
      aromatic = parsed.aromatic;
      i = end + 1;
    } else if (ch === "C" && s[i + 1] === "l") {
      element = "Cl";
      i += 2;
    } else if (ch === "B" && s[i + 1] === "r") {
      element = "Br";
      i += 2;
    } else if ("cnospb".includes(ch)) {
      element = ch.toUpperCase();
      aromatic = true;
      i++;
    } else if ("CNOSPFIBH".includes(ch)) {
      element = ch;
      i++;
    } else {
      throw new Error(`Unsupported SMILES token '${ch}' at position ${i + 1}.`);
    }

    const idx = nodes.length;
    nodes.push({ element, charge, x: 0, y: 0 });
    isAromatic.push(aromatic);

    if (prevAtom !== null) {
      const bondType = pendingBond ?? (aromatic && isAromatic[prevAtom] ? 4 : 1);
      edges.push({ u: prevAtom, v: idx, bond_type: bondType });
    }
    prevAtom = idx;
    pendingBond = null;
  }

  // Simple circular/grid initial layout (physics simulation in canvas will refine it)
  const n = nodes.length;
  const cx = 190;
  const cy = 125;
  const radius = Math.min(85, Math.max(36, n * 10));
  nodes.forEach((node, idx) => {
    if (n === 1) {
      node.x = cx;
      node.y = cy;
    } else {
      const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
      node.x = cx + Math.cos(angle) * radius;
      node.y = cy + Math.sin(angle) * radius;
    }
  });

  return { nodes, edges };
}
