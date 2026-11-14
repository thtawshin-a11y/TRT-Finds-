import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  Heart,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { ScrollReveal } from '../components/ScrollEffects';
import { PROFILE_AVATAR_ACCENTS, useProfile } from '../context/ProfileContext';
import { useStore } from '../context/StoreContext';
import { formatTaka } from '../lib/format';

async function resizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas compression unavailable.'));
          return;
        }
        // Center-crop square cover
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const {
    profiles,
    activeProfile,
    isActiveProfileLocked,
    pendingUnlock,
    clearPendingUnlock,
    switchProfile,
    createProfile,
    updateActiveProfile,
    deleteProfile,
    setSecurityPin,
    removeSecurityPin,
    lockActiveProfile,
    unlockProfileWithPin,
    exportBackupKey,
    restoreFromCodeOrKey,
  } = useProfile();
  const { categories, wishlist, showToast } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const unlockSectionRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState(activeProfile.name);
  const [phone, setPhone] = useState(activeProfile.phone);
  const [city, setCity] = useState(activeProfile.city);
  const [deliveryNote, setDeliveryNote] = useState(activeProfile.deliveryNote);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(activeProfile.avatarUrl ?? null);
  const [avatarAccent, setAvatarAccent] = useState(activeProfile.avatarAccent);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(
    activeProfile.favoriteCategories
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');

  const [restoreInput, setRestoreInput] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [copiedType, setCopiedType] = useState<'code' | 'key' | 'link' | null>(null);

  // PIN Security states
  const [unlockPinInput, setUnlockPinInput] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [pinPanelMode, setPinPanelMode] = useState<'idle' | 'set' | 'remove'>('idle');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    setName(activeProfile.name);
    setPhone(activeProfile.phone);
    setCity(activeProfile.city);
    setDeliveryNote(activeProfile.deliveryNote);
    setAvatarUrl(activeProfile.avatarUrl ?? null);
    setAvatarAccent(activeProfile.avatarAccent);
    setFavoriteCategories(activeProfile.favoriteCategories);
    setPinPanelMode('idle');
    setCurrentPinInput('');
    setNewPinInput('');
    setPinError(null);
  }, [activeProfile]);

  useEffect(() => {
    if (pendingUnlock) {
      setUnlockPinInput('');
      setUnlockError(null);
      unlockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [pendingUnlock]);

  const initials =
    (name.trim() || activeProfile.name || 'T')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'T';

  const handleToggleFavCategory = (catId: string) => {
    setFavoriteCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressed = await resizeAvatarImage(file);
      setAvatarUrl(compressed);
      await updateActiveProfile({ avatarUrl: compressed });
      showToast('Profile photo updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    await updateActiveProfile({ avatarUrl: null });
    showToast('Profile photo removed.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateActiveProfile({
        name: name.trim() || 'TRT Shopper',
        phone: phone.trim(),
        city: city.trim(),
        deliveryNote: deliveryNote.trim(),
        avatarUrl,
        avatarAccent,
        favoriteCategories,
      });
      showToast('Profile saved securely.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Enter a profile name first.');
      return;
    }
    const created = createProfile({
      name: newName.trim(),
      city: newCity.trim(),
      avatarAccent:
        PROFILE_AVATAR_ACCENTS[profiles.length % PROFILE_AVATAR_ACCENTS.length]?.hex || '#1C3265',
    });
    setNewName('');
    setNewCity('');
    setNewProfileOpen(false);
    showToast(`Created & switched to "${created.name}".`);
  };

  const handleCopy = async (kind: 'code' | 'key' | 'link') => {
    const value =
      kind === 'code'
        ? activeProfile.profileCode
        : kind === 'key'
          ? exportBackupKey(activeProfile)
          : `${window.location.origin}/profile?profile_key=${encodeURIComponent(
              exportBackupKey(activeProfile)
            )}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(kind);
      showToast(
        kind === 'code'
          ? `Copied Profile Code: ${activeProfile.profileCode}`
          : kind === 'key'
            ? 'Copied Portable Profile Key!'
            : 'Copied Shareable Profile Link!'
      );
      window.setTimeout(() => setCopiedType(null), 2200);
    } catch {
      showToast('Copy not supported in this browser—select manually.');
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreInput.trim()) return;
    setRestoring(true);
    try {
      const result = await restoreFromCodeOrKey(restoreInput);
      showToast(result.message);
      if (result.ok) {
        setRestoreInput('');
      }
      if (result.needsPin) {
        setUnlockError(null);
        setUnlockPinInput('');
        unlockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlockBusy(true);
    try {
      const res = await unlockProfileWithPin(unlockPinInput);
      if (!res.ok) {
        setUnlockError(res.message);
        return;
      }
      setUnlockPinInput('');
      setRestoreInput('');
      showToast(res.message);
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinBusy(true);
    try {
      const res = await setSecurityPin(
        newPinInput,
        activeProfile.hasPin ? currentPinInput : undefined
      );
      if (!res.ok) {
        setPinError(res.message);
        return;
      }
      setCurrentPinInput('');
      setNewPinInput('');
      setPinPanelMode('idle');
      showToast(res.message);
    } finally {
      setPinBusy(false);
    }
  };

  const handleRemovePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinBusy(true);
    try {
      const res = await removeSecurityPin(currentPinInput);
      if (!res.ok) {
        setPinError(res.message);
        return;
      }
      setCurrentPinInput('');
      setPinPanelMode('idle');
      showToast(res.message);
    } finally {
      setPinBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hidden file input for profile photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        onChange={(e) => void handleAvatarFileChange(e)}
        className="hidden"
      />

      {/* Header Banner */}
      <ScrollReveal className="flex flex-col justify-between gap-4 pb-8 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9ED]/80 bg-[#F1F4FC] px-3.5 py-1 font-accent text-[11px] font-semibold tracking-[0.16em] text-[#1C3265] uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[#3156A5]" />
            Code + PIN Protected · No Login Needed
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#101A35] sm:text-4xl">
            Customer Profile
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#1C3265]">
            Add your profile photo, protect private details with an optional 4–6 digit Security PIN,
            and return anytime using your Profile Code or Portable Backup Key.
          </p>
        </div>

        <Link
          to="/shop"
          className="apple-btn apple-btn-glass inline-flex h-11 items-center gap-2 self-start px-5 text-xs font-semibold sm:self-auto"
        >
          <span className="relative z-10">Explore Shop</span>
          <ArrowRight className="relative z-10 h-3.5 w-3.5" />
        </Link>
      </ScrollReveal>

      {/* Pending External/Server/Key PIN Challenge */}
      {pendingUnlock && (
        <div
          ref={unlockSectionRef}
          className="liquid-glass-card mb-7 rounded-3xl border-2 border-[#3156A5]/60 p-6 shadow-[0_20px_50px_-16px_rgba(16,26,53,0.2)] sm:p-7"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {pendingUnlock.avatarUrl ? (
                <img
                  src={pendingUnlock.avatarUrl}
                  alt={pendingUnlock.name}
                  className="h-14 w-14 shrink-0 rounded-2xl border border-[#B7C9ED] object-cover shadow-sm"
                />
              ) : (
                <div
                  style={{ backgroundColor: pendingUnlock.avatarAccent || '#1C3265' }}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-extrabold text-white shadow-sm"
                >
                  {(pendingUnlock.name || 'T').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1C3265] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                  <Lock className="h-3 w-3" />
                  <span>PIN Required to Open</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-[#101A35]">
                  {pendingUnlock.name}
                </h2>
                <p className="font-accent text-xs font-semibold text-[#3156A5]">
                  {pendingUnlock.profileCode}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => void handleUnlockSubmit(e)} className="flex flex-wrap items-center gap-2.5">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                required
                value={unlockPinInput}
                onChange={(e) => setUnlockPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 4–6 digit PIN"
                className="h-11 w-44 rounded-full border border-[#B7C9ED] bg-white px-4 text-center font-accent text-sm font-bold tracking-[0.25em] text-[#101A35] placeholder:tracking-normal placeholder:font-normal focus:border-[#3156A5] focus:outline-none"
              />
              <button
                type="submit"
                disabled={unlockBusy || unlockPinInput.length < 4}
                className="apple-btn apple-btn-primary inline-flex h-11 items-center gap-1.5 px-5 text-xs font-semibold disabled:opacity-50"
              >
                <Unlock className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{unlockBusy ? 'Verifying...' : 'Unlock & Load'}</span>
              </button>
              <button
                type="button"
                onClick={clearPendingUnlock}
                className="apple-btn apple-btn-glass inline-flex h-11 w-11 items-center justify-center text-[#101A35]"
                aria-label="Cancel unlock"
              >
                <X className="relative z-10 h-4 w-4" />
              </button>
            </form>
          </div>
          {unlockError && (
            <p className="mt-3 text-xs font-semibold text-red-600">{unlockError}</p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Active Profile Editor + Photo + Security */}
        <div className="space-y-6 lg:col-span-7">
          <ScrollReveal className="liquid-glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B7C9ED]/50 pb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={activeProfile.name}
                      className="h-20 w-20 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: avatarAccent }}
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-extrabold text-white shadow-md"
                    >
                      {initials}
                    </div>
                  )}

                  {!isActiveProfileLocked && (
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
                      className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1C3265] text-white shadow-md transition-transform hover:scale-105 hover:bg-[#101A35]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-[#101A35]">
                      {activeProfile.name}
                    </h2>
                    {activeProfile.hasPin && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isActiveProfileLocked
                            ? 'bg-[#101A35] text-white'
                            : 'border border-[#B7C9ED] bg-[#F1F4FC] text-[#1C3265]'
                        }`}
                      >
                        {isActiveProfileLocked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3 text-[#3156A5]" />
                        )}
                        <span>{isActiveProfileLocked ? 'Locked' : 'PIN Active'}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#B7C9ED] bg-white px-3 py-0.5 font-accent text-[11px] font-bold tracking-wider text-[#1C3265]">
                      {activeProfile.profileCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy('code')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#3156A5] hover:text-[#101A35]"
                    >
                      {copiedType === 'code' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedType === 'code' ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {!isActiveProfileLocked && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-3 py-1 text-[11px] font-semibold text-[#101A35] transition-colors hover:border-[#3156A5]"
                      >
                        <Camera className="h-3 w-3 text-[#3156A5]" />
                        <span>
                          {uploadingAvatar
                            ? 'Processing...'
                            : avatarUrl
                              ? 'Change Photo'
                              : 'Upload Photo'}
                        </span>
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveAvatar()}
                          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold text-[#6385CB] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#B7C9ED]/70 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101A35]">
                <Heart className="h-3.5 w-3.5 fill-[#1C3265] text-[#1C3265]" />
                <span>
                  {isActiveProfileLocked
                    ? 'Private'
                    : `${wishlist.length} ${wishlist.length === 1 ? 'Saved Find' : 'Saved Finds'}`}
                </span>
              </div>
            </div>

            {isActiveProfileLocked ? (
              <div className="mt-6 rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC]/70 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101A35] text-white">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-[#101A35]">
                  This Profile Is PIN-Locked
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#1C3265]">
                  Phone number, delivery notes, and saved wishlist items are hidden until you unlock
                  with your 4–6 digit Security PIN.
                </p>

                <form
                  onSubmit={(e) => void handleUnlockSubmit(e)}
                  className="mx-auto mt-5 flex max-w-xs flex-col gap-2.5 sm:flex-row"
                >
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={unlockPinInput}
                    onChange={(e) => setUnlockPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter PIN"
                    className="h-11 flex-1 rounded-full border border-[#B7C9ED] bg-white px-4 text-center font-accent text-sm font-bold tracking-[0.25em] text-[#101A35] placeholder:tracking-normal placeholder:font-normal focus:border-[#3156A5] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={unlockBusy || unlockPinInput.length < 4}
                    className="apple-btn apple-btn-primary inline-flex h-11 items-center justify-center gap-1.5 px-5 text-xs font-semibold disabled:opacity-50"
                  >
                    <Unlock className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{unlockBusy ? 'Unlocking...' : 'Unlock'}</span>
                  </button>
                </form>
                {unlockError && (
                  <p className="mt-2.5 text-xs font-semibold text-red-600">{unlockError}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                {/* Avatar Accent Picker */}
                <div>
                  <span className="block text-xs font-semibold text-[#101A35]">Profile Color</span>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {PROFILE_AVATAR_ACCENTS.map((accent) => {
                      const selected = avatarAccent === accent.hex;
                      return (
                        <button
                          key={accent.hex}
                          type="button"
                          onClick={() => setAvatarAccent(accent.hex)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            selected
                              ? 'border-[#101A35] bg-[#101A35] text-white'
                              : 'border-[#B7C9ED] bg-white text-[#101A35] hover:border-[#3156A5]'
                          }`}
                        >
                          <span
                            style={{ backgroundColor: accent.hex }}
                            className="h-3 w-3 rounded-full border border-white/60"
                          />
                          <span>{accent.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Your Name / Client Label
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tawshin"
                      className="h-11 w-full rounded-2xl border border-[#B7C9ED] bg-white px-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                      Phone / WhatsApp{' '}
                      <span className="font-normal text-[#6385CB]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 17XX-XXXXXX"
                        className="h-11 w-full rounded-2xl border border-[#B7C9ED] bg-white pl-10 pr-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                    City / Delivery Area{' '}
                    <span className="font-normal text-[#6385CB]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6385CB]" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Dhaka, Chattogram, Sylhet..."
                      className="h-11 w-full rounded-2xl border border-[#B7C9ED] bg-white pl-10 pr-4 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                    Delivery Address or Shopping Preferences{' '}
                    <span className="font-normal text-[#6385CB]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Preferred sizes, address note, or gift preferences..."
                    className="w-full rounded-2xl border border-[#B7C9ED] bg-white px-4 py-3 text-sm text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
                  />
                </div>

                {categories.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-[#101A35]">
                      Favorite Categories
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const active = favoriteCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleToggleFavCategory(cat.id)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[#1C3265] bg-[#1C3265] text-white'
                                : 'border-[#B7C9ED] bg-white text-[#1C3265] hover:border-[#3156A5]'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="apple-btn apple-btn-primary inline-flex h-11 items-center justify-center gap-2 px-7 text-xs font-semibold disabled:opacity-60"
                >
                  <UserCheck className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </form>
            )}
          </ScrollReveal>

          {/* Profile Security & PIN Lock Card */}
          {!isActiveProfileLocked && (
            <ScrollReveal className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1F4FC] text-[#1C3265]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#101A35]">
                      Profile Security &amp; Returning Access
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#1C3265]">
                      {activeProfile.hasPin
                        ? 'Your profile is protected by a 4–6 digit Security PIN. Returning visitors need your PIN to view private info.'
                        : 'Add an optional 4–6 digit Security PIN so only you can unlock this profile when returning later.'}
                    </p>
                  </div>
                </div>

                {activeProfile.hasPin && (
                  <button
                    type="button"
                    onClick={() => {
                      lockActiveProfile();
                      showToast(`Locked "${activeProfile.name}".`);
                    }}
                    className="apple-btn apple-btn-glass inline-flex h-9 shrink-0 items-center gap-1.5 px-4 text-xs font-semibold"
                  >
                    <Lock className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">Lock Now</span>
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!activeProfile.hasPin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPinPanelMode((m) => (m === 'set' ? 'idle' : 'set'));
                      setPinError(null);
                    }}
                    className="apple-btn apple-btn-primary inline-flex h-9 items-center gap-1.5 px-4 text-xs font-semibold"
                  >
                    <KeyRound className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">
                      {pinPanelMode === 'set' ? 'Close' : 'Set Security PIN'}
                    </span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPinPanelMode((m) => (m === 'set' ? 'idle' : 'set'));
                        setPinError(null);
                      }}
                      className="apple-btn apple-btn-glass inline-flex h-9 items-center gap-1.5 px-4 text-xs font-semibold"
                    >
                      <KeyRound className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10">Change PIN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinPanelMode((m) => (m === 'remove' ? 'idle' : 'remove'));
                        setPinError(null);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#B7C9ED] px-4 text-xs font-semibold text-[#6385CB] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Remove PIN</span>
                    </button>
                  </>
                )}
              </div>

              {pinPanelMode === 'set' && (
                <form
                  onSubmit={(e) => void handleSetPinSubmit(e)}
                  className="mt-4 space-y-3 rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC]/60 p-4"
                >
                  {activeProfile.hasPin && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                        Current Security PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={currentPinInput}
                        onChange={(e) =>
                          setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="Current 4–6 digit PIN"
                        className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-white px-3.5 font-accent text-xs tracking-widest text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                      {activeProfile.hasPin ? 'New Security PIN (4–6 digits)' : 'Security PIN (4–6 digits)'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={newPinInput}
                      onChange={(e) =>
                        setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="e.g. 2480"
                      className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-white px-3.5 font-accent text-xs tracking-widest text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                  {pinError && <p className="text-xs font-semibold text-red-600">{pinError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={pinBusy || newPinInput.length < 4}
                      className="apple-btn apple-btn-primary h-9 px-5 text-xs font-semibold disabled:opacity-50"
                    >
                      <span className="relative z-10">
                        {pinBusy ? 'Saving...' : 'Enable Security PIN'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinPanelMode('idle')}
                      className="apple-btn apple-btn-glass h-9 px-4 text-xs font-semibold"
                    >
                      <span className="relative z-10">Cancel</span>
                    </button>
                  </div>
                </form>
              )}

              {pinPanelMode === 'remove' && (
                <form
                  onSubmit={(e) => void handleRemovePinSubmit(e)}
                  className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4"
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#101A35]">
                      Confirm Current PIN to Remove Protection
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={currentPinInput}
                      onChange={(e) =>
                        setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="Enter current PIN"
                      className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-white px-3.5 font-accent text-xs tracking-widest text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                  </div>
                  {pinError && <p className="text-xs font-semibold text-red-600">{pinError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={pinBusy || currentPinInput.length < 4}
                      className="h-9 rounded-full bg-red-600 px-5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {pinBusy ? 'Removing...' : 'Remove PIN'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinPanelMode('idle')}
                      className="h-9 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-semibold text-[#101A35]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </ScrollReveal>
          )}

          {/* Saved Finds Preview for Active Profile */}
          <ScrollReveal className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#101A35]">
                  {activeProfile.name}&apos;s Saved Finds
                </h3>
                <p className="text-xs text-[#1C3265]">
                  Each customer profile keeps its own separate wishlist.
                </p>
              </div>
              <Link
                to="/wishlist"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3156A5] hover:text-[#101A35]"
              >
                <span>Open Wishlist</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isActiveProfileLocked ? (
              <div className="mt-4 rounded-2xl border border-[#B7C9ED]/50 bg-[#F1F4FC]/60 p-5 text-center">
                <p className="text-xs font-medium text-[#1C3265]">
                  Unlock this profile with its Security PIN to view saved items.
                </p>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#B7C9ED]/50 bg-[#F1F4FC]/60 p-5 text-center">
                <p className="text-xs font-medium text-[#1C3265]">
                  No items saved under this profile yet.
                </p>
                <Link
                  to="/shop"
                  className="apple-btn apple-btn-primary mt-3 inline-flex h-9 items-center px-5 text-xs font-semibold"
                >
                  <span className="relative z-10">Browse Finds</span>
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {wishlist.slice(0, 4).map((item) => (
                  <Link
                    key={item.productId}
                    to={`/product/${item.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-[#B7C9ED]/60 bg-[#F1F4FC]/45 p-2.5 transition-colors hover:border-[#3156A5] hover:bg-white"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Heart className="h-4 w-4 text-[#6385CB]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xs font-bold text-[#101A35]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-accent tabular-nums text-xs font-bold text-[#1C3265]">
                        {formatTaka(item.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>

        {/* Right: Multi-Profile Switcher + Returning Access / Portable Backup */}
        <div className="space-y-6 lg:col-span-5">
          {/* Switch / Add Separate Client Profiles */}
          <ScrollReveal className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#101A35]">
                  Client &amp; Customer Profiles
                </h2>
                <p className="text-xs text-[#1C3265]">
                  Create or switch profiles for different shoppers or clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewProfileOpen((v) => !v)}
                className="apple-btn apple-btn-glass inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-semibold"
              >
                <Plus className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">New</span>
              </button>
            </div>

            {newProfileOpen && (
              <form
                onSubmit={handleCreateNewProfile}
                className="mt-4 space-y-3 rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC]/60 p-4"
              >
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#101A35]">
                  <UserPlus className="h-3.5 w-3.5 text-[#3156A5]" />
                  <span>Add Separate Customer Profile</span>
                </p>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Profile name (e.g. Gift List, Client Rahat)"
                  className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-white px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                />
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="City / Area (optional)"
                  className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-white px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="apple-btn apple-btn-primary h-9 flex-1 text-xs font-semibold"
                  >
                    <span className="relative z-10">Create &amp; Switch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProfileOpen(false)}
                    className="apple-btn apple-btn-glass h-9 px-4 text-xs font-semibold"
                  >
                    <span className="relative z-10">Cancel</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 space-y-2.5">
              {profiles.map((prof) => {
                const isActive = prof.id === activeProfile.id;
                const profInitials = (prof.name || 'T').slice(0, 2).toUpperCase();
                return (
                  <div
                    key={prof.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                      isActive
                        ? 'border-[#1C3265] bg-[#F1F4FC]'
                        : 'border-[#B7C9ED]/60 bg-white hover:border-[#3156A5]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        switchProfile(prof.id);
                        showToast(`Switched to "${prof.name}".`);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {prof.avatarUrl ? (
                        <img
                          src={prof.avatarUrl}
                          alt={prof.name}
                          className="h-10 w-10 shrink-0 rounded-xl border border-white object-cover shadow-xs"
                        />
                      ) : (
                        <span
                          style={{ backgroundColor: prof.avatarAccent || '#1C3265' }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold text-white"
                        >
                          {profInitials}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-display text-xs font-bold text-[#101A35]">
                          <span className="truncate">{prof.name}</span>
                          {prof.hasPin && <Lock className="h-3 w-3 shrink-0 text-[#3156A5]" />}
                        </p>
                        <p className="truncate font-accent text-[10px] font-semibold text-[#3156A5]">
                          {prof.profileCode} · {prof.wishlist.length} saved
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {isActive ? (
                        <span className="rounded-full bg-[#1C3265] px-2.5 py-1 text-[10px] font-bold text-white">
                          Active
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              switchProfile(prof.id);
                              showToast(`Switched to "${prof.name}".`);
                            }}
                            className="rounded-full border border-[#B7C9ED] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#101A35] hover:border-[#3156A5]"
                          >
                            Use
                          </button>
                          {profiles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                deleteProfile(prof.id);
                                showToast(`Removed "${prof.name}".`);
                              }}
                              aria-label={`Delete ${prof.name}`}
                              className="rounded-full p-1.5 text-[#6385CB] hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Carry Profile to Another Phone / Returning Access */}
          <ScrollReveal className="rounded-3xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#101A35]">
              <Share2 className="h-4 w-4 text-[#3156A5]" />
              <span>Returning Customer &amp; Backup</span>
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#1C3265]">
              Save your <strong>Profile Code</strong> or <strong>Portable Key</strong>. Next time
              you visit—even from another phone—paste it below (plus your PIN if enabled) to load
              everything back.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopy('link')}
                className="apple-btn apple-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-3 text-xs font-semibold"
              >
                {copiedType === 'link' ? (
                  <Check className="relative z-10 h-3.5 w-3.5" />
                ) : (
                  <Link2 className="relative z-10 h-3.5 w-3.5" />
                )}
                <span className="relative z-10">
                  {copiedType === 'link' ? 'Link Copied!' : 'Copy Profile Link'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopy('key')}
                className="apple-btn apple-btn-glass inline-flex h-10 items-center justify-center gap-1.5 px-3 text-xs font-semibold"
              >
                {copiedType === 'key' ? (
                  <Check className="relative z-10 h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="relative z-10 h-3.5 w-3.5" />
                )}
                <span className="relative z-10">
                  {copiedType === 'key' ? 'Key Copied!' : 'Copy Backup Key'}
                </span>
              </button>
            </div>

            <form onSubmit={handleRestore} className="mt-5 border-t border-[#B7C9ED]/60 pt-4">
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Load Saved Profile (Profile Code, Link, or Backup Key)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value)}
                  placeholder="TRT-XXXX-XXXX or TRTP1:..."
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[#B7C9ED] bg-white px-3 text-xs text-[#101A35] placeholder:text-[#6385CB]/75 focus:border-[#3156A5] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={restoring || !restoreInput.trim()}
                  className="apple-btn apple-btn-primary inline-flex h-10 shrink-0 items-center gap-1.5 px-4 text-xs font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`relative z-10 h-3.5 w-3.5 ${restoring ? 'animate-spin' : ''}`} />
                  <span className="relative z-10">Load</span>
                </button>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
