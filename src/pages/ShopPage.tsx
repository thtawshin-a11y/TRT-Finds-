import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductEmptyState, ProductGridSkeleton } from '../components/ProductEmptyState';
import { ScrollReveal } from '../components/ScrollEffects';
import { SlidingTabs, type TabOption } from '../components/SlidingTabs';
import { useStore } from '../context/StoreContext';
import type { ProductSortOption } from '../types';

export function ShopPage() {
  const { products, categories, loadingCatalog, searchQuery, setSearchQuery } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const initialSort = (searchParams.get('sort') as ProductSortOption) || 'newest';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [sortBy, setSortBy] = useState<ProductSortOption>(initialSort);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    const paramSort = searchParams.get('sort') as ProductSortOption | null;
    if (paramCat) setSelectedCategory(paramCat);
    if (paramSort) setSortBy(paramSort);
  }, [searchParams]);

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
        const hay = `${p.title} ${p.description || ''} ${p.categoryName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
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
  }, [products, selectedCategory, searchQuery, sortBy, categories]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ScrollReveal className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div>
          <p className="font-accent text-xs font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
            Storefront Catalog
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl">
            Curated Shop
          </h1>
          <p className="mt-2 text-sm text-[#1C3265]/75">
            Search, filter, and compare thoughtfully chosen finds priced transparently in ৳.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-full border border-[#B7C9ED] bg-white pl-11 pr-9 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6385CB] hover:text-[#101A35]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.06} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SlidingTabs
          layoutId="shop-category-tabs"
          options={categoryTabs}
          value={selectedCategory}
          onChange={handleCategoryChange}
          slideInFromRight
        />

        <SlidingTabs
          layoutId="shop-sort-tabs"
          size="sm"
          options={sortOptions}
          value={sortBy}
          onChange={handleSortChange}
        />
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="mt-6 flex items-center justify-between text-xs text-[#1C3265]/70">
        <span className="font-accent tabular-nums">
          Showing {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'find' : 'finds'}
        </span>
        {(selectedCategory !== 'all' || searchQuery || sortBy !== 'newest') && (
          <button
            type="button"
            onClick={resetFilters}
            className="apple-btn apple-btn-glass px-4 py-1.5 font-medium text-[#1C3265]"
          >
            <span className="relative z-10">Reset filters</span>
          </button>
        )}
      </ScrollReveal>

      <section className="mt-6">
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
                  : 'Try adjusting your search keywords or category pill.'
              }
              showResetButton={products.length > 0}
              onReset={resetFilters}
            />
          </ScrollReveal>
        )}
      </section>
    </div>
  );
}
