"use client";

import { motion, useReducedMotion } from "motion/react";

export default function DrunkTitle() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.h1
      className="home-title"
      id="home-title"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <svg className="hero-video-text" viewBox="0 0 1200 300" role="img" aria-labelledby="purcar-title">
        <title id="purcar-title">purcar.me</title>
        <defs>
          <mask id="purcar-video-mask" x="0" y="0" width="1200" height="300" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1200" height="300" fill="black" />
            <text
              x="600"
              y="235"
              textAnchor="middle"
              fill="white"
              fontFamily="Manrope, Arial, sans-serif"
              fontSize="235"
              fontWeight="800"
              letterSpacing="-10"
            >
              purcar.me
            </text>
          </mask>
        </defs>
        <foreignObject x="0" y="0" width="1200" height="300" mask="url(#purcar-video-mask)">
          <div className="hero-video-mask-frame">
            <video autoPlay={!reduceMotion} muted loop playsInline preload="metadata" aria-hidden="true">
              <source src="/media/purcar-title-video.mp4" type="video/mp4" />
            </video>
          </div>
        </foreignObject>
      </svg>
      <span className="sr-only">purcar.me</span>
    </motion.h1>
  );
}
