import type {
  AnalyticsEvent,
  AnalyticsEventType,
  Category,
  Product,
  ProductFormInput,
  SiteSettings,
} from '../types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandPhilosophy: 'Thought • Realize • Trend',
  heroHeadline: 'Discover smart finds, curated just for you.',
  heroSubtext: 'Explore thoughtfully selected products, everyday essentials, and smarter deals.',
  heroPrimaryCta: 'Explore Products',
  heroSecondaryCta: 'Discover Categories',
  orderButtonLabel: 'Order Now',
  aboutTitle: 'Simplicity, clarity, and products worth owning.',
  aboutBody:
    'TRT FINDS (@trtfinds) curates thoughtful everyday tools, refined home pieces, smart tech accessories, and timeless fashion—presented with clear pricing in Bangladeshi Taka (৳) and direct outbound links to verified partner stores.',
  affiliateDisclosure:
    'When you click Order Now on TRT FINDS, you are directed safely to the official merchant or partner store. Some outbound links are affiliate links, meaning TRT FINDS may earn a referral commission at no additional cost to you.',
  contactEmail: 'hello@trtfinds.com',
  contactPhone: '+880 1700-000000',
  contactAddress: 'Dhaka, Bangladesh',
  contactHours: 'Saturday – Thursday, 10:00 AM – 8:00 PM',
  socialHandle: '@trtfinds',
  enableReloadAnimation: true,
};

