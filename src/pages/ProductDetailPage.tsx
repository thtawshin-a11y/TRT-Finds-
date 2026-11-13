import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Heart,
  Play,
  Share2,
  Star,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ScrollReveal } from '../components/ScrollEffects';
import { useStore } from '../context/StoreContext';
import { fetchProductBySlug, trackAnalyticsEvent } from '../lib/apiClient';
import { formatTaka, isSafeHttpUrl } from '../lib/format';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, isInWishlist, toggleWishlist, settings, showToast } = useStore();

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const productFromStore = useMemo(
    () => products.find((p) => p.slug === slug) || null,
    [products, slug]
  );

  const product = productFromStore || fetchedProduct;

  useEffect(() => {
    let active = true;
    setActiveMediaIndex(0);
    setShowVideo(false);

    if (productFromStore) {
      setLoading(false);
      return;
    }

    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProductBySlug(slug)
      .then((res) => {
        if (active) {
          setFetchedProduct(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, productFromStore]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.title} — TRT FINDS`;
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || null);

    void trackAnalyticsEvent({
      type: 'product_view',
      path: `/product/${product.slug}`,
      product,
      dedupeSessionKey: `view_${product.id}`,
    });

    return () => {
      document.title = 'TRT FINDS — Discover smart finds, curated just for you.';
    };
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = products.filter((p) => p.id !== product.id);
    if (product.categoryId || product.categoryName) {
      const sameCategory = others.filter(
        (p) =>
          (product.categoryId && p.categoryId === product.categoryId) ||
          (product.categoryName && p.categoryName === product.categoryName)
      );
      if (sameCategory.length > 0) return sameCategory.slice(0, 3);
    }
    return others.slice(0, 3);
  }, [products, product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-[#F1F4FC] lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="h-4 w-28 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="h-9 w-4/5 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-[#F1F4FC]" />
            <div className="h-28 w-full animate-pulse rounded-3xl bg-[#F1F4FC]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-[#101A35] sm:text-3xl">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-[#1C3265]/75">
          This item may have been removed or is no longer published.
        </p>
        <Link
          to="/shop"
          className="apple-btn apple-btn-primary mt-6 inline-flex h-11 items-center gap-2 px-6 text-xs font-semibold"
        >
          <ArrowLeft className="relative z-10 h-4 w-4" />
          <span className="relative z-10">Back to Shop</span>
        </Link>
      </div>
    );
  }

  const saved = isInWishlist(product.id);
  const images = product.images?.length ? product.images : [];
  const activeImage = images[activeMediaIndex] || images[0];
  const discount =
    product.discountPercent && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

  const handleAffiliateClick = () => {
    void trackAnalyticsEvent({
      type: 'affiliate_click',
      path: `/product/${product.slug}`,
      product,
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on TRT FINDS (${formatTaka(product.price)})`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      showToast('Product link copied to clipboard.');
      window.setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      showToast('Unable to copy link automatically.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#6385CB]">
        <Link
          to="/shop"
          className="apple-btn apple-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 font-medium text-[#1C3265]"
        >
          <ArrowLeft className="relative z-10 h-3.5 w-3.5" />
          <span className="relative z-10">Shop</span>
        </Link>
        {product.categoryName && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              to={`/shop?category=${encodeURIComponent(product.categoryId || 'all')}`}
              className="hover:text-[#101A35]"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-[#101A35]">{product.title}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left: Gallery & Optional Video */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="overflow-hidden rounded-3xl border border-[#B7C9ED]/60 bg-[#F1F4FC]">
            <div className="relative aspect-[4/3] w-full">
              {showVideo && product.video ? (
                <video
                  src={product.video}
                  controls
                  playsInline
                  className="h-full w-full bg-[#101A35] object-contain"
                />
              ) : activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-10 text-sm text-[#1C3265]/60">
                  No preview media available
                </div>
              )}
            </div>
          </div>

          {(images.length > 1 || product.video) && (
            <div className="mt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1">
              {images.map((imgUrl, idx) => {
                const isSelected = !showVideo && activeMediaIndex === idx;
                return (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => {
                      setShowVideo(false);
                      setActiveMediaIndex(idx);
                    }}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#1C3265] ring-2 ring-[#1C3265]/25'
                        : 'border-[#B7C9ED]/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}

              {product.video && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className={`flex h-16 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border bg-[#F1F4FC] text-[11px] font-medium text-[#1C3265] transition-all ${
                    showVideo
                      ? 'border-[#1C3265] ring-2 ring-[#1C3265]/25'
                      : 'border-[#B7C9ED]/60 hover:border-[#3156A5]'
                  }`}
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Video</span>
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Right: Contiguous Purchase Module */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6 sm:p-8 lg:sticky lg:top-24 lg:col-span-5"
        >
          {(product.categoryName || (product.rating !== null && product.rating !== undefined)) && (
            <div className="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
              {product.categoryName && (
                <span className="font-accent font-semibold tracking-wider text-[#3156A5] uppercase">
                  {product.categoryName}
                </span>
              )}
              {product.categoryName && product.rating !== null && product.rating !== undefined && (
                <span aria-hidden="true" className="text-[#B7C9ED]">
                  ·
                </span>
              )}
              {product.rating !== null && product.rating !== undefined && (
                <span className="inline-flex items-center gap-1 font-accent tabular-nums font-medium text-[#101A35]">
                  <Star className="h-3.5 w-3.5 fill-[#3156A5] text-[#3156A5]" />
                  {Number(product.rating).toFixed(1)}
                </span>
              )}
            </div>
          )}

          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-[#101A35] sm:text-3xl">
            {product.title}
          </h1>

          {/* Price in ৳ */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-accent tabular-nums text-3xl font-bold text-[#101A35]">
              {formatTaka(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-accent tabular-nums text-base text-[#6385CB] line-through">
                {formatTaka(product.originalPrice)}
              </span>
            )}
            {discount && discount > 0 && (
              <span className="rounded-full bg-[#F1F4FC] px-3 py-0.5 font-accent tabular-nums text-xs font-semibold text-[#3156A5]">
                Save {discount}%
              </span>
            )}
          </div>

          {product.stock !== null && product.stock !== undefined && (
            <p className="mt-2.5 font-accent tabular-nums text-xs font-medium text-[#1C3265]/75">
              {product.stock > 0
                ? `${product.stock} units available`
                : 'Currently out of stock'}
            </p>
          )}

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[#1C3265]/85">
              {product.description}
            </p>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <span className="block font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
                Color{selectedColor ? `: ${selectedColor}` : ''}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`apple-btn px-4 py-1.5 text-xs font-medium ${
                      selectedColor === color ? 'apple-btn-primary' : 'apple-btn-glass'
                    }`}
                  >
                    <span className="relative z-10">{color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-5">
              <span className="block font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
                Size{selectedSize ? `: ${selectedSize}` : ''}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`apple-btn min-w-[44px] px-4 py-1.5 text-xs font-medium ${
                      selectedSize === size ? 'apple-btn-primary' : 'apple-btn-glass'
                    }`}
                  >
                    <span className="relative z-10">{size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Affiliate Order CTA + Login-Free Wishlist */}
          <div className="mt-7 space-y-2.5">
            {isSafeHttpUrl(product.affiliateUrl) ? (
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                onClick={handleAffiliateClick}
                className="apple-btn apple-btn-primary flex h-12 w-full items-center justify-center gap-2 px-6 text-sm font-semibold"
              >
                <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'} at Partner Store</span>
                <ArrowUpRight className="relative z-10 h-4 w-4" />
              </a>
            ) : (
              <div className="rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-4 py-3 text-center text-xs text-[#1C3265]">
                Merchant link unavailable.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`apple-btn flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold ${
                  saved ? 'apple-btn-primary' : 'apple-btn-glass'
                }`}
              >
                <Heart className={`relative z-10 h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                <span className="relative z-10">{saved ? 'Saved' : 'Save to Wishlist'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleShare()}
                className="apple-btn apple-btn-glass flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold"
              >
                {copiedShare ? (
                  <>
                    <Check className="relative z-10 h-4 w-4 text-[#3156A5]" />
                    <span className="relative z-10">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">Share Find</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-5 pt-4 text-[11px] leading-relaxed text-[#6385CB]">
            {settings.affiliateDisclosure}
          </p>

          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-6 border-t border-[#F1F4FC] pt-5">
              <h2 className="font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
                Specifications
              </h2>
              <dl className="mt-3 divide-y divide-[#F1F4FC]">
                {product.specifications.map((spec, idx) => (
                  <div key={`${spec.label}-${idx}`} className="flex justify-between gap-4 py-2.5 text-xs">
                    <dt className="font-medium text-[#6385CB]">{spec.label}</dt>
                    <dd className="text-right font-semibold text-[#101A35]">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </motion.div>
      </div>

      {relatedProducts.length > 0 && (
        <ScrollReveal className="mt-16 pt-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#101A35]">
            Related Smart Finds
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((rel, idx) => (
              <ProductCard key={rel.id} product={rel} index={idx} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
