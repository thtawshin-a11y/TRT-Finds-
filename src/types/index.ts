export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ColorVariant {
  id: string;
  name: string;
  hexes: string[];
  images: string[];
  inStock?: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  images: string[];
  video?: string | null;
  colors?: string[] | null;
  colorVariants?: ColorVariant[] | null;
  sizes?: string[] | null;
  stock?: number | null;
  rating?: number | null;
  specifications?: ProductSpecification[] | null;
  affiliateUrl?: string | null;
  isPinned: boolean;
  isPublished: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProductFormInput {
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
  specifications: ProductSpecification[] | null;
  affiliateUrl: string | null;
  isPinned: boolean;
  isPublished: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface WishlistItem {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image?: string | null;
  affiliateUrl?: string | null;
  addedAt: number;
}

export type AnalyticsEventType =
  | 'site_visit'
  | 'product_view'
  | 'affiliate_click'
  | 'profile_created';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  productId?: string | null;
  productTitle?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  path: string;
  dateKey: string;
  monthKey: string;
  createdAt?: number;
}

export interface SiteSettings {
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

export type ProductSortOption = 'newest' | 'featured' | 'price-asc' | 'price-desc';

export interface CustomerProfile {
  id: string;
  profileCode: string;
  name: string;
  phone: string;
  city: string;
  deliveryNote: string;
  avatarUrl?: string | null;
  avatarAccent: string;
  favoriteCategories: string[];
  wishlist: WishlistItem[];
  recentlyViewedSlugs: string[];
  hasPin?: boolean;
  pinSalt?: string;
  pinHash?: string;
  trackedCreation?: boolean;
  createdAt: number;
  updatedAt: number;
}