const SEED_TIMESTAMP = 1763000000000;

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'tech-gadgets',
    name: 'Tech & Gadgets',
    slug: 'tech-gadgets',
    description: 'Precision hardware, wireless keyboards, and intelligent everyday carry tech.',
    sortOrder: 1,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Minimalist spatial pieces, architectural lighting, and refined desk upgrades.',
    sortOrder: 2,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Structured silhouettes, clean accessories, and timeless wardrobe staples.',
    sortOrder: 3,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'daily-essentials',
    name: 'Daily Essentials',
    slug: 'daily-essentials',
    description: 'Thoughtful tools and insulated drinkware built for effortless daily routines.',
    sortOrder: 4,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'demo_kibo_keyboard',
    title: 'Kibo 75% Wireless Mechanical Keyboard',
    slug: 'kibo-75-wireless-mechanical-keyboard',
    price: 5800,
    originalPrice: 6500,
    discountPercent: 11,
    description:
      'CNC-machined aluminum frame paired with tri-mode Bluetooth/2.4GHz connectivity, hot-swappable tactile switches, and double-shot PBT keycaps in crisp white and deep cobalt.',
    categoryId: 'tech-gadgets',
    categoryName: 'Tech & Gadgets',
    images: ['/assets/demo/mechanical-keyboard.jpg'],
    video: null,
    colors: ['Arctic White & Cobalt', 'Midnight Slate'],
    sizes: ['75% Compact'],
    stock: 18,
    rating: 4.9,
    specifications: [
      { label: 'Chassis', value: 'CNC Anodized Aluminum' },
      { label: 'Connectivity', value: 'USB-C / Bluetooth 5.1 / 2.4GHz' },
      { label: 'Battery', value: '4000 mAh Rechargeable' },
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=wireless+mechanical+keyboard',
    isPinned: true,
    isPublished: true,
    createdAt: SEED_TIMESTAMP - 40000,
    updatedAt: SEED_TIMESTAMP - 40000,
  },
  {
    id: 'demo_lumen_lamp',
    title: 'Lumen Arc Architectural LED Desk Lamp',
    slug: 'lumen-arc-architectural-led-desk-lamp',
    price: 3450,
    originalPrice: 4200,
    discountPercent: 18,
    description:
      'Counter-balanced brushed aluminum arm with stepless dimming, flicker-free CRI 95+ illumination, and weighted midnight navy base.',
    categoryId: 'home-living',
    categoryName: 'Home & Living',
    images: ['/assets/demo/desk-lamp.jpg'],
    video: null,
    colors: ['Midnight Navy & Brushed Steel'],
    sizes: null,
    stock: 24,
    rating: 4.8,
    specifications: [
      { label: 'Color Rendering', value: 'CRI 95+ Natural Spectrum' },
      { label: 'Control', value: 'Tactile Toggle & Dimmer' },
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=minimalist+architectural+led+desk+lamp',
    isPinned: true,
    isPublished: true,
    createdAt: SEED_TIMESTAMP - 30000,
    updatedAt: SEED_TIMESTAMP - 30000,
  },
  {
    id: 'demo_atelier_tote',
    title: 'Atelier Structured Leather Everyday Tote',
    slug: 'atelier-structured-leather-everyday-tote',
    price: 2950,
    originalPrice: null,
    discountPercent: null,
    description:
      'Clean architectural silhouette crafted in full-grain pebbled vegan leather with a padded 14-inch laptop sleeve and detachable crossbody strap.',
    categoryId: 'fashion',
    categoryName: 'Fashion',
    images: ['/assets/demo/structured-tote.jpg'],
    video: null,
    colors: ['Deep Cobalt', 'Midnight Navy'],
    sizes: ['Standard (14" Laptop)'],
    stock: 12,
    rating: 4.7,
    specifications: [
      { label: 'Capacity', value: 'Fits up to 14-inch laptop' },
      { label: 'Strap', value: 'Dual handle + detachable shoulder strap' },
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=structured+leather+tote+bag',
    isPinned: true,
    isPublished: true,
    createdAt: SEED_TIMESTAMP - 20000,
    updatedAt: SEED_TIMESTAMP - 20000,
  },
  {
    id: 'demo_nomad_flask',
    title: 'Nomad Matte Cobalt Insulated Flask',
    slug: 'nomad-matte-cobalt-insulated-flask',
    price: 1450,
    originalPrice: 1750,
    discountPercent: 17,
    description:
      'Double-wall vacuum-insulated 18/8 stainless steel flask that keeps drinks cold for 24 hours or hot for 12 hours, finished in matte deep cobalt.',
    categoryId: 'daily-essentials',
    categoryName: 'Daily Essentials',
    images: ['/assets/demo/insulated-flask.jpg'],
    video: null,
    colors: ['Deep Cobalt', 'Arctic White'],
    sizes: ['750ml'],
    stock: 40,
    rating: 4.9,
    specifications: [
      { label: 'Material', value: '18/8 Food-Grade Stainless Steel' },
      { label: 'Insulation', value: '24h Cold / 12h Hot' },
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=insulated+stainless+steel+water+bottle',
    isPinned: false,
    isPublished: true,
    createdAt: SEED_TIMESTAMP - 10000,
    updatedAt: SEED_TIMESTAMP - 10000,
  },
];

// --- Static-host browser persistence fallback (for Vercel/static SPA hosting without server.ts) ---
const STATIC_STORE_KEY = 'trt_finds_static_store_v1';
const DEFAULT_ADMIN_SHA256 = '0c157a1fc71da8071ff27f97d3028490e3f7548b27741ca7ff5ba2362b1cab1c';
const STATIC_TOKEN_PREFIX = 'trt_static_';

interface StaticStoreState {
  passwordSha256: string;
  categories: Category[];
  products: Product[];
  analytics: AnalyticsEvent[];
  settings: SiteSettings;
}

function slugifyText(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || `item-${Date.now()}`
  );
}

async function sha256Hex(value: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new Error('Secure Web Crypto is required for static admin authentication.');
}

function createSeedStaticState(): StaticStoreState {
  return {
    passwordSha256: DEFAULT_ADMIN_SHA256,
    categories: FALLBACK_CATEGORIES.map((c) => ({ ...c })),
    products: FALLBACK_PRODUCTS.map((p) => ({ ...p, images: [...p.images] })),
    analytics: [],
    settings: { ...DEFAULT_SITE_SETTINGS },
  };
}

function readStaticState(): StaticStoreState {
  const seed = createSeedStaticState();
  try {
    if (typeof window === 'undefined' || !window.localStorage) return seed;
    const raw = window.localStorage.getItem(STATIC_STORE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<StaticStoreState>;
    return {
      passwordSha256:
        typeof parsed.passwordSha256 === 'string' && parsed.passwordSha256.length === 64
          ? parsed.passwordSha256
          : seed.passwordSha256,
      categories: Array.isArray(parsed.categories) ? parsed.categories : seed.categories,
      products: Array.isArray(parsed.products) ? parsed.products : seed.products,
      analytics: Array.isArray(parsed.analytics) ? parsed.analytics : [],
      settings:
        parsed.settings && typeof parsed.settings === 'object'
          ? { ...DEFAULT_SITE_SETTINGS, ...parsed.settings }
          : seed.settings,
    };
  } catch {
    return seed;
  }
}

function writeStaticState(state: StaticStoreState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STATIC_STORE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function getStaticStorefrontData(): {
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
} {
  const state = readStaticState();
  const categories = [...state.categories].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
  );
  const products = state.products
    .filter((p) => p && p.isPublished !== false)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return {
    products,
    categories,
    settings: { ...DEFAULT_SITE_SETTINGS, ...state.settings },
  };
}

export function getStaticProductBySlug(slug: string): Product | null {
  const { products } = getStaticStorefrontData();
  return products.find((p) => p.slug === slug) || null;
}

export function staticTrackAnalytics(params: {
  type: AnalyticsEventType;
  path: string;
  product?: Product | null;
}): void {
  const state = readStaticState();
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const monthKey = dateKey.slice(0, 7);
  state.analytics.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: params.type,
    path: params.path || '/',
    productId: params.product?.id ?? null,
    productTitle: params.product?.title ?? null,
    categoryId: params.product?.categoryId ?? null,
    categoryName: params.product?.categoryName ?? null,
    dateKey,
    monthKey,
    createdAt: Date.now(),
  });
  if (state.analytics.length > 2000) {
    state.analytics = state.analytics.slice(-2000);
  }
  writeStaticState(state);
}

