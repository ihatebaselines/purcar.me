"use client";

import { useEffect } from "react";
import { CloudShader } from "@/components/magic/effects";
import { ScrollProgress } from "@/components/magic/effects";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";

const MODEL_URL = "https://media.githubusercontent.com/media/ihatebaselines/purcar.me/refs/heads/main/models/phc-1.onnx?v=phc-1-onnx-3";
const MODEL_CACHE = "purcar-phc-1-model-v2";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const timer = window.setTimeout(async () => {
      try {
        const cache = await caches.open(MODEL_CACHE);
        const existing = await cache.match(MODEL_URL);
        if (existing) return;
        const res = await fetch(MODEL_URL, { cache: "force-cache" });
        if (res.ok) await cache.put(MODEL_URL, res);
      } catch {
        // Silent background preload; ignore network errors
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, []);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const blueStrength = useTransform(scrollYProgress, [0, 0.2, 0.48, 0.76, 1], [0.015, 0.07, 0.18, 0.34, 0.5]);
  const gradientFocus = useTransform(scrollYProgress, [0, 0.25, 0.55, 0.82, 1], ["7%", "18%", "38%", "66%", "92%"]);
  const evolvingGradient = useMotionTemplate`radial-gradient(125% 125% at 50% ${gradientFocus}, rgba(255,255,255,0) 40%, rgba(50,97,237,${blueStrength}) 100%)`;

  return (
    <>
      <div className="app-sky-background" aria-hidden="true">
        <CloudShader speed={0.22} />
        <motion.div
          className="sky-scroll-gradient"
          style={{ background: reduceMotion ? "radial-gradient(125% 125% at 50% 55%,rgba(255,255,255,0) 40%,rgba(50,97,237,.22) 100%)" : evolvingGradient }}
        />
      </div>
      <ScrollProgress className="site-scroll-progress" />
      {children}
    </>
  );
}
