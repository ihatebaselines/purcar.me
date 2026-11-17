"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/* ---------- ScrollProgress ---------- */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50, restDelta: 0.001 });
  return (
    <motion.div
      className={cn("fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#4a9390] via-[#5cb0ac] to-[#818cf8]", className)}
      style={{ scaleX }}
    />
  );
}

/* ---------- Meteors ---------- */
export function Meteors({ number = 24, className }: { number?: number; className?: string }) {
  const styles = useMemo(
    () => Array.from({ length: number }, (_, i) => ({
      top: -5,
      left: `${((i * 37.31 + number * 13) % 100).toFixed(2)}%`,
      animationDelay: `${((i * 1.73 + number * 0.37) % 5).toFixed(2)}s`,
      animationDuration: `${(3 + ((i * 2.17 + number * 0.13) % 6)).toFixed(2)}s`,
    })),
    [number],
  );
  return (
    <>
      {styles.map((style, i) => (
        <span
          key={i}
          style={style}
          className={cn(
            "pointer-events-none absolute size-0.5 rotate-[215deg] animate-[meteor_linear_infinite] rounded-full bg-zinc-300 shadow-[0_0_0_1px_#ffffff10]",
            className
          )}
        >
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2 bg-gradient-to-r from-zinc-400 to-transparent" />
        </span>
      ))}
    </>
  );
}

/* ---------- Particles (mouse-reactive canvas) ---------- */
export function Particles({
  className,
  quantity = 100,
  ease = 80,
  color = "#ffffff",
  size = 0.4,
}: {
  className?: string;
  quantity?: number;
  ease?: number;
  color?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;
    type P = { x: number; y: number; tx: number; ty: number; s: number; a: number; ta: number; dx: number; dy: number; mag: number };
    let ps: P[] = [];
    const hex = color.replace("#", "");
    const rgb = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)].join(" ");
    const mk = (): P => ({
      x: Math.random() * w, y: Math.random() * h, tx: 0, ty: 0,
      s: Math.floor(Math.random() * 2) + size,
      a: 0, ta: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1, dy: (Math.random() - 0.5) * 0.1,
      mag: 0.1 + Math.random() * 4,
    });
    const resize = () => {
      w = wrap.offsetWidth; h = wrap.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ps = Array.from({ length: quantity }, mk);
    };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left - w / 2, y: e.clientY - r.top - h / 2 };
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ps.forEach((p) => {
        const edge = Math.min(p.x, w - p.x, p.y, h - p.y);
        const rm = Math.max(0, Math.min(1, edge / 20));
        p.a += (p.ta * rm - p.a) * 0.05;
        p.x += p.dx; p.y += p.dy;
        p.tx += (mouse.current.x / (50 / p.mag) - p.tx) / ease;
        p.ty += (mouse.current.y / (50 / p.mag) - p.ty) / ease;
        if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) Object.assign(p, mk(), { x: Math.random() * w, y: Math.random() * h });
        ctx.beginPath();
        ctx.arc(p.x + p.tx, p.y + p.ty, p.s, 0, 2 * Math.PI);
        ctx.fillStyle = `rgb(${rgb} / ${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); };
  }, [quantity, ease, color, size]);
  return (
    <div ref={wrapRef} className={cn("pointer-events-none", className)} aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}

/* ---------- RetroGrid ---------- */
export function RetroGrid({ className, angle = 65 }: { className?: string; angle?: number }) {
  return (
    <div
      className={cn("pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]", className)}
      style={{ "--grid-angle": `${angle}deg` } as React.CSSProperties}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className="animate-[grid_15s_linear_infinite] [background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(92,176,172,0.45) 1px, transparent 0), linear-gradient(to bottom, rgba(92,176,172,0.45) 1px, transparent 0)",
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] to-transparent to-90%" />
    </div>
  );
}

/* ---------- BorderBeam ---------- */
export function BorderBeam({
  size = 120,
  duration = 8,
  colorFrom = "#5cb0ac",
  colorTo = "#818cf8",
  className,
}: {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn("absolute aspect-square bg-gradient-to-l from-[var(--cf)] via-[var(--ct)] to-transparent", className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          "--cf": colorFrom,
          "--ct": colorTo,
        } as React.CSSProperties}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ repeat: Infinity, ease: "linear", duration }}
      />
    </div>
  );
}

/* ---------- ProgressiveBlur ---------- */
export function ProgressiveBlur({
  position = "bottom",
  height = "30%",
  className,
}: {
  position?: "top" | "bottom";
  height?: string;
  className?: string;
}) {
  const layers = [1, 2, 4, 8, 16];
  return (
    <div
      className={cn("pointer-events-none absolute inset-x-0 z-10", position === "bottom" ? "bottom-0" : "top-0", className)}
      style={{ height }}
    >
      {layers.map((b, i) => {
        const start = i * 20, end = start + 40;
        const dir = position === "bottom" ? "to bottom" : "to top";
        const mask = `linear-gradient(${dir}, transparent ${start}%, #000 ${Math.min(end, 100)}%)`;
        return (
          <div
            key={b}
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: mask, WebkitMaskImage: mask }}
          />
        );
      })}
    </div>
  );
}

