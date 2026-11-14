import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductEmptyState, ProductGridSkeleton } from '../components/ProductEmptyState';
import { ScrollEditorialTicker, ScrollParallaxSection, ScrollReveal } from '../components/ScrollEffects';
import { SlidingTabs, type TabOption } from '../components/SlidingTabs';
import { useStore } from '../context/StoreContext';
import { formatTaka, getSwatchGradient, resolveProductColorOptions } from '../lib/format';
import type { ProductSortOption } from '../types';

export function ShopPage() {
  const { products, categories, settings, loadingCatalog, searchQuery, setSearchQuery } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const initialSort = (searchParams.get('sort') as ProductSortOption) || 'newest';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [sortBy, setSortBy] = useState<ProductSortOption>(initialSort);

  // Interactive Product Filter States
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in-stock' | 'discounted'>('all');
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | null>(null);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    const paramSort = searchParams.get('sort') as ProductSortOption | null;
    if (paramCat) setSelectedCategory(paramCat);
    if (paramSort) setSortBy(paramSort);
  }, [searchParams]);

  const catalogMaxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.max(1000, ...products.map((p) => Math.ceil(p.price / 100) * 100));
  }, [products]);

  const effectiveMaxPrice = maxPriceLimit ?? catalogMaxPrice;

  const availableColors = useMemo(() => {
    const map = new Map<string, { name: string; hexes: string[] }>();
    products.forEach((p) => {
      resolveProductColorOptions(p).forEach((c) => {
        const key = c.name.trim().toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, { name: c.name.trim(), hexes: c.hexes });
        }
      });
    });
    return Array.from(map.values());
  }, [products]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.sizes?.forEach((s) => {
        if (s.trim()) set.add(s.trim());
      });
    });
    return Array.from(set);
  }, [products]);

  const hasUncategorized = useMemo(
    () => products.some((p) => !p.categoryId && !p.categoryName),
    [products]
  );

  const categoryTabs: TabOption<string>[] = useMemo(() => {
    const tabs: TabOption<string>[] = [{ value: 'all', label: 'All Finds', count: products.length }];
    categories.forEach((cat) => {
      const count = products.filter(
        (p) => p.categoryId === cat.id || p.categoryName === cat.name
      ).length;
      tabs.push({ value: cat.id, label: cat.name, count });
    });
    if (hasUncategorized) {
      tabs.push({
        value: 'uncategorized',
        label: 'Uncategorized',
        count: products.filter((p) => !p.categoryId && !p.categoryName).length,
      });
    }
    return tabs;
  }, [categories, products, hasUncategorized]);

  const sortOptions: TabOption<ProductSortOption>[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low–High' },
    { value: 'price-desc', label: 'Price: High–Low' },
  ];

  const handleCategoryChange = (next: string) => {
    setSelectedCategory(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    setSearchParams(params, { replace: true });
  };

  const handleSortChange = (next: ProductSortOption) => {
    setSortBy(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'newest') params.delete('sort');
    else params.set('sort', next);
    setSearchParams(params, { replace: true });
  };

  const activeFilterCount =
    (selectedColorName !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (maxPriceLimit !== null && maxPriceLimit < catalogMaxPrice ? 1 : 0);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = products.filter((p) => {
      if (selectedCategory === 'uncategorized') {
        if (p.categoryId || p.categoryName) return false;
      } else if (selectedCategory !== 'all') {
        const targetCat = categories.find(
          (c) => c.id === selectedCategory || c.slug === selectedCategory
        );
        const matchesCat =
          p.categoryId === selectedCategory ||
          (targetCat && (p.categoryId === targetCat.id || p.categoryName === targetCat.name));
        if (!matchesCat) return false;
      }

      if (q) {
        const colorNames = resolveProductColorOptions(p)
          .map((c) => c.name)
          .join(' ');
        const hay = `${p.title} ${p.description || ''} ${p.categoryName || ''} ${colorNames}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (selectedColorName !== 'all') {
        const hasColor = resolveProductColorOptions(p).some(
          (c) => c.name.trim().toLowerCase() === selectedColorName.toLowerCase()
        );
        if (!hasColor) return false;
      }

      if (selectedSize !== 'all') {
        const hasSize = p.sizes?.some(
          (s) => s.trim().toLowerCase() === selectedSize.toLowerCase()
        );
        if (!hasSize) return false;
      }

      if (availabilityFilter === 'in-stock') {
        if (p.stock !== null && p.stock !== undefined && p.stock <= 0) return false;
      } else if (availabilityFilter === 'discounted') {
        const hasDiscount =
          (p.discountPercent && p.discountPercent > 0) ||
          (p.originalPrice && p.originalPrice > p.price);
        if (!hasDiscount) return false;
      }

      if (maxPriceLimit !== null && p.price > maxPriceLimit) {
        return false;
      }

      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
    sortBy,
    categories,
    selectedColorName,
    selectedSize,
    availabilityFilter,
    maxPriceLimit,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
    setSelectedColorName('all');
    setSelectedSize('all');
    setAvailabilityFilter('all');
    setMaxPriceLimit(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header Title Block */}
      <ScrollReveal className="pb-5">
        <p className="font-accent text-xs font-bold tracking-[0.16em] text-[#1C3265] uppercase">
          Storefront Catalog
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl">
          Curated Shop
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-[#1C3265]">
          Search, filter by color, price or size, and compare thoughtfully chosen finds priced transparently in ৳.
        </p>
      </ScrollReveal>

      {/* Row 1: Search Bar alongside All Finds Categories */}
      <div className="rounded-3xl border border-[#B7C9ED]/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full shrink-0 lg:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1C3265]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or colors..."
              aria-label="Search products"
              className="h-11 w-full rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/65 pl-11 pr-9 text-sm font-medium text-[#101A35] placeholder:text-[#1C3265]/65 focus:border-[#1C3265] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#1C3265] hover:bg-white hover:text-[#101A35]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <SlidingTabs
              layoutId="shop-category-tabs"
              options={categoryTabs}
              value={selectedCategory}
              onChange={handleCategoryChange}
            />
          </div>
        </div>

        {/* Row 2 (Directly Below): Sort Options (Newest, Featured, Price Low-High) + Interactive Filter Toggle */}
        <div className="mt-3.5 flex flex-col gap-3 border-t border-[#F1F4FC] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
              Sort:
            </span>
            <SlidingTabs
              layoutId="shop-sort-tabs"
              size="sm"
              options={sortOptions}
              value={sortBy}
              onChange={handleSortChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className={`apple-btn inline-flex h-10 items-center gap-2 px-4 text-xs font-semibold ${
                filtersOpen || activeFilterCount > 0
                  ? 'apple-btn-primary'
                  : 'apple-btn-glass text-[#101A35]'
              }`}
            >
              <SlidersHorizontal className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Interactive Filter</span>
              {activeFilterCount > 0 && (
                <span className="relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 font-accent tabular-nums text-[10px] font-bold text-[#101A35]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(selectedCategory !== 'all' || searchQuery || sortBy !== 'newest' || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="apple-btn apple-btn-glass inline-flex h-10 items-center gap-1.5 px-3.5 text-xs font-semibold text-[#101A35]"
              >
                <RotateCcw className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Product Filter Drawer */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-4 rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Interactive Color Swatch Filter */}
                <div>
                  <span className="block font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                    Filter by Color
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedColorName('all')}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        selectedColorName === 'all'
                          ? 'bg-[#101A35] text-white'
                          : 'border border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#1C3265]'
                      }`}
                    >
                      All Colors
                    </button>
                    {availableColors.map((color) => {
                      const active =
                        selectedColorName.toLowerCase() === color.name.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() =>
                            setSelectedColorName(active ? 'all' : color.name)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            active
                              ? 'bg-[#101A35] text-white'
                              : 'border border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#1C3265]'
                          }`}
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                            style={{ background: getSwatchGradient(color.hexes) }}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Max Budget Slider (৳) */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                      Max Budget
                    </span>
                    <span className="font-accent tabular-nums text-xs font-extrabold text-[#101A35]">
                      {formatTaka(effectiveMaxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={catalogMaxPrice}
                    step={100}
                    value={effectiveMaxPrice}
                    onChange={(e) => setMaxPriceLimit(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#1C3265]"
                  />
                  <div className="mt-1 flex justify-between font-accent tabular-nums text-[10px] font-semibold text-[#1C3265]">
                    <span>{formatTaka(500)}</span>
                    <span>{formatTaka(catalogMaxPrice)}</span>
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <span className="block font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                    Availability & Deals
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'in-stock', label: 'In Stock' },
                        { id: 'discounted', label: 'On Sale' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAvailabilityFilter(opt.id)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          availabilityFilter === opt.id
                            ? 'bg-[#101A35] text-white'
                            : 'border border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#1C3265]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <span className="block font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                    Size
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSize('all')}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        selectedSize === 'all'
                          ? 'bg-[#101A35] text-white'
                          : 'border border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#1C3265]'
                      }`}
                    >
                      All Sizes
                    </button>
                    {availableSizes.map((sz) => {
                      const active = selectedSize.toLowerCase() === sz.toLowerCase();
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(active ? 'all' : sz)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                            active
                              ? 'bg-[#101A35] text-white'
                              : 'border border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#1C3265]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count Row */}
      <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#101A35]">
        <span className="font-accent tabular-nums">
          Showing {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'find' : 'finds'}
        </span>
      </div>

      <ScrollEditorialTicker
        className="-mx-4 mt-4 sm:-mx-6 lg:-mx-8"
        reverse
        items={[
          settings.brandPhilosophy || 'Thought • Realize • Trend',
          'Interactive Color & Budget Filters',
          'Transparent ৳ Pricing',
          'Curated Smart Utility',
        ]}
      />

      <ScrollParallaxSection offsetY={14} className="mt-7">
        {loadingCatalog ? (
          <ProductGridSkeleton count={6} />
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <ProductEmptyState
              title={
                products.length === 0
                  ? 'Something worth discovering is coming soon.'
                  : 'No matching products found.'
              }
              subtitle={
                products.length === 0
                  ? 'New curated finds will appear here once published.'
                  : 'Try adjusting your search keywords, color swatch, budget slider, or category.'
              }
              showResetButton={products.length > 0}
              onReset={resetFilters}
            />
          </ScrollReveal>
        )}
      </ScrollParallaxSection>
    </div>
  );
}