export async function staticAdminLogin(password: string): Promise<string> {
  const state = readStaticState();
  const hash = await sha256Hex(password);
  if (hash !== state.passwordSha256) {
    throw new Error('Incorrect admin password.');
  }
  return `${STATIC_TOKEN_PREFIX}${hash.slice(0, 24)}`;
}

export function staticVerifyToken(token: string): boolean {
  if (!token.startsWith(STATIC_TOKEN_PREFIX)) return false;
  const state = readStaticState();
  return token === `${STATIC_TOKEN_PREFIX}${state.passwordSha256.slice(0, 24)}`;
}

export async function staticChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<string> {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  const state = readStaticState();
  const currentHash = await sha256Hex(currentPassword);
  if (currentHash !== state.passwordSha256) {
    throw new Error('Current password is incorrect.');
  }
  const nextHash = await sha256Hex(newPassword);
  state.passwordSha256 = nextHash;
  writeStaticState(state);
  return `${STATIC_TOKEN_PREFIX}${nextHash.slice(0, 24)}`;
}

export function staticFetchDashboard(token: string): {
  products: Product[];
  categories: Category[];
  analytics: AnalyticsEvent[];
  profileCount: number;
  settings: SiteSettings;
} {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  let profileCount = 0;
  try {
    const rawProfiles = window.localStorage.getItem('trt_finds_customer_profiles_v1');
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as unknown;
      if (Array.isArray(parsed)) profileCount = parsed.length;
    }
  } catch {
    profileCount = 0;
  }
  return {
    products: [...state.products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    categories: [...state.categories].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    ),
    analytics: [...state.analytics].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    profileCount,
    settings: { ...DEFAULT_SITE_SETTINGS, ...state.settings },
  };
}

