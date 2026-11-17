"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";
import { cn } from "@/lib/utils";

/* ---------- TypingAnimation ---------- */
export function TypingAnimation({
  children,
  className,
  speed = 45,
}: {
  children: string;
  className?: string;
  speed?: number;
}) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(children.slice(0, i));
      if (i >= children.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [children, speed]);
  return (
    <span className={cn("font-mono", className)}>
      {shown}
      <span className="inline-block w-[0.5ch] animate-pulse">▍</span>
    </span>
  );
}

/* ---------- NumberTicker ---------- */
export function NumberTicker({
  value,
  className,
  suffix = "",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = Intl.NumberFormat("en-US").format(Math.round(v)) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);
  return (
    <span ref={ref} className={cn("tabular-nums tracking-tighter", className)}>
      0{suffix}
    </span>
  );
}

/* ---------- MorphingText (SVG goo threshold) ---------- */
export function MorphingText({ texts, className }: { texts: string[]; className?: string }) {
  const t1 = useRef<HTMLSpanElement>(null);
  const t2 = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const morphTime = 1.2;
    const cooldownTime = 1.4;
    let idx = texts.length - 1;
    let time = performance.now();
    let morph = 0;
    let cooldown = cooldownTime;
    let raf = 0;
    const setStyles = (fraction: number) => {
      const a = t1.current, b = t2.current;
      if (!a || !b) return;
      b.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      b.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      const inv = 1 - fraction;
      a.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      a.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
      a.textContent = texts[idx % texts.length];
      b.textContent = texts[(idx + 1) % texts.length];
    };
    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) { cooldown = cooldownTime; fraction = 1; }
      setStyles(fraction);
      if (fraction === 1) idx++;
    };
    const doCooldown = () => {
      morph = 0;
      const a = t1.current, b = t2.current;
      if (a && b) {
        b.style.filter = "none"; b.style.opacity = "100%";
        a.style.filter = "none"; a.style.opacity = "0%";
      }
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = (now - time) / 1000;
      time = now;
      cooldown -= dt;
      if (cooldown <= 0) doMorph(); else doCooldown();
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [texts]);

  return (
    <div className={cn("relative mx-auto h-16 w-full max-w-3xl text-center font-sans text-[40pt] font-bold leading-none md:h-24 lg:text-[6rem]", className)} style={{ filter: "url(#threshold) blur(0.6px)" }}>
      <span ref={t1} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
      <span ref={t2} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
      <svg className="hidden" aria-hidden>
        <defs>
          <filter id="threshold">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

/* ---------- Highlighter ---------- */
export function Highlighter({
  children,
  action = "highlight",
  color = "#87CEFA",
}: {
  children: React.ReactNode;
  action?: "highlight" | "underline";
  color?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <span ref={ref} className="relative inline-block px-1">
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        style={{
          backgroundColor: action === "highlight" ? color : color,
          originX: 0,
          opacity: action === "highlight" ? 0.35 : 1,
        }}
        className={cn(
          "absolute left-0 right-0 -z-10 rounded-sm",
          action === "highlight" ? "top-0 bottom-0" : "bottom-0 h-[3px]"
        )}
      />
      {children}
    </span>
  );
}

/* ---------- KineticText ---------- */
export function KineticText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 140, damping: 14 }}
          whileHover={{ y: -10, rotate: -4, scale: 1.12 }}
          className="inline-block cursor-default"
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* ---------- SquigglyText ---------- */
export function SquigglyText({
  children,
  className,
  stepDuration = 90,
}: {
  children: React.ReactNode;
  className?: string;
  stepDuration?: number;
}) {
  const reactId = useId();
  const id = `sq-${reactId.replace(/:/g, "")}`;
  const [seed, setSeed] = useState(1);
  const [scale, setScale] = useState(6);
  useEffect(() => {
    const iv = setInterval(() => {
      setSeed((s) => (s % 6) + 1);
      setScale(5 + Math.random() * 4);
    }, stepDuration);
    return () => clearInterval(iv);
  }, [stepDuration]);
  return (
    <span className={cn("relative inline-block", className)} style={{ filter: `url(#${id})` }}>
      {children}
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} />
        </filter>
      </svg>
    </span>
  );
}

/* ---------- ContainerTextFlip ---------- */
export function ContainerTextFlip({ words, className }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((x) => (x + 1) % words.length), 2500);
    return () => clearInterval(iv);
  }, [words.length]);
  return (
    <motion.span
      layout
      className={cn(
        "inline-block rounded-lg bg-gradient-to-b from-white/10 to-white/5 px-3 py-1 text-white shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.3),0_4px_8px_#00000052]",
        className
      )}
    >
      <motion.span key={words[i]} initial={{ opacity: 0, y: -12, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className="inline-block">
        {words[i].split("").map((c, k) => (
          <motion.span key={k} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: k * 0.03 }} className="inline-block">
            {c === " " ? "\u00A0" : c}
          </motion.span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/* ---------- DiaTextReveal ---------- */
export function DiaTextReveal({
  text,
  colors = ["#A97CF8", "#F38CB8", "#FDCC92"],
  className,
}: {
  text: string;
  colors?: string[];
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <span className="opacity-20">{text}</span>
      <motion.span
        aria-hidden
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: inView ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        className="absolute inset-0 bg-clip-text text-transparent"
        style={{ backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})` }}
      >
        {text}
      </motion.span>
    </span>
  );
}
