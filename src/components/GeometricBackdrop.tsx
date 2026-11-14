import { useEffect, useState } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'motion/react';

export function GeometricBackdrop() {
  const [enableMouseParallax, setEnableMouseParallax] = useState(false);
  const { scrollY } = useScroll();

  // Normalized mouse coordinates (-1 to +1 from viewport center) on desktop only
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canTrack = Boolean(finePointer?.matches) && !reducedMotion?.matches;
    setEnableMouseParallax(canTrack);
    if (!canTrack) return;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseX.set((e.clientX / w - 0.5) * 2);
      mouseY.set((e.clientY / h - 0.5) * 2);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  // Inverse mouse-following parallax depths (desktop only)
  const topParallaxX = useTransform(mouseX, [-1, 1], [22, -22]);
  const topParallaxY = useTransform(mouseY, [-1, 1], [18, -18]);

  const leftParallaxX = useTransform(mouseX, [-1, 1], [28, -28]);
  const leftParallaxY = useTransform(mouseY, [-1, 1], [22, -22]);

  const bottomParallaxX = useTransform(mouseX, [-1, 1], [16, -16]);
  const bottomParallaxY = useTransform(mouseY, [-1, 1], [12, -12]);

  // Direct GPU scroll transforms (lightweight without nested scroll springs)
  const topOrbRotate = useTransform(scrollY, [0, 2600], [0, 180]);
  const topOrbY = useTransform(scrollY, [0, 2600], [0, 90]);

  const leftDiamondRotate = useTransform(scrollY, [0, 2600], [14, -180]);
  const leftDiamondY = useTransform(scrollY, [0, 2600], [0, -90]);

  const bottomRingRotate = useTransform(scrollY, [0, 2600], [-18, 200]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* Top-Right Architectural Orbital Plane */}
      <motion.div
        style={enableMouseParallax ? { x: topParallaxX, y: topParallaxY } : undefined}
        className="absolute -top-44 right-[-12%]"
      >
        <motion.div
          style={{ rotate: topOrbRotate, y: topOrbY }}
          className="flex h-[460px] w-[460px] items-center justify-center rounded-[72px] border border-[#B7C9ED]/45 bg-[#F1F4FC]/70 will-change-transform sm:h-[580px] sm:w-[580px]"
        >
          <svg viewBox="0 0 240 240" className="h-[78%] w-[78%] text-[#6385CB]" fill="none">
            <circle
              cx="120"
              cy="120"
              r="98"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.2"
              strokeDasharray="6 8"
            />
            <circle cx="120" cy="120" r="68" stroke="#1C3265" strokeOpacity="0.18" strokeWidth="1" />
            <rect
              x="72"
              y="72"
              width="96"
              height="96"
              rx="22"
              stroke="#3156A5"
              strokeOpacity="0.22"
              strokeWidth="1.2"
            />
            <path
              d="M120 100 C122.4 113.5 126.5 117.6 140 120 C126.5 122.4 122.4 126.5 120 140 C117.6 126.5 113.5 122.4 100 120 C113.5 117.6 117.6 113.5 120 100 Z"
              fill="#3156A5"
              fillOpacity="0.18"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Mid-Left Bidirectional Rotating Diamond */}
      <motion.div
        style={enableMouseParallax ? { x: leftParallaxX, y: leftParallaxY } : undefined}
        className="absolute top-[36%] -left-36 sm:-left-24"
      >
        <motion.div
          style={{ rotate: leftDiamondRotate, y: leftDiamondY }}
          className="flex h-[340px] w-[340px] items-center justify-center rounded-[52px] border border-[#B7C9ED]/40 bg-[#F1F4FC]/50 will-change-transform sm:h-[420px] sm:w-[420px]"
        >
          <svg viewBox="0 0 200 200" className="h-[72%] w-[72%] text-[#1C3265]" fill="none">
            <circle
              cx="100"
              cy="100"
              r="82"
              stroke="#3156A5"
              strokeOpacity="0.24"
              strokeWidth="1.2"
              strokeDasharray="4 7"
            />
            <polygon
              points="100,24 176,100 100,176 24,100"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1.2"
            />
            <circle cx="100" cy="100" r="26" stroke="#6385CB" strokeOpacity="0.28" strokeWidth="1.2" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Lower-Right Orbital Ring (Desktop/Tablet) */}
      <motion.div
        style={enableMouseParallax ? { x: bottomParallaxX, y: bottomParallaxY } : undefined}
        className="absolute -bottom-28 right-[4%] hidden sm:block"
      >
        <motion.div
          style={{ rotate: bottomRingRotate }}
          className="flex h-[320px] w-[320px] items-center justify-center rounded-full border border-[#B7C9ED]/35 bg-[#F1F4FC]/35 will-change-transform"
        >
          <svg viewBox="0 0 180 180" className="h-[80%] w-[80%] text-[#3156A5]" fill="none">
            <circle
              cx="90"
              cy="90"
              r="74"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1.2"
              strokeDasharray="10 8"
            />
            <circle cx="90" cy="90" r="46" stroke="#1C3265" strokeOpacity="0.18" strokeWidth="1" />
          </svg>
        </motion.div>
      </motion.div>

      <div className="trt-grid-surface absolute inset-0 opacity-45" />
      <div className="trt-diagonal-lines absolute inset-0 opacity-45" />
    </div>
  );
}
