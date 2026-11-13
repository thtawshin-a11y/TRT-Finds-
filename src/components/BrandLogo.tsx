interface BrandLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TRT_LOGO_SRC =
  '/assets/aistudio/b3ef5859-7d2f-4a01-aec6-ca619a73b11b-removebg-preview_37608de0.png';

export function BrandLogo({
  className,
  showWordmark = true,
  size = 'md',
}: BrandLogoProps) {
  const imgSizeClass =
    className ||
    (size === 'lg'
      ? 'h-24 w-auto sm:h-28'
      : size === 'sm'
        ? 'h-11 w-auto'
        : 'h-12 w-auto sm:h-14 lg:h-16');

  const textSizeClass =
    size === 'lg'
      ? 'text-lg sm:text-xl'
      : size === 'sm'
        ? 'text-xs sm:text-sm'
        : 'text-[13px] sm:text-base lg:text-[17px]';

  const gapClass =
    size === 'lg'
      ? 'gap-4 sm:gap-5'
      : size === 'sm'
        ? 'gap-2.5'
        : 'gap-2 sm:gap-3.5';

  return (
    <span className={`inline-flex items-center ${gapClass} shrink-0 select-none`}>
      <img
        src={TRT_LOGO_SRC}
        alt="TRT FINDS monogram"
        className={`${imgSizeClass} shrink-0 object-contain`}
        referrerPolicy="no-referrer"
      />
      {showWordmark && (
        <span className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0">
          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-[#B7C9ED]/80 sm:inline-block"
          />
          <span
            className={`inline-flex items-baseline gap-1 whitespace-nowrap leading-none ${textSizeClass}`}
          >
            <span className="font-display font-extrabold tracking-tight text-[#101A35]">
              TRT
            </span>
            <span className="font-serif-brand font-bold uppercase tracking-[0.07em] text-[#1C3265]">
              FIN
              <span className="relative inline-block">
                D
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[46%] top-[51%] h-[0.28em] w-[0.28em] -translate-x-1/2 -translate-y-1/2 text-[#3156A5]"
                  fill="currentColor"
                >
                  <path d="M12 1 C13.2 8.2 15.8 10.8 23 12 C15.8 13.2 13.2 15.8 12 23 C10.8 15.8 8.2 13.2 1 12 C8.2 10.8 10.8 8.2 12 1 Z" />
                </svg>
              </span>
              S
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
