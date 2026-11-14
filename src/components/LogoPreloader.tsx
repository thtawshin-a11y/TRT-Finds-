import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TRT_LOGO_SRC } from './BrandLogo';

export function LogoPreloader({ enabled = true }: { enabled?: boolean }) {
  const [visible, setVisible] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 120 : 950;
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="trt-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white [perspective:1100px]"
          aria-hidden="true"
        >
          {/* Ambient cobalt 3D glow aura */}
          <motion.div
            initial={{ opacity: 0.25, scale: 0.7 }}
            animate={{ opacity: [0.3, 0.75, 0.35], scale: [0.85, 1.15, 1] }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="pointer-events-none absolute h-52 w-52 rounded-full bg-radial from-[#B7C9ED]/55 via-[#6385CB]/20 to-transparent blur-2xl"
          />

          {/* Pure 3D Animated TRT Logo (no text) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.72, rotateY: -36, rotateX: 18 }}
            animate={{
              opacity: 1,
              scale: [0.88, 1.06, 1],
              rotateY: [-28, 14, 0],
              rotateX: [16, -6, 0],
            }}
            exit={{ opacity: 0, scale: 0.92, rotateY: 22 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative flex flex-col items-center gap-5 will-change-transform"
          >
            <img
              src={TRT_LOGO_SRC}
              alt="TRT"
              referrerPolicy="no-referrer"
              className="h-28 w-auto drop-shadow-[0_18px_30px_rgba(28,50,101,0.22)] sm:h-36"
            />

            <motion.div
              initial={{ scaleX: 0, opacity: 0.4 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="h-[2.5px] w-24 origin-center rounded-full bg-gradient-to-r from-[#6385CB] via-[#1C3265] to-[#101A35]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
