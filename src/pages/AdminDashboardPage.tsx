import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Check,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Plus,
  Search,
  Sliders,
  Trash2,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { SlidingTabs } from '../components/SlidingTabs';
import { AdminAnalyticsPanel } from '../components/admin/AdminAnalyticsPanel';
import { AdminProductForm } from '../components/admin/AdminProductForm';
import { useStore } from '../context/StoreContext';
import {
  ADMIN_TOKEN_KEY,
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteProduct,
  adminLoginWithPassword,
  adminUpdateCategory,
  adminUpdateProduct,
  adminUpdateSettings,
  changeAdminPassword,
  DEFAULT_SITE_SETTINGS,
  fetchAdminDashboard,
  verifyAdminToken,
} from '../lib/apiClient';
import { formatTaka, formatTimestampLabel } from '../lib/format';
import type { AnalyticsEvent, Category, Product, SiteSettings } from '../types';

type AdminTab = 'overview' | 'products' | 'categories' | 'site' | 'analytics' | 'password';
type ProductFilter = 'all' | 'published' | 'drafts' | 'pinned';

export function AdminDashboardPage() {
  const { refreshStorefront } = useStore();

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [checkingSession, setCheckingSession] = useState<boolean>(true);

  // Password-only unlock state
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loadingData, setLoadingData] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [siteForm, setSiteForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Products tab controls
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);

  // Category tab controls
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<Category | null>(null);

  // Site settings save state
  const [savingSettings, setSavingSettings] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!statusMessage) return;
    const t = window.setTimeout(() => setStatusMessage(null), 3800);
    return () => window.clearTimeout(t);
  }, [statusMessage]);

  // Verify persisted session token on mount
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!token) {
        if (active) setCheckingSession(false);
        return;
      }
      const valid = await verifyAdminToken(token);
      if (!active) return;
      if (!valid) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      }
      setCheckingSession(false);
    };
    void check();
    return () => {
      active = false;
    };
  }, [token]);

  const loadDashboard = useCallback(async (activeToken: string) => {
    setLoadingData(true);
    try {
      const data = await fetchAdminDashboard(activeToken);
      setProducts(data.products);
      setCategories(data.categories);
      setAnalytics(data.analytics);
      setProfileCount(data.profileCount ?? 0);
      setSiteForm({ ...DEFAULT_SITE_SETTINGS, ...data.settings });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load dashboard.';
      if (msg.toLowerCase().includes('session') || msg.includes('401')) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      } else {
        setStatusMessage(msg);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (token && !checkingSession) {
      void loadDashboard(token);
    }
  }, [token, checkingSession, loadDashboard]);

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setLoginError(null);
    setLoginBusy(true);
    try {
      const newToken = await adminLoginWithPassword(passwordInput);
      localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
      setToken(newToken);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Incorrect admin password.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLockPortal = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setPasswordInput('');
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const stats = useMemo(() => {
    const total = products.length;
    const published = products.filter((p) => p.isPublished).length;
    const drafts = products.filter((p) => !p.isPublished).length;
    const pinned = products.filter((p) => p.isPinned).length;
    const totalClicks = analytics.filter((a) => a.type === 'affiliate_click').length;
    const totalVisits = analytics.filter((a) => a.type === 'site_visit').length;
    const profileEvents = analytics.filter((a) => a.type === 'profile_created').length;
    const totalProfiles = Math.max(profileCount, profileEvents);
    return { total, published, drafts, pinned, totalClicks, totalVisits, totalProfiles };
  }, [products, analytics, profileCount]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productFilter === 'published' && !p.isPublished) return false;
      if (productFilter === 'drafts' && p.isPublished) return false;
      if (productFilter === 'pinned' && !p.isPinned) return false;
      if (q) {
        const hay = `${p.title} ${p.categoryName || ''} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, productFilter, productSearch]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F4FC]/50 p-6">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#B7C9ED] border-t-[#1C3265]" />
          <p className="mt-3 text-xs font-medium text-[#1C3265]">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  // Password-Only Access Gate
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F4FC]/60 p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#B7C9ED] bg-white p-8 shadow-sm">
          <BrandLogo size="md" showWordmark />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1">
            <Lock className="h-3.5 w-3.5 text-[#3156A5]" />
            <span className="font-accent text-[10px] font-semibold tracking-[0.16em] text-[#1C3265] uppercase">
              Admin Portal
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[#101A35]">
            Enter Admin Password
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#1C3265]/75">
            Unlock the private TRT FINDS workspace to manage products, categories, site customization, and analytics.
          </p>

          {loginError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={(e) => void handlePasswordUnlock(e)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="trt-admin-password"
                className="mb-1.5 block text-xs font-semibold text-[#101A35]"
              >
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="trt-admin-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="h-12 w-full rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/30 pl-5 pr-12 text-sm text-[#101A35] transition-colors focus:border-[#3156A5] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#6385CB] hover:bg-[#F1F4FC] hover:text-[#101A35]"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginBusy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C3265] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#101A35] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              <span>{loginBusy ? 'Unlocking...' : 'Unlock Admin Portal'}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-[#F1F4FC] pt-5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9ED] px-4 py-2 text-xs font-medium text-[#1C3265] transition-colors hover:bg-[#F1F4FC]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleProduct = async (
    product: Product,
    field: 'isPinned' | 'isPublished',
    value: boolean
  ) => {
    try {
      await adminUpdateProduct(token, product.id, { [field]: value });
      await Promise.all([loadDashboard(token), refreshStorefront()]);
      setStatusMessage(
        field === 'isPinned'
          ? value
            ? 'Pinned to homepage.'
            : 'Unpinned from homepage.'
          : value
            ? 'Product published.'
            : 'Moved to drafts.'
      );
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleDeleteProductConfirm = async () => {
    if (!confirmDeleteProduct) return;
    try {
      await adminDeleteProduct(token, confirmDeleteProduct.id);
      setConfirmDeleteProduct(null);
      await Promise.all([loadDashboard(token), refreshStorefront()]);
      setStatusMessage('Product deleted.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCategory) {
        await adminUpdateCategory(token, editingCategory.id, {
          name: catName.trim(),
          description: catDesc.trim() || null,
          sortOrder: editingCategory.sortOrder,
        });
        setStatusMessage('Category updated.');
      } else {
        await adminCreateCategory(token, {
          name: catName.trim(),
          description: catDesc.trim() || null,
          sortOrder: categories.length + 1,
        });
        setStatusMessage('Category created.');
      }
      setCatName('');
      setCatDesc('');
      setEditingCategory(null);
      await Promise.all([loadDashboard(token), refreshStorefront()]);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to save category.');
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!confirmDeleteCategory) return;
    try {
      await adminDeleteCategory(token, confirmDeleteCategory.id);
      setConfirmDeleteCategory(null);
      await Promise.all([loadDashboard(token), refreshStorefront()]);
      setStatusMessage('Category deleted.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await adminUpdateSettings(token, siteForm);
      setSiteForm({ ...DEFAULT_SITE_SETTINGS, ...updated });
      await refreshStorefront();
      setStatusMessage('Storefront copy & site settings updated.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const refreshedToken = await changeAdminPassword(token, currentPassword, newPassword);
      localStorage.setItem(ADMIN_TOKEN_KEY, refreshedToken);
      setToken(refreshedToken);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage('Admin password updated successfully.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const navTabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderKanban },
    { id: 'site', label: 'Site & Content', icon: Sliders },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'password', label: 'Password', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-[#F1F4FC]/50 text-[#101A35]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-[#B7C9ED]/60 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-18 items-center justify-between border-b border-[#F1F4FC] px-5">
            <BrandLogo size="sm" showWordmark />
            <span className="rounded-full bg-[#F1F4FC] px-2.5 py-0.5 font-accent text-[10px] font-semibold tracking-wider text-[#3156A5] uppercase">
              Admin
            </span>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto p-3 lg:flex-col">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowProductForm(false);
                  }}
                  className={`inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#101A35] text-white'
                      : 'text-[#1C3265]/80 hover:bg-[#F1F4FC] hover:text-[#101A35]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden border-t border-[#F1F4FC] p-4 lg:mt-auto lg:block">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/50 px-4 text-xs font-medium text-[#1C3265] transition-colors hover:border-[#3156A5] hover:bg-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Live Storefront</span>
              </Link>
              <button
                type="button"
                onClick={handleLockPortal}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-transparent px-4 text-xs font-medium text-[#6385CB] transition-colors hover:bg-[#F1F4FC] hover:text-[#101A35]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Lock Admin Portal</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-accent text-[11px] font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
                TRT FINDS Console
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#101A35]">
                {navTabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-medium text-[#1C3265] hover:border-[#3156A5] lg:hidden"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Storefront</span>
              </Link>
              <button
                type="button"
                onClick={handleLockPortal}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs font-medium text-[#6385CB] hover:text-[#101A35] lg:hidden"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('products');
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1C3265] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#101A35]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-full border border-[#3156A5]/35 bg-white px-5 py-2.5 text-xs font-medium text-[#1C3265] shadow-xs">
              <Check className="h-4 w-4 text-[#3156A5]" />
              <span>{statusMessage}</span>
            </div>
          )}

          {loadingData && products.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-3xl border border-[#B7C9ED]/60 bg-white"
                />
              ))}
            </div>
          ) : null}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Total Products
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#101A35]">
                    {stats.total}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Published
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1C3265]">
                    {stats.published}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Drafts
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#3156A5]">
                    {stats.drafts}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Pinned
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#101A35]">
                    {stats.pinned}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Affiliate Clicks
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#1C3265]">
                    {stats.totalClicks}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-5">
                  <span className="font-accent text-[11px] font-semibold tracking-wider text-[#6385CB] uppercase">
                    Customer Profiles
                  </span>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#3156A5]">
                    {stats.totalProfiles}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[#101A35]">
                    Recent Product Activity
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="rounded-full border border-[#B7C9ED] px-4 py-1.5 text-xs font-medium text-[#3156A5] hover:bg-[#F1F4FC] hover:text-[#101A35]"
                  >
                    Manage all
                  </button>
                </div>

                {products.length === 0 ? (
                  <p className="py-10 text-center text-xs text-[#6385CB]">
                    No products added yet. Click &ldquo;Add Product&rdquo; to publish your first find.
                  </p>
                ) : (
                  <div className="mt-4 divide-y divide-[#F1F4FC]">
                    {products.slice(0, 6).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="h-11 w-11 shrink-0 rounded-2xl border border-[#B7C9ED]/50 bg-[#F1F4FC] object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#101A35]">{p.title}</p>
                            <p className="text-xs text-[#6385CB]">
                              {p.categoryName || 'Uncategorized'} · {formatTimestampLabel(p.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="font-accent tabular-nums text-xs font-semibold text-[#101A35]">
                            {formatTaka(p.price)}
                          </span>
                          <span className="rounded-full bg-[#F1F4FC] px-3 py-1 text-[11px] font-medium text-[#1C3265]">
                            {p.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {showProductForm ? (
                <AdminProductForm
                  token={token}
                  categories={categories}
                  editingProduct={editingProduct}
                  onCategoryCreated={(cat) => {
                    setCategories((prev) => [...prev, cat]);
                    void refreshStorefront();
                  }}
                  onSuccess={async (msg) => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setStatusMessage(msg);
                    await Promise.all([loadDashboard(token), refreshStorefront()]);
                  }}
                  onCancel={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <SlidingTabs
                      layoutId="admin-product-filter"
                      size="sm"
                      value={productFilter}
                      onChange={setProductFilter}
                      options={[
                        { value: 'all', label: 'All', count: stats.total },
                        { value: 'published', label: 'Published', count: stats.published },
                        { value: 'drafts', label: 'Drafts', count: stats.drafts },
                        { value: 'pinned', label: 'Pinned', count: stats.pinned },
                      ]}
                    />

                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Filter products..."
                        className="h-10 w-full rounded-full border border-[#B7C9ED] bg-white pl-10 pr-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white px-6 py-16 text-center">
                      <p className="font-display text-lg font-bold text-[#101A35]">
                        No products match this view
                      </p>
                      <p className="mt-1 text-xs text-[#1C3265]/70">
                        Add a new product or adjust your status filter.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-[#B7C9ED]/65 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-[#F1F4FC] bg-[#F1F4FC]/60 font-accent text-[11px] font-semibold tracking-wider text-[#1C3265] uppercase">
                            <tr>
                              <th className="px-5 py-3.5">Product</th>
                              <th className="px-4 py-3.5">Category</th>
                              <th className="px-4 py-3.5 text-right">Price</th>
                              <th className="px-4 py-3.5">Status</th>
                              <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F4FC]">
                            {filteredProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-[#F1F4FC]/35">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={p.images[0]}
                                      alt={p.title}
                                      referrerPolicy="no-referrer"
                                      className="h-10 w-10 shrink-0 rounded-xl border border-[#B7C9ED]/50 object-cover"
                                    />
                                    <div className="min-w-0">
                                      <p className="max-w-[220px] truncate font-medium text-[#101A35]">
                                        {p.title}
                                      </p>
                                      <p className="max-w-[220px] truncate text-[11px] text-[#6385CB]">
                                        /product/{p.slug}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-[#1C3265]">
                                  {p.categoryName || 'Uncategorized'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-accent tabular-nums font-semibold text-[#101A35]">
                                  {formatTaka(p.price)}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="rounded-full bg-[#F1F4FC] px-3 py-1 text-[11px] font-medium text-[#1C3265]">
                                    {p.isPublished ? 'Published' : 'Draft'}
                                    {p.isPinned ? ' · Pinned' : ''}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleToggleProduct(p, 'isPinned', !p.isPinned)
                                      }
                                      title={p.isPinned ? 'Unpin from homepage' : 'Pin to homepage'}
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                        p.isPinned
                                          ? 'border-[#101A35] bg-[#101A35] text-white'
                                          : 'border-[#B7C9ED] text-[#1C3265] hover:bg-[#F1F4FC]'
                                      }`}
                                    >
                                      <Bookmark className="h-3.5 w-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleToggleProduct(p, 'isPublished', !p.isPublished)
                                      }
                                      title={p.isPublished ? 'Move to Draft' : 'Publish'}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:bg-[#F1F4FC]"
                                    >
                                      {p.isPublished ? (
                                        <Eye className="h-3.5 w-3.5" />
                                      ) : (
                                        <EyeOff className="h-3.5 w-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setShowProductForm(true);
                                      }}
                                      title="Edit product"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:bg-[#F1F4FC]"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>

                                    {p.isPublished && (
                                      <Link
                                        to={`/product/${p.slug}`}
                                        target="_blank"
                                        title="View on storefront"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:bg-[#F1F4FC]"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Link>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteProduct(p)}
                                      title="Delete product"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6 lg:col-span-5">
                <h2 className="font-display text-base font-bold text-[#101A35]">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <form onSubmit={(e) => void handleSaveCategory(e)} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g., Tech & Gadgets"
                      className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-sm focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Short editorial summary..."
                      className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-sm focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="h-10 flex-1 rounded-full bg-[#1C3265] px-5 text-xs font-semibold text-white hover:bg-[#101A35]"
                    >
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCatName('');
                          setCatDesc('');
                        }}
                        className="h-10 rounded-full border border-[#B7C9ED] px-5 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6 lg:col-span-7">
                <h2 className="font-display text-base font-bold text-[#101A35]">
                  Active Categories ({categories.length})
                </h2>
                {categories.length === 0 ? (
                  <p className="py-10 text-center text-xs text-[#6385CB]">
                    No categories configured yet.
                  </p>
                ) : (
                  <div className="mt-4 divide-y divide-[#F1F4FC]">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-4 py-3.5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#101A35]">{c.name}</p>
                          {c.description && (
                            <p className="truncate text-xs text-[#6385CB]">{c.description}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(c);
                              setCatName(c.name);
                              setCatDesc(c.description || '');
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:bg-[#F1F4FC]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategory(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SITE & CONTENT CUSTOMIZATION TAB */}
          {activeTab === 'site' && (
            <form
              onSubmit={(e) => void handleSaveSiteSettings(e)}
              className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F4FC] pb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#101A35]">
                    Storefront Copy, CTA & Contact Details
                  </h2>
                  <p className="mt-1 text-xs text-[#1C3265]/75">
                    Customize hero headlines, Order Now button label, philosophy, about section, contact page details, and logo entrance animation.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="h-10 rounded-full bg-[#1C3265] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#101A35] disabled:opacity-60"
                >
                  {savingSettings ? 'Saving...' : 'Save Site Changes'}
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <p className="font-accent text-[11px] font-semibold tracking-wider text-[#3156A5] uppercase">
                    Hero & Buttons
                  </p>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Brand Philosophy Line
                    </label>
                    <input
                      type="text"
                      value={siteForm.brandPhilosophy}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, brandPhilosophy: e.target.value }))
                      }
                      className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      value={siteForm.heroHeadline}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, heroHeadline: e.target.value }))
                      }
                      className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Hero Subtext
                    </label>
                    <textarea
                      rows={3}
                      value={siteForm.heroSubtext}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, heroSubtext: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Primary CTA
                      </label>
                      <input
                        type="text"
                        value={siteForm.heroPrimaryCta}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, heroPrimaryCta: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Secondary CTA
                      </label>
                      <input
                        type="text"
                        value={siteForm.heroSecondaryCta}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, heroSecondaryCta: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Affiliate CTA Label
                      </label>
                      <input
                        type="text"
                        value={siteForm.orderButtonLabel}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, orderButtonLabel: e.target.value }))
                        }
                        placeholder="Order Now"
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/50 px-4 py-3.5">
                    <div>
                      <span className="block text-xs font-semibold text-[#101A35]">
                        Enable Logo Reload Animation
                      </span>
                      <span className="block text-[11px] text-[#1C3265]/75">
                        Displays the TRT FINDS monogram entrance animation on page load.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={siteForm.enableReloadAnimation}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, enableReloadAnimation: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#1C3265]"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <p className="font-accent text-[11px] font-semibold tracking-wider text-[#3156A5] uppercase">
                    About, Disclosure & Contact
                  </p>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      About Page Headline
                    </label>
                    <input
                      type="text"
                      value={siteForm.aboutTitle}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, aboutTitle: e.target.value }))
                      }
                      className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      About Copy
                    </label>
                    <textarea
                      rows={3}
                      value={siteForm.aboutBody}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, aboutBody: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Affiliate Disclosure Note
                    </label>
                    <textarea
                      rows={2}
                      value={siteForm.affiliateDisclosure}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, affiliateDisclosure: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={siteForm.contactEmail}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, contactEmail: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={siteForm.contactPhone}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, contactPhone: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Address
                      </label>
                      <input
                        type="text"
                        value={siteForm.contactAddress}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, contactAddress: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                        Social Handle
                      </label>
                      <input
                        type="text"
                        value={siteForm.socialHandle}
                        onChange={(e) =>
                          setSiteForm((s) => ({ ...s, socialHandle: e.target.value }))
                        }
                        className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Support Hours
                    </label>
                    <input
                      type="text"
                      value={siteForm.contactHours}
                      onChange={(e) =>
                        setSiteForm((s) => ({ ...s, contactHours: e.target.value }))
                      }
                      className="h-10 w-full rounded-full border border-[#B7C9ED] px-4 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <AdminAnalyticsPanel
              events={analytics}
              products={products}
              categories={categories}
              profileCount={profileCount}
            />
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'password' && (
            <div className="max-w-lg rounded-3xl border border-[#B7C9ED]/65 bg-white p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-[#101A35]">
                Update Admin Password
              </h2>
              <p className="mt-1 text-xs text-[#1C3265]/75">
                Change the password used to unlock this private TRT FINDS Admin Portal.
              </p>

              {passwordError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  {passwordError}
                </div>
              )}

              <form onSubmit={(e) => void handleChangePassword(e)} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="h-11 rounded-full bg-[#1C3265] px-7 text-xs font-semibold text-white transition-colors hover:bg-[#101A35] disabled:opacity-60"
                >
                  {savingPassword ? 'Updating...' : 'Update Admin Password'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Delete Product Confirmation Modal */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101A35]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#B7C9ED] bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-[#101A35]">Delete Product?</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#1C3265]/80">
              Are you sure you want to permanently delete <strong>{confirmDeleteProduct.title}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="h-9 rounded-full border border-[#B7C9ED] px-5 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteProductConfirm()}
                className="h-9 rounded-full bg-red-600 px-5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {confirmDeleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101A35]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#B7C9ED] bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-[#101A35]">Delete Category?</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#1C3265]/80">
              Delete <strong>{confirmDeleteCategory.name}</strong>? Existing products will remain accessible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCategory(null)}
                className="h-9 rounded-full border border-[#B7C9ED] px-5 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCategoryConfirm()}
                className="h-9 rounded-full bg-red-600 px-5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
