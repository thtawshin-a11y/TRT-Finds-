import type { ColorVariant, Product } from '../types';

export function formatTaka(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '৳0';
  }
  const rounded = Math.round(Number(amount));
  return `৳${rounded.toLocaleString('en-US')}`;
}

export function slugify(input: string): string {
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

export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getDateKeys(date: Date = new Date()): { dateKey: string; monthKey: string } {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return {
    dateKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
  };
}

export function formatTimestampLabel(ts: unknown): string {
  if (!ts) return 'Just now';
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    const d = (ts as { toDate: () => Date }).toDate();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (ts instanceof Date) {
    return ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return 'Recent';
}

export interface ParsedColorSwatch {
  raw: string;
  name: string;
  hexes: string[];
  primaryHex: string;
  secondaryHex?: string;
  tertiaryHex?: string;
}

export interface ResolvedColorOption {
  id: string;
  name: string;
  hexes: string[];
  primaryHex: string;
  secondaryHex?: string;
  tertiaryHex?: string;
  images: string[];
  inStock: boolean;
}

export const PRESET_COLOR_SWATCHES: Array<{ name: string; hexes: string[] }> = [
  { name: 'Midnight Navy', hexes: ['#101A35'] },
  { name: 'Deep Cobalt', hexes: ['#1C3265'] },
  { name: 'Royal Blue', hexes: ['#3156A5'] },
  { name: 'Crimson Red', hexes: ['#DC2626'] },
  { name: 'Arctic White', hexes: ['#F8FAFC'] },
  { name: 'Jet Black', hexes: ['#111827'] },
  { name: 'Forest Green', hexes: ['#14532D'] },
  { name: 'Sand Beige', hexes: ['#D6C7B2'] },
  { name: 'Blue & Red', hexes: ['#2563EB', '#DC2626'] },
  { name: 'Cobalt & White', hexes: ['#1C3265', '#F8FAFC'] },
  { name: 'Midnight, Cobalt & Red', hexes: ['#101A35', '#3156A5', '#DC2626'] },
];

const COLOR_KEYWORD_MAP: Array<[RegExp, string]> = [
  [/cobalt/i, '#1C3265'],
  [/navy|midnight/i, '#101A35'],
  [/sky|ice|light\s*blue/i, '#93C5FD'],
  [/blue|royal|denim/i, '#2563EB'],
  [/white|arctic|ivory|cream|pearl/i, '#F8FAFC'],
  [/black|jet|obsidian|onyx/i, '#111827'],
  [/charcoal/i, '#374151'],
  [/slate|graphite/i, '#475569'],
  [/grey|gray|silver|ash/i, '#94A3B8'],
  [/olive|moss/i, '#4D5D3B'],
  [/forest|emerald|dark\s*green/i, '#14532D'],
  [/sage|mint/i, '#6EE7B7'],
  [/green/i, '#16A34A'],
  [/burgundy|wine|maroon/i, '#7F1D1D'],
  [/red|crimson|scarlet/i, '#DC2626'],
  [/coral|peach/i, '#FB7185'],
  [/pink|rose|blush/i, '#EC4899'],
  [/purple|violet|plum/i, '#7C3AED'],
  [/lavender|lilac/i, '#C4B5FD'],
  [/orange|terracotta|rust/i, '#EA580C'],
  [/gold|mustard|amber/i, '#D97706'],
  [/yellow/i, '#EAB308'],
  [/brown|walnut|espresso|chocolate|coffee/i, '#78350F'],
  [/beige|sand|tan|camel|khaki|taupe/i, '#D6C7B2'],
];

export function inferHexFromText(text: string): string | null {
  for (const [pattern, hex] of COLOR_KEYWORD_MAP) {
    if (pattern.test(text)) return hex;
  }
  return null;
}

export function getSwatchGradient(hexes: string[]): string {
  const valid = hexes.filter((h) => /^#[0-9a-fA-F]{3,8}$/.test(h));
  if (valid.length === 0) return '#1C3265';
  if (valid.length === 1) return valid[0];
  if (valid.length === 2) {
    return `linear-gradient(135deg, ${valid[0]} 50%, ${valid[1]} 50%)`;
  }
  return `linear-gradient(135deg, ${valid[0]} 0% 34%, ${valid[1]} 34% 67%, ${valid[2]} 67% 100%)`;
}

export function formatColorStorageValue(name: string, hexes: string | string[]): string {
  const cleanName = name.trim();
  const arr = (Array.isArray(hexes) ? hexes : [hexes])
    .map((h) => h.trim().toUpperCase())
    .filter((h) => /^#[0-9a-fA-F]{6}$/.test(h));
  const safeHexes = arr.length > 0 ? arr.slice(0, 4) : ['#1C3265'];
  return cleanName ? `${cleanName}|${safeHexes.join('|')}` : safeHexes.join('|');
}

export function parseColorOption(raw: string): ParsedColorSwatch {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { raw, name: 'Default', hexes: ['#1C3265'], primaryHex: '#1C3265' };
  }

  // Explicit "Name|#HEX1|#HEX2|#HEX3" format
  if (trimmed.includes('|')) {
    const segments = trimmed.split('|').map((s) => s.trim()).filter(Boolean);
    const hexes = segments.filter((s) => /^#[0-9a-fA-F]{3,8}$/.test(s));
    const label = segments.find((s) => !/^#[0-9a-fA-F]{3,8}$/.test(s));
    if (hexes.length > 0) {
      return {
        raw: trimmed,
        name: label || hexes.join(' & '),
        hexes,
        primaryHex: hexes[0],
        secondaryHex: hexes[1],
        tertiaryHex: hexes[2],
      };
    }
  }

  // Bare hex value
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    return {
      raw: trimmed,
      name: trimmed.toUpperCase(),
      hexes: [trimmed],
      primaryHex: trimmed,
    };
  }

  // Multi-color names like "Blue & Red" or "Midnight, Cobalt & Red"
  const parts = trimmed.split(/\s*(?:&|\/|\+|,|and)\s*/i).filter(Boolean);
  if (parts.length >= 2) {
    const resolvedHexes = parts
      .map((part) => inferHexFromText(part) || '#3156A5')
      .slice(0, 4);
    return {
      raw: trimmed,
      name: trimmed,
      hexes: resolvedHexes,
      primaryHex: resolvedHexes[0],
      secondaryHex: resolvedHexes[1],
      tertiaryHex: resolvedHexes[2],
    };
  }

  const single = inferHexFromText(trimmed) || '#3156A5';
  return {
    raw: trimmed,
    name: trimmed,
    hexes: [single],
    primaryHex: single,
  };
}

/**
 * Resolves unified color options with linked product photos and per-color stock.
 */
export function resolveProductColorOptions(product: Product): ResolvedColorOption[] {
  const fallbackOutOfStock =
    product.stock !== null && product.stock !== undefined && product.stock <= 0;

  if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    return product.colorVariants.map((variant: ColorVariant, idx: number) => {
      const parsed = parseColorOption(variant.name);
      const validHexes =
        Array.isArray(variant.hexes) && variant.hexes.length > 0
          ? variant.hexes
          : parsed.hexes;
      const variantImages = Array.isArray(variant.images)
        ? variant.images.filter(Boolean)
        : [];
      return {
        id: variant.id || `cv_${idx}`,
        name: parsed.name || variant.name,
        hexes: validHexes,
        primaryHex: validHexes[0] || '#1C3265',
        secondaryHex: validHexes[1],
        tertiaryHex: validHexes[2],
        images: variantImages,
        inStock: variant.inStock !== undefined ? variant.inStock : !fallbackOutOfStock,
      };
    });
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    const productImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    return product.colors.filter(Boolean).map((raw, idx) => {
      const parsed = parseColorOption(raw);
      const mappedImg =
        productImages.length > 1
          ? [productImages[idx % productImages.length]]
          : productImages.length === 1
            ? [productImages[0]]
            : [];
      return {
        id: `c_${idx}`,
        name: parsed.name,
        hexes: parsed.hexes,
        primaryHex: parsed.primaryHex,
        secondaryHex: parsed.secondaryHex,
        tertiaryHex: parsed.tertiaryHex,
        images: mappedImg,
        inStock: !fallbackOutOfStock,
      };
    });
  }

  return [];
}
