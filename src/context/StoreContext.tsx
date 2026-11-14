import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SITE_SETTINGS, fetchStorefrontData } from '../lib/apiClient';
import { getStaticStorefrontData } from '../lib/fallbackCatalog';
import type { Category, Product, SiteSettings, WishlistItem } from '../types';

const WISHLIST_STORAGE_KEY = 'trt_finds_wishlist_v1';

interface StoreContextValue {
  products: Product[];
  pinnedProducts: Product[];
  categories: Category[];
  settings: SiteSettings;
  wishlist: WishlistItem[];
  loadingCatalog: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeWishlistItem: (productId: string) => void;
  refreshStorefront: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readLocalWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is WishlistItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as WishlistItem).productId === 'string' &&
        typeof (item as WishlistItem).title === 'string' &&
        typeof (item as WishlistItem).slug === 'string' &&
        typeof (item as WishlistItem).price === 'number'
    );
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => readLocalWishlist());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const refreshStorefront = useCallback(async () => {
    try {
      const data = await fetchStorefrontData();
      const safeProducts = Array.isArray(data?.products)
        ? data.products
        : getStaticStorefrontData().products;
      const safeCategories = Array.isArray(data?.categories)
        ? data.categories
        : getStaticStorefrontData().categories;
      setProducts(safeProducts);
      setCategories(safeCategories);
      setSettings({
        ...DEFAULT_SITE_SETTINGS,
        ...(data?.settings && typeof data.settings === 'object' ? data.settings : {}),
      });
    } catch {
      const fallback = getStaticStorefrontData();
      setProducts((prev) => (prev.length > 0 ? prev : fallback.products));
      setCategories((prev) => (prev.length > 0 ? prev : fallback.categories));
      setSettings((prev) => ({ ...DEFAULT_SITE_SETTINGS, ...prev }));
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void refreshStorefront();
  }, [refreshStorefront]);

  // Sync wishlist to localStorage and across open browser tabs without requiring customer login
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlist]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_STORAGE_KEY) {
        setWishlist(readLocalWishlist());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const pinnedProducts = useMemo(() => products.filter((p) => p.isPinned), [products]);
  const wishlistIds = useMemo(() => new Set(wishlist.map((w) => w.productId)), [wishlist]);

  const isInWishlist = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setWishlist((prev) => {
        const exists = prev.some((item) => item.productId === product.id);
        if (exists) {
          showToast('Removed from your wishlist.');
          return prev.filter((item) => item.productId !== product.id);
        }
        showToast('Saved to your wishlist.');
        return [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            image: product.images?.[0] || null,
            affiliateUrl: product.affiliateUrl ?? null,
            addedAt: Date.now(),
          },
          ...prev,
        ];
      });
    },
    [showToast]
  );

  const removeWishlistItem = useCallback(
    (productId: string) => {
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      showToast('Removed from your wishlist.');
    },
    [showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        pinnedProducts,
        categories,
        settings,
        wishlist,
        loadingCatalog,
        searchQuery,
        setSearchQuery,
        isInWishlist,
        toggleWishlist,
        removeWishlistItem,
        refreshStorefront,
        toastMessage,
        showToast,
        quickViewProduct,
        openQuickView,
        closeQuickView,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
