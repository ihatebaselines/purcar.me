"use client";

import { CloudShader } from "@/components/magic/effects";
import { ScrollProgress } from "@/components/magic/effects";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";

export function Providers({ children }: { children: React.ReactNode }) {
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
