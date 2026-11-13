import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

export function LogoPreloader({ enabled = true }: { enabled?: boolean }) {
  const [visible, setVisible] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 120 : 900;
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="trt-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            >
              <BrandLogo size="lg" showWordmark />
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] w-28 origin-left rounded-full bg-[#1C3265]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
