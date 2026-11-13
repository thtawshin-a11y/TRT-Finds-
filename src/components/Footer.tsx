import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import { ScrollReveal } from './ScrollEffects';

export function Footer() {
  const { settings } = useStore();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-[#F1F4FC]/45">
      <ScrollReveal className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <BrandLogo size="md" showWordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#1C3265]/80">
              {settings.heroHeadline} {settings.heroSubtext}
            </p>
            <p className="mt-4 font-accent text-xs font-semibold tracking-[0.14em] text-[#3156A5] uppercase">
              {settings.brandPhilosophy}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm md:col-span-3">
            <div className="flex flex-col gap-2.5">
              <span className="font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
                Navigate
              </span>
              <Link to="/" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                Home
              </Link>
              <Link to="/shop" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                Shop
              </Link>
              <Link to="/categories" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                Categories
              </Link>
              <Link to="/about" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                About
              </Link>
              <Link to="/contact" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
                Saved & More
              </span>
              <Link to="/wishlist" className="text-[#1C3265]/75 transition-colors hover:text-[#101A35]">
                Wishlist
              </Link>
              <span className="text-xs text-[#6385CB]">{settings.socialHandle}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-[#B7C9ED]/60 bg-white p-6 md:col-span-4">
            <p className="font-accent text-xs font-semibold tracking-wider text-[#101A35] uppercase">
              Affiliate Disclosure
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#1C3265]/80">
              {settings.affiliateDisclosure}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#B7C9ED]/40 pt-6 text-xs text-[#1C3265]/70 sm:flex-row sm:items-center">
          <p>© {year} TRT FINDS ({settings.socialHandle}). All rights reserved.</p>

          {/* Separate Admin Portal entry at the bottom */}
          <Link
            to="/admin"
            className="apple-btn apple-btn-glass inline-flex h-9 items-center gap-1.5 px-4 text-xs font-semibold whitespace-nowrap"
          >
            <Lock className="relative z-10 h-3 w-3" />
            <span className="relative z-10">Admin Portal</span>
          </Link>
        </div>
      </ScrollReveal>
    </footer>
  );
}
