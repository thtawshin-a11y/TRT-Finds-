import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductEmptyState, ProductGridSkeleton } from '../components/ProductEmptyState';
import { ScrollParallaxSection, ScrollReveal } from '../components/ScrollEffects';
import { SlidingTabs, type TabOption } from '../components/SlidingTabs';
import { useStore } from '../context/StoreContext';
import { formatTaka } from '../lib/format';

export function HomePage() {
  const { products, pinnedProducts, categories, settings, loadingCatalog } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroLeftY = useTransform(heroScroll, [0, 1], [0, -28]);
  const heroRightY = useTransform(heroScroll, [0, 1], [0, 24]);

  const hasUncategorized = useMemo(
    () => products.some((p) => !p.categoryId && !p.categoryName),
    [products]
  );

  const tabOptions: TabOption<string>[] = useMemo(() => {
    const base: TabOption<string>[] = [{ value: 'all', label: 'All Finds', count: products.length }];
    categories.forEach((cat) => {
      const count = products.filter(
        (p) => p.categoryId === cat.id || p.categoryName === cat.name
      ).length;
      base.push({ value: cat.id, label: cat.name, count });
    });
    if (hasUncategorized) {
      const count = products.filter((p) => !p.categoryId && !p.categoryName).length;
      base.push({ value: 'uncategorized', label: 'Uncategorized', count });
    }
    return base;
  }, [categories, products, hasUncategorized]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products.slice(0, 9);
    if (selectedCategory === 'uncategorized') {
      return products.filter((p) => !p.categoryId && !p.categoryName);
    }
    const targetCat = categories.find((c) => c.id === selectedCategory);
    return products.filter(
      (p) =>
        p.categoryId === selectedCategory ||
        (targetCat && p.categoryName === targetCat.name)
    );
  }, [products, selectedCategory, categories]);

  const spotlightProduct = pinnedProducts[0] || products[0] || null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Scroll-Driven Bento + Futuristic Minimal Hero */}
      <section ref={heroRef} className="py-8 sm:py-12 lg:py-16">
        <div className="grid items-stretch gap-5 lg:grid-cols-12">
          {/* Primary Hero Bento Tile */}
          <motion.div
            style={{ y: heroLeftY }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#B7C9ED]/70 bg-white p-7 sm:p-10 lg:col-span-7 lg:p-12"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#B7C9ED]/80 bg-[#F1F4FC] px-4 py-1.5 font-accent text-[11px] font-semibold tracking-[0.16em] text-[#1C3265] uppercase">
                <Sparkles className="h-3.5 w-3.5 text-[#3156A5]" />
                {settings.brandPhilosophy}
              </span>

              <h1 className="mt-6 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-[#101A35] sm:text-5xl lg:text-[52px] [text-wrap:balance]">
                {settings.heroHeadline}
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#1C3265]/80 sm:text-lg">
                {settings.heroSubtext}
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <Link
                to="/shop"
                className="apple-btn apple-btn-primary inline-flex h-12 items-center gap-2 px-7 text-sm font-semibold whitespace-nowrap"
              >
                <span className="relative z-10">{settings.heroPrimaryCta}</span>
                <ArrowRight className="relative z-10 h-4 w-4" />
              </Link>
              <Link
                to="/categories"
                className="apple-btn apple-btn-glass inline-flex h-12 items-center px-7 text-sm font-semibold whitespace-nowrap"
              >
                <span className="relative z-10">{settings.heroSecondaryCta}</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Modular Bento Grid: Spotlight Find + Category Tiles */}
          <motion.div
            style={{ y: heroRightY }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-4 sm:grid-cols-2 lg:col-span-5"
          >
            {spotlightProduct ? (
              <Link
                to={`/product/${spotlightProduct.slug}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/65 p-5 transition-all hover:border-[#3156A5] sm:col-span-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-accent text-[10px] font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
                      Curated Spotlight
                    </span>
                    <h2 className="mt-1 truncate font-display text-lg font-bold text-[#101A35]">
                      {spotlightProduct.title}
                    </h2>
                    <p className="mt-1 font-accent tabular-nums text-base font-bold text-[#1C3265]">
                      {formatTaka(spotlightProduct.price)}
                    </p>
                  </div>
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#B7C9ED]/60 bg-white">
                    {spotlightProduct.images?.[0] ? (
                      <img
                        src={spotlightProduct.images[0]}
                        alt={spotlightProduct.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F1F4FC]">
                        <div className="h-6 w-6 rotate-45 rounded-lg border border-[#6385CB]/45 bg-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#1C3265]">
                  <span>{spotlightProduct.categoryName || 'Featured Find'}</span>
                  <span className="inline-flex items-center gap-1 group-hover:text-[#3156A5]">
                    Inspect Find
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ) : null}

            {categories.slice(0, 4).map((cat, idx) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id || p.categoryName === cat.name
              ).length;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ duration: 0.48, delay: 0.1 + idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="flex"
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.id)}`}
                    className="group flex w-full flex-col justify-between rounded-3xl border border-[#B7C9ED]/65 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3156A5] hover:bg-[#F1F4FC]/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-accent tabular-nums text-[11px] font-semibold text-[#6385CB]">
                        0{idx + 1}
                      </span>
                      <span className="rounded-full bg-[#F1F4FC] px-2.5 py-0.5 font-accent tabular-nums text-[11px] font-semibold text-[#1C3265]">
                        {count}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#101A35] group-hover:text-[#1C3265]">
                        {cat.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6385CB] transition-transform group-hover:translate-x-0.5 group-hover:text-[#101A35]" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Scroll-Based Section 1: Pinned / Featured Finds */}
      {pinnedProducts.length > 0 && (
        <ScrollParallaxSection offsetY={24} className="py-10 sm:py-14">
          <ScrollReveal>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-accent text-xs font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
                  Pinned Highlights
                </p>
                <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#101A35] sm:text-3xl">
                  Featured Smart Finds
                </h2>
              </div>
              <Link
                to="/shop?sort=featured"
                className="apple-btn apple-btn-glass inline-flex h-10 items-center gap-1.5 px-5 text-xs font-semibold whitespace-nowrap"
              >
                <span className="relative z-10">View all featured</span>
                <ArrowRight className="relative z-10 h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedProducts.slice(0, 6).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </ScrollReveal>
        </ScrollParallaxSection>
      )}

      {/* Scroll-Based Section 2: Browse by Category — Horizontal Right-Aligned Sliding Row */}
      <ScrollParallaxSection offsetY={26} className="py-10 sm:py-14">
        <ScrollReveal>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="shrink-0">
              <p className="font-accent text-xs font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
                Curated Selection
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#101A35] sm:text-3xl">
                Browse by Category
              </h2>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-start md:justify-end">
              <SlidingTabs
                layoutId="home-category-tabs"
                options={tabOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                slideInFromRight
              />
            </div>
          </div>

          <div className="mt-8">
            {loadingCatalog ? (
              <ProductGridSkeleton count={6} />
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  <Link
                    to="/shop"
                    className="apple-btn apple-btn-glass inline-flex h-11 items-center gap-2 px-7 text-xs font-semibold whitespace-nowrap"
                  >
                    <span className="relative z-10">Explore All Products</span>
                    <ArrowRight className="relative z-10 h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <ProductEmptyState
                title={
                  products.length === 0
                    ? 'Something worth discovering is coming soon.'
                    : 'No finds in this category yet.'
                }
                subtitle={
                  products.length === 0
                    ? 'Every item on TRT FINDS is intentionally curated. New smart finds will appear here as soon as they are published.'
                    : 'Try another category pill or explore the full storefront.'
                }
                showResetButton={products.length > 0}
                onReset={() => setSelectedCategory('all')}
              />
            )}
          </div>
        </ScrollReveal>
      </ScrollParallaxSection>

      {/* Scroll-Based Section 3: Brand Philosophy Bento Strip */}
      <ScrollParallaxSection offsetY={28} className="py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-[#B7C9ED]/55 bg-[#F1F4FC]/60 p-7"
          >
            <span className="font-accent text-xs font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
              01 · Thought
            </span>
            <h3 className="mt-2 font-display text-lg font-bold text-[#101A35]">
              Intentional Selection
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#1C3265]/80">
              No noisy marketplace clutter—only considered objects evaluated for daily utility and lasting design.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-[#B7C9ED]/55 bg-white p-7"
          >
            <span className="font-accent text-xs font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
              02 · Realize
            </span>
            <h3 className="mt-2 font-display text-lg font-bold text-[#101A35]">
              Clear Transparency
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#1C3265]/80">
              Honest ৳ pricing, crisp specifications, and direct verified outbound links to trusted partner stores.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-[#101A35] bg-[#101A35] p-7 text-white"
          >
            <span className="inline-flex items-center gap-1.5 font-accent text-xs font-semibold tracking-[0.14em] text-[#B7C9ED] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              03 · Trend
            </span>
            <h3 className="mt-2 font-display text-lg font-bold text-white">
              Modern Everyday Utility
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#B7C9ED]/90">
              Designed for modern living across Tech & Gadgets, Home & Living, Fashion, and Daily Essentials.
            </p>
          </motion.div>
        </div>
      </ScrollParallaxSection>
    </div>
  );
}
