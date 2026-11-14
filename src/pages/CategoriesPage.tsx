import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { ScrollParallaxSection, ScrollReveal, ScrollScrubCard } from '../components/ScrollEffects';
import { useStore } from '../context/StoreContext';

export function CategoriesPage() {
  const { categories, products } = useStore();

  const uncategorizedCount = useMemo(
    () => products.filter((p) => !p.categoryId && !p.categoryName).length,
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ScrollReveal className="max-w-2xl">
        <p className="font-accent text-xs font-bold tracking-[0.16em] text-[#1C3265] uppercase">
          Collections
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl">
          Discover Categories
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-[#1C3265] sm:text-base">
          Thoughtfully organized aisles across tech, home, wardrobe, and everyday essentials—plus standalone uncategorized discoveries.
        </p>
      </ScrollReveal>

      <ScrollParallaxSection offsetY={20} className="mt-10 grid gap-5 sm:grid-cols-2">
        {categories.map((cat, idx) => {
          const count = products.filter(
            (p) => p.categoryId === cat.id || p.categoryName === cat.name
          ).length;

          return (
            <ScrollScrubCard key={cat.id} index={idx}>
              <Link
                to={`/shop?category=${encodeURIComponent(cat.id)}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-[#B7C9ED]/70 bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#3156A5] hover:bg-[#F1F4FC]/45"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-accent tabular-nums text-xs font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                      {String(idx + 1).padStart(2, '0')} · Category
                    </span>
                    <span className="rounded-full bg-[#F1F4FC] px-3 py-1 font-accent tabular-nums text-xs font-semibold text-[#1C3265]">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <h2 className="mt-4 font-display text-2xl font-bold text-[#101A35] transition-colors group-hover:text-[#1C3265]">
                    {cat.name}
                  </h2>

                  {cat.description && (
                    <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-[#1C3265]">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-[#1C3265] group-hover:text-[#3156A5]">
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </ScrollScrubCard>
          );
        })}

        {uncategorizedCount > 0 && (
          <ScrollScrubCard index={categories.length}>
            <Link
              to="/shop?category=uncategorized"
              className="group flex h-full flex-col justify-between rounded-3xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/55 p-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#3156A5]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-accent text-xs font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                    <Layers className="h-3.5 w-3.5" />
                    Independent Finds
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-accent tabular-nums text-xs font-semibold text-[#1C3265]">
                    {uncategorizedCount} {uncategorizedCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-[#101A35]">
                  Uncategorized
                </h2>
                <p className="mt-2 text-sm text-[#1C3265]/75">
                  Standalone finds curated outside standard collections.
                </p>
              </div>
              <div className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-[#1C3265]">
                <span>Explore Standalone Finds</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </ScrollScrubCard>
        )}
      </ScrollParallaxSection>
    </div>
  );
}
