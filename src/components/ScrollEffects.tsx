import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { TRT_LOGO_SRC } from './BrandLogo';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="fixed left-0 right-0 top-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-[#6385CB] via-[#1C3265] to-[#101A35] will-change-transform"
    />
  );
}

/**
 * High-FPS GPU-composited scroll reveal (zero per-card scroll-event jitter on mobile).
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 20,
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
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: 0.45,
        delay: Math.min(delay, 0.16),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Lightweight 3D perspective card entry optimized for mobile 60fps.
 */
export function ScrollScrubCard({
  children,
  index = 0,
  className = '',
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div className={`[perspective:900px] ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 22, rotateX: 5, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.04 }}
        transition={{
          duration: 0.44,
          delay: Math.min((index % 3) * 0.05, 0.14),
          ease: [0.22, 1, 0.36, 1],
        }}
        className="h-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Lightweight GPU-only vertical parallax section.
 */
export function ScrollParallaxSection({
  children,
  className = '',
  offsetY = 18,
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

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [offsetY, 0, -offsetY * 0.4]);

  return (
    <section ref={ref} className={className}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </section>
  );
}

/**
 * Dual-lane scroll-driven editorial ticker featuring TRT Logo PNG, TRT FINDS name, and slogans.
 */
export function ScrollEditorialTicker({
  items,
  reverse = false,
  className = '',
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const xPrimary = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? ['-14%', '4%'] : ['4%', '-14%']
  );
  const xSecondary = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? ['4%', '-14%'] : ['-14%', '4%']
  );

  const repeated = [...items, ...items, ...items];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`overflow-hidden border-y border-[#B7C9ED]/55 bg-[#F1F4FC]/70 py-3 ${className}`}
    >
      {/* Lane 1: TRT Logo + TRT FINDS + Slogans */}
      <motion.div
        style={{ x: xPrimary }}
        className="flex w-max items-center gap-6 whitespace-nowrap px-4 will-change-transform"
      >
        {repeated.map((item, idx) => (
          <span
            key={`lane1-${item}-${idx}`}
            className="inline-flex items-center gap-2.5 font-accent text-[11px] font-bold tracking-[0.16em] text-[#101A35] uppercase sm:text-xs"
          >
            <img
              src={TRT_LOGO_SRC}
              alt=""
              referrerPolicy="no-referrer"
              className="h-5 w-auto shrink-0 object-contain"
            />
            <span className="font-display font-extrabold text-[#101A35]">TRT FINDS</span>
            <span className="text-[#3156A5]">•</span>
            <span className="text-[#1C3265]">{item}</span>
          </span>
        ))}
      </motion.div>

      {/* Lane 2: Counter-gliding subtle architectural slogan ribbon */}
      <motion.div
        style={{ x: xSecondary }}
        className="mt-2 flex w-max items-center gap-6 whitespace-nowrap px-4 will-change-transform"
      >
        {repeated.map((item, idx) => (
          <span
            key={`lane2-${item}-${idx}`}
            className="inline-flex items-center gap-2.5 font-accent text-[10px] font-semibold tracking-[0.18em] text-[#1C3265] uppercase"
          >
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] bg-[#1C3265]" />
            <span>{item}</span>
            <img
              src={TRT_LOGO_SRC}
              alt=""
              referrerPolicy="no-referrer"
              className="h-4 w-auto shrink-0 object-contain opacity-90"
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
