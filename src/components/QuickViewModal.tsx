import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Share2,
  Star,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { trackAnalyticsEvent } from '../lib/apiClient';
import {
  formatTaka,
  getSwatchGradient,
  isSafeHttpUrl,
  resolveProductColorOptions,
} from '../lib/format';

export function QuickViewModal() {
  const {
    quickViewProduct: product,
    closeQuickView,
    isInWishlist,
    toggleWishlist,
    settings,
    showToast,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [colorLocked, setColorLocked] = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedColorIdx(0);
    setSelectedSizeIdx(0);
    setColorLocked(false);
    setGalleryPaused(false);
    setCopiedShare(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickView();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, closeQuickView]);

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
    colorOptions.length > 0 ? colorOptions[selectedColorIdx % colorOptions.length] : null;

  const displayedImages = useMemo(() => {
    if (colorLocked && activeColor && activeColor.images.length > 0) {
      return activeColor.images;
    }
    return allImages;
  }, [colorLocked, activeColor, allImages]);

  useEffect(() => {
    if (!product || displayedImages.length <= 1 || galleryPaused) return;
    const timer = window.setInterval(() => {
      setActiveImageIdx((prev) => {
        const next = (prev + 1) % displayedImages.length;
        if (!colorLocked && colorOptions.length > 1) {
          const nextImgUrl = displayedImages[next];
          const matchIdx = colorOptions.findIndex((c) => c.images.includes(nextImgUrl));
          if (matchIdx !== -1) setSelectedColorIdx(matchIdx);
        }
        return next;
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, [product, displayedImages, colorOptions, colorLocked, galleryPaused]);

  if (!product) return null;

  const saved = isInWishlist(product.id);
  const safeImgIdx = displayedImages.length > 0 ? activeImageIdx % displayedImages.length : 0;
  const activeImage = displayedImages[safeImgIdx];
  const activeSize = sizes.length > 0 ? sizes[selectedSizeIdx % sizes.length] : null;

  const isOutOfStock =
    (product.stock !== null && product.stock !== undefined && product.stock <= 0) ||
    (activeColor ? !activeColor.inStock : false);
  const availabilityLabel = isOutOfStock
    ? 'Out of Stock'
    : product.stock === null || product.stock === undefined
      ? 'Available'
      : `In Stock · ${product.stock}`;

  const discount =
    product.discountPercent && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

  const hasAffiliateLink = isSafeHttpUrl(product.affiliateUrl);

  const handleAffiliateClick = () => {
    void trackAnalyticsEvent({
      type: 'affiliate_click',
      path: `/product/${product.slug}`,
      product,
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/product/${product.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      showToast('Product link copied to clipboard.');
      window.setTimeout(() => setCopiedShare(false), 1800);
    } catch {
      showToast('Unable to copy link automatically.');
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="quick-view-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeQuickView}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${product.title}`}
          className="liquid-glass-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            key="quick-view-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-panel relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] p-5 sm:p-7"
          >
            <button
              type="button"
              onClick={closeQuickView}
              aria-label="Close quick view"
              className="apple-btn apple-icon-btn absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center text-[#101A35]"
            >
              <X className="relative z-10 h-4.5 w-4.5" />
            </button>

            <div className="relative grid items-start gap-6 md:grid-cols-12 md:gap-8">
              {/* Uncropped Adaptive Photo Gallery */}
              <div
                onMouseEnter={() => setGalleryPaused(true)}
                onMouseLeave={() => setGalleryPaused(false)}
                className="md:col-span-6"
              >
                <div className="liquid-glass-card relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-3xl p-4 sm:min-h-[360px]">
                  {activeImage ? (
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.img
                        key={`${activeImage}-${safeImgIdx}`}
                        src={activeImage}
                        alt={`${product.title}${activeColor ? ` — ${activeColor.name}` : ''}`}
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, y: 20, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.985 }}
                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                        className="max-h-[380px] w-auto max-w-full rounded-2xl object-contain"
                      />
                    </AnimatePresence>
                  ) : (
                    <div className="flex h-56 w-full flex-col items-center justify-center gap-2 text-center">
                      <div className="h-10 w-10 rotate-45 rounded-xl border border-[#3156A5]/45 bg-white" />
                      <span className="text-xs font-semibold text-[#101A35]">
                        Visual preview unavailable
                      </span>
                    </div>
                  )}

                  {displayedImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#B7C9ED]/75 bg-white/95 px-2.5 py-1">
                      {displayedImages.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`View photo ${idx + 1}`}
                          onClick={() => {
                            setActiveImageIdx(idx);
                            setGalleryPaused(true);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === safeImgIdx
                              ? 'w-4 bg-[#101A35]'
                              : 'w-1.5 bg-[#3156A5]/45 hover:bg-[#1C3265]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Details Column */}
              <div className="flex flex-col md:col-span-6 md:pr-4">
                <div className="flex flex-wrap items-center gap-2 pr-10">
                  {product.categoryName && (
                    <span className="font-accent text-[11px] font-bold tracking-wider text-[#1C3265] uppercase">
                      {product.categoryName}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-accent text-[10px] font-bold ${
                      isOutOfStock
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-[#B7C9ED] bg-white text-[#101A35]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOutOfStock ? 'bg-red-500' : 'bg-emerald-600'
                      }`}
                    />
                    {availabilityLabel}
                  </span>
                </div>

                <h2 className="mt-2 font-display text-xl font-extrabold leading-snug text-[#101A35] sm:text-2xl">
                  {product.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                  <span className="font-accent tabular-nums text-2xl font-extrabold text-[#101A35]">
                    {formatTaka(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="font-accent tabular-nums text-sm font-medium text-[#1C3265]/75 line-through">
                      {formatTaka(product.originalPrice)}
                    </span>
                  )}
                  {discount && discount > 0 && (
                    <span className="rounded-full bg-[#101A35] px-2.5 py-0.5 font-accent tabular-nums text-[11px] font-semibold text-white">
                      -{discount}%
                    </span>
                  )}
                </div>

                {product.rating !== null && product.rating !== undefined && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`h-3.5 w-3.5 ${
                          starIdx <= Math.round(Number(product.rating))
                            ? 'fill-[#1C3265] text-[#1C3265]'
                            : 'fill-[#F1F4FC] text-[#B7C9ED]'
                        }`}
                      />
                    ))}
                    <span className="font-accent tabular-nums text-xs font-bold text-[#101A35]">
                      ({Number(product.rating).toFixed(1)})
                    </span>
                  </div>
                )}

                {product.description && (
                  <p className="mt-4 line-clamp-4 text-xs font-medium leading-relaxed text-[#1C3265] sm:text-sm">
                    {product.description}
                  </p>
                )}

                {/* Color Palette Swatches (switches displayed photo directly) */}
                {colorOptions.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                        Colors
                      </span>
                      {activeColor && (
                        <span className="text-xs font-bold text-[#1C3265]">
                          {activeColor.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {colorOptions.map((swatch, idx) => {
                        const selected = idx === selectedColorIdx % colorOptions.length;
                        return (
                          <button
                            key={`${swatch.id}-${idx}`}
                            type="button"
                            title={swatch.name}
                            aria-label={`Select color ${swatch.name}`}
                            onClick={() => {
                              setSelectedColorIdx(idx);
                              setColorLocked(true);
                              setActiveImageIdx(0);
                            }}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border p-1 transition-all ${
                              selected
                                ? 'scale-105 border-[#101A35] bg-white ring-2 ring-[#3156A5]/35'
                                : 'border-[#B7C9ED] bg-white hover:border-[#1C3265]'
                            }`}
                          >
                            <span
                              className="h-full w-full rounded-lg border border-black/15"
                              style={{ background: getSwatchGradient(swatch.hexes) }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-accent text-[11px] font-bold tracking-wider text-[#101A35] uppercase">
                        Size
                      </span>
                      {activeSize && (
                        <span className="text-xs font-bold text-[#1C3265]">{activeSize}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sizes.map((size, idx) => {
                        const selected = idx === selectedSizeIdx % sizes.length;
                        return (
                          <button
                            key={`${size}-${idx}`}
                            type="button"
                            onClick={() => setSelectedSizeIdx(idx)}
                            className={`apple-btn px-3.5 py-1.5 text-xs font-semibold ${
                              selected ? 'apple-btn-primary' : 'apple-btn-glass text-[#101A35]'
                            }`}
                          >
                            <span className="relative z-10">{size}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      className={`apple-btn flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold ${
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
                        className="apple-btn apple-btn-primary flex h-11 items-center justify-center gap-1.5 px-4 text-xs font-semibold"
                      >
                        <span className="relative z-10">
                          {settings.orderButtonLabel || 'Order Now'}
                        </span>
                        <ArrowUpRight className="relative z-10 h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleShare()}
                        className="apple-btn apple-btn-primary flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold"
                      >
                        {copiedShare ? (
                          <>
                            <Check className="relative z-10 h-4 w-4" />
                            <span className="relative z-10">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="relative z-10 h-4 w-4" />
                            <span className="relative z-10">Share</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/product/${product.slug}`}
                    onClick={closeQuickView}
                    className="apple-btn apple-btn-glass flex h-10 w-full items-center justify-center gap-1.5 px-4 text-xs font-semibold text-[#101A35]"
                  >
                    <span className="relative z-10">Open Full Product Page</span>
                    <ArrowRight className="relative z-10 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
