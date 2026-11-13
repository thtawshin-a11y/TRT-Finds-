import type {
  AnalyticsEvent,
  AnalyticsEventType,
  Category,
  Product,
  ProductFormInput,
  SiteSettings,
} from '../types';
import {
  DEFAULT_SITE_SETTINGS,
  getStaticProductBySlug,
  getStaticStorefrontData,
  staticAdminLogin,
  staticChangePassword,
  staticCreateCategory,
  staticCreateProduct,
  staticDeleteCategory,
  staticDeleteProduct,
  staticFetchDashboard,
  staticTrackAnalytics,
  staticUpdateCategory,
  staticUpdateProduct,
  staticUpdateSettings,
  staticVerifyToken,
} from './fallbackCatalog';

export { DEFAULT_SITE_SETTINGS };
export const ADMIN_TOKEN_KEY = 'trt_admin_session_token_v1';

class ApiUnavailableError extends Error {
  constructor(message = 'Backend API unavailable (using static host mode).') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

let staticHostDetected = false;

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiUnavailableError(
      err instanceof Error ? err.message : 'Network error reaching backend API.'
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const rawText = await res.text();

  // Static hosts (e.g. Vercel SPA rewrites) return 200 OK with text/html (index.html)
  // for /api/* routes when Express server.ts is not mounted.
  if (!contentType.includes('application/json')) {
    staticHostDetected = true;
    throw new ApiUnavailableError(`Non-JSON response from ${url} (${res.status})`);
  }

  let parsed: (T & { error?: string }) | null = null;
  try {
    parsed = JSON.parse(rawText) as T & { error?: string };
  } catch {
    staticHostDetected = true;
    throw new ApiUnavailableError(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    throw new Error(parsed?.error || `Request failed (${res.status})`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ApiUnavailableError(`Unexpected empty payload from ${url}`);
  }

  staticHostDetected = false;
  return parsed;
}

function adminHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function isApiFallbackTrigger(err: unknown): boolean {
  return err instanceof ApiUnavailableError;
}

export async function fetchStorefrontData(): Promise<{
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
}> {
  try {
    const data = await apiJson<{
      products?: unknown;
      categories?: unknown;
      settings?: unknown;
    }>('/api/storefront');

    if (!Array.isArray(data.products) || !Array.isArray(data.categories)) {
      throw new ApiUnavailableError('Malformed storefront payload from API.');
    }

    return {
      products: data.products as Product[],
      categories: data.categories as Category[],
      settings: {
        ...DEFAULT_SITE_SETTINGS,
        ...(data.settings && typeof data.settings === 'object'
          ? (data.settings as Partial<SiteSettings>)
          : {}),
      },
    };
  } catch (err) {
    if (isApiFallbackTrigger(err) || err instanceof Error) {
      return getStaticStorefrontData();
    }
    return getStaticStorefrontData();
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await apiJson<{ product?: Product }>(`/api/products/${encodeURIComponent(slug)}`);
    return res.product || getStaticProductBySlug(slug);
  } catch {
    return getStaticProductBySlug(slug);
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

  if (staticHostDetected) {
    staticTrackAnalytics(params);
    return;
  }

  try {
    const res = await fetch('/api/analytics', {
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
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      staticHostDetected = true;
      staticTrackAnalytics(params);
    }
  } catch {
    staticTrackAnalytics(params);
  }
}

// --- Admin Auth & Dashboard API (Express backend with static host fallback) ---
export async function adminLoginWithPassword(password: string): Promise<string> {
  try {
    const res = await apiJson<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return res.token;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticAdminLogin(password);
    }
    throw err;
  }
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (token.startsWith('trt_static_')) {
    return staticVerifyToken(token);
  }
  try {
    await apiJson('/api/admin/verify', { headers: adminHeaders(token) });
    return true;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticVerifyToken(token);
    }
    return false;
  }
}

export async function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<string> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticChangePassword(token, currentPassword, newPassword);
  }
  try {
    const res = await apiJson<{ ok: boolean; token: string }>('/api/admin/change-password', {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.token;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticChangePassword(token, currentPassword, newPassword);
    }
    throw err;
  }
}

export async function fetchAdminDashboard(token: string): Promise<{
  products: Product[];
  categories: Category[];
  analytics: AnalyticsEvent[];
  settings: SiteSettings;
}> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticFetchDashboard(token);
  }
  try {
    return await apiJson('/api/admin/dashboard', { headers: adminHeaders(token) });
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticFetchDashboard(token);
    }
    throw err;
  }
}

export async function adminCreateProduct(token: string, input: ProductFormInput): Promise<Product> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticCreateProduct(token, input);
  }
  try {
    const res = await apiJson<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(input),
    });
    return res.product;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticCreateProduct(token, input);
    }
    throw err;
  }
}

export async function adminUpdateProduct(
  token: string,
  id: string,
  input: Partial<ProductFormInput>
): Promise<Product> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticUpdateProduct(token, id, input);
  }
  try {
    const res = await apiJson<{ product: Product }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(input),
    });
    return res.product;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticUpdateProduct(token, id, input);
    }
    throw err;
  }
}

export async function adminDeleteProduct(token: string, id: string): Promise<void> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    staticDeleteProduct(token, id);
    return;
  }
  try {
    await apiJson(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(token),
    });
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      staticDeleteProduct(token, id);
      return;
    }
    throw err;
  }
}

export async function adminCreateCategory(
  token: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Promise<Category> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticCreateCategory(token, input);
  }
  try {
    const res = await apiJson<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(input),
    });
    return res.category;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticCreateCategory(token, input);
    }
    throw err;
  }
}

export async function adminUpdateCategory(
  token: string,
  id: string,
  input: { name: string; description?: string | null; sortOrder?: number }
): Promise<Category> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticUpdateCategory(token, id, input);
  }
  try {
    const res = await apiJson<{ category: Category }>(
      `/api/admin/categories/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: adminHeaders(token),
        body: JSON.stringify(input),
      }
    );
    return res.category;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticUpdateCategory(token, id, input);
    }
    throw err;
  }
}

export async function adminDeleteCategory(token: string, id: string): Promise<void> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    staticDeleteCategory(token, id);
    return;
  }
  try {
    await apiJson(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: adminHeaders(token),
    });
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      staticDeleteCategory(token, id);
      return;
    }
    throw err;
  }
}

export async function adminUpdateSettings(
  token: string,
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  if (token.startsWith('trt_static_') || staticHostDetected) {
    return staticUpdateSettings(token, settings);
  }
  try {
    const res = await apiJson<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(settings),
    });
    return res.settings;
  } catch (err) {
    if (isApiFallbackTrigger(err)) {
      return staticUpdateSettings(token, settings);
    }
    throw err;
  }
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
      const result = String(reader.result || '');
      if (token.startsWith('trt_static_') || staticHostDetected) {
        if (kind === 'video' || result.length > 1_500_000) {
          reject(
            new Error(
              'Direct large-file upload requires the Node backend; paste a media URL in static mode.'
            )
          );
          return;
        }
        onProgress(100);
        resolve(result);
        return;
      }

      try {
        onProgress(45);
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
        if (isApiFallbackTrigger(err) && kind === 'image' && result.length <= 1_500_000) {
          onProgress(100);
          resolve(result);
          return;
        }
        reject(err instanceof Error ? err : new Error('Media upload failed.'));
      }
    };
    reader.readAsDataURL(file);
  });
}
