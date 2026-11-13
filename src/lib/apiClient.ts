import type {
  AnalyticsEvent,
  AnalyticsEventType,
  Category,
  Product,
  ProductFormInput,
  SiteSettings,
} from '../types';

export const ADMIN_TOKEN_KEY = 'trt_admin_session_token_v1';

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

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function adminHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchStorefrontData(): Promise<{
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
}> {
  return apiJson('/api/storefront');
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await apiJson<{ product: Product }>(`/api/products/${encodeURIComponent(slug)}`);
    return res.product;
  } catch {
    return null;
  }
}

const sessionTracked = new Set<string>();

export async function trackAnalyticsEvent(params: {
  type: AnalyticsEventType;
  path: string;
  product?: Product | null;
  dedupeSessionKey?: string;
}): Promise<void> {
  if (params.dedupeSessionKey) {
    if (sessionTracked.has(params.dedupeSessionKey)) return;
    sessionTracked.add(params.dedupeSessionKey);
  }
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: params.type,
        path: params.path,
        productId: params.product?.id ?? null,
        productTitle: params.product?.title ?? null,
        categoryId: params.product?.categoryId ?? null,
        categoryName: params.product?.categoryName ?? null,
      }),
    });
  } catch {
    // Non-blocking telemetry
  }
}

// --- Admin Auth & Dashboard API ---
export async function adminLoginWithPassword(password: string): Promise<string> {
  const res = await apiJson<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await apiJson('/api/admin/verify', { headers: adminHeaders(token) });
    return true;
  } catch {
    return false;
  }
}

export async function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<string> {
  const res = await apiJson<{ ok: boolean; token: string }>('/api/admin/change-password', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.token;
}

export async function fetchAdminDashboard(token: string): Promise<{
  products: Product[];
  categories: Category[];
  analytics: AnalyticsEvent[];
  settings: SiteSettings;
}> {
  return apiJson('/api/admin/dashboard', { headers: adminHeaders(token) });
}

export async function adminCreateProduct(token: string, input: ProductFormInput): Promise<Product> {
  const res = await apiJson<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });
  return res.product;
}

export async function adminUpdateProduct(
  token: string,
  id: string,
  input: Partial<ProductFormInput>
): Promise<Product> {
  const res = await apiJson<{ product: Product }>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });
  return res.product;
}

export async function adminDeleteProduct(token: string, id: string): Promise<void> {
  await apiJson(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  });
}

export async function adminCreateCategory(
  token: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Promise<Category> {
  const res = await apiJson<{ category: Category }>('/api/admin/categories', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });
  return res.category;
}

export async function adminUpdateCategory(
  token: string,
  id: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Promise<Category> {
  const res = await apiJson<{ category: Category }>(
    `/api/admin/categories/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return res.category;
}

export async function adminDeleteCategory(token: string, id: string): Promise<void> {
  await apiJson(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  });
}

export async function adminUpdateSettings(
  token: string,
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const res = await apiJson<{ settings: SiteSettings }>('/api/admin/settings', {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(settings),
  });
  return res.settings;
}

export function uploadMediaFile(
  token: string,
  file: File,
  kind: 'image' | 'video',
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowedImages = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
    const allowedVideos = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
    const maxBytes = kind === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

    if (kind === 'image' && !allowedImages.has(file.type)) {
      reject(new Error('Unsupported image format. Use JPG, PNG, WebP, or AVIF.'));
      return;
    }
    if (kind === 'video' && !allowedVideos.has(file.type)) {
      reject(new Error('Unsupported video format. Use MP4, WebM, or MOV.'));
      return;
    }
    if (file.size > maxBytes) {
      reject(
        new Error(
          kind === 'image' ? 'Image must be 10 MB or smaller.' : 'Video must be 50 MB or smaller.'
        )
      );
      return;
    }

    onProgress(15);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.onload = async () => {
      try {
        onProgress(45);
        const result = String(reader.result || '');
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        const res = await apiJson<{ url: string }>('/api/admin/upload', {
          method: 'POST',
          headers: adminHeaders(token),
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            base64Data,
          }),
        });
        onProgress(100);
        resolve(res.url);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Media upload failed.'));
      }
    };
    reader.readAsDataURL(file);
  });
}
