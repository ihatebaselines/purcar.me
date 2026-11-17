"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  Reorder,
  useDragControls,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ================= AnimatedList ================= */
export function AnimatedList({
  children,
  delay = 1600,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const arr = React.Children.toArray(children);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index >= arr.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [index, delay, arr.length]);
  const shown = useMemo(() => arr.slice(0, index + 1).reverse(), [index, arr]);
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <AnimatePresence initial={false}>
        {shown.map((item) => (
          <motion.div
            key={(item as React.ReactElement).key}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, originY: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 40 }}
            className="mx-auto w-full"
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Notification({
  name, description, icon, color, time,
}: { name: string; description: string; icon: string; color: string; time: string }) {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl text-white font-bold" style={{ backgroundColor: color }}>
          <span className="text-sm">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre font-medium">
            <span className="text-sm">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-muted">{time}</span>
          </figcaption>
          <p className="text-xs font-normal text-muted">{description}</p>
        </div>
      </div>
    </figure>
  );
}

/* ================= Dock (magnify) ================= */
const DockCtx = React.createContext<MotionValue<number> | null>(null);
export function Dock({ children, className }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <DockCtx.Provider value={mouseX}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "mx-auto flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 p-2 backdrop-blur-md supports-backdrop-blur:bg-white/10",
          className
        )}
      >
        {children}
      </motion.div>
    </DockCtx.Provider>
  );
}
export function DockIcon({ children, size = 40, magnification = 64, distance = 130, className }: {
  children: React.ReactNode; size?: number; magnification?: number; distance?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = React.useContext(DockCtx)!;
  const dist = useTransform(mouseX, (v) => {
    const b = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return v - b.x - b.width / 2;
  });
  const w = useSpring(useTransform(dist, [-distance, 0, distance], [size, magnification, size]), { mass: 0.1, stiffness: 150, damping: 12 });
  return (
    <motion.div ref={ref} style={{ width: w, height: w }} className={cn("flex aspect-square cursor-pointer items-center justify-center rounded-full", className)}>
      {children}
    </motion.div>
  );
}

/* ================= OrbitingCircles ================= */
export function OrbitingCircles({
  children, radius = 160, iconSize = 30, speed = 1, reverse = false, path = true, className,
}: {
  children: React.ReactNode; radius?: number; iconSize?: number; speed?: number; reverse?: boolean; path?: boolean; className?: string;
}) {
  const items = React.Children.toArray(children);
  const duration = 20 / speed;
  return (
    <>
      {path && (
        <svg className="pointer-events-none absolute inset-0 size-full" xmlns="http://www.w3.org/2000/svg">
          <circle className="stroke-white/15 stroke-1" cx="50%" cy="50%" r={radius} fill="none" strokeDasharray="4 6" />
        </svg>
      )}
      {items.map((child, i) => {
        const angle = (360 / items.length) * i;
        return (
          <div
            key={i}
            style={{
              width: iconSize, height: iconSize,
              animation: `orbit ${duration}s linear infinite`,
              animationDirection: reverse ? "reverse" : "normal",
              ["--radius" as string]: radius,
              ["--angle" as string]: angle,
            } as React.CSSProperties}
            className={cn("absolute flex shrink-0 items-center justify-center rounded-full", className)}
          >
            {child}
          </div>
        );
      })}
    </>
  );
}

/* ================= AvatarCircles ================= */
export function AvatarCircles({ numPeople, avatarUrls }: { numPeople?: number; avatarUrls: { imageUrl: string; profileUrl: string }[] }) {
  return (
    <div className="z-10 flex -space-x-4 rtl:space-x-reverse">
      {avatarUrls.map((u, i) => (
        <a key={i} href={u.profileUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={i} className="size-10 rounded-full border-2 border-background bg-card object-cover" src={u.imageUrl} width={40} height={40} alt={`Avatar ${i + 1}`} />
        </a>
      ))}
      {(numPeople ?? 0) > 0 && (
        <span className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-fg text-center text-xs font-medium text-background">
          +{numPeople}
        </span>
      )}
    </div>
  );
}

/* ================= Lens ================= */
export function Lens({ children, zoomFactor = 2, lensSize = 150, className }: {
  children: React.ReactNode; zoomFactor?: number; lensSize?: number; className?: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <div
      className={cn("relative z-20 overflow-hidden rounded-xl", className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      <AnimatePresence>
        {pos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-none absolute inset-0 z-30"
            style={{
              maskImage: `radial-gradient(circle ${lensSize / 2}px at ${pos.x}px ${pos.y}px, black 100%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${lensSize / 2}px at ${pos.x}px ${pos.y}px, black 100%, transparent 100%)`,
              transform: `scale(${zoomFactor})`,
              transformOrigin: `${pos.x}px ${pos.y}px`,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= Compare ================= */
export function Compare({ first, second, className, slideMode = "hover" }: {
  first: React.ReactNode; second: React.ReactNode; className?: string; slideMode?: "hover" | "drag";
}) {
  const [pct, setPct] = useState(50);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className={cn("relative select-none overflow-hidden rounded-2xl", className)}
      style={{ cursor: "col-resize" }}
      onMouseMove={(e) => { if (slideMode === "hover" || drag) move(e.clientX); }}
      onMouseDown={() => setDrag(true)}
      onMouseUp={() => setDrag(false)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <div className="absolute inset-0">{second}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>{first}</div>
      <div className="absolute top-0 z-30 h-full w-px bg-gradient-to-b from-transparent via-[#5cb0ac] to-transparent" style={{ left: `${pct}%` }}>
        <div className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#5cb0ac] bg-card text-[10px] text-[#5cb0ac] shadow-[0_0_20px_#5cb0ac66]">⇆</div>
      </div>
    </div>
  );
}

/* ================= GooeyInput ================= */
export function GooeyInput({ placeholder = "Search...", onSubmit }: { placeholder?: string; onSubmit?: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  return (
    <div className="relative flex items-center" style={{ filter: "url(#gooey)" }}>
      <svg className="absolute size-0" aria-hidden>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <motion.div
        animate={{ width: open ? 300 : 0, opacity: open ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="h-11 overflow-hidden rounded-full bg-fg"
      >
        <input
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onSubmit?.(val.trim()); }}
          placeholder={placeholder}
          className="size-full bg-transparent pl-5 pr-14 text-sm text-background outline-none placeholder:text-background/50"
        />
      </motion.div>
      <button
        onClick={() => { if (open && val.trim()) onSubmit?.(val.trim()); else setOpen((o) => !o); }}
        className={cn("z-10 flex size-11 items-center justify-center rounded-full bg-fg text-background transition", open && "-ml-11")}
        aria-label="Search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
    </div>
  );
}

/* ================= PinContainer (3D) ================= */
export function PinContainer({ children, title, href, className }: {
  children: React.ReactNode; title?: string; href?: string; className?: string;
}) {
  const [t, setT] = useState("translate(-50%,-50%) rotateX(0deg) scale(1)");
  return (
    <a
      className={cn("group/pin relative z-50 block cursor-pointer", className)}
      onMouseEnter={() => setT("translate(-50%,-50%) rotateX(40deg) scale(0.8)")}
      onMouseLeave={() => setT("translate(-50%,-50%) rotateX(0deg) scale(1)")}
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
    >
      <div style={{ perspective: "1000px", transform: "rotateX(70deg) translateZ(0deg)" }} className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2">
        <div
          style={{ transform: t }}
          className="absolute left-1/2 top-1/2 flex items-start justify-start overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_8px_16px_rgb(0_0_0/0.4)] transition duration-700 group-hover/pin:border-[#4a9390]/60"
        >
          <div className={cn("relative z-50")}>{children}</div>
        </div>
      </div>
      <PinPerspective title={title} />
    </a>
  );
}
function PinPerspective({ title }: { title?: string }) {
  return (
    <motion.div className="pointer-events-none z-[60] flex h-80 w-96 items-center justify-center opacity-0 transition duration-500 group-hover/pin:opacity-100">
      <div className="inset-0 -mt-7 h-full w-full flex-none">
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <span className="relative z-10 flex items-center space-x-2 rounded-full bg-black/80 px-4 py-0.5 ring-1 ring-white/10">
            <span className="relative z-20 inline-block py-0.5 text-xs font-bold text-white">{title}</span>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover/pin:opacity-40" />
          </span>
        </div>
        <div style={{ perspective: "1000px", transform: "rotateX(70deg) translateZ(0)" }} className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2">
          {[0, 2, 4].map((d) => (
            <motion.div
              key={d}
              initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
              animate={{ opacity: [0, 1, 0.5, 0], scale: 1, z: 0 }}
              transition={{ duration: 6, repeat: Infinity, delay: d }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-sky-500/[0.08] shadow-[0_8px_16px_rgb(0_0_0/0.4)]"
            />
          ))}
        </div>
        <motion.div className="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-gradient-to-b from-transparent to-cyan-500 blur-[2px] group-hover/pin:h-40" />
        <motion.div className="absolute bottom-1/2 right-1/2 h-20 w-px translate-y-[14px] bg-gradient-to-b from-transparent to-cyan-500 group-hover/pin:h-40" />
        <motion.div className="absolute bottom-1/2 right-1/2 z-40 h-[4px] w-[4px] translate-x-[1.5px] translate-y-[14px] rounded-full bg-cyan-600 blur-[3px]" />
        <motion.div className="absolute bottom-1/2 right-1/2 z-40 h-[2px] w-[2px] translate-x-[0.5px] translate-y-[14px] rounded-full bg-cyan-300" />
      </div>
    </motion.div>
  );
}

/* ================= AnimatedThemeToggler ================= */
export function AnimatedThemeToggler({ className }: { className?: string }) {
  const dark = useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => true,
  );
  useEffect(() => {
    const saved = localStorage.getItem("phc-theme");
    const isDark = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("phc-theme", next ? "dark" : "light");
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition) return apply();
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = left + width / 2, y = top + height / 2;
    const maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    await doc.startViewTransition(apply).ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  };
  return (
    <button onClick={toggle} aria-label="Toggle theme" className={cn("flex size-9 items-center justify-center rounded-full border border-border bg-card text-base transition hover:scale-110", className)}>
      {dark ? "☀" : "☾"}
    </button>
  );
}

/* ================= ImageGenerationLoader ================= */
export function ImageGenerationLoader({
  text = "Analysing", cellSize = 6, gap = 2, colors = ["#5cb0ac", "#2b6a67"], className, active = true,
}: { text?: string; cellSize?: number; gap?: number; colors?: string[]; className?: string; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ cols: 0, rows: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDim({ cols: Math.floor(el.clientWidth / (cellSize + gap)), rows: Math.floor(el.clientHeight / (cellSize + gap)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellSize, gap]);
  if (!active) return null;
  const cells = Array.from({ length: dim.cols * dim.rows });
  return (
    <div ref={ref} className={cn("absolute inset-0 z-20 overflow-hidden bg-background/70 backdrop-blur-sm", className)}>
      <div className="grid size-full place-content-center" style={{ gridTemplateColumns: `repeat(${dim.cols}, ${cellSize}px)`, gap }}>
        {cells.map((_, i) => {
          const x = i % dim.cols, y = Math.floor(i / dim.cols);
          return (
            <span
              key={i}
              style={{
                width: cellSize, height: cellSize, borderRadius: 1,
                background: colors[(x + y) % colors.length],
                animation: "waveCell 1.6s ease-in-out infinite",
                animationDelay: `${((x + y) * 0.04).toFixed(2)}s`,
              }}
            />
          );
        })}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-black/70 px-4 py-1.5 font-mono text-xs text-[#9be7e0] ring-1 ring-white/10">{text}…</span>
      </div>
    </div>
  );
}

/* ================= CodeBlock ================= */
export function CodeBlock({ tabs, className }: { tabs: { name: string; lang: string; code: string }[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const cur = tabs[active];
  const highlight = (code: string) =>
    code.split("\n").map((line, i) => {
      const parts = line.split(/(#.*$|"[^"]*"|\b(?:from|import|def|return|print|const|let|function|export|if|for|in)\b)/g);
      return (
        <div key={i}>
          {parts.map((p, k) =>
            /^#/.test(p) ? <span key={k} className="text-zinc-500">{p}</span>
            : /^"/.test(p) ? <span key={k} className="text-emerald-300">{p}</span>
            : /^(from|import|def|return|print|const|let|function|export|if|for|in)$/.test(p) ? <span key={k} className="text-violet-300">{p}</span>
            : <span key={k}>{p}</span>
          )}
        </div>
      );
    });
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-[#0d1017] font-mono text-xs text-zinc-300", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((t, i) => (
            <button key={t.name} onClick={() => setActive(i)} className={cn("rounded-md px-2.5 py-1 transition", i === active ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}>{t.name}</button>
          ))}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(cur.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded-md px-2 py-1 text-zinc-400 hover:text-white">
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 leading-relaxed">{highlight(cur.code)}</pre>
    </div>
  );
}

/* ================= Reorder drag items ================= */
export interface DragItem { id: number; title: string; subtitle: string; tag: string; }
export function DragItems({ initial }: { initial: DragItem[] }) {
  const [items, setItems] = useState(initial);
  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems} className="mx-auto w-full max-w-md space-y-2">
      {items.map((item) => <DragRow key={item.id} item={item} />)}
    </Reorder.Group>
  );
}
function DragRow({ item }: { item: DragItem }) {
  const y = useMotionValue(0);
  const controls = useDragControls();
  const boxShadow = useTransform(y, (v) => (v !== 0 ? "5px 5px 14px rgba(0,0,0,0.45)" : "0 0 0 rgba(0,0,0,0)"));
  return (
    <Reorder.Item value={item} style={{ boxShadow, y }} dragListener={false} dragControls={controls} className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3">
      <div>
        <h4 className="text-sm font-semibold">{item.title}</h4>
        <p className="text-xs text-muted">{item.subtitle}</p>
        <span className="mt-1 inline-block rounded bg-[#4a9390]/20 px-1.5 py-0.5 text-[10px] text-[#5cb0ac]">{item.tag}</span>
      </div>
      <button onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} style={{ touchAction: "none" }} className="cursor-grab active:cursor-grabbing" aria-label="Reorder">
        <svg viewBox="0 0 39 39" width="28" height="28" className="fill-muted">
          {[5, 19, 33].flatMap((cx) => [5, 19, 33].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} />))}
        </svg>
      </button>
    </Reorder.Item>
  );
}
