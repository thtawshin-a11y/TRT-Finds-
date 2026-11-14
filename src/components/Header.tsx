import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Layers,
  Lock,
  LogOut,
  MoreVertical,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatTaka } from '../lib/format';
import { BrandLogo } from './BrandLogo';

export function Header() {
  const { products, categories, wishlist, searchQuery, setSearchQuery, showToast } = useStore();
  const { user, openAuthModal, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();
  const headerBlurBg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.92)']);

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close popovers on route navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Focus input when global search opens
  useEffect(() => {
    if (searchOpen) {
      const id = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(id);
    }
  }, [searchOpen]);

  // Outside click & keyboard shortcuts (Escape + Cmd/Ctrl+K)
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuOpen && menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (searchOpen && headerRef.current && !headerRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen((prev) => !prev);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen, searchOpen]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingCategories = useMemo(() => {
    if (!trimmedQuery) return categories.slice(0, 4);
    return categories
      .filter((cat) => {
        const hay = `${cat.name} ${cat.description || ''}`.toLowerCase();
        return hay.includes(trimmedQuery);
      })
      .slice(0, 5);
  }, [categories, trimmedQuery]);

  const matchingProducts = useMemo(() => {
    if (!trimmedQuery) {
      const pinned = products.filter((p) => p.isPinned);
      return (pinned.length > 0 ? pinned : products).slice(0, 4);
    }

    return products
      .filter((p) => {
        const linkedCat = categories.find((c) => c.id === p.categoryId);
        const hay = `${p.title} ${p.categoryName || ''} ${linkedCat?.name || ''} ${
          p.description || ''
        }`.toLowerCase();
        return hay.includes(trimmedQuery);
      })
      .slice(0, 6);
  }, [products, categories, trimmedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate('/shop');
  };

  const handleSelectCategory = (catId: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(`/shop?category=${encodeURIComponent(catId)}`);
  };

  const handleSelectProduct = (slug: string) => {
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(`/product/${encodeURIComponent(slug)}`);
  };

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop', end: false },
    { to: '/categories', label: 'Categories', end: false },
    { to: '/about', label: 'About', end: false },
    { to: '/contact', label: 'Contact', end: false },
  ];

  return (
    <motion.header
      ref={headerRef}
      style={{ backgroundColor: headerBlurBg }}
      className="sticky top-0 z-40 border-b border-white/90 shadow-[inset_0_-1px_0_rgba(183,201,237,0.45),0_8px_28px_-14px_rgba(16,26,53,0.12)] backdrop-blur-2xl backdrop-saturate-150 transition-shadow"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3.5 sm:h-24 sm:gap-6 sm:px-6 lg:px-8">
        {/* Left: Enlarged Brand Logo & Wordmark */}
        <Link to="/" className="shrink-0 focus-visible:rounded-full" aria-label="TRT FINDS Home">
          <BrandLogo size="md" showWordmark />
        </Link>

        {/* Center: Clean Desktop Navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-1.5 xl:gap-2.5 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `apple-btn whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#F1F4FC] text-[#101A35]'
                    : 'text-[#1C3265] hover:bg-[#F1F4FC]/80 hover:text-[#101A35]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Strictly Search Icon, Wishlist Button, and Three-Dot Menu */}
        <div ref={menuContainerRef} className="relative flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Global product and category search"
            aria-expanded={searchOpen}
            className={`apple-btn inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
              searchOpen ? 'apple-btn-primary' : 'apple-icon-btn text-[#1C3265]'
            }`}
          >
            {searchOpen ? (
              <X className="relative z-10 h-4 w-4" />
            ) : (
              <Search className="relative z-10 h-4 w-4" />
            )}
          </button>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(false);
            }}
            className="apple-btn apple-btn-glass inline-flex h-10 items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap sm:h-11 sm:gap-2 sm:px-4"
          >
            <Heart
              className={`relative z-10 h-4 w-4 text-[#1C3265] ${
                wishlist.length > 0 ? 'fill-[#1C3265]' : ''
              }`}
            />
            <span className="relative z-10 hidden sm:inline">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1C3265] px-1.5 font-accent tabular-nums text-[11px] font-semibold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
            aria-label="More navigation options"
            aria-expanded={menuOpen}
            className={`apple-btn inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
              menuOpen ? 'apple-btn-primary' : 'apple-icon-btn text-[#1C3265]'
            }`}
          >
            {menuOpen ? (
              <X className="relative z-10 h-4.5 w-4.5" />
            ) : (
              <MoreVertical className="relative z-10 h-4.5 w-4.5" />
            )}
          </button>

          {/* Three-Dot Liquid Glass Menu Popover */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-glass-panel absolute right-0 top-[calc(100%+12px)] z-50 w-68 rounded-[28px] p-3"
              >
                {/* Member Sign Up / Google Account Section */}
                <div className="liquid-glass-card mb-2.5 rounded-2xl p-3">
                  {user ? (
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'Member'}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 shrink-0 rounded-full border border-[#B7C9ED] object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1C3265] font-display text-xs font-bold text-white">
                            {(user.displayName || user.email || 'T').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-display text-xs font-bold text-[#101A35]">
                            {user.displayName || 'Member'}
                          </p>
                          <p className="truncate text-[10px] text-[#6385CB]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          void signOutUser().then(() => showToast('Signed out.'));
                        }}
                        aria-label="Sign out"
                        title="Sign out"
                        className="apple-btn apple-icon-btn inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#1C3265]"
                      >
                        <LogOut className="relative z-10 h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-accent text-[10px] font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                        Member Access
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openAuthModal('signup');
                        }}
                        className="apple-btn apple-btn-primary mt-2 flex h-9 w-full items-center justify-center gap-1.5 px-3 text-xs font-semibold"
                      >
                        <UserPlus className="relative z-10 h-3.5 w-3.5" />
                        <span className="relative z-10">Sign Up / Google</span>
                      </button>
                    </div>
                  )}
                </div>

                <nav aria-label="Menu" className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#101A35] text-white'
                            : 'text-[#1C3265]/85 hover:bg-white/75 hover:text-[#101A35]'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="my-1 border-t border-[#B7C9ED]/35" />

                  <Link
                    to="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-full px-4 py-2 text-sm font-medium text-[#1C3265]/85 transition-colors hover:bg-white/75 hover:text-[#101A35]"
                  >
                    <span>Wishlist</span>
                    <span className="font-accent tabular-nums text-xs font-semibold text-[#3156A5]">
                      {wishlist.length}
                    </span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#1C3265] transition-colors hover:bg-white/75 hover:text-[#101A35]"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Admin Portal</span>
                  </Link>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Header Search Bar & Live Product / Category Results */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#B7C9ED]/35 bg-white/95 px-4 py-4 shadow-[0_20px_48px_-16px_rgba(16,26,53,0.18)] backdrop-blur-2xl sm:px-6"
          >
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name or category..."
                    aria-label="Search products by name or category"
                    className="h-11 w-full rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/55 pl-11 pr-10 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:bg-white focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6385CB] hover:bg-[#F1F4FC] hover:text-[#101A35]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="apple-btn apple-btn-primary h-11 shrink-0 px-5 text-xs font-semibold sm:px-6"
                >
                  <span className="relative z-10">View in Shop</span>
                </button>
              </form>

              {/* Live Search Results from Existing Shop Data */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Category Matches */}
                {matchingCategories.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-1.5 font-accent text-[10px] font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                      <Layers className="h-3 w-3" />
                      <span>{trimmedQuery ? 'Matching Categories' : 'Browse Categories'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {matchingCategories.map((cat) => {
                        const count = products.filter(
                          (p) => p.categoryId === cat.id || p.categoryName === cat.name
                        ).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategory(cat.id)}
                            className="apple-btn apple-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
                          >
                            <span className="relative z-10">{cat.name}</span>
                            <span className="relative z-10 rounded-full bg-[#F1F4FC] px-1.5 py-0.5 font-accent tabular-nums text-[10px] text-[#3156A5]">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product Matches */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-accent text-[10px] font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                      <Sparkles className="h-3 w-3" />
                      <span>{trimmedQuery ? 'Matching Products' : 'Suggested Finds'}</span>
                    </span>
                    {trimmedQuery && matchingProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/shop');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1C3265] hover:text-[#3156A5]"
                      >
                        <span>Open Shop Filter</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {matchingProducts.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {matchingProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product.slug)}
                          className="group flex items-center gap-3 rounded-2xl border border-[#B7C9ED]/55 bg-white p-2.5 text-left transition-all hover:border-[#3156A5] hover:bg-[#F1F4FC]/50"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#B7C9ED]/50 bg-[#F1F4FC]">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <div className="h-4 w-4 rotate-45 rounded border border-[#6385CB]/50 bg-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-xs font-bold text-[#101A35] group-hover:text-[#1C3265]">
                              {product.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                              <span className="font-accent tabular-nums font-bold text-[#1C3265]">
                                {formatTaka(product.price)}
                              </span>
                              {product.categoryName && (
                                <span className="truncate text-[#6385CB]">
                                  · {product.categoryName}
                                </span>
                              )}
                            </div>
                          </div>

                          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#6385CB] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#101A35]" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#B7C9ED]/55 bg-[#F1F4FC]/45 px-4 py-5 text-center">
                      <p className="text-xs font-medium text-[#101A35]">
                        No products or categories match &ldquo;{searchQuery.trim()}&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs font-semibold text-[#3156A5] hover:text-[#101A35]"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
