import { Link } from 'react-router-dom';

export function ProductEmptyState({
  title = 'Something worth discovering is coming soon.',
  subtitle = 'Our curators are selecting refined essentials and smarter everyday finds. Check back shortly or explore our categories.',
  showResetButton = false,
  onReset,
}: {
  title?: string;
  subtitle?: string;
  showResetButton?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-[#B7C9ED]/60 bg-[#F1F4FC]/45 px-6 py-16 text-center">
      <svg
        viewBox="0 0 80 80"
        className="h-16 w-16 text-[#1C3265]"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="40" cy="40" r="30" stroke="#B7C9ED" strokeWidth="1.25" strokeDasharray="3 4" />
        <rect
          x="26"
          y="26"
          width="28"
          height="28"
          rx="6"
          transform="rotate(45 40 40)"
          stroke="#1C3265"
          strokeWidth="1.5"
          fill="#FFFFFF"
        />
        <path
          d="M40 31 C40.8 36 44 39.2 49 40 C44 40.8 40.8 44 40 49 C39.2 44 36 40.8 31 40 C36 39.2 39.2 36 40 31 Z"
          fill="#3156A5"
        />
      </svg>

      <h3 className="mt-5 font-display text-xl font-bold text-[#101A35] sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#1C3265]/75">{subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {showResetButton && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="apple-btn apple-btn-primary h-10 px-6 text-xs font-semibold"
          >
            <span className="relative z-10">Clear Filters</span>
          </button>
        ) : (
          <Link
            to="/categories"
            className="apple-btn apple-btn-glass inline-flex h-10 items-center px-6 text-xs font-semibold"
          >
            <span className="relative z-10">Explore Categories</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-[#B7C9ED]/45 bg-white"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-[#F1F4FC]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <div className="h-10 animate-pulse rounded-full bg-[#F1F4FC]" />
              <div className="h-10 animate-pulse rounded-full bg-[#B7C9ED]/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
