import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoveringInteractive, setHoveringInteractive] = useState(false);
  const [pressed, setPressed] = useState(false);

  const auraRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const activeButtonRef = useRef<HTMLElement | null>(null);

  const targetPos = useRef({ x: -120, y: -120 });
  const dotPos = useRef({ x: -120, y: -120 });
  const ringPos = useRef({ x: -120, y: -120 });
  const auraPos = useRef({ x: -120, y: -120 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      setEnabled(finePointer.matches && !reducedMotion.matches);
    };

    evaluate();
    finePointer.addEventListener('change', evaluate);
    reducedMotion.addEventListener('change', evaluate);

    return () => {
      finePointer.removeEventListener('change', evaluate);
      reducedMotion.removeEventListener('change', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const resetActiveButton = () => {
      const prev = activeButtonRef.current;
      if (prev) {
        prev.style.removeProperty('--mag-x');
        prev.style.removeProperty('--mag-y');
        activeButtonRef.current = null;
      }
    };

    const handleMove = (e: MouseEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      if (!visible) setVisible(true);

      const el = e.target as HTMLElement | null;
      const interactive = el?.closest(
        'a, button, [role="button"], input, textarea, select, label'
      ) as HTMLElement | null;

      setHoveringInteractive(Boolean(interactive));

      // Apply cursor-tracking specular spotlight & magnetic pull on Apple-style circular buttons
      const appleBtn = el?.closest('.apple-btn') as HTMLElement | null;
      if (appleBtn) {
        if (activeButtonRef.current && activeButtonRef.current !== appleBtn) {
          resetActiveButton();
        }
        activeButtonRef.current = appleBtn;
        const rect = appleBtn.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        appleBtn.style.setProperty('--mx', `${localX.toFixed(1)}px`);
        appleBtn.style.setProperty('--my', `${localY.toFixed(1)}px`);

        const offsetX = ((localX / rect.width) - 0.5) * 5;
        const offsetY = ((localY / rect.height) - 0.5) * 4;
        appleBtn.style.setProperty('--mag-x', `${offsetX.toFixed(2)}px`);
        appleBtn.style.setProperty('--mag-y', `${offsetY.toFixed(2)}px`);
      } else if (activeButtonRef.current) {
        resetActiveButton();
      }
    };

    const handleLeave = () => {
      setVisible(false);
      resetActiveButton();
    };
    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);

    const animate = () => {
      // Precision inner core dot
      dotPos.current.x += (targetPos.current.x - dotPos.current.x) * 0.42;
      dotPos.current.y += (targetPos.current.y - dotPos.current.y) * 0.42;

      // Smooth outer glass ring
      ringPos.current.x += (targetPos.current.x - ringPos.current.x) * 0.17;
      ringPos.current.y += (targetPos.current.y - ringPos.current.y) * 0.17;

      // Trailing ambient cobalt glow
      auraPos.current.x += (targetPos.current.x - auraPos.current.x) * 0.09;
      auraPos.current.y += (targetPos.current.y - auraPos.current.y) * 0.09;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${auraPos.current.x}px, ${auraPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = window.requestAnimationFrame(animate);
    };

    rafId.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      resetActiveButton();
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <>
      {/* Trailing ambient radial cobalt glow */}
      <div
        ref={auraRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[88] h-36 w-36 rounded-full transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(99, 133, 203, 0.14) 0%, rgba(183, 201, 237, 0.05) 45%, transparent 72%)',
        }}
      />

      {/* Smooth fluid ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[89] rounded-full border transition-[width,height,background-color,border-color,opacity,backdrop-filter] duration-200 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        } ${
          hoveringInteractive
            ? 'h-12 w-12 border-[#3156A5]/50 bg-[#6385CB]/12 backdrop-blur-[1px]'
            : 'h-8 w-8 border-[#1C3265]/30 bg-transparent'
        } ${pressed ? 'scale-90' : 'scale-100'}`}
      />

      {/* Precision inner dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[90] rounded-full transition-[width,height,background-color,opacity] duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        } ${
          hoveringInteractive
            ? 'h-1.5 w-1.5 bg-[#3156A5]'
            : 'h-2 w-2 bg-[#101A35]'
        } ${pressed ? 'scale-125' : 'scale-100'}`}
      />
    </>
  );
}
