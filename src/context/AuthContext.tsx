import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  onAuthStateChanged, 
  FirebaseUser 
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        localStorage.removeItem('projectpilot_guest_active');
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Builder' : 'Developer'),
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous
        });
      } else {
        // Check if guest preview mode was active
        const isGuestActive = localStorage.getItem('projectpilot_guest_active') === 'true';
        const savedGuestUid = localStorage.getItem('projectpilot_guest_uid');
        if (isGuestActive && savedGuestUid) {
          setUser({
            uid: savedGuestUid,
            email: null,
            displayName: 'Guest Builder',
            photoURL: null,
            isAnonymous: true
          });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('Auth state listener error:', err);
      // If error occurs, check if guest active
      const isGuestActive = localStorage.getItem('projectpilot_guest_active') === 'true';
      const savedGuestUid = localStorage.getItem('projectpilot_guest_uid');
      if (isGuestActive && savedGuestUid) {
        setUser({
          uid: savedGuestUid,
          email: null,
          displayName: 'Guest Builder',
          photoURL: null,
          isAnonymous: true
        });
      } else {
        setError('Authentication connection error');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      // Clean user-friendly message
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or use Instant Developer Preview.');
      } else {
        setError(err?.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const signInGuest = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginAsGuest();
    } catch (err: any) {
      console.warn('Firebase Anonymous Auth unavailable, activating local developer preview session:', err);
      // Graceful fallback to local guest session
      const guestUid = localStorage.getItem('projectpilot_guest_uid') || `guest-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('projectpilot_guest_uid', guestUid);
      localStorage.setItem('projectpilot_guest_active', 'true');
      
      setUser({
        uid: guestUid,
        email: null,
        displayName: 'Guest Builder',
        photoURL: null,
        isAnonymous: true
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      localStorage.removeItem('projectpilot_guest_active');
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      console.error('Logout failed:', err);
      localStorage.removeItem('projectpilot_guest_active');
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        signInGoogle,
        signInGuest,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
