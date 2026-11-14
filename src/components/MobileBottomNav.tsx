import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Heart,
  Home,
  Info,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Menu,
  ShoppingBag,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export function MobileBottomNav() {
  const { wishlist, settings, showToast } = useStore();
  const { user, openAuthModal, signOutUser } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!moreOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [moreOpen]);

  const navTabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/shop', label: 'Shop', icon: ShoppingBag, end: false },
    { to: '/categories', label: 'Categories', icon: LayoutGrid, end: false },
    { to: '/wishlist', label: 'Saved', icon: Heart, end: false, badge: wishlist.length },
  ];

  const isMoreRouteActive =
    moreOpen || location.pathname === '/about' || location.pathname === '/contact';

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {/* Clean Frosted Upward Sheet for Menu */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative mx-auto mb-3 max-w-md rounded-[28px] border border-[#B7C9ED]/90 bg-white/97 p-3.5 shadow-[0_18px_40px_-12px_rgba(16,26,53,0.22)]"
          >
            <div className="relative mb-3 flex items-center justify-between px-2 pt-0.5">
              <div>
                <p className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#101A35]">
                  <Sparkles className="h-3.5 w-3.5 text-[#1C3265]" />
                  <span>TRT FINDS</span>
                </p>
                <p className="mt-0.5 font-accent text-[10px] font-bold tracking-[0.14em] text-[#1C3265] uppercase">
                  {settings.brandPhilosophy}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="apple-btn apple-icon-btn inline-flex h-9 w-9 items-center justify-center text-[#101A35]"
              >
                <X className="relative z-10 h-4 w-4" />
              </button>
            </div>

            {/* Member Sign Up / Continue with Google Row */}
            <div className="mb-2.5 rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/70 p-2.5">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-bold text-[#101A35]">
                      {user.displayName || 'TRT FINDS Member'}
                    </p>
                    <p className="truncate text-[10px] font-medium text-[#1C3265]">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      void signOutUser().then(() => showToast('Signed out.'));
                    }}
                    className="apple-btn apple-btn-glass inline-flex h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-[#101A35]"
                  >
                    <LogOut className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openAuthModal('signup');
                  }}
                  className="apple-btn apple-btn-primary flex h-10 w-full items-center justify-center gap-2 px-4 text-xs font-semibold"
                >
                  <UserPlus className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">Sign Up / Continue with Google</span>
                </button>
              )}
            </div>

            <div className="relative grid grid-cols-2 gap-2">
              <Link
                to="/about"
                className={`apple-btn flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold ${
                  location.pathname === '/about' ? 'apple-btn-primary' : 'apple-btn-glass'
                }`}
              >
                <Info className="relative z-10 h-4 w-4 shrink-0" />
                <span className="relative z-10">About Brand</span>
              </Link>

              <Link
                to="/contact"
                className={`apple-btn flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold ${
                  location.pathname === '/contact' ? 'apple-btn-primary' : 'apple-btn-glass'
                }`}
              >
                <Mail className="relative z-10 h-4 w-4 shrink-0" />
                <span className="relative z-10">Contact</span>
              </Link>
            </div>

            <Link
              to="/admin"
              className="apple-btn apple-btn-glass relative mt-2 flex h-11 items-center justify-between px-4 text-xs font-semibold text-[#101A35]"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[#1C3265]" />
                <span>Admin Portal</span>
              </span>
              <span className="relative z-10 font-accent text-[10px] font-semibold text-[#1C3265]">
                Manage Store
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure White Liquid-Glass Apple-UI Bottom Navigation Dock */}
      <nav
        aria-label="Mobile navigation"
        className="liquid-glass-nav pointer-events-auto relative mx-auto max-w-md rounded-[30px] p-1.5"
      >
        <div className="relative grid grid-cols-5 items-center gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                onClick={() => setMoreOpen(false)}
                className="relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-full text-center transition-transform active:scale-95"
              >
                {({ isActive }) => {
                  const active = isActive && !moreOpen;
                  return (
                    <>
                      {active && (
                        <motion.span
                          layoutId="mobile-bottom-active-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="apple-btn-primary pointer-events-none absolute inset-0 rounded-full"
                        />
                      )}

                      <span className="relative z-10 inline-flex items-center justify-center">
                        <Icon
                          strokeWidth={active ? 2.25 : 2}
                          className={`h-[18px] w-[18px] transition-colors duration-150 ${
                            active
                              ? tab.to === '/wishlist'
                                ? 'fill-white text-white'
                                : 'text-white'
                              : 'text-[#101A35]'
                          }`}
                        />
                        {typeof tab.badge === 'number' && tab.badge > 0 && (
                          <span
                            className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-accent tabular-nums text-[9px] font-bold ring-2 ${
                              active
                                ? 'bg-white text-[#101A35] ring-[#1C3265]'
                                : 'bg-[#101A35] text-white ring-white'
                            }`}
                          >
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </span>
                        )}
                      </span>

                      <span
                        className={`relative z-10 text-[10px] leading-none transition-colors duration-150 ${
                          active ? 'font-bold text-white' : 'font-semibold text-[#101A35]'
                        }`}
                      >
                        {tab.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}

          {/* 5th Button: Menu */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More pages and menu"
            aria-expanded={moreOpen}
            className="relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-full text-center transition-transform active:scale-95"
          >
            {isMoreRouteActive && (
              <motion.span
                layoutId="mobile-bottom-active-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="apple-btn-primary pointer-events-none absolute inset-0 rounded-full"
              />
            )}
            <span className="relative z-10">
              <Menu
                strokeWidth={isMoreRouteActive ? 2.25 : 2}
                className={`h-[18px] w-[18px] transition-colors duration-150 ${
                  isMoreRouteActive ? 'text-white' : 'text-[#101A35]'
                }`}
              />
            </span>
            <span
              className={`relative z-10 text-[10px] leading-none transition-colors duration-150 ${
                isMoreRouteActive ? 'font-bold text-white' : 'font-semibold text-[#101A35]'
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
