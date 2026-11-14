import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AuthModal } from './components/AuthModal';
import { CustomCursor } from './components/CustomCursor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { GeometricBackdrop } from './components/GeometricBackdrop';
import { Header } from './components/Header';
import { LogoPreloader } from './components/LogoPreloader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickViewModal } from './components/QuickViewModal';
import { ScrollProgressBar } from './components/ScrollEffects';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { trackAnalyticsEvent } from './lib/apiClient';
import { AboutPage } from './pages/AboutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { WishlistPage } from './pages/WishlistPage';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (!location.pathname.startsWith('/admin')) {
      void trackAnalyticsEvent({
        type: 'site_visit',
        path: location.pathname || '/',
        dedupeSessionKey: `visit_${location.pathname}`,
      });
    }
  }, [location.pathname]);

  return null;
}

function ToastBanner() {
  const { toastMessage } = useStore();
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-24 right-4 z-50 rounded-full border border-[#1C3265]/30 bg-[#101A35] px-5 py-2.5 text-xs font-medium text-white shadow-lg md:bottom-5 md:right-5"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const { settings } = useStore();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <LogoPreloader enabled={settings.enableReloadAnimation} />}
      {!isAdminRoute && <ScrollProgressBar />}
      <RouteTracker />
      <CustomCursor />
      {!isAdminRoute && <GeometricBackdrop />}

      {isAdminRoute ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/*" element={<AdminDashboardPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex min-h-screen flex-col pb-24 md:pb-0">
          <Header />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="will-change-transform"
              >
                <Routes location={location}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      )}

      <QuickViewModal />
      <AuthModal />
      <ToastBanner />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <StoreProvider>
              <AppShell />
            </StoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}
