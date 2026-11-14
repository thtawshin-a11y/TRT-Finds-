import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ScrollReveal } from '../components/ScrollEffects';
import { useStore } from '../context/StoreContext';

export function AboutPage() {
  const { settings } = useStore();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <ScrollReveal>
        <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-8 sm:p-12">
          <BrandLogo size="lg" showWordmark />

          <p className="mt-7 font-accent text-xs font-bold tracking-[0.18em] text-[#1C3265] uppercase">
            {settings.brandPhilosophy}
          </p>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl [text-wrap:balance]">
            {settings.aboutTitle}
          </h1>

          <div className="mt-6 space-y-4 whitespace-pre-line text-sm font-medium leading-relaxed text-[#1C3265] sm:text-base">
            <p>{settings.aboutBody}</p>
          </div>

          <div className="mt-8 rounded-2xl border border-[#B7C9ED]/75 bg-[#F1F4FC]/75 p-6">
            <h2 className="font-display text-sm font-bold text-[#101A35]">
              Transparent Affiliate Disclosure
            </h2>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#1C3265] sm:text-sm">
              {settings.affiliateDisclosure}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="apple-btn apple-btn-primary inline-flex h-11 items-center gap-2 px-7 text-sm font-semibold"
            >
              <span className="relative z-10">Explore Curated Shop</span>
              <ArrowRight className="relative z-10 h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="apple-btn apple-btn-glass inline-flex h-11 items-center px-7 text-sm font-semibold"
            >
              <span className="relative z-10">Contact Us</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
