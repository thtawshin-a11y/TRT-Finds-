import { useEffect } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';

export function GeometricBackdrop() {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 110,
    damping: 26,
    mass: 0.6,
    restDelta: 0.001,
  });

  // Normalized mouse coordinates (-1 to +1 from viewport center)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const smoothMouseX = useSpring(rawMouseX, {
    stiffness: 85,
    damping: 24,
    mass: 0.7,
    restDelta: 0.001,
  });
  const smoothMouseY = useSpring(rawMouseY, {
    stiffness: 85,
    damping: 24,
    mass: 0.7,
    restDelta: 0.001,
  });

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;
      rawMouseX.set(nx);
      rawMouseY.set(ny);
    };

    const handleMouseLeave = () => {
      rawMouseX.set(0);
      rawMouseY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [rawMouseX, rawMouseY]);

  // Inverse mouse-following parallax depths (shapes shift gently opposite cursor movement)
  const topParallaxX = useTransform(smoothMouseX, [-1, 1], [28, -28]);
  const topParallaxY = useTransform(smoothMouseY, [-1, 1], [22, -22]);

  const leftParallaxX = useTransform(smoothMouseX, [-1, 1], [38, -38]);
  const leftParallaxY = useTransform(smoothMouseY, [-1, 1], [30, -30]);

  const bottomParallaxX = useTransform(smoothMouseX, [-1, 1], [20, -20]);
  const bottomParallaxY = useTransform(smoothMouseY, [-1, 1], [16, -16]);

  const gridParallaxX = useTransform(smoothMouseX, [-1, 1], [10, -10]);
  const gridParallaxY = useTransform(smoothMouseY, [-1, 1], [8, -8]);

  // Bidirectional scroll transforms: scrolling down rotates forward, scrolling back reverses cleanly
  const topOrbRotate = useTransform(smoothScrollY, [0, 2600], [0, 220]);
  const topOrbY = useTransform(smoothScrollY, [0, 2600], [0, 110]);

  const leftDiamondRotate = useTransform(smoothScrollY, [0, 2600], [14, -210]);
  const leftDiamondY = useTransform(smoothScrollY, [0, 2600], [0, -120]);

  const bottomRingRotate = useTransform(smoothScrollY, [0, 2600], [-18, 260]);
  const bottomRingX = useTransform(smoothScrollY, [0, 2600], [0, -45]);

  const gridScrollY = useTransform(smoothScrollY, [0, 2600], [0, -70]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* Top-Right Architectural Orbital Plane (mouse parallax wrapper + scroll rotation) */}
      <motion.div
        style={{ x: topParallaxX, y: topParallaxY }}
        className="absolute -top-44 right-[-12%]"
      >
        <motion.div
          style={{ rotate: topOrbRotate, y: topOrbY }}
          className="flex h-[520px] w-[520px] items-center justify-center rounded-[72px] border border-[#B7C9ED]/45 bg-[#F1F4FC]/75 sm:h-[600px] sm:w-[600px]"
        >
          <svg viewBox="0 0 240 240" className="h-[78%] w-[78%] text-[#6385CB]" fill="none">
            <circle
              cx="120"
              cy="120"
              r="98"
              stroke="currentColor"
              strokeOpacity="0.32"
              strokeWidth="1.2"
              strokeDasharray="6 8"
            />
            <circle
              cx="120"
              cy="120"
              r="68"
              stroke="#1C3265"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
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

      {/* Mid-Left Bidirectional Rotating Diamond & Spark (mouse parallax wrapper + scroll rotation) */}
      <motion.div
        style={{ x: leftParallaxX, y: leftParallaxY }}
        className="absolute top-[36%] -left-36 sm:-left-24"
      >
        <motion.div
          style={{ rotate: leftDiamondRotate, y: leftDiamondY }}
          className="flex h-[380px] w-[380px] items-center justify-center rounded-[52px] border border-[#B7C9ED]/40 bg-[#F1F4FC]/55 sm:h-[440px] sm:w-[440px]"
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
            <circle
              cx="100"
              cy="100"
              r="26"
              stroke="#6385CB"
              strokeOpacity="0.28"
              strokeWidth="1.2"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Lower-Right Scroll-Linked & Mouse Parallax Orbital Ring */}
      <motion.div
        style={{ x: bottomParallaxX, y: bottomParallaxY }}
        className="absolute -bottom-28 right-[4%] hidden sm:block"
      >
        <motion.div
          style={{ rotate: bottomRingRotate, x: bottomRingX }}
          className="flex h-[340px] w-[340px] items-center justify-center rounded-full border border-[#B7C9ED]/35 bg-[#F1F4FC]/35"
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
            <circle
              cx="90"
              cy="90"
              r="46"
              stroke="#1C3265"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
            <line
              x1="90"
              y1="10"
              x2="90"
              y2="170"
              stroke="#B7C9ED"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <line
              x1="10"
              y1="90"
              x2="170"
              y2="90"
              stroke="#B7C9ED"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Ultra-low-opacity dot matrix + diagonal technical lines shifting subtly with mouse & scroll */}
      <motion.div style={{ x: gridParallaxX, y: gridParallaxY }} className="absolute -inset-6">
        <motion.div style={{ y: gridScrollY }} className="trt-grid-surface absolute inset-0 opacity-55" />
      </motion.div>
      <div className="trt-diagonal-lines absolute inset-0 opacity-55" />

      {/* Subtle paper-grain texture */}
      <div className="trt-paper-grain absolute inset-0" />
    </div>
  );
}
