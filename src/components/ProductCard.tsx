import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Bookmark, Eye, Heart, Star } from 'lucide-react';
import { ScrollScrubCard } from './ScrollEffects';
import { useStore } from '../context/StoreContext';
import { trackAnalyticsEvent } from '../lib/apiClient';
import {
  formatTaka,
  getSwatchGradient,
  isSafeHttpUrl,
  resolveProductColorOptions,
} from '../lib/format';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, openQuickView, settings } = useStore();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [activeSizeIdx, setActiveSizeIdx] = useState(0);
  const [colorLocked, setColorLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const saved = isInWishlist(product.id);
  const colorOptions = useMemo(() => resolveProductColorOptions(product), [product]);
  const allProductImages = useMemo(
    () =>
      Array.from(
        new Set([
          ...(Array.isArray(product.images) ? product.images.filter(Boolean) : []),
          ...colorOptions.flatMap((c) => c.images),
        ])
      ),
    [product.images, colorOptions]
  );
  const sizes = useMemo(
    () => (Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : []),
    [product.sizes]
  );

  const activeColor =
    colorOptions.length > 0 ? colorOptions[activeColorIdx % colorOptions.length] : null;

  // When a color is selected by user and has bound photos, display that color's photos!
  const displayedImages = useMemo(() => {
    if (colorLocked && activeColor && activeColor.images.length > 0) {
      return activeColor.images;
    }
    return allProductImages;
  }, [colorLocked, activeColor, allProductImages]);

  // Smooth continuous auto slide-up animation across photos, colors, and sizes
  useEffect(() => {
    const hasCycle =
      displayedImages.length > 1 || (!colorLocked && colorOptions.length > 1) || sizes.length > 1;
    if (!hasCycle || isHovered) return;

    const timer = window.setInterval(() => {
      if (displayedImages.length > 1) {
        setActiveImageIdx((prev) => {
          const next = (prev + 1) % displayedImages.length;
          if (!colorLocked && colorOptions.length > 1) {
            const nextImgUrl = displayedImages[next];
            const matchingColorIdx = colorOptions.findIndex((c) =>
              c.images.includes(nextImgUrl)
            );
            if (matchingColorIdx !== -1) {
              setActiveColorIdx(matchingColorIdx);
            } else {
              setActiveColorIdx((cPrev) => (cPrev + 1) % colorOptions.length);
            }
          }
          return next;
        });
      } else if (!colorLocked && colorOptions.length > 1) {
        setActiveColorIdx((prev) => (prev + 1) % colorOptions.length);
      }

      if (sizes.length > 1) {
        setActiveSizeIdx((prev) => (prev + 1) % sizes.length);
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [displayedImages, colorOptions, sizes.length, colorLocked, isHovered]);

  const safeImgIdx = displayedImages.length > 0 ? activeImageIdx % displayedImages.length : 0;
  const currentImage = displayedImages[safeImgIdx];
  const currentImgFailed = currentImage ? Boolean(failedImages[currentImage]) : false;
  const activeSize = sizes.length > 0 ? sizes[activeSizeIdx % sizes.length] : null;

  const isOutOfStock =
    (product.stock !== null && product.stock !== undefined && product.stock <= 0) ||
    (activeColor ? !activeColor.inStock : false);
  const availabilityLabel = isOutOfStock
    ? 'Out of stock'
    : product.stock === null || product.stock === undefined
      ? 'Available'
      : `${product.stock} in stock`;

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

  return (
    <ScrollScrubCard index={index} className="h-full">
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#B7C9ED]/75 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#3156A5]"
      >
        {/* Adaptive Media Stage — preserves portrait, square, and landscape ratios without cropping */}
        <div className="relative flex min-h-[220px] w-full items-center justify-center overflow-hidden bg-[#F1F4FC]/65 p-3 sm:p-4">
          <Link
            to={`/product/${product.slug}`}
            className="relative flex min-h-[200px] w-full items-center justify-center overflow-hidden"
          >
            {currentImage && !currentImgFailed ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={`${currentImage}-${safeImgIdx}`}
                  src={currentImage}
                  alt={`${product.title}${activeColor ? ` — ${activeColor.name}` : ''}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [currentImage]: true }))
                  }
                  initial={{ opacity: 0, y: 20, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.985 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className="max-h-[340px] w-auto max-w-full rounded-2xl object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              </AnimatePresence>
            ) : (
              <div className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-[#F1F4FC] p-6 text-center">
                <div className="h-10 w-10 rotate-45 rounded-xl border border-[#3156A5]/45 bg-white" />
                <span className="max-w-[180px] truncate text-xs font-semibold text-[#101A35]">
                  {product.title}
                </span>
              </div>
            )}
          </Link>

          {/* Apple-style Circular Wishlist & Quick View Buttons */}
          <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`apple-btn inline-flex h-10 w-10 items-center justify-center rounded-full ${
                saved ? 'apple-btn-primary' : 'apple-icon-btn text-[#101A35]'
              }`}
            >
              <Heart className={`relative z-10 h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openQuickView(product);
              }}
              aria-label={`Quick view ${product.title}`}
              title="Quick View"
              className="apple-btn apple-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101A35]"
            >
              <Eye className="relative z-10 h-4 w-4" />
            </button>
          </div>

          {/* Pinned Badge */}
          {product.isPinned && (
            <span className="absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#101A35] px-3 py-1 font-accent text-[10px] font-semibold tracking-wider text-white uppercase">
              <Bookmark className="h-3 w-3" />
              Featured
            </span>
          )}

          {/* Multi-photo Slide-Up Progress Dots */}
          {displayedImages.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#B7C9ED]/75 bg-white/95 px-2.5 py-1">
              {displayedImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`View photo ${idx + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveImageIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeImgIdx ? 'w-4 bg-[#101A35]' : 'w-1.5 bg-[#3156A5]/45 hover:bg-[#1C3265]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {(product.categoryName || (product.rating !== null && product.rating !== undefined)) && (
            <div className="mb-1.5 flex items-center gap-2 text-xs text-[#1C3265]">
              {product.categoryName && (
                <span className="truncate font-accent font-semibold text-[#1C3265]">
                  {product.categoryName}
                </span>
              )}
              {product.categoryName && product.rating !== null && product.rating !== undefined && (
                <span aria-hidden="true">·</span>
              )}
              {product.rating !== null && product.rating !== undefined && (
                <span className="inline-flex items-center gap-1 font-accent font-semibold tabular-nums text-[#101A35]">
                  <Star className="h-3 w-3 fill-[#1C3265] text-[#1C3265]" />
                  {Number(product.rating).toFixed(1)}
                </span>
              )}
            </div>
          )}

          {/* Title + Immediate Availability Status beside title */}
          <div className="flex items-start justify-between gap-2.5">
            <Link to={`/product/${product.slug}`} className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-[#101A35] transition-colors group-hover:text-[#1C3265] sm:text-[17px]">
                {product.title}
              </h3>
            </Link>

            <span
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-accent text-[10px] font-bold whitespace-nowrap ${
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
              {availabilityLabel}
            </span>
          </div>

          {/* Interactive Single & Multi-Color Palette Swatches (switches photo on click) */}
          {(colorOptions.length > 0 || sizes.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              {colorOptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {colorOptions.map((swatch, idx) => {
                    const isActive = idx === activeColorIdx % colorOptions.length;
                    return (
                      <button
                        key={`${swatch.id}-${idx}`}
                        type="button"
                        title={swatch.name}
                        aria-label={`Select color ${swatch.name}`}
                        onClick={() => {
                          setActiveColorIdx(idx);
                          setColorLocked(true);
                          setActiveImageIdx(0);
                        }}
                        className={`inline-flex h-5.5 w-5.5 items-center justify-center rounded-md border p-[2px] transition-all ${
                          isActive
                            ? 'scale-110 border-[#101A35] ring-1 ring-[#1C3265]/45'
                            : 'border-[#B7C9ED] hover:border-[#1C3265]'
                        }`}
                      >
                        <span
                          className="h-full w-full rounded-[3px] border border-black/15"
                          style={{ background: getSwatchGradient(swatch.hexes) }}
                        />
                      </button>
                    );
                  })}

                  {activeColor && (
                    <span className="max-w-[140px] truncate pl-0.5 text-[11px] font-semibold text-[#101A35]">
                      {activeColor.name}
                    </span>
                  )}
                </div>
              )}

              {activeSize && (
                <span className="rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-2.5 py-0.5 font-accent text-[10px] font-bold text-[#101A35]">
                  Size: {activeSize}
                </span>
              )}
            </div>
          )}

          {/* Pricing in ৳ */}
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="font-accent tabular-nums text-lg font-extrabold text-[#101A35]">
              {formatTaka(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-accent tabular-nums text-xs font-medium text-[#1C3265]/75 line-through">
                {formatTaka(product.originalPrice)}
              </span>
            )}
            {discount && discount > 0 && (
              <span className="rounded-full bg-[#F1F4FC] px-2 py-0.5 font-accent tabular-nums text-[11px] font-bold text-[#1C3265]">
                -{discount}%
              </span>
            )}
          </div>

          {/* Apple UI Circular Action Buttons */}
          {isSafeHttpUrl(product.affiliateUrl) ? (
            <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4">
              <Link
                to={`/product/${product.slug}`}
                className="apple-btn apple-btn-glass inline-flex h-10 items-center justify-center px-4 text-xs font-semibold whitespace-nowrap text-[#101A35]"
              >
                <span className="relative z-10">View Details</span>
              </Link>

              <a
                href={product.affiliateUrl || '#'}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                onClick={handleAffiliateClick}
                className="apple-btn apple-btn-primary inline-flex h-10 items-center justify-center gap-1 px-4 text-xs font-semibold whitespace-nowrap"
              >
                <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'}</span>
                <ArrowUpRight className="relative z-10 h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="mt-auto pt-4">
              <Link
                to={`/product/${product.slug}`}
                className="apple-btn apple-btn-primary inline-flex h-10 w-full items-center justify-center px-4 text-xs font-semibold whitespace-nowrap"
              >
                <span className="relative z-10">View Details</span>
              </Link>
            </div>
          )}
        </div>
      </article>
    </ScrollScrubCard>
  );
}
