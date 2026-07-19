import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function AmbientOrbs() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Smooth cursor tracking
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springConfig = { damping: 45, stiffness: 150, mass: 1.2 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 125); // centers the 250px glow circle
      cursorY.set(e.clientY - 125);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion, cursorX, cursorY]);

  // Aurora animations (drift)
  const driftTransition = (duration: number) => ({
    duration,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const,
  });

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05070D] overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* 1. Atmospheric Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#05070D] via-[#0A0A0F] to-[#10131A]" />

      {/* 2. Aurora Lighting (4 blurred light sources) */}
      <motion.div
        className="absolute top-[-15%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#70E1FF] opacity-[0.045] blur-[120px]"
        animate={reducedMotion ? {} : {
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={driftTransition(45)}
      />
      <motion.div
        className="absolute top-[-15%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#8B5CF6] opacity-[0.045] blur-[120px]"
        animate={reducedMotion ? {} : {
          x: [0, -30, 30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={driftTransition(55)}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-[#5B7CFA] opacity-[0.04] blur-[120px]"
        animate={reducedMotion ? {} : {
          x: [0, 30, -30, 0],
          y: [0, -40, 20, 0],
        }}
        transition={driftTransition(60)}
      />
      <motion.div
        className="absolute bottom-[-15%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-white opacity-[0.025] blur-[120px]"
        animate={reducedMotion ? {} : {
          x: [0, -20, 40, 0],
          y: [0, 30, -30, 0],
        }}
        transition={driftTransition(50)}
      />

      {/* 3. Faint Neural-Network SVG Line/Node Pattern (opacity 2-3%, random pulse) */}
      <motion.svg
        className="absolute inset-0 w-full h-full opacity-[0.025] text-white"
        animate={reducedMotion ? {} : {
          opacity: [0.015, 0.03, 0.015],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Nodes */}
        <circle cx="10" cy="20" r="0.4" fill="currentColor" />
        <circle cx="35" cy="40" r="0.4" fill="currentColor" />
        <circle cx="20" cy="75" r="0.4" fill="currentColor" />
        <circle cx="65" cy="15" r="0.4" fill="currentColor" />
        <circle cx="80" cy="45" r="0.4" fill="currentColor" />
        <circle cx="70" cy="80" r="0.4" fill="currentColor" />
        <circle cx="90" cy="25" r="0.4" fill="currentColor" />
        
        {/* Connections */}
        <line x1="10" y1="20" x2="35" y2="40" stroke="currentColor" strokeWidth="0.05" />
        <line x1="20" y1="75" x2="35" y2="40" stroke="currentColor" strokeWidth="0.05" />
        <line x1="35" y1="40" x2="65" y2="15" stroke="currentColor" strokeWidth="0.05" />
        <line x1="65" y1="15" x2="80" y2="45" stroke="currentColor" strokeWidth="0.05" />
        <line x1="80" y1="45" x2="70" y2="80" stroke="currentColor" strokeWidth="0.05" />
        <line x1="20" y1="75" x2="70" y2="80" stroke="currentColor" strokeWidth="0.05" />
        <line x1="65" y1="15" x2="90" y2="25" stroke="currentColor" strokeWidth="0.05" />
        <line x1="80" y1="45" x2="90" y2="25" stroke="currentColor" strokeWidth="0.05" />
      </motion.svg>

      {/* 4. Fine Noise Texture (opacity 1.5%) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.015] pointer-events-none mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* 5. Vignette (edge darkening) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.15)_100%)]" />

      {/* 6. Ambient Cursor Glow */}
      {!reducedMotion && (
        <motion.div
          className="fixed w-[250px] h-[250px] rounded-full bg-[#5B7CFA] opacity-[0.05] blur-[80px] pointer-events-none z-0"
          style={{ x: smoothX, y: smoothY }}
        />
      )}
    </div>
  );
}
