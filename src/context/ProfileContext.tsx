import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackAnalyticsEvent } from '../lib/apiClient';
import type { CustomerProfile, WishlistItem } from '../types';

const PROFILES_STORAGE_KEY = 'trt_finds_customer_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'trt_finds_active_profile_id_v1';
const LOCKED_PROFILES_KEY = 'trt_finds_locked_profiles_v1';
const LEGACY_WISHLIST_KEY = 'trt_finds_wishlist_v1';

export const PROFILE_AVATAR_ACCENTS = [
  { label: 'Midnight Navy', hex: '#101A35' },
  { label: 'Deep Cobalt', hex: '#1C3265' },
  { label: 'Royal Cobalt', hex: '#3156A5' },
  { label: 'Soft Cobalt', hex: '#6385CB' },
];

export interface PendingPinUnlock {
  source: 'local' | 'server' | 'key';
  profileCode: string;
  name: string;
  avatarUrl?: string | null;
  avatarAccent: string;
  candidate?: Partial<CustomerProfile>;
}

interface ProfileContextValue {
  profiles: CustomerProfile[];
  activeProfile: CustomerProfile;
  isActiveProfileLocked: boolean;
  pendingUnlock: PendingPinUnlock | null;
  clearPendingUnlock: () => void;
  switchProfile: (profileId: string) => void;
  createProfile: (input: {
    name: string;
    phone?: string;
    city?: string;
    deliveryNote?: string;
    avatarUrl?: string | null;
    avatarAccent?: string;
    favoriteCategories?: string[];
  }) => CustomerProfile;
  updateActiveProfile: (
    patch: Partial<
      Pick<
        CustomerProfile,
        'name' | 'phone' | 'city' | 'deliveryNote' | 'avatarUrl' | 'avatarAccent' | 'favoriteCategories'
      >
    >
  ) => Promise<void>;
  deleteProfile: (profileId: string) => void;
  updateActiveWishlist: (updater: (prev: WishlistItem[]) => WishlistItem[]) => void;
  recordViewedSlug: (slug: string) => void;
  setSecurityPin: (pin: string, currentPin?: string) => Promise<{ ok: boolean; message: string }>;
  removeSecurityPin: (currentPin: string) => Promise<{ ok: boolean; message: string }>;
  lockActiveProfile: () => void;
  unlockProfileWithPin: (pin: string) => Promise<{ ok: boolean; message: string }>;
  exportBackupKey: (profile?: CustomerProfile) => string;
  restoreFromCodeOrKey: (
    codeOrKey: string
  ) => Promise<{ ok: boolean; needsPin?: boolean; message: string }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function generateProfileCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TRT-${block(4)}-${block(4)}`;
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const input = `${salt}:${pin.trim()}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readLegacyWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is WishlistItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as WishlistItem).productId === 'string' &&
        typeof (item as WishlistItem).title === 'string' &&
        typeof (item as WishlistItem).slug === 'string' &&
        typeof (item as WishlistItem).price === 'number'
    );
  } catch {
    return [];
  }
}

