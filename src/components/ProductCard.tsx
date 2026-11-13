import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Bookmark, Heart, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { trackAnalyticsEvent } from '../lib/apiClient';
import { formatTaka, isSafeHttpUrl } from '../lib/format';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, settings } = useStore();
  const [imgError, setImgError] = useState(false);

  const saved = isInWishlist(product.id);
  const primaryImage = product.images?.[0];
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
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.55,
        delay: Math.min((index % 3) * 0.07, 0.21),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-[#B7C9ED]/60 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#6385CB]"
    >
      {/* Media Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F1F4FC]">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          {primaryImage && !imgError ? (
            <img
              src={primaryImage}
              alt={product.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F1F4FC] p-6 text-center">
              <div className="h-10 w-10 rotate-45 rounded-xl border border-[#6385CB]/45 bg-white" />
              <span className="max-w-[180px] truncate text-xs font-medium text-[#1C3265]/70">
                {product.title}
              </span>
            </div>
          )}
        </Link>

        {/* Apple-style Circular Wishlist Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`apple-btn absolute right-3.5 top-3.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${
            saved ? 'apple-btn-primary' : 'apple-icon-btn text-[#1C3265]'
          }`}
        >
          <Heart className={`relative z-10 h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>

        {/* Pinned Badge */}
        {product.isPinned && (
          <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-[#101A35]/90 px-3 py-1 font-accent text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-md">
            <Bookmark className="h-3 w-3" />
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {(product.categoryName || (product.rating !== null && product.rating !== undefined)) && (
          <div className="mb-1.5 flex items-center gap-2 text-xs text-[#6385CB]">
            {product.categoryName && (
              <span className="truncate font-accent font-medium text-[#3156A5]">
                {product.categoryName}
              </span>
            )}
            {product.categoryName && product.rating !== null && product.rating !== undefined && (
              <span aria-hidden="true">·</span>
            )}
            {product.rating !== null && product.rating !== undefined && (
              <span className="inline-flex items-center gap-1 font-accent tabular-nums text-[#1C3265]">
                <Star className="h-3 w-3 fill-[#3156A5] text-[#3156A5]" />
                {Number(product.rating).toFixed(1)}
              </span>
            )}
          </div>
        )}

        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-[#101A35] transition-colors group-hover:text-[#1C3265] sm:text-[17px]">
            {product.title}
          </h3>
        </Link>

        {/* Pricing in ৳ */}
        <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
          <span className="font-accent tabular-nums text-lg font-bold text-[#101A35]">
            {formatTaka(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="font-accent tabular-nums text-xs text-[#6385CB] line-through">
              {formatTaka(product.originalPrice)}
            </span>
          )}
          {discount && discount > 0 && (
            <span className="font-accent tabular-nums text-xs font-semibold text-[#3156A5]">
              -{discount}%
            </span>
          )}
        </div>

        {/* Apple UI Circular Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 pt-3">
          <Link
            to={`/product/${product.slug}`}
            className="apple-btn apple-btn-glass inline-flex h-10 items-center justify-center px-4 text-xs font-semibold whitespace-nowrap"
          >
            <span className="relative z-10">View Details</span>
          </Link>

          {isSafeHttpUrl(product.affiliateUrl) ? (
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              onClick={handleAffiliateClick}
              className="apple-btn apple-btn-primary inline-flex h-10 items-center justify-center gap-1 px-4 text-xs font-semibold whitespace-nowrap"
            >
              <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'}</span>
              <ArrowUpRight className="relative z-10 h-3.5 w-3.5" />
            </a>
          ) : (
            <Link
              to={`/product/${product.slug}`}
              className="apple-btn apple-btn-primary inline-flex h-10 items-center justify-center px-4 text-xs font-semibold whitespace-nowrap"
            >
              <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'}</span>
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