/* ---------- DitherField (ordered Bayer dither, horizon pattern, pointer) ---------- */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export function DitherField({
  className,
  colors = ["#1a3a39", "#3b7a77", "#9be7e0"],
  children,
}: {
  className?: string;
  colors?: [string, string, string] | string[];
  children?: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const ptr = useRef({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const el = wrap.current, c = cvs.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cell = 5;
    let cols = 0, rows = 0, raf = 0;
    const resize = () => {
      cols = Math.ceil(el.offsetWidth / cell);
      rows = Math.ceil(el.offsetHeight / cell);
      c.width = cols * cell; c.height = rows * cell;
    };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      ptr.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    resize();
    window.addEventListener("resize", resize);
    el.addEventListener("mousemove", onMove);
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, c.width, c.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols, ny = y / rows;
          let v = ny * 0.9 + Math.sin(nx * 6 + t * 0.7) * 0.05 + Math.sin(nx * 13 - t * 0.5 + ny * 4) * 0.03;
          const dx = nx - ptr.current.x, dy = ny - ptr.current.y;
          v += Math.max(0, 0.35 - Math.hypot(dx * 1.6, dy)) * 0.9;
          v = Math.max(0, Math.min(1, v));
          const th = (BAYER[y & 3][x & 3] + 0.5) / 16;
          const lvl = v > th ? (v > 0.66 ? 2 : v > 0.33 ? 1 : 0) : -1;
          if (lvl < 0) continue;
          ctx.fillStyle = colors[lvl];
          ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); el.removeEventListener("mousemove", onMove); };
  }, [colors]);
  return (
    <div ref={wrap} className={cn("relative overflow-hidden", className)}>
      <canvas ref={cvs} className="absolute inset-0 size-full opacity-60" />
      <div className="relative z-10 flex size-full flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- CloudShader (WebGL fbm clouds) ---------- */
const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform float u_speed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<6;i++){ v += a*noise(p); p = p*2.02 + 11.7; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 2.4;
  float t = u_time * 0.04 * u_speed;
  float c = fbm(p + vec2(t, 0.0) + fbm(p*0.7 + vec2(t*0.5, 3.0)));
  c = smoothstep(0.38, 0.85, c);
  vec3 skyTop = vec3(0.39, 0.65, 0.82);
  vec3 skyBot = vec3(0.72, 0.85, 0.94);
  vec3 sky = mix(skyBot, skyTop, uv.y);
  vec3 col = mix(sky, vec3(1.0), c * 0.92);
  gl_FragColor = vec4(col, 1.0);
}`;
export function CloudShader({ className, speed = 1 }: { className?: string; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext("webgl");
    if (!gl) return;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }"));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");
    const resize = () => {
      const w = Math.max(1, Math.floor(c.clientWidth / 2)), h = Math.max(1, Math.floor(c.clientHeight / 2));
      c.width = w; c.height = h; gl.viewport(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);
    const t0 = performance.now();
    let raf = 0;
    const frame = () => {
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform1f(uSpeed, speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={ref} className={cn("size-full", className)} />;
}

/* ---------- DottedMap ---------- */
const LAND: [number, number][][] = [
  [[16, 24], [31, 39]], [[14, 26], [30, 40], [66, 78]], [[10, 25], [31, 38], [60, 90]],
  [[3, 30], [32, 40], [46, 90]], [[3, 30], [33, 38], [39, 41], [44, 90]], [[4, 21], [26, 32], [46, 90]],
  [[5, 21], [26, 33], [44, 90]], [[6, 34], [43, 90]], [[8, 34], [42, 90]], [[12, 34], [40, 90]],
  [[14, 33], [43, 47], [48, 90]], [[16, 32], [42, 44], [46, 49], [52, 90]], [[18, 32], [41, 76], [78, 80]],
  [[19, 30], [41, 76]], [[19, 23], [40, 76]], [[19, 24], [40, 64], [66, 72], [73, 77]],
  [[21, 24], [40, 63], [67, 71], [73, 76]], [[22, 24], [26, 31], [40, 62], [69, 71], [74, 76]],
  [[25, 32], [41, 57], [71, 72], [73, 77]], [[25, 34], [41, 58], [70, 78]], [[25, 36], [43, 58], [69, 80]],
  [[25, 36], [46, 56], [70, 82]], [[25, 36], [46, 57], [72, 82]], [[26, 36], [47, 57], [74, 82]],
  [[26, 36], [47, 56], [76, 81]], [[27, 36], [47, 58], [73, 83]], [[27, 35], [48, 56], [73, 83]],
  [[27, 34], [48, 56], [73, 84]], [[28, 34], [49, 55], [73, 85]], [[28, 33], [50, 54], [76, 84]],
  [[28, 32], [78, 80], [88, 89]], [[28, 31], [87, 89]], [[28, 30]], [[28, 30]], [], [],
];
export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  countryCode: string;
}
export function DottedMap({ markers, className }: { markers: MapMarker[]; className?: string }) {
  const W = 360, H = 146, STEP = 4;
  const dots: { x: number; y: number }[] = [];
  LAND.forEach((ranges, r) => {
    ranges.forEach(([a, b]) => {
      for (let c = a; c <= b; c++) dots.push({ x: c * STEP + 2, y: r * STEP + 2 });
    });
  });
  const project = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * W,
    y: ((80 - lat) / 144) * H,
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("size-full", className)}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.85} fill="#5cb0ac" opacity={0.55} />
      ))}
      {markers.map((m, i) => {
        const { x, y } = project(m.lat, m.lng);
        const r = 2.8;
        const fs = r * 0.95;
        const pillH = r * 1.8;
        const pillW = m.label.length * (fs * 0.62) + r * 1.8;
        const clip = `flag-clip-${i}`;
        return (
          <g key={m.label}>
            <circle cx={x} cy={y} r={r * 1.5} fill="#5cb0ac" opacity={0.25}>
              <animate attributeName="r" values={`${r};${r * 3};${r}`} dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <clipPath id={clip}><circle cx={x} cy={y} r={r * 0.8} /></clipPath>
            <image href={`https://flagcdn.com/w80/${m.countryCode}.webp`} x={x - r * 0.8} y={y - r * 0.8} width={r * 1.6} height={r * 1.6} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
            <rect x={x + r * 1.1} y={y - pillH / 2} width={pillW} height={pillH} rx={pillH / 2} fill="rgba(0,0,0,0.65)" />
            <text x={x + r * 1.1 + r * 0.8} y={y + fs * 0.35} fontSize={fs} fill="white" fontFamily="monospace">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
