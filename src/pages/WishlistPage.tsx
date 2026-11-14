import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Trash2, User } from 'lucide-react';
import { ScrollReveal, ScrollScrubCard } from '../components/ScrollEffects';
import { useProfile } from '../context/ProfileContext';
import { useStore } from '../context/StoreContext';
import { trackAnalyticsEvent } from '../lib/apiClient';
import { formatTaka, isSafeHttpUrl } from '../lib/format';

export function WishlistPage() {
  const { wishlist, removeWishlistItem, settings } = useStore();
  const { activeProfile } = useProfile();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ScrollReveal className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-accent text-xs font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
            {activeProfile.name} · {activeProfile.profileCode}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#101A35]">
            Your Wishlist
          </h1>
          <p className="mt-1 text-sm text-[#1C3265]/80">
            Saved directly to your customer profile—no sign-in or account needed ({wishlist.length}{' '}
            {wishlist.length === 1 ? 'saved find' : 'saved finds'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/profile"
            className="apple-btn apple-btn-glass inline-flex h-10 items-center gap-1.5 px-4 text-xs font-semibold"
          >
            <User className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">Switch Profile</span>
          </Link>
          <Link
            to="/shop"
            className="apple-btn apple-btn-primary inline-flex h-10 items-center gap-1.5 px-5 text-xs font-semibold"
          >
            <span className="relative z-10">Continue shopping</span>
            <ArrowRight className="relative z-10 h-3.5 w-3.5" />
          </Link>
        </div>
      </ScrollReveal>

      {wishlist.length === 0 ? (
        <ScrollReveal className="mt-6 rounded-3xl border border-[#B7C9ED]/60 bg-[#F1F4FC]/45 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-bold text-[#101A35]">
            Your wishlist is currently empty
          </h2>
          <p className="mt-2 text-sm text-[#1C3265]/75">
            Tap the heart icon on any product to save it here instantly without signing in.
          </p>
          <Link
            to="/shop"
            className="apple-btn apple-btn-primary mt-6 inline-flex h-11 items-center gap-2 px-7 text-xs font-semibold"
          >
            <span className="relative z-10">Explore Products</span>
            <ArrowRight className="relative z-10 h-4 w-4" />
          </Link>
        </ScrollReveal>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item, idx) => (
            <ScrollScrubCard key={item.productId} index={idx}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#B7C9ED]/65 bg-white">
              <Link
                to={`/product/${item.slug}`}
                className="flex min-h-[200px] w-full items-center justify-center bg-[#F1F4FC]/60 p-3"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[320px] w-auto max-w-full rounded-2xl object-contain"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center text-xs text-[#6385CB]">
                    {item.title}
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <Link to={`/product/${item.slug}`}>
                  <h2 className="line-clamp-2 font-display text-base font-bold text-[#101A35] hover:text-[#1C3265]">
                    {item.title}
                  </h2>
                </Link>
                <p className="mt-2 font-accent tabular-nums text-lg font-bold text-[#101A35]">
                  {formatTaka(item.price)}
                </p>

                <div className="mt-4 flex items-center gap-2 pt-3">
                  {isSafeHttpUrl(item.affiliateUrl) ? (
                    <a
                      href={item.affiliateUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      onClick={() =>
                        void trackAnalyticsEvent({
                          type: 'affiliate_click',
                          path: `/product/${item.slug}`,
                        })
                      }
                      className="apple-btn apple-btn-primary inline-flex h-10 flex-1 items-center justify-center gap-1 px-4 text-xs font-semibold"
                    >
                      <span className="relative z-10">{settings.orderButtonLabel || 'Order Now'}</span>
                      <ArrowUpRight className="relative z-10 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link
                      to={`/product/${item.slug}`}
                      className="apple-btn apple-btn-primary inline-flex h-10 flex-1 items-center justify-center px-4 text-xs font-semibold"
                    >
                      <span className="relative z-10">View Details</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => removeWishlistItem(item.productId)}
                    aria-label="Remove from wishlist"
                    className="apple-btn apple-icon-btn inline-flex h-10 w-10 items-center justify-center text-[#1C3265] hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="relative z-10 h-4 w-4" />
                  </button>
                </div>
              </div>
              </article>
            </ScrollScrubCard>
          ))}
        </div>
      )}
    </div>
  );
}
