import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, Lock, MoreVertical, Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

export function Header() {
  const { wishlist, searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate('/shop');
  };

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop', end: false },
    { to: '/categories', label: 'Categories', end: false },
    { to: '/about', label: 'About', end: false },
    { to: '/contact', label: 'Contact', end: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#B7C9ED]/35 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3.5 sm:h-24 sm:gap-6 sm:px-6 lg:px-8">
        {/* Left: Enlarged Brand Logo & Wordmark */}
        <Link to="/" className="shrink-0 focus-visible:rounded-full" aria-label="TRT FINDS Home">
          <BrandLogo size="md" showWordmark />
        </Link>

        {/* Center: Clean Desktop Navigation (hidden on mobile & tablet for spacious alignment) */}
        <nav aria-label="Primary" className="hidden items-center gap-1.5 xl:gap-2.5 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `apple-btn whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#F1F4FC] text-[#101A35]'
                    : 'text-[#1C3265]/75 hover:bg-[#F1F4FC]/70 hover:text-[#101A35]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Strictly Search Icon, Wishlist Button, and Three-Dot Menu across Mobile, Tablet & Desktop */}
        <div ref={menuContainerRef} className="relative flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Search products"
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
            onClick={() => setMenuOpen(false)}
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

          {/* Three-Dot Apple Glass Menu Popover */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+12px)] z-50 w-60 rounded-3xl border border-[#B7C9ED]/75 bg-white/95 p-2.5 shadow-[0_20px_44px_-12px_rgba(16,26,53,0.22)] backdrop-blur-2xl"
              >
                <nav aria-label="Menu" className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#101A35] text-white'
                            : 'text-[#1C3265]/85 hover:bg-[#F1F4FC] hover:text-[#101A35]'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="my-1 border-t border-[#F1F4FC]" />

                  <Link
                    to="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium text-[#1C3265]/85 transition-colors hover:bg-[#F1F4FC] hover:text-[#101A35]"
                  >
                    <span>Wishlist</span>
                    <span className="font-accent tabular-nums text-xs font-semibold text-[#3156A5]">
                      {wishlist.length}
                    </span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium text-[#6385CB] transition-colors hover:bg-[#F1F4FC] hover:text-[#101A35]"
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

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-t border-[#B7C9ED]/35 bg-white/95 px-4 py-3.5 backdrop-blur-xl sm:px-6"
          >
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-2xl items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search smart finds, categories, or essentials..."
                  className="h-11 w-full rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/50 pl-11 pr-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="apple-btn apple-btn-primary h-11 shrink-0 px-6 text-xs font-semibold"
              >
                <span className="relative z-10">Search</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
