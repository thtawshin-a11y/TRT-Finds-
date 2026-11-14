import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

function GoogleLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.22 1.18-3.24 0-5.99-2.19-6.97-5.13H1.02v3.14C3.03 21.17 7.19 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.03 14.04c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.18H1.02C.37 7.47 0 8.9 0 10.68s.37 3.21 1.02 4.5l4.01-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.19 0 3.03 2.83 1.02 6.82l4.01 3.14c.98-2.94 3.73-5.21 6.97-5.21Z"
      />
    </svg>
  );
}

export function AuthModal() {
  const {
    authModalOpen,
    authMode,
    setAuthMode,
    closeAuthModal,
    continueWithGoogle,
    signUpWithEmail,
    signInWithEmail,
  } = useAuth();
  const { showToast } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    setError(null);
    setVerificationSent(false);
  }, [authMode, authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authModalOpen, closeAuthModal]);

  const handleGoogleContinue = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await continueWithGoogle();
      showToast('Signed in with Google.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (authMode === 'signup') {
        const result = await signUpWithEmail({ name, email, password });
        if (result.needsVerification) {
          setVerificationSent(true);
          showToast('Account created! Check your email to verify.');
        } else {
          closeAuthModal();
          showToast('Welcome to TRT FINDS!');
        }
      } else {
        await signInWithEmail({ email, password });
        showToast('Signed in successfully.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={closeAuthModal}
          role="dialog"
          aria-modal="true"
          aria-label="TRT FINDS Member Account"
          className="liquid-glass-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            key="auth-panel"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-panel relative w-full max-w-md overflow-hidden rounded-[32px] p-6 sm:p-8"
          >
            {/* Ambient Cobalt Liquid Refraction Blurs */}
            <div
              aria-hidden="true"
              className="pointer-events-none -left-10 -top-10 absolute h-36 w-36 rounded-full bg-[#B7C9ED]/35 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none -bottom-10 -right-10 absolute h-36 w-36 rounded-full bg-[#6385CB]/25 blur-3xl"
            />

            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close sign up dialog"
              className="apple-btn apple-icon-btn absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center text-[#101A35]"
            >
              <X className="relative z-10 h-4 w-4" />
            </button>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1 font-accent text-[10px] font-semibold tracking-[0.16em] text-[#3156A5] uppercase">
                <Sparkles className="h-3 w-3" />
                TRT FINDS Member
              </span>

              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[#101A35]">
                {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#1C3265]/80">
                {authMode === 'signup'
                  ? 'Join TRT FINDS with the newest sign up experience or continue instantly with Google.'
                  : 'Sign in to access your TRT FINDS member profile across devices.'}
              </p>

              {/* Liquid Glass Mode Switcher */}
              <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-full border border-[#B7C9ED]/65 bg-white/60 p-1 backdrop-blur-md">
                {(['signup', 'signin'] as const).map((mode) => {
                  const active = authMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAuthMode(mode)}
                      className="relative rounded-full py-2 text-xs font-semibold transition-colors"
                    >
                      {active && (
                        <motion.span
                          layoutId="auth-mode-pill"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="apple-btn-primary absolute inset-0 rounded-full"
                        />
                      )}
                      <span
                        className={`relative z-10 ${
                          active ? 'text-white' : 'text-[#1C3265]/80 hover:text-[#101A35]'
                        }`}
                      >
                        {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Continue with Google Button */}
              <button
                type="button"
                disabled={googleLoading || submitting}
                onClick={() => void handleGoogleContinue()}
                className="apple-btn apple-btn-glass mt-5 flex h-12 w-full items-center justify-center gap-3 px-5 text-xs font-bold text-[#101A35] disabled:opacity-60"
              >
                <GoogleLogoSvg />
                <span className="relative z-10">
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#B7C9ED]/60" />
                <span className="font-accent text-[10px] font-semibold tracking-[0.14em] text-[#6385CB] uppercase">
                  Or with Email
                </span>
                <div className="h-px flex-1 bg-[#B7C9ED]/60" />
              </div>

              {verificationSent ? (
                <div className="liquid-glass-card rounded-3xl p-5 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-[#3156A5]" />
                  <h3 className="mt-2.5 font-display text-base font-bold text-[#101A35]">
                    Verify your email address
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#1C3265]/80">
                    We sent a verification link to <strong className="text-[#101A35]">{email}</strong>.
                    Confirm it to sync your member profile.
                  </p>
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="apple-btn apple-btn-primary mt-4 inline-flex h-10 items-center justify-center px-6 text-xs font-semibold"
                  >
                    <span className="relative z-10">Done</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-700">
                      {error}
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="h-11 w-full rounded-full border border-[#B7C9ED]/85 bg-white/80 pl-10 pr-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-full border border-[#B7C9ED]/85 bg-white/80 pl-10 pr-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="h-11 w-full rounded-full border border-[#B7C9ED]/85 bg-white/80 pl-10 pr-10 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6385CB] hover:text-[#101A35]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || googleLoading}
                    className="apple-btn apple-btn-primary mt-2 flex h-11 w-full items-center justify-center text-xs font-semibold disabled:opacity-60"
                  >
                    <span className="relative z-10">
                      {submitting
                        ? authMode === 'signup'
                          ? 'Creating Account...'
                          : 'Signing In...'
                        : authMode === 'signup'
                          ? 'Create Account'
                          : 'Sign In'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
