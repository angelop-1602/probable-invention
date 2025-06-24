"use client";

import { useState, useEffect } from 'react';
import { 
  User, 
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export interface UseProponentAuthResult {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useProponentAuth(): UseProponentAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Proponent Auth state changed:", currentUser?.email);
      setUser(currentUser);
      setLoading(false);
      
      // Store authentication state in localStorage
      if (currentUser) {
        localStorage.setItem('proponentAuthenticated', 'true');
        localStorage.setItem('proponentUserId', currentUser.uid);
        localStorage.setItem('proponentEmail', currentUser.email || '');
        
        // If on sign-in page, redirect to dashboard
        if (window.location.pathname.includes('/auth/sign-in') || window.location.pathname === '/') {
          console.log("Redirecting proponent to dashboard from auth state change");
          router.push('/dashboard');
        }
      } else {
        localStorage.removeItem('proponentAuthenticated');
        localStorage.removeItem('proponentUserId');
        localStorage.removeItem('proponentEmail');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Starting email sign in...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email sign in successful:", result.user.email);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Starting email sign up...");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Email sign up successful:", result.user.email);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log("Starting Microsoft sign in for proponent...");
      const result = await signInWithPopup(auth, provider);
      console.log("Microsoft sign in successful:", result.user.email);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log("Starting Google sign in for proponent...");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign in successful:", result.user.email);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");
      
      // Clear localStorage first
      localStorage.removeItem('proponentAuthenticated');
      localStorage.removeItem('proponentUserId');
      localStorage.removeItem('proponentEmail');
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      console.log("Sign out successful, redirecting to home...");
      
      // Small delay to ensure auth state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use window.location for a more reliable redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to redirect to home
      window.location.href = '/';
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithMicrosoft,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
} 