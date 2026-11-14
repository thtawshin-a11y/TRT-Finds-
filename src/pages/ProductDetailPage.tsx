import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
import {
  formatTaka,
  getSwatchGradient,
  isSafeHttpUrl,
  resolveProductColorOptions,
} from '../lib/format';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, isInWishlist, toggleWishlist, settings, showToast } = useStore();

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [colorLocked, setColorLocked] = useState(false);
  const [variantAutoPaused, setVariantAutoPaused] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const productFromStore = useMemo(
    () => products.find((p) => p.slug === slug) || null,
    [products, slug]
  );

  const product = productFromStore || fetchedProduct;

  useEffect(() => {
    let active = true;
    setActiveMediaIndex(0);
    setSelectedColorIndex(0);
    setSelectedSizeIndex(0);
    setColorLocked(false);
    setShowVideo(false);
    setGalleryPaused(false);
    setVariantAutoPaused(false);
    setDescExpanded(false);

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

  const colorOptions = useMemo(
    () => (product ? resolveProductColorOptions(product) : []),
    [product]
  );

  const allImages = useMemo(
    () =>
      product
        ? Array.from(
            new Set([
              ...(Array.isArray(product.images) ? product.images.filter(Boolean) : []),
              ...colorOptions.flatMap((c) => c.images),
            ])
          )
        : [],
    [product, colorOptions]
  );

  const sizes = useMemo(
    () => (product && Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : []),
    [product]
  );

  const activeColor =
    colorOptions[selectedColorIndex % Math.max(colorOptions.length, 1)] || null;

  // When a color with linked photos is explicitly selected, prioritize that color's photos
  const displayedImages = useMemo(() => {
    if (colorLocked && activeColor && activeColor.images.length > 0) {
      return activeColor.images;
    }
    return allImages;
  }, [colorLocked, activeColor, allImages]);

  // Gentle slide-up auto cycling across photos
  useEffect(() => {
    if (displayedImages.length <= 1 || showVideo || galleryPaused) return;
    const timer = window.setInterval(() => {
      setActiveMediaIndex((prev) => {
        const next = (prev + 1) % displayedImages.length;
        if (!colorLocked && colorOptions.length > 1) {
          const nextImg = displayedImages[next];
          const matchedColorIdx = colorOptions.findIndex((c) => c.images.includes(nextImg));
          if (matchedColorIdx !== -1) setSelectedColorIndex(matchedColorIdx);
        }
        return next;
      });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [displayedImages, showVideo, galleryPaused, colorLocked, colorOptions]);

  const pauseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const pauseGalleryBriefly = () => {
    setGalleryPaused(true);
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      setGalleryPaused(false);
    }, 5500);
  };

  useEffect(() => {
    if (variantAutoPaused) return;
    if (colorOptions.length <= 1 && sizes.length <= 1) return;

    const timer = window.setInterval(() => {
      if (colorOptions.length > 1) {
        setSelectedColorIndex((prev) => (prev + 1) % colorOptions.length);
      }
      if (sizes.length > 1) {
        setSelectedSizeIndex((prev) => (prev + 1) % sizes.length);
      }
    }, 3400);
    return () => window.clearInterval(timer);
  }, [colorOptions.length, sizes.length, variantAutoPaused]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = products.filter((p) => p.id !== product.id);
    if (product.categoryId || product.categoryName) {
      const sameCategory = others.filter(
        (p) =>
          (product.categoryId && p.categoryId === product.categoryId) ||
          (product.categoryName && p.categoryName === product.categoryName)
      );
      if (sameCategory.length > 0) return sameCategory.slice(0, 4);
    }
    return others.slice(0, 4);
  }, [products, product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="h-[420px] animate-pulse rounded-3xl bg-[#F1F4FC] lg:col-span-7" />
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
        <p className="mt-2 text-sm font-medium text-[#1C3265]">
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
  const safeMediaIdx = displayedImages.length > 0 ? activeMediaIndex % displayedImages.length : 0;
  const activeImage = displayedImages[safeMediaIdx] || displayedImages[0];
  const activeSize = sizes[selectedSizeIndex % Math.max(sizes.length, 1)] || null;

  const isOutOfStock =
    (product.stock !== null && product.stock !== undefined && product.stock <= 0) ||
    (activeColor ? !activeColor.inStock : false);
  const stockLabel = isOutOfStock
    ? activeColor && !activeColor.inStock
      ? `Out of Stock (${activeColor.name})`
      : 'Out of Stock'
    : product.stock === null || product.stock === undefined
      ? 'Available'
      : `In Stock · ${product.stock} available`;

  const discount =
    product.discountPercent && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

  const hasLongDescription = Boolean(product.description && product.description.length > 210);
  const displayedDescription =
    product.description && hasLongDescription && !descExpanded
      ? `${product.description.slice(0, 210).trimEnd()}...`
      : product.description;

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
        // Fallback
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

  const hasThumbRail = displayedImages.length > 1 || Boolean(product.video);
  const hasAffiliateLink = isSafeHttpUrl(product.affiliateUrl);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Editorial Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-[#1C3265]">
        <Link
          to="/shop"
          className="apple-btn apple-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-[#101A35]"
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
        <span className="truncate font-semibold text-[#101A35]">{product.title}</span>
      </nav>

      {/* Main Split Layout */}
      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Left Column: Vertical Thumbnail Rail + Uncropped Adaptive Photo Stage */}
        <ScrollReveal className="lg:col-span-7">
          <div
            onMouseEnter={() => setGalleryPaused(true)}
            onMouseLeave={() => setGalleryPaused(false)}
          >
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-4">
              {hasThumbRail && (
                <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 sm:w-20 sm:shrink-0 sm:flex-col sm:overflow-visible sm:pb-0">
                  {displayedImages.map((imgUrl, idx) => {
                    const isSelected = !showVideo && safeMediaIdx === idx;
                    return (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => {
                          setShowVideo(false);
                          setActiveMediaIndex(idx);
                          pauseGalleryBriefly();
                        }}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[#F1F4FC]/70 p-1 transition-all sm:h-20 sm:w-20 ${
                          isSelected
                            ? 'border-[#101A35] ring-2 ring-[#3156A5]/35'
                            : 'border-[#B7C9ED] opacity-80 hover:border-[#1C3265] hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${product.title} view ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full rounded-xl object-contain"
                        />
                      </button>
                    );
                  })}

                  {product.video && (
                    <button
                      type="button"
                      onClick={() => setShowVideo(true)}
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border bg-[#F1F4FC] text-[11px] font-semibold text-[#101A35] transition-all sm:h-20 sm:w-20 ${
                        showVideo
                          ? 'border-[#101A35] ring-2 ring-[#3156A5]/35'
                          : 'border-[#B7C9ED] hover:border-[#1C3265]'
                      }`}
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Video</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Showcase Stage */}
              <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-3xl border border-[#B7C9ED]/80 bg-[#F1F4FC]/65 p-4 sm:min-h-[420px] sm:p-7">
                {showVideo && product.video ? (
                  <video
                    src={product.video}
                    controls
                    playsInline
                    className="max-h-[540px] w-full rounded-2xl bg-[#101A35] object-contain"
                  />
                ) : activeImage ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.img
                      key={`${activeImage}-${safeMediaIdx}`}
                      src={activeImage}
                      alt={`${product.title}${activeColor ? ` — ${activeColor.name}` : ''}`}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, y: 22, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -22, scale: 0.985 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="max-h-[540px] w-auto max-w-full rounded-2xl object-contain"
                    />
                  </AnimatePresence>
                ) : (
                  <div className="flex h-64 w-full flex-col items-center justify-center gap-3 p-10 text-center">
                    <div className="h-12 w-12 rotate-45 rounded-2xl border border-[#3156A5]/45 bg-white" />
                    <span className="text-xs font-semibold text-[#101A35]">
                      Curated visual preview unavailable
                    </span>
                  </div>
                )}

                {displayedImages.length > 1 && !showVideo && (
                  <div className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-2 rounded-full border border-[#B7C9ED] bg-white/95 px-3 py-1 font-accent tabular-nums text-[10px] font-bold text-[#101A35]">
                    <span>
                      {safeMediaIdx + 1} / {displayedImages.length}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3156A5]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Column */}
        <div className="rounded-3xl border border-[#B7C9ED]/80 bg-white p-6 sm:p-8 lg:sticky lg:top-28 lg:col-span-5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-accent font-bold tracking-wider text-[#1C3265] uppercase">
              TRT FINDS {product.categoryName ? `/ ${product.categoryName}` : ''}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-accent text-[10px] font-bold ${
                isOutOfStock
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-[#B7C9ED] bg-[#F1F4FC] text-[#101A35]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOutOfStock ? 'bg-red-500' : 'bg-emerald-600'
                }`}
              />
              {stockLabel}
            </span>
          </div>

          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-[#101A35] sm:text-3xl">
            {product.title}
          </h1>

          {/* Price Row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-accent tabular-nums text-lg font-medium text-[#1C3265]/75 line-through">
                {formatTaka(product.originalPrice)}
              </span>
            )}
            <span className="font-accent tabular-nums text-3xl font-extrabold text-[#101A35]">
              {formatTaka(product.price)}
            </span>
            {discount && discount > 0 && (
              <span className="rounded-full bg-[#101A35] px-3 py-1 font-accent tabular-nums text-xs font-semibold text-white">
                {discount}% Off
              </span>
            )}
          </div>

          {/* 5-Star Visual Rating */}
          {product.rating !== null && product.rating !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5" aria-label={`Rated ${product.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const filled = starIndex <= Math.round(Number(product.rating));
                  return (
                    <Star
                      key={starIndex}
                      className={`h-4 w-4 ${
                        filled
                          ? 'fill-[#1C3265] text-[#1C3265]'
                          : 'fill-[#F1F4FC] text-[#B7C9ED]'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="font-accent tabular-nums text-xs font-bold text-[#101A35]">
                ({Number(product.rating).toFixed(1)})
              </span>
            </div>
          )}

          {/* Description */}
          {displayedDescription && (
            <div className="mt-5 border-t border-[#F1F4FC] pt-4">
              <h2 className="font-accent text-xs font-bold tracking-wider text-[#101A35] uppercase">
                Descriptions
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-[#1C3265]">
                {displayedDescription}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1.5 text-xs font-bold text-[#1C3265] underline-offset-2 hover:text-[#101A35] hover:underline"
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Available Color Palette (Single, Dual, Triple — switches gallery directly to that color's product photo) */}
          {colorOptions.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <span className="font-accent text-xs font-bold tracking-wider text-[#101A35] uppercase">
                  Available Color
                </span>
                <div className="flex items-center gap-2">
                  {colorLocked && allImages.length > displayedImages.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setColorLocked(false);
                        setActiveMediaIndex(0);
                      }}
                      className="text-[11px] font-semibold text-[#3156A5] hover:text-[#101A35]"
                    >
                      Show all photos
                    </button>
                  )}
                  {activeColor && (
                    <span className="text-xs font-bold text-[#1C3265]">{activeColor.name}</span>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {colorOptions.map((swatch, idx) => {
                  const isSelected = idx === selectedColorIndex % colorOptions.length;
                  return (
                    <button
                      key={`${swatch.id}-${idx}`}
                      type="button"
                      title={swatch.name}
                      aria-label={`Select color ${swatch.name}`}
                      onClick={() => {
                        setSelectedColorIndex(idx);
                        setColorLocked(true);
                        setVariantAutoPaused(true);
                        setShowVideo(false);
                        setActiveMediaIndex(0);
                      }}
                      className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border p-1 transition-all ${
                        isSelected
                          ? 'scale-105 border-[#101A35] bg-white ring-2 ring-[#3156A5]/35'
                          : 'border-[#B7C9ED] bg-white hover:border-[#1C3265]'
                      }`}
                    >
                      <span
                        className="h-full w-full rounded-xl border border-black/15"
                        style={{ background: getSwatchGradient(swatch.hexes) }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-accent text-xs font-bold tracking-wider text-[#101A35] uppercase">
                  Size
                </span>
                {activeSize && (
                  <span className="text-xs font-bold text-[#1C3265]">{activeSize}</span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {sizes.map((size, idx) => {
                  const isSelected = idx === selectedSizeIndex % sizes.length;
                  return (
                    <button
                      key={`${size}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedSizeIndex(idx);
                        setVariantAutoPaused(true);
                      }}
                      className={`apple-btn min-w-[46px] px-4 py-2 text-xs font-semibold ${
                        isSelected ? 'apple-btn-primary' : 'apple-btn-glass text-[#101A35]'
                      }`}
                    >
                      <span className="relative z-10">{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dual Action Pills */}
          <div className="mt-7 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`apple-btn flex h-12 items-center justify-center gap-2 px-4 text-xs font-semibold ${
                  saved ? 'apple-btn-primary' : 'apple-btn-glass text-[#101A35]'
                }`}
              >
                <Heart className={`relative z-10 h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                <span className="relative z-10">{saved ? 'Saved' : 'Save Find'}</span>
              </button>

              {hasAffiliateLink ? (
                <a
                  href={product.affiliateUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  onClick={handleAffiliateClick}
                  className="apple-btn apple-btn-primary flex h-12 items-center justify-center gap-1.5 px-4 text-xs font-semibold"
                >
                  <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'}</span>
                  <ArrowUpRight className="relative z-10 h-4 w-4" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="apple-btn apple-btn-primary flex h-12 items-center justify-center gap-2 px-4 text-xs font-semibold"
                >
                  {copiedShare ? (
                    <>
                      <Check className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">Share Find</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {hasAffiliateLink && (
              <button
                type="button"
                onClick={() => void handleShare()}
                className="apple-btn apple-btn-glass flex h-10 w-full items-center justify-center gap-2 px-4 text-xs font-semibold text-[#101A35]"
              >
                {copiedShare ? (
                  <>
                    <Check className="relative z-10 h-3.5 w-3.5 text-[#1C3265]" />
                    <span className="relative z-10">Product Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">Share Find</span>
                  </>
                )}
              </button>
            )}
          </div>

          {hasAffiliateLink && (
            <p className="mt-5 pt-4 text-[11px] font-medium leading-relaxed text-[#1C3265]">
              {settings.affiliateDisclosure}
            </p>
          )}

          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-6 border-t border-[#F1F4FC] pt-5">
              <h2 className="font-accent text-xs font-bold tracking-wider text-[#101A35] uppercase">
                Specifications
              </h2>
              <dl className="mt-3 divide-y divide-[#F1F4FC]">
                {product.specifications.map((spec, idx) => (
                  <div key={`${spec.label}-${idx}`} className="flex justify-between gap-4 py-2.5 text-xs">
                    <dt className="font-semibold text-[#1C3265]">{spec.label}</dt>
                    <dd className="text-right font-bold text-[#101A35]">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Related Smart Finds */}
      {relatedProducts.length > 0 && (
        <ScrollReveal className="mt-16 pt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-accent text-xs font-bold tracking-[0.16em] text-[#1C3265] uppercase">
                Curated Pairings
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#101A35]">
                Related Smart Finds
              </h2>
            </div>
            <Link
              to="/shop"
              className="apple-btn apple-btn-glass inline-flex h-9 items-center px-4 text-xs font-semibold whitespace-nowrap text-[#101A35]"
            >
              <span className="relative z-10">View All</span>
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rel, idx) => (
              <ProductCard key={rel.id} product={rel} index={idx} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
