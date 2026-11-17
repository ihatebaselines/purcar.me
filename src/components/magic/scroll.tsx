"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/* ============ Video masking ============ */
export function TextOverlayVideoMasking({ text = "HEXOCHEM", src, className }: { text?: string; src: string; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <figure className="relative h-[240px] w-full overflow-hidden rounded-lg bg-black">
        <video autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover">
          <source src={src} type="video/mp4" />
        </video>
        <svg viewBox="0 0 285 165" preserveAspectRatio="xMidYMid slice" className="absolute left-0 top-0 size-full">
          <defs>
            <mask id="text-hole" x="0" y="0" width="100%" height="100%">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <text x="50%" y="57%" fill="black" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="800" fontSize="23" letterSpacing="-1">
                {text}
              </text>
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" style={{ fill: "#000105", mask: "url(#text-hole)" }} />
        </svg>
      </figure>
    </section>
  );
}

export function SplashVideoMasking({ src, className }: { src: string; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <figure className="relative">
        <video
          autoPlay muted loop playsInline
          style={{ maskImage: "url('/media/splash-mask.png')", WebkitMaskImage: "url('/media/splash-mask.png')", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
          className="relative aspect-square max-h-[320px] w-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      </figure>
    </section>
  );
}

const GRID =
  "absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]";

/* ============ Scroll scale/rotate sections ============ */
export function ScrollScaleSections() {
  const container = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  const s1 = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const r1 = useTransform(scrollYProgress, [0, 1], [0, -5]);
  const s2 = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const r2 = useTransform(scrollYProgress, [0, 1], [5, 0]);
  return (
    <main ref={container} className="relative h-[200vh] bg-black">
      <motion.section style={{ scale: s1, rotate: r1 }} className="sticky top-0 flex h-screen flex-col items-center justify-center bg-gradient-to-t from-[#ebebeb] to-[#dadada] font-semibold text-black">
        <div className={GRID} />
        <h2 className="relative px-8 text-center text-4xl leading-[120%] tracking-tight md:text-6xl">
          118 elements. <br /> One graph model. Scroll 👇
        </h2>
      </motion.section>
      <motion.section style={{ scale: s2, rotate: r2 }} className="relative h-screen bg-gradient-to-t from-[#06060e] to-[#1a1919] text-white">
        <div className={GRID} />
        <article className="relative z-10 mx-auto max-w-5xl px-6">
          <h2 className="py-10 text-4xl font-semibold leading-[110%] tracking-tight md:text-6xl">
            Organic. Inorganic. <br /> Same transformer.
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {["Alkane → Alkyl halide", "Ester → Acid + Alcohol", "Fe + CuSO₄ → FeSO₄ + Cu", "Es³⁺ + MoO₄²⁻ → salt"].map((t, i) => (
              <div key={i} className="flex aspect-[3/4] items-end rounded-xl border border-white/10 bg-gradient-to-br from-[#4a9390]/30 to-[#818cf8]/20 p-4 text-sm font-semibold">{t}</div>
            ))}
          </div>
        </article>
      </motion.section>
      <footer className="bg-[#06060e]">
        <h1 className="translate-y-20 bg-gradient-to-r from-neutral-400 to-neutral-800 bg-clip-text text-center text-[16vw] font-semibold uppercase leading-[100%] text-transparent">
          hexochem
        </h1>
        <div className="relative z-10 grid h-40 place-content-center rounded-tl-full rounded-tr-full bg-black text-2xl text-white" />
      </footer>
    </main>
  );
}

/* ============ Sticky stacked sections ============ */
export function StickyStack() {
  return (
    <article>
      <section className="sticky top-0 grid h-screen w-full place-content-center bg-slate-950 text-white">
        <div className={GRID} />
        <h2 className="relative px-8 text-center text-4xl font-semibold leading-[120%] tracking-tight md:text-6xl">
          Predict any reaction <br /> in one forward pass 👇
        </h2>
      </section>
      <section className="sticky top-0 grid h-screen place-content-center overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-neutral-300 text-black">
        <div className={GRID} />
        <h2 className="relative px-8 text-center text-3xl font-semibold leading-[120%] tracking-tight md:text-5xl">
          Bond orders. Formal charges. <br /> Every atom, every pair.
        </h2>
      </section>
      <section className="sticky top-0 grid h-screen w-full place-content-center bg-slate-950 text-white">
        <div className={GRID} />
        <h2 className="relative px-8 text-center text-4xl font-semibold leading-[120%] tracking-tight md:text-5xl">
          Open the studio. <br /> Build a molecule ☝️
        </h2>
      </section>
    </article>
  );
}

/* ============ Horizontal scroll ============ */
const PANELS = [
  { word: "ORGANIC", bg: "bg-red-400" },
  { word: "INORGANIC", bg: "bg-blue-400" },
  { word: "118 ELEMENTS", bg: "bg-orange-400" },
  { word: "GRAPHS", bg: "bg-yellow-400" },
  { word: "PHC", bg: "bg-green-400" },
];
export function HorizontalScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${(PANELS.length - 1) * 100}vw`]);
  const hx = useTransform(scrollYProgress, [0, 1], [400, -400]);
  return (
    <article>
      <header className="relative grid h-[60vh] w-full place-content-center bg-slate-950 text-white">
        <div className={GRID} />
        <h2 className="relative text-center text-4xl font-bold tracking-tight md:text-6xl">
          Scroll sideways <br /> through chemical space
        </h2>
      </header>
      <section ref={ref} className="relative h-[500vh]">
        <motion.ul style={{ x }} className="sticky top-0 flex">
          {PANELS.map((p, i) => (
            <li key={p.word} className={cn("flex h-screen w-screen shrink-0 flex-col items-center justify-center overflow-hidden", p.bg)}>
              <motion.h3 style={{ x: hx }} className="relative bottom-5 inline-block whitespace-nowrap text-[16vw] font-semibold text-black">{p.word}</motion.h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/hexochem-logo.webp" alt={`panel ${i + 1}`} className="absolute bottom-0 w-[300px] rounded-t-2xl bg-white object-cover md:w-[420px]" />
            </li>
          ))}
        </motion.ul>
      </section>
      <footer className="grid h-[40vh] place-content-center bg-red-600 font-medium text-white">
        <p>HexoChem (PHC) · built by ihatebaselines.com</p>
      </footer>
    </article>
  );
}
