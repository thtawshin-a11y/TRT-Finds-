import { useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { ScrollReveal, ScrollScrubCard } from '../components/ScrollEffects';
import { useStore } from '../context/StoreContext';

export function ContactPage() {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    showToast('Thank you! Your message has been received.');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <ScrollReveal className="max-w-2xl">
        <p className="font-accent text-xs font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
          Get in Touch
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl">
          Contact TRT FINDS
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#1C3265]/80 sm:text-base">
          Have a question about a curated find, partner inquiry, or product suggestion? Reach out directly.
        </p>
      </ScrollReveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* Bento Contact Details */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          <ScrollScrubCard index={0}>
            <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F4FC] text-[#1C3265]">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 font-accent text-xs font-semibold tracking-wider text-[#6385CB] uppercase">
                Email
              </p>
              <p className="mt-1 font-display text-base font-bold text-[#101A35]">
                {settings.contactEmail}
              </p>
            </div>
          </ScrollScrubCard>

          <ScrollScrubCard index={1}>
            <div className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F4FC] text-[#1C3265]">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 font-accent text-xs font-semibold tracking-wider text-[#6385CB] uppercase">
                Phone
              </p>
              <p className="mt-1 font-display text-base font-bold tabular-nums text-[#101A35]">
                {settings.contactPhone}
              </p>
            </div>
          </ScrollScrubCard>

          <ScrollScrubCard index={2}>
            <div className="rounded-3xl border border-[#B7C9ED]/65 bg-[#F1F4FC]/60 p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1C3265]">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-accent text-xs font-semibold tracking-wider text-[#6385CB] uppercase">
                    Location & Hours
                  </p>
                  <p className="mt-1 font-display text-sm font-bold text-[#101A35]">
                    {settings.contactAddress}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#1C3265]/75">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{settings.contactHours}</span>
                  </p>
                </div>
              </div>
            </div>
          </ScrollScrubCard>
        </div>

        {/* Contact Form */}
        <ScrollReveal delay={0.08} className="rounded-3xl border border-[#B7C9ED]/65 bg-white p-7 sm:p-9 lg:col-span-7">
          <h2 className="font-display text-xl font-bold text-[#101A35]">Send a Message</h2>
          <p className="mt-1 text-xs text-[#1C3265]/75">
            We respond to inquiries during business hours ({settings.socialHandle}).
          </p>

          {submitted && (
            <div className="mt-5 rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC] px-4 py-3 text-xs font-medium text-[#1C3265]">
              Message sent! Thank you for contacting TRT FINDS.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="h-11 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-full border border-[#B7C9ED] px-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Message
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you're looking for or share feedback..."
                className="w-full rounded-3xl border border-[#B7C9ED] p-4 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="apple-btn apple-btn-primary inline-flex h-11 items-center gap-2 px-7 text-xs font-semibold"
            >
              <Send className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Send Message</span>
            </button>
          </form>
        </ScrollReveal>
      </div>
    </div>
  );
}