function createDefaultProfile(initialWishlist: WishlistItem[] = []): CustomerProfile {
  const now = Date.now();
  return {
    id: `prof_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    profileCode: generateProfileCode(),
    name: 'Personal Profile',
    phone: '',
    city: 'Dhaka',
    deliveryNote: '',
    avatarUrl: null,
    avatarAccent: '#1C3265',
    favoriteCategories: [],
    wishlist: initialWishlist,
    recentlyViewedSlugs: [],
    hasPin: false,
    trackedCreation: false,
    createdAt: now,
    updatedAt: now,
  };
}

function sanitizeProfile(raw: Partial<CustomerProfile>): CustomerProfile {
  const now = Date.now();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `prof_${now.toString(36)}`,
    profileCode:
      typeof raw.profileCode === 'string' && raw.profileCode.trim()
        ? raw.profileCode.trim().toUpperCase()
        : generateProfileCode(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : 'TRT Shopper',
    phone: typeof raw.phone === 'string' ? raw.phone.slice(0, 40) : '',
    city: typeof raw.city === 'string' ? raw.city.slice(0, 80) : '',
    deliveryNote: typeof raw.deliveryNote === 'string' ? raw.deliveryNote.slice(0, 300) : '',
    avatarUrl: typeof raw.avatarUrl === 'string' && raw.avatarUrl ? raw.avatarUrl : null,
    avatarAccent: typeof raw.avatarAccent === 'string' && raw.avatarAccent ? raw.avatarAccent : '#1C3265',
    favoriteCategories: Array.isArray(raw.favoriteCategories)
      ? raw.favoriteCategories.filter((c): c is string => typeof c === 'string').slice(0, 20)
      : [],
    wishlist: Array.isArray(raw.wishlist) ? raw.wishlist : [],
    recentlyViewedSlugs: Array.isArray(raw.recentlyViewedSlugs)
      ? raw.recentlyViewedSlugs.filter((s): s is string => typeof s === 'string').slice(0, 20)
      : [],
    hasPin: Boolean(raw.hasPin && raw.pinHash),
    pinSalt: raw.hasPin && typeof raw.pinSalt === 'string' ? raw.pinSalt : undefined,
    pinHash: raw.hasPin && typeof raw.pinHash === 'string' ? raw.pinHash : undefined,
    trackedCreation: Boolean(raw.trackedCreation),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

function readStoredProfiles(): { profiles: CustomerProfile[]; activeId: string } {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.map((p) => sanitizeProfile(p as Partial<CustomerProfile>));
        const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
        const active = sanitized.find((p) => p.id === savedActiveId) || sanitized[0];
        return { profiles: sanitized, activeId: active.id };
      }
    }
  } catch {
    // Fall back to fresh default profile
  }

  const starter = createDefaultProfile(readLegacyWishlist());
  return { profiles: [starter], activeId: starter.id };
}

function readLockedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCKED_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function persistProfiles(profiles: CustomerProfile[], activeId: string, lockedIds: string[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, activeId);
    localStorage.setItem(LOCKED_PROFILES_KEY, JSON.stringify(lockedIds));
  } catch {
    // Ignore quota errors
  }
}

function encodePortableKey(profile: CustomerProfile): string {
  // Omit bulky inline data-URL avatar if very large so URLs remain shareable, keep URLs or compact avatars <= 18KB
  const compactAvatar =
    profile.avatarUrl && profile.avatarUrl.length <= 18000 ? profile.avatarUrl : undefined;
  const payload = {
    v: 2,
    id: profile.id,
    c: profile.profileCode,
    n: profile.name,
    p: profile.phone,
    ct: profile.city,
    dn: profile.deliveryNote,
    av: compactAvatar,
    ac: profile.avatarAccent,
    fc: profile.favoriteCategories,
    w: profile.wishlist.slice(0, 50),
    hp: Boolean(profile.hasPin),
    ps: profile.hasPin ? profile.pinSalt : undefined,
    ph: profile.hasPin ? profile.pinHash : undefined,
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64Url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `TRTP1:${base64Url}`;
}

function decodePortableKey(key: string): Partial<CustomerProfile> | null {
  try {
    const trimmed = key.trim();
    if (!trimmed.startsWith('TRTP1:')) return null;
    const base64Url = trimmed.slice(6);
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as {
      id?: string;
      c?: string;
      n?: string;
      p?: string;
      ct?: string;
      dn?: string;
      av?: string | null;
      ac?: string;
      fc?: string[];
      w?: WishlistItem[];
      hp?: boolean;
      ps?: string;
      ph?: string;
    };
    return {
      id: parsed.id,
      profileCode: parsed.c,
      name: parsed.n,
      phone: parsed.p,
      city: parsed.ct,
      deliveryNote: parsed.dn,
      avatarUrl: parsed.av ?? null,
      avatarAccent: parsed.ac,
      favoriteCategories: parsed.fc,
      wishlist: parsed.w,
      hasPin: Boolean(parsed.hp),
      pinSalt: parsed.ps,
      pinHash: parsed.ph,
    };
  } catch {
    return null;
  }
}

async function trySyncProfileToServer(
  profile: CustomerProfile,
  authorizedPinHash?: string
): Promise<void> {
  try {
    const res = await fetch('/api/profiles/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, authorizedPinHash }),
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) return;
  } catch {
    // Static host (Netlify) or offline fallback
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => readStoredProfiles(), []);
  const [profiles, setProfiles] = useState<CustomerProfile[]>(initial.profiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(initial.activeId);
  const [lockedIds, setLockedIds] = useState<string[]>(() => readLockedIds());
  const [pendingUnlock, setPendingUnlock] = useState<PendingPinUnlock | null>(null);

  const rawActiveProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId]
  );

  const isActiveProfileLocked = useMemo(
    () => Boolean(rawActiveProfile.hasPin && lockedIds.includes(rawActiveProfile.id)),
    [rawActiveProfile.hasPin, rawActiveProfile.id, lockedIds]
  );

  // Mask private info & wishlist if the active profile is PIN-locked
  const activeProfile: CustomerProfile = useMemo(() => {
    if (!isActiveProfileLocked) return rawActiveProfile;
    return {
      ...rawActiveProfile,
      phone: '',
      deliveryNote: '',
      wishlist: [],
    };
  }, [rawActiveProfile, isActiveProfileLocked]);

  useEffect(() => {
    persistProfiles(profiles, rawActiveProfile.id, lockedIds);
  }, [profiles, rawActiveProfile.id, lockedIds]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === PROFILES_STORAGE_KEY ||
        e.key === ACTIVE_PROFILE_ID_KEY ||
        e.key === LOCKED_PROFILES_KEY
      ) {
        const next = readStoredProfiles();
        setProfiles(next.profiles);
        setActiveProfileId(next.activeId);
        setLockedIds(readLockedIds());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const clearPendingUnlock = useCallback(() => {
    setPendingUnlock(null);
  }, []);

  const switchProfile = useCallback((profileId: string) => {
    setProfiles((prev) => {
      const target = prev.find((p) => p.id === profileId);
      if (target) {
        setActiveProfileId(target.id);
      }
      return prev;
    });
  }, []);

  const createProfile = useCallback(
    (input: {
      name: string;
      phone?: string;
      city?: string;
      deliveryNote?: string;
      avatarUrl?: string | null;
      avatarAccent?: string;
      favoriteCategories?: string[];
    }): CustomerProfile => {
      const now = Date.now();
      const created = sanitizeProfile({
        id: `prof_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        profileCode: generateProfileCode(),
        name: input.name.trim() || 'Client Profile',
        phone: input.phone || '',
        city: input.city || '',
        deliveryNote: input.deliveryNote || '',
        avatarUrl: input.avatarUrl ?? null,
        avatarAccent: input.avatarAccent || '#1C3265',
        favoriteCategories: input.favoriteCategories || [],
        wishlist: [],
        recentlyViewedSlugs: [],
        trackedCreation: true,
        createdAt: now,
        updatedAt: now,
      });

      setProfiles((prev) => [created, ...prev]);
      setActiveProfileId(created.id);
      void trackAnalyticsEvent({
        type: 'profile_created',
        path: '/profile',
        dedupeSessionKey: `profile_created_${created.id}`,
      });
      void trySyncProfileToServer(created);
      return created;
    },
    []
  );

  const updateActiveProfile = useCallback(
    async (
      patch: Partial<
        Pick<
          CustomerProfile,
          | 'name'
          | 'phone'
          | 'city'
          | 'deliveryNote'
          | 'avatarUrl'
          | 'avatarAccent'
          | 'favoriteCategories'
        >
      >
    ) => {
      if (isActiveProfileLocked) return;

      let updatedSnapshot: CustomerProfile | null = null;
      let shouldTrackCreation = false;

      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== rawActiveProfile.id) return p;
          if (!p.trackedCreation) {
            shouldTrackCreation = true;
          }
          const next = sanitizeProfile({
            ...p,
            ...patch,
            trackedCreation: true,
            updatedAt: Date.now(),
          });
          updatedSnapshot = next;
          return next;
        })
      );

      if (shouldTrackCreation) {
        void trackAnalyticsEvent({
          type: 'profile_created',
          path: '/profile',
          dedupeSessionKey: `profile_created_${rawActiveProfile.id}`,
        });
      }

      if (updatedSnapshot) {
        await trySyncProfileToServer(updatedSnapshot, rawActiveProfile.pinHash);
      }
    },
    [isActiveProfileLocked, rawActiveProfile.id, rawActiveProfile.pinHash]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const remaining = prev.filter((p) => p.id !== profileId);
        if (rawActiveProfile.id === profileId && remaining[0]) {
          setActiveProfileId(remaining[0].id);
        }
        return remaining;
      });
      setLockedIds((prev) => prev.filter((id) => id !== profileId));
    },
    [rawActiveProfile.id]
  );

  const updateActiveWishlist = useCallback(
    (updater: (prev: WishlistItem[]) => WishlistItem[]) => {
      if (isActiveProfileLocked) return;
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== rawActiveProfile.id) return p;
          const nextWishlist = updater(p.wishlist);
          const next = { ...p, wishlist: nextWishlist, updatedAt: Date.now() };
          void trySyncProfileToServer(next, p.pinHash);
          return next;
        })
      );
    },
    [isActiveProfileLocked, rawActiveProfile.id]
  );

  const recordViewedSlug = useCallback(
    (slug: string) => {
      if (!slug || isActiveProfileLocked) return;
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== rawActiveProfile.id) return p;
          const deduped = [slug, ...p.recentlyViewedSlugs.filter((s) => s !== slug)].slice(0, 12);
          return { ...p, recentlyViewedSlugs: deduped };
        })
      );
    },
    [isActiveProfileLocked, rawActiveProfile.id]
  );

  const setSecurityPin = useCallback(
    async (pin: string, currentPin?: string): Promise<{ ok: boolean; message: string }> => {
      const cleanPin = pin.trim();
      if (!/^\d{4,6}$/.test(cleanPin)) {
        return { ok: false, message: 'Security PIN must be 4 to 6 digits.' };
      }

      if (rawActiveProfile.hasPin && rawActiveProfile.pinHash && rawActiveProfile.pinSalt) {
        const currentCheck = await hashPin(currentPin || '', rawActiveProfile.pinSalt);
        if (currentCheck !== rawActiveProfile.pinHash) {
          return { ok: false, message: 'Current Security PIN is incorrect.' };
        }
      }

      const prevPinHash = rawActiveProfile.pinHash;
      const newSalt = generateSalt();
      const newHash = await hashPin(cleanPin, newSalt);

      let snapshot: CustomerProfile | null = null;
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== rawActiveProfile.id) return p;
          const next = sanitizeProfile({
            ...p,
            hasPin: true,
            pinSalt: newSalt,
            pinHash: newHash,
            trackedCreation: true,
            updatedAt: Date.now(),
          });
          snapshot = next;
          return next;
        })
      );
      setLockedIds((prev) => prev.filter((id) => id !== rawActiveProfile.id));

      if (snapshot) {
        await trySyncProfileToServer(snapshot, prevPinHash || newHash);
      }

      return { ok: true, message: 'Profile Security PIN enabled.' };
    },
    [rawActiveProfile.hasPin, rawActiveProfile.pinHash, rawActiveProfile.pinSalt, rawActiveProfile.id]
  );

  const removeSecurityPin = useCallback(
    async (currentPin: string): Promise<{ ok: boolean; message: string }> => {
      if (!rawActiveProfile.hasPin) {
        return { ok: true, message: 'No PIN set.' };
      }
      if (rawActiveProfile.pinHash && rawActiveProfile.pinSalt) {
        const check = await hashPin(currentPin, rawActiveProfile.pinSalt);
        if (check !== rawActiveProfile.pinHash) {
          return { ok: false, message: 'Incorrect Security PIN.' };
        }
      }

      const prevPinHash = rawActiveProfile.pinHash;
      let snapshot: CustomerProfile | null = null;
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== rawActiveProfile.id) return p;
          const next = sanitizeProfile({
            ...p,
            hasPin: false,
            pinSalt: undefined,
            pinHash: undefined,
            updatedAt: Date.now(),
          });
          snapshot = next;
          return next;
        })
      );
      setLockedIds((prev) => prev.filter((id) => id !== rawActiveProfile.id));

      if (snapshot) {
        await trySyncProfileToServer(snapshot, prevPinHash);
      }
      return { ok: true, message: 'Security PIN removed.' };
    },
    [rawActiveProfile.hasPin, rawActiveProfile.pinHash, rawActiveProfile.pinSalt, rawActiveProfile.id]
  );

  const lockActiveProfile = useCallback(() => {
    if (!rawActiveProfile.hasPin) return;
    setLockedIds((prev) =>
      prev.includes(rawActiveProfile.id) ? prev : [...prev, rawActiveProfile.id]
    );
  }, [rawActiveProfile.hasPin, rawActiveProfile.id]);

  const unlockProfileWithPin = useCallback(
    async (pin: string): Promise<{ ok: boolean; message: string }> => {
      const cleanPin = pin.trim();
      if (!cleanPin) return { ok: false, message: 'Enter your Security PIN.' };

      // Case 1: Unlocking an external server/key pending profile
      if (pendingUnlock) {
        if (pendingUnlock.source === 'server') {
          try {
            const res = await fetch('/api/profiles/unlock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: pendingUnlock.profileCode, pin: cleanPin }),
            });
            const data = (await res.json()) as {
              profile?: Partial<CustomerProfile>;
              error?: string;
            };
            if (!res.ok || !data.profile) {
              return { ok: false, message: data.error || 'Incorrect Security PIN.' };
            }
            const restored = sanitizeProfile({ ...data.profile, trackedCreation: true });
            setProfiles((prev) => [
              restored,
              ...prev.filter((p) => p.profileCode !== restored.profileCode),
            ]);
            setActiveProfileId(restored.id);
            setLockedIds((prev) => prev.filter((id) => id !== restored.id));
            setPendingUnlock(null);
            return { ok: true, message: `Unlocked & loaded "${restored.name}".` };
          } catch {
            return { ok: false, message: 'Unable to reach server to verify PIN.' };
          }
        }

        if (pendingUnlock.source === 'key' && pendingUnlock.candidate) {
          const cand = pendingUnlock.candidate;
          if (cand.pinHash && cand.pinSalt) {
            const attempt = await hashPin(cleanPin, cand.pinSalt);
            if (attempt !== cand.pinHash) {
              return { ok: false, message: 'Incorrect Security PIN.' };
            }
          }
          const restored = sanitizeProfile({ ...cand, trackedCreation: true, updatedAt: Date.now() });
          setProfiles((prev) => [
            restored,
            ...prev.filter((p) => p.profileCode !== restored.profileCode && p.id !== restored.id),
          ]);
          setActiveProfileId(restored.id);
          setLockedIds((prev) => prev.filter((id) => id !== restored.id));
          setPendingUnlock(null);
          return { ok: true, message: `Unlocked & restored "${restored.name}".` };
        }
      }

      // Case 2: Unlocking currently active locked local profile
      if (rawActiveProfile.hasPin && rawActiveProfile.pinHash && rawActiveProfile.pinSalt) {
        const attempt = await hashPin(cleanPin, rawActiveProfile.pinSalt);
        if (attempt !== rawActiveProfile.pinHash) {
          return { ok: false, message: 'Incorrect Security PIN.' };
        }
        setLockedIds((prev) => prev.filter((id) => id !== rawActiveProfile.id));
        return { ok: true, message: `Unlocked "${rawActiveProfile.name}".` };
      }

      return { ok: false, message: 'No PIN lock found.' };
    },
    [pendingUnlock, rawActiveProfile.hasPin, rawActiveProfile.pinHash, rawActiveProfile.pinSalt, rawActiveProfile.id, rawActiveProfile.name]
  );

  const exportBackupKey = useCallback(
    (profile?: CustomerProfile) => encodePortableKey(profile || rawActiveProfile),
    [rawActiveProfile]
  );

  const restoreFromCodeOrKey = useCallback(
    async (
      rawInput: string
    ): Promise<{ ok: boolean; needsPin?: boolean; message: string }> => {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        return { ok: false, message: 'Please enter a Profile Code or Backup Key.' };
      }

      // 1. Check portable Backup Key (TRTP1:...) or URL
      let extractedKey = trimmed;
      if (trimmed.includes('profile_key=')) {
        try {
          const url = new URL(trimmed);
          extractedKey = url.searchParams.get('profile_key') || trimmed;
        } catch {
          // Ignore malformed URL wrapper
        }
      }

      if (extractedKey.startsWith('TRTP1:')) {
        const decoded = decodePortableKey(extractedKey);
        if (!decoded) {
          return { ok: false, message: 'Invalid or corrupted Backup Key.' };
        }

        if (decoded.hasPin && decoded.pinHash && decoded.pinSalt) {
          setPendingUnlock({
            source: 'key',
            profileCode: decoded.profileCode || 'TRT-LOCKED',
            name: decoded.name || 'Locked Profile',
            avatarUrl: decoded.avatarUrl ?? null,
            avatarAccent: decoded.avatarAccent || '#1C3265',
            candidate: decoded,
          });
          return {
            ok: false,
            needsPin: true,
            message: `Enter the Security PIN for "${decoded.name || 'this profile'}" to restore.`,
          };
        }

        const restored = sanitizeProfile({
          ...decoded,
          trackedCreation: true,
          updatedAt: Date.now(),
        });
        setProfiles((prev) => {
          const exists = prev.some(
            (p) => p.profileCode === restored.profileCode || p.id === restored.id
          );
          if (exists) {
            return prev.map((p) =>
              p.profileCode === restored.profileCode || p.id === restored.id ? restored : p
            );
          }
          return [restored, ...prev];
        });
        setActiveProfileId(restored.id);
        return { ok: true, message: `Loaded profile "${restored.name}".` };
      }

      // 2. Otherwise treat as Profile Code (TRT-XXXX-XXXX)
      const normalizedCode = trimmed.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const localMatch = profiles.find((p) => p.profileCode === normalizedCode);
      if (localMatch) {
        setActiveProfileId(localMatch.id);
        if (localMatch.hasPin && lockedIds.includes(localMatch.id)) {
          return {
            ok: true,
            needsPin: true,
            message: `Switched to "${localMatch.name}". Enter PIN to unlock.`,
          };
        }
        return { ok: true, message: `Switched to "${localMatch.name}".` };
      }

      try {
        const res = await fetch(`/api/profiles/${encodeURIComponent(normalizedCode)}`);
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && contentType.includes('application/json')) {
          const data = (await res.json()) as {
            locked?: boolean;
            profile?: Partial<CustomerProfile>;
            profilePreview?: {
              profileCode: string;
              name: string;
              avatarUrl?: string | null;
              avatarAccent?: string;
            };
          };
          if (data.locked && data.profilePreview) {
            setPendingUnlock({
              source: 'server',
              profileCode: data.profilePreview.profileCode,
              name: data.profilePreview.name,
              avatarUrl: data.profilePreview.avatarUrl ?? null,
              avatarAccent: data.profilePreview.avatarAccent || '#1C3265',
            });
            return {
              ok: false,
              needsPin: true,
              message: `Profile "${data.profilePreview.name}" is PIN-protected. Enter PIN to open.`,
            };
          }
          if (data.profile) {
            const restored = sanitizeProfile({ ...data.profile, trackedCreation: true });
            setProfiles((prev) => [
              restored,
              ...prev.filter((p) => p.profileCode !== restored.profileCode),
            ]);
            setActiveProfileId(restored.id);
            return { ok: true, message: `Synced profile "${restored.name}".` };
          }
        }
      } catch {
        // Ignore network/static host errors
      }

      return {
        ok: false,
        message:
          'Profile Code not found on this device. On static hosting, paste your Portable Backup Key (TRTP1:...) or shareable link to move profiles between devices.',
      };
    },
    [profiles, lockedIds]
  );

  // Auto-import portable profile from URL ?profile_key=TRTP1:...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const key = params.get('profile_key');
    if (key && key.startsWith('TRTP1:')) {
      void restoreFromCodeOrKey(key).then((result) => {
        if (result.ok || result.needsPin) {
          params.delete('profile_key');
          const nextSearch = params.toString();
          const cleanUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
          window.history.replaceState({}, '', cleanUrl);
        }
      });
    }
  }, [restoreFromCodeOrKey]);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        isActiveProfileLocked,
        pendingUnlock,
        clearPendingUnlock,
        switchProfile,
        createProfile,
        updateActiveProfile,
        deleteProfile,
        updateActiveWishlist,
        recordViewedSlug,
        setSecurityPin,
        removeSecurityPin,
        lockActiveProfile,
        unlockProfileWithPin,
        exportBackupKey,
        restoreFromCodeOrKey,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
