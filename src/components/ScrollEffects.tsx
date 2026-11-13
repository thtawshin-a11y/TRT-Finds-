import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-[#6385CB] via-[#1C3265] to-[#101A35]"
    />
  );
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 34,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-driven parallax container using useScroll + useTransform for vertical depth,
 * paired cleanly with nested whileInView fade-in and slide-up reveals.
 */
export function ScrollParallaxSection({
  children,
  className = '',
  offsetY = 24,
}: {
  children: React.ReactNode;
  className?: string;
  offsetY?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 0.5, 1], [offsetY, 0, -offsetY * 0.45]);

  return (
    <section ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </section>
  );
}
