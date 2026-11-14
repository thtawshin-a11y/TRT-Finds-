import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'trt-store.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface ProductSpec {
  label: string;
  value: string;
}

interface ColorVariant {
  id: string;
  name: string;
  hexes: string[];
  images: string[];
  inStock?: boolean;
}

interface ProductRecord {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  images: string[];
  video: string | null;
  colors: string[] | null;
  colorVariants?: ColorVariant[] | null;
  sizes: string[] | null;
  stock: number | null;
  rating: number | null;
  specifications: ProductSpec[] | null;
  affiliateUrl: string | null;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AnalyticsRecord {
  id: string;
  type: 'site_visit' | 'product_view' | 'affiliate_click' | 'profile_created';
  productId: string | null;
  productTitle: string | null;
  categoryId: string | null;
  categoryName: string | null;
  path: string;
  dateKey: string;
  monthKey: string;
  createdAt: number;
}

interface SiteSettings {
  brandPhilosophy: string;
  heroHeadline: string;
  heroSubtext: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  orderButtonLabel: string;
  aboutTitle: string;
  aboutBody: string;
  affiliateDisclosure: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  socialHandle: string;
  enableReloadAnimation: boolean;
}

interface CustomerProfileRecord {
  id: string;
  profileCode: string;
  name: string;
  phone: string;
  city: string;
  deliveryNote: string;
  avatarUrl?: string | null;
  avatarAccent: string;
  favoriteCategories: string[];
  wishlist: unknown[];
  recentlyViewedSlugs: string[];
  hasPin?: boolean;
  pinSalt?: string;
  pinHash?: string;
  createdAt: number;
  updatedAt: number;
}

interface StoreData {
  adminSecretKey: string;
  passwordSalt: string;
  passwordHash: string;
  categories: CategoryRecord[];
  products: ProductRecord[];
  analytics: AnalyticsRecord[];
  profiles?: Record<string, CustomerProfileRecord>;
  settings: SiteSettings;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createInitialStore(): StoreData {
  const now = Date.now();
  const salt = crypto.randomBytes(16).toString('hex');
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'TRT-ADMIN-2026';

  const categories: CategoryRecord[] = [
    {
      id: 'tech-gadgets',
      name: 'Tech & Gadgets',
      slug: 'tech-gadgets',
      description: 'Precision hardware, wireless keyboards, and intelligent everyday carry tech.',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'home-living',
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Minimalist spatial pieces, architectural lighting, and refined desk upgrades.',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'fashion',
      name: 'Fashion',
      slug: 'fashion',
      description: 'Structured silhouettes, clean accessories, and timeless wardrobe staples.',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'daily-essentials',
      name: 'Daily Essentials',
      slug: 'daily-essentials',
      description: 'Thoughtful tools and insulated drinkware built for effortless daily routines.',
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const products: ProductRecord[] = [
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
      createdAt: now - 40000,
      updatedAt: now - 40000,
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
      createdAt: now - 30000,
      updatedAt: now - 30000,
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
      createdAt: now - 20000,
      updatedAt: now - 20000,
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
      createdAt: now - 10000,
      updatedAt: now - 10000,
    },
  ];

  const settings: SiteSettings = {
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

  return {
    adminSecretKey: crypto.randomBytes(32).toString('hex'),
    passwordSalt: salt,
    passwordHash: hashPassword(initialPassword, salt),
    categories,
    products,
    analytics: [],
    profiles: {},
    settings,
  };
}

function readStore(): StoreData {
  if (!fs.existsSync(STORE_FILE)) {
    const init = createInitialStore();
    fs.writeFileSync(STORE_FILE, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    const init = createInitialStore();
    fs.writeFileSync(STORE_FILE, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
}

function writeStore(data: StoreData): void {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function signToken(secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

async function startServer() {
  // Ensure initial store exists
  readStore();

  const app = express();
  app.use(express.json({ limit: '60mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const store = readStore();
    if (!verifyToken(token, store.adminSecretKey)) {
      res.status(401).json({ error: 'Invalid or expired admin session.' });
      return;
    }
    next();
  };

  // --- Public Storefront Endpoints ---
  app.get('/api/storefront', (_req, res) => {
    const store = readStore();
    const publishedProducts = store.products
      .filter((p) => p.isPublished)
      .sort((a, b) => b.createdAt - a.createdAt);
    const categories = [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json({
      products: publishedProducts,
      categories,
      settings: store.settings,
    });
  });

  app.get('/api/products/:slug', (req, res) => {
    const store = readStore();
    const product = store.products.find(
      (p) => p.slug === req.params.slug && p.isPublished
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  });

  app.post('/api/analytics', (req, res) => {
    const body = req.body as Partial<AnalyticsRecord>;
    if (
      !body ||
      !body.type ||
      !['site_visit', 'product_view', 'affiliate_click', 'profile_created'].includes(body.type)
    ) {
      res.status(400).json({ error: 'Invalid analytics event type' });
      return;
    }
    const store = readStore();
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const monthKey = dateKey.slice(0, 7);

    const record: AnalyticsRecord = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      type: body.type,
      productId: body.productId ? String(body.productId).slice(0, 128) : null,
      productTitle: body.productTitle ? String(body.productTitle).slice(0, 160) : null,
      categoryId: body.categoryId ? String(body.categoryId).slice(0, 128) : null,
      categoryName: body.categoryName ? String(body.categoryName).slice(0, 80) : null,
      path: String(body.path || '/').slice(0, 300),
      dateKey,
      monthKey,
      createdAt: Date.now(),
    };

    store.analytics.unshift(record);
    if (store.analytics.length > 3000) {
      store.analytics = store.analytics.slice(0, 3000);
    }
    writeStore(store);
    res.json({ ok: true });
  });

  // --- Passwordless Customer Profile Sync & PIN Security Endpoints ---
  app.get('/api/profiles/:code', (req, res) => {
    const code = String(req.params.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    if (!code || code.length < 6) {
      res.status(400).json({ error: 'Invalid profile code.' });
      return;
    }
    const store = readStore();
    const profile = store.profiles?.[code];
    if (!profile) {
      res.status(404).json({ error: 'Profile code not found.' });
      return;
    }
    if (profile.hasPin && profile.pinHash) {
      res.json({
        locked: true,
        profilePreview: {
          profileCode: profile.profileCode,
          name: profile.name,
          avatarUrl: profile.avatarUrl || null,
          avatarAccent: profile.avatarAccent,
          hasPin: true,
        },
      });
      return;
    }
    res.json({ locked: false, profile });
  });

  app.post('/api/profiles/unlock', (req, res) => {
    const { code: rawCode, pin } = req.body as { code?: string; pin?: string };
    const code = String(rawCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    if (!code || !pin) {
      res.status(400).json({ error: 'Profile code and Security PIN are required.' });
      return;
    }
    const store = readStore();
    const profile = store.profiles?.[code];
    if (!profile) {
      res.status(404).json({ error: 'Profile code not found.' });
      return;
    }
    if (!profile.hasPin || !profile.pinHash || !profile.pinSalt) {
      res.json({ profile });
      return;
    }
    const attemptHash = crypto
      .createHash('sha256')
      .update(`${profile.pinSalt}:${String(pin).trim()}`)
      .digest('hex');
    if (attemptHash !== profile.pinHash) {
      res.status(401).json({ error: 'Incorrect Security PIN.' });
      return;
    }
    res.json({ profile });
  });

  app.post('/api/profiles/sync', (req, res) => {
    const body = req.body as Partial<CustomerProfileRecord> & { authorizedPinHash?: string };
    const code = String(body?.profileCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    if (!code || code.length < 6 || code.length > 32) {
      res.status(400).json({ error: 'Valid profile code is required.' });
      return;
    }
    const store = readStore();
    if (!store.profiles) store.profiles = {};
    const existing = store.profiles[code];
    if (
      existing?.hasPin &&
      existing.pinHash &&
      body.authorizedPinHash !== existing.pinHash &&
      body.pinHash !== existing.pinHash
    ) {
      res.status(403).json({ error: 'Unlock this profile with its Security PIN before syncing changes.' });
      return;
    }
    const now = Date.now();
    const safeAvatar =
      typeof body.avatarUrl === 'string' && body.avatarUrl.length <= 220000
        ? body.avatarUrl
        : body.avatarUrl === null
          ? null
          : existing?.avatarUrl ?? null;

    const record: CustomerProfileRecord = {
      id: body.id ? String(body.id).slice(0, 80) : existing?.id || `prof_${now.toString(36)}`,
      profileCode: code,
      name: String(body.name || existing?.name || 'TRT Shopper').trim().slice(0, 80),
      phone: String(body.phone || '').trim().slice(0, 40),
      city: String(body.city || '').trim().slice(0, 80),
      deliveryNote: String(body.deliveryNote || '').trim().slice(0, 300),
      avatarUrl: safeAvatar,
      avatarAccent: String(body.avatarAccent || '#1C3265').slice(0, 20),
      favoriteCategories: Array.isArray(body.favoriteCategories)
        ? body.favoriteCategories.map((c) => String(c).slice(0, 60)).slice(0, 20)
        : [],
      wishlist: Array.isArray(body.wishlist) ? body.wishlist.slice(0, 200) : [],
      recentlyViewedSlugs: Array.isArray(body.recentlyViewedSlugs)
        ? body.recentlyViewedSlugs.map((s) => String(s).slice(0, 120)).slice(0, 30)
        : [],
      hasPin: Boolean(body.hasPin),
      pinSalt: body.hasPin && body.pinSalt ? String(body.pinSalt).slice(0, 64) : undefined,
      pinHash: body.hasPin && body.pinHash ? String(body.pinHash).slice(0, 128) : undefined,
      createdAt: existing?.createdAt || Number(body.createdAt) || now,
      updatedAt: now,
    };
    store.profiles[code] = record;
    writeStore(store);
    res.json({ profile: record });
  });

  // --- Admin Auth (Password Only) ---
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }
    const store = readStore();
    const attemptHash = hashPassword(password, store.passwordSalt);
    const a = Buffer.from(attemptHash, 'hex');
    const b = Buffer.from(store.passwordHash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'Incorrect admin password.' });
      return;
    }
    const token = signToken(store.adminSecretKey);
    res.json({ token });
  });

  app.get('/api/admin/verify', requireAdmin, (_req, res) => {
    res.json({ valid: true });
  });

  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        error: 'Current password and a new password (min 6 characters) are required.',
      });
      return;
    }
    const store = readStore();
    const currentAttempt = hashPassword(currentPassword, store.passwordSalt);
    const a = Buffer.from(currentAttempt, 'hex');
    const b = Buffer.from(store.passwordHash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    store.passwordSalt = newSalt;
    store.passwordHash = hashPassword(newPassword, newSalt);
    writeStore(store);
    const token = signToken(store.adminSecretKey);
    res.json({ ok: true, token });
  });

  // --- Admin Dashboard Data & CRUD ---
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const store = readStore();
    res.json({
      products: [...store.products].sort((a, b) => b.updatedAt - a.updatedAt),
      categories: [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      analytics: store.analytics,
      profileCount: Object.keys(store.profiles || {}).length,
      settings: store.settings,
    });
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const { filename, mimeType, base64Data } = req.body as {
      filename?: string;
      mimeType?: string;
      base64Data?: string;
    };
    if (!filename || !mimeType || !base64Data) {
      res.status(400).json({ error: 'Missing file upload payload.' });
      return;
    }
    const allowedMime = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]);
    if (!allowedMime.has(mimeType)) {
      res.status(400).json({ error: 'Unsupported media file type.' });
      return;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.byteLength > 50 * 1024 * 1024) {
      res.status(400).json({ error: 'File exceeds 50 MB size limit.' });
      return;
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const outName = `${Date.now()}_${safeName}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);
    res.json({ url: `/uploads/${outName}` });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as Partial<ProductRecord>;
    const numericPrice = Number(body.price);
    if (body.price === undefined || body.price === null || Number.isNaN(numericPrice) || numericPrice < 0) {
      res.status(400).json({
        error: 'A valid Price (৳) is required.',
      });
      return;
    }

    const store = readStore();
    const now = Date.now();
    const cleanTitle =
      body.title && String(body.title).trim()
        ? String(body.title).trim().slice(0, 160)
        : `Curated Find ৳${Math.round(numericPrice)}`;
    const baseSlug = slugify(body.slug || cleanTitle);
    const existsSlug = store.products.some((p) => p.slug === baseSlug);
    const finalSlug = existsSlug ? `${baseSlug}-${now.toString(36).slice(-4)}` : baseSlug;

    const newProduct: ProductRecord = {
      id: `prod_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      slug: finalSlug,
      price: Math.max(0, numericPrice),
      originalPrice:
        body.originalPrice !== null && body.originalPrice !== undefined
          ? Math.max(0, Number(body.originalPrice))
          : null,
      discountPercent:
        body.discountPercent !== null && body.discountPercent !== undefined
          ? Math.min(100, Math.max(0, Number(body.discountPercent)))
          : null,
      description: body.description ? String(body.description).trim().slice(0, 5000) : null,
      categoryId: body.categoryId || null,
      categoryName: body.categoryName || null,
      images: Array.isArray(body.images) ? body.images.slice(0, 24) : [],
      video: body.video || null,
      colors: body.colors?.length ? body.colors.slice(0, 20) : null,
      colorVariants: Array.isArray(body.colorVariants) && body.colorVariants.length
        ? body.colorVariants.slice(0, 20)
        : null,
      sizes: body.sizes?.length ? body.sizes.slice(0, 20) : null,
      stock:
        body.stock !== null && body.stock !== undefined
          ? Math.max(0, Math.floor(Number(body.stock)))
          : null,
      rating:
        body.rating !== null && body.rating !== undefined
          ? Math.min(5, Math.max(0, Number(body.rating)))
          : null,
      specifications: body.specifications?.length ? body.specifications.slice(0, 30) : null,
      affiliateUrl: body.affiliateUrl && String(body.affiliateUrl).trim()
        ? String(body.affiliateUrl).trim().slice(0, 1000)
        : null,
      isPinned: Boolean(body.isPinned),
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
      createdAt: now,
      updatedAt: now,
    };

    store.products.unshift(newProduct);
    writeStore(store);
    res.json({ product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const existing = store.products[idx];
    const body = req.body as Partial<ProductRecord>;
    const updated: ProductRecord = {
      ...existing,
      ...body,
      id: existing.id,
      slug: body.slug ? slugify(body.slug) : existing.slug,
      affiliateUrl:
        body.affiliateUrl !== undefined
          ? body.affiliateUrl && String(body.affiliateUrl).trim()
            ? String(body.affiliateUrl).trim().slice(0, 1000)
            : null
          : existing.affiliateUrl,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    store.products[idx] = updated;
    writeStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== req.params.id);
    if (store.products.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const body = req.body as { name?: string; description?: string | null; sortOrder?: number };
    if (!body.name?.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const store = readStore();
    const now = Date.now();
    const slug = slugify(body.name);
    const id = store.categories.some((c) => c.id === slug)
      ? `${slug}-${now.toString(36).slice(-4)}`
      : slug;

    const category: CategoryRecord = {
      id,
      name: body.name.trim().slice(0, 60),
      slug,
      description: body.description ? body.description.trim().slice(0, 300) : null,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : store.categories.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    store.categories.push(category);
    writeStore(store);
    res.json({ category });
  });

  app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const idx = store.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    const body = req.body as { name?: string; description?: string | null; sortOrder?: number };
    const existing = store.categories[idx];
    const updatedName = body.name?.trim() || existing.name;
    const updated: CategoryRecord = {
      ...existing,
      name: updatedName.slice(0, 60),
      slug: slugify(updatedName),
      description:
        body.description !== undefined
          ? body.description
            ? body.description.trim().slice(0, 300)
            : null
          : existing.description,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : existing.sortOrder,
      updatedAt: Date.now(),
    };
    store.categories[idx] = updated;
    // Sync categoryName on products referencing this category
    store.products = store.products.map((p) =>
      p.categoryId === updated.id ? { ...p, categoryName: updated.name } : p
    );
    writeStore(store);
    res.json({ category: updated });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const store = readStore();
    store.categories = store.categories.filter((c) => c.id !== req.params.id);
    writeStore(store);
    res.json({ ok: true });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const store = readStore();
    const incoming = req.body as Partial<SiteSettings>;
    store.settings = {
      ...store.settings,
      ...incoming,
    };
    writeStore(store);
    res.json({ settings: store.settings });
  });

  // --- Vite / Static SPA Middleware ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRT FINDS server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
