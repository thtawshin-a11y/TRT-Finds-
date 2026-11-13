import { useRef } from 'react';
import { motion } from 'motion/react';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SlidingTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
  size?: 'sm' | 'md';
  slideInFromRight?: boolean;
}

export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className = '',
  size = 'md',
  slideInFromRight = false,
}: SlidingTabsProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={trackRef}
      role="tablist"
      className={`inline-flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar rounded-full border border-[#B7C9ED]/75 bg-[#F1F4FC]/85 p-1.5 backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(16,26,53,0.06)] ${className}`}
    >
      {options.map((option, idx) => {
        const isActive = option.value === value;
        return (
          <motion.button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(option.value)}
            initial={slideInFromRight ? { opacity: 0, x: 44 } : false}
            whileInView={slideInFromRight ? { opacity: 1, x: 0 } : undefined}
            animate={!slideInFromRight ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: 0.48,
              delay: slideInFromRight ? idx * 0.07 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`apple-btn relative shrink-0 whitespace-nowrap rounded-full font-medium transition-colors duration-200 ${
              size === 'sm' ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-xs sm:text-sm'
            } ${isActive ? 'text-white' : 'text-[#1C3265]/85 hover:bg-white/75 hover:text-[#101A35]'}`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 32,
                  mass: 0.85,
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#233D7A] to-[#101A35] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_12px_-2px_rgba(16,26,53,0.34)]"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <span>{option.label}</span>
              {typeof option.count === 'number' && (
                <span
                  className={`font-accent tabular-nums text-[11px] ${
                    isActive ? 'text-[#B7C9ED]' : 'text-[#6385CB]'
                  }`}
                >
                  {option.count}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