export function staticCreateProduct(token: string, input: ProductFormInput): Product {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  const now = Date.now();
  const numericPrice = Math.max(0, Number(input.price) || 0);
  const cleanTitle =
    input.title && input.title.trim()
      ? input.title.trim()
      : `Curated Find ৳${Math.round(numericPrice)}`;
  const baseSlug = slugifyText(input.slug || cleanTitle);
  const slugExists = state.products.some((p) => p.slug === baseSlug);
  const finalSlug = slugExists ? `${baseSlug}-${String(now).slice(-4)}` : baseSlug;

  const product: Product = {
    id: `prod_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    slug: finalSlug,
    price: numericPrice,
    originalPrice: input.originalPrice ?? null,
    discountPercent: input.discountPercent ?? null,
    description: input.description ?? null,
    categoryId: input.categoryId ?? null,
    categoryName: input.categoryName ?? null,
    images: Array.isArray(input.images) ? input.images.slice(0, 24) : [],
    video: input.video ?? null,
    colors: input.colors ?? null,
    colorVariants:
      Array.isArray(input.colorVariants) && input.colorVariants.length > 0
        ? input.colorVariants
        : null,
    sizes: input.sizes ?? null,
    stock: input.stock ?? null,
    rating: input.rating ?? null,
    specifications: input.specifications ?? null,
    affiliateUrl: input.affiliateUrl && input.affiliateUrl.trim() ? input.affiliateUrl.trim() : null,
    isPinned: Boolean(input.isPinned),
    isPublished: input.isPublished !== false,
    createdAt: now,
    updatedAt: now,
  };
  state.products.unshift(product);
  writeStaticState(state);
  return product;
}

export function staticUpdateProduct(
  token: string,
  id: string,
  input: Partial<ProductFormInput>
): Product {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  const idx = state.products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Product not found.');
  const updated: Product = {
    ...state.products[idx],
    ...input,
    affiliateUrl:
      input.affiliateUrl !== undefined
        ? input.affiliateUrl && input.affiliateUrl.trim()
          ? input.affiliateUrl.trim()
          : null
        : state.products[idx].affiliateUrl,
    updatedAt: Date.now(),
  };
  state.products[idx] = updated;
  writeStaticState(state);
  return updated;
}

export function staticDeleteProduct(token: string, id: string): void {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  state.products = state.products.filter((p) => p.id !== id);
  writeStaticState(state);
}

export function staticCreateCategory(
  token: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Category {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  const now = Date.now();
  const cat: Category = {
    id: slugifyText(input.name),
    name: input.name.trim(),
    slug: slugifyText(input.name),
    description: input.description ?? null,
    sortOrder: Number(input.sortOrder ?? state.categories.length + 1),
    createdAt: now,
    updatedAt: now,
  };
  state.categories.push(cat);
  writeStaticState(state);
  return cat;
}

export function staticUpdateCategory(
  token: string,
  id: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Category {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  const idx = state.categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Category not found.');
  const updated: Category = {
    ...state.categories[idx],
    name: input.name.trim(),
    description: input.description ?? null,
    sortOrder: Number(input.sortOrder ?? state.categories[idx].sortOrder),
    updatedAt: Date.now(),
  };
  state.categories[idx] = updated;
  state.products = state.products.map((p) =>
    p.categoryId === id ? { ...p, categoryName: updated.name } : p
  );
  writeStaticState(state);
  return updated;
}

export function staticDeleteCategory(token: string, id: string): void {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  state.categories = state.categories.filter((c) => c.id !== id);
  state.products = state.products.map((p) =>
    p.categoryId === id ? { ...p, categoryId: null, categoryName: null } : p
  );
  writeStaticState(state);
}

export function staticUpdateSettings(
  token: string,
  settings: Partial<SiteSettings>
): SiteSettings {
  if (!staticVerifyToken(token)) throw new Error('Admin session expired.');
  const state = readStaticState();
  state.settings = { ...DEFAULT_SITE_SETTINGS, ...state.settings, ...settings };
  writeStaticState(state);
  return state.settings;
}
