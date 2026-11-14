import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

export type AuthModalMode = 'signup' | 'signin';

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  authModalOpen: boolean;
  authMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: AuthModalMode) => void;
  continueWithGoogle: () => Promise<void>;
  signUpWithEmail: (params: { name: string; email: string; password: string }) => Promise<{
    needsVerification: boolean;
  }>;
  signInWithEmail: (params: { email: string; password: string }) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncVerifiedUserProfile(user: User): Promise<void> {
  // Firestore rules strictly mandate request.auth.token.email_verified == true
  if (!user.emailVerified) return;

  const displayName = (user.displayName || user.email?.split('@')[0] || 'Member').slice(0, 100);
  const photoURL = user.photoURL ? user.photoURL.slice(0, 1000) : null;
  const userDocRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userDocRef,
        {
          displayName,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  if (user.email) {
    const privateRef = doc(db, 'users', user.uid, 'private', 'info');
    try {
      await setDoc(
        privateRef,
        {
          uid: user.uid,
          email: user.email.slice(0, 200),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/info`);
    }
  }
}

function formatAuthError(err: unknown): Error {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: string }).code);
    switch (code) {
      case 'auth/popup-closed-by-user':
        return new Error('Google sign-in popup was closed before completing.');
      case 'auth/popup-blocked':
        return new Error('Popup was blocked by your browser. Please allow popups for this site.');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists. Try signing in instead.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters.');
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return new Error('Invalid email or password.');
      case 'auth/operation-not-allowed':
        return new Error(
          'Email/Password sign-in is not yet enabled in Firebase Console → Authentication → Sign-in method. Use Continue with Google or enable Email/Password.'
        );
      default:
        break;
    }
  }
  return err instanceof Error ? err : new Error('Authentication failed. Please try again.');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>('signup');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser?.emailVerified) {
        void syncVerifiedUserProfile(nextUser).catch(() => {
          // Non-blocking background sync
        });
      }
    });
    return () => unsub();
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const continueWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await syncVerifiedUserProfile(cred.user).catch(() => {});
      }
      setAuthModalOpen(false);
    } catch (err) {
      throw formatAuthError(err);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
        }
        let needsVerification = false;
        if (!cred.user.emailVerified) {
          needsVerification = true;
          await sendEmailVerification(cred.user).catch(() => {});
        } else {
          await syncVerifiedUserProfile(cred.user).catch(() => {});
        }
        return { needsVerification };
      } catch (err) {
        throw formatAuthError(err);
      }
    },
    []
  );

  const signInWithEmail = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (cred.user.emailVerified) {
          await syncVerifiedUserProfile(cred.user).catch(() => {});
        }
        setAuthModalOpen(false);
      } catch (err) {
        throw formatAuthError(err);
      }
    },
    []
  );

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        authModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        continueWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
