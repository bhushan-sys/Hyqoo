"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function SparklesGlobe() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden pointer-events-auto select-none"
      style={{ perspective: "1200px" }}
    >
      {/* ──────────────── 1. Deep Space Sparkles Starfield ──────────────── */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="space-backdrop-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.8}
          particleDensity={35}
          className="w-full h-full"
          particleColor="#ffffff"
          speed={1.5}
        />
      </div>

      {/* ──────────────── 2. Cosmic Ambient Radial Glow ──────────────── */}
      <div
        className="absolute w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] lg:w-[900px] lg:h-[900px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12) 0%, rgba(234, 179, 8, 0.05) 35%, rgba(6, 78, 59, 0.08) 60%, transparent 75%)",
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px)`,
        }}
      />

      {/* ──────────────── 3. Outer Planetary Orbital Ring ──────────────── */}
      <div
        className="absolute w-[440px] h-[440px] sm:w-[620px] sm:h-[620px] lg:w-[720px] lg:h-[720px] rounded-full pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(68deg) rotateY(-18deg) rotateZ(${mousePos.x * 15}deg) scale(${isHovered ? 1.04 : 1})`,
          border: "1px dashed rgba(16, 185, 129, 0.28)",
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.15)",
        }}
      >
        {/* Orbital satellite pulse */}
        <div
          className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-[spin_12s_linear_infinite]"
          style={{ top: "-6px", left: "50%" }}
        />
      </div>

      {/* ──────────────── 4. Counter-Orbit Ring ──────────────── */}
      <div
        className="absolute w-[380px] h-[380px] sm:w-[540px] sm:h-[540px] lg:w-[640px] lg:h-[640px] rounded-full pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(72deg) rotateY(24deg) rotateZ(${-mousePos.y * 15}deg)`,
          border: "1px solid rgba(228, 194, 114, 0.22)",
        }}
      >
        <div
          className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[spin_18s_linear_infinite_reverse]"
          style={{ bottom: "-4px", right: "40%" }}
        />
      </div>

      {/* ──────────────── 5. THE SPHERICAL GLOBE ──────────────── */}
      <div
        className="relative w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] rounded-full overflow-hidden transition-all duration-700 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotateX(${-mousePos.y * 14}deg) rotateY(${mousePos.x * 18}deg) scale(${isHovered ? 1.03 : 1})`,
          boxShadow: `
            0 0 50px rgba(16, 185, 129, 0.25),
            0 0 100px rgba(6, 78, 59, 0.35),
            inset 0 0 50px rgba(16, 185, 129, 0.4),
            inset 0 0 120px rgba(2, 44, 34, 0.85)
          `,
          border: "1px solid rgba(110, 231, 183, 0.3)",
          background: "#010804",
        }}
      >
        {/* Layer 5A: Emerald Sparkles inside Globe */}
        <div className="absolute inset-0 z-0">
          <SparklesCore
            id="globe-emerald-sparkles"
            background="transparent"
            minSize={1.2}
            maxSize={2.8}
            particleDensity={140}
            className="w-full h-full"
            particleColor="#10b981"
            speed={2.2}
          />
        </div>

        {/* Layer 5B: Gold Sparkles inside Globe */}
        <div className="absolute inset-0 z-[1] mix-blend-screen opacity-85">
          <SparklesCore
            id="globe-gold-sparkles"
            background="transparent"
            minSize={1}
            maxSize={2.4}
            particleDensity={70}
            className="w-full h-full"
            particleColor="#eab308"
            speed={2.8}
          />
        </div>

        {/* Layer 5C: Crisp Starlight Diamond Sparkles */}
        <div className="absolute inset-0 z-[2] mix-blend-screen opacity-70">
          <SparklesCore
            id="globe-starlight-sparkles"
            background="transparent"
            minSize={0.8}
            maxSize={1.8}
            particleDensity={60}
            className="w-full h-full"
            particleColor="#ffffff"
            speed={1.8}
          />
        </div>

        {/* Layer 5D: 3D Spherical Wireframe Lines (Rotating Meridians & Parallels) */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-40 animate-[spin_60s_linear_infinite]"
          style={{ transformOrigin: "center center" }}
        >
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
            {/* Equator & Latitudes */}
            <ellipse
              cx="100"
              cy="100"
              rx="98"
              ry="24"
              stroke="rgba(110, 231, 183, 0.45)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="100"
              cy="65"
              rx="85"
              ry="18"
              stroke="rgba(110, 231, 183, 0.3)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <ellipse
              cx="100"
              cy="135"
              rx="85"
              ry="18"
              stroke="rgba(110, 231, 183, 0.3)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <ellipse
              cx="100"
              cy="38"
              rx="60"
              ry="12"
              stroke="rgba(110, 231, 183, 0.25)"
              strokeWidth="0.5"
            />
            <ellipse
              cx="100"
              cy="162"
              rx="60"
              ry="12"
              stroke="rgba(110, 231, 183, 0.25)"
              strokeWidth="0.5"
            />

            {/* Meridians */}
            <ellipse
              cx="100"
              cy="100"
              rx="28"
              ry="98"
              stroke="rgba(234, 179, 8, 0.35)"
              strokeWidth="0.75"
            />
            <ellipse
              cx="100"
              cy="100"
              rx="62"
              ry="98"
              stroke="rgba(110, 231, 183, 0.3)"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="100"
              cy="100"
              rx="88"
              ry="98"
              stroke="rgba(110, 231, 183, 0.2)"
              strokeWidth="0.5"
            />
            <line
              x1="100"
              y1="2"
              x2="100"
              y2="198"
              stroke="rgba(234, 179, 8, 0.5)"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />
            <line
              x1="2"
              y1="100"
              x2="198"
              y2="100"
              stroke="rgba(110, 231, 183, 0.5)"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />
          </svg>
        </div>

        {/* Layer 5E: Talent Hubs (Pulsing Beacons) */}
        <div className="absolute inset-0 z-[4] pointer-events-none">
          {/* Hub 1: North America / West */}
          <div className="absolute top-[32%] left-[28%] flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </span>
          </div>

          {/* Hub 2: Europe / UK */}
          <div className="absolute top-[28%] left-[54%] flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            </span>
          </div>

          {/* Hub 3: South Asia / India */}
          <div className="absolute top-[52%] left-[68%] flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </span>
          </div>

          {/* Hub 4: Latin America */}
          <div className="absolute top-[64%] left-[36%] flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            </span>
          </div>
        </div>

        {/* Layer 5F: 3D Spherical Lighting Overlay (Specular Highlight & Shadow Hemisphere) */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none rounded-full"
          style={{
            background: `
              radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 25%, transparent 55%),
              radial-gradient(circle at 75% 78%, rgba(0, 0, 0, 0.85) 0%, rgba(2, 10, 6, 0.4) 45%, transparent 70%)
            `,
          }}
        />

        {/* Layer 5G: Spherical Edge Fresnel Glow Ring */}
        <div
          className="absolute inset-0 z-[6] pointer-events-none rounded-full"
          style={{
            boxShadow:
              "inset 0 0 45px rgba(16, 185, 129, 0.55), inset 0 0 15px rgba(255, 255, 255, 0.3)",
          }}
        />
      </div>

      {/* ──────────────── 6. Floating Talent Profile Badges ──────────────── */}
      <div
        className="absolute z-[7] pointer-events-none hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-black/75 backdrop-blur-md text-xs text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out"
        style={{
          top: "22%",
          right: "12%",
          transform: `translate(${mousePos.x * -18}px, ${mousePos.y * -18}px)`,
        }}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="font-medium text-emerald-300">14M+</span>
        <span className="text-zinc-400">Global Network</span>
      </div>

      <div
        className="absolute z-[7] pointer-events-none hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-black/75 backdrop-blur-md text-xs text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out"
        style={{
          bottom: "18%",
          left: "12%",
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
        <span className="font-medium text-amber-300">72h</span>
        <span className="text-zinc-400">Vetted Delivery</span>
      </div>
    </div>
  );
}
