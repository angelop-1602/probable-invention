"use client";

import { useState, useEffect } from 'react';
import { 
  User, 
  OAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);
      setLoading(false);
      
      // Store authentication state in localStorage
      if (currentUser) {
        localStorage.setItem('isAuthenticated', 'true');
        
        // If on sign-in page, redirect to dashboard
        if (window.location.pathname.includes('/rec-chair/auth/sign-in')) {
          console.log("Redirecting to dashboard from auth state change");
          router.push('/rec-chair');
        }
      } else {
        localStorage.removeItem('isAuthenticated');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log("Starting Microsoft sign in...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign in successful:", result.user.email);
      
      // Check if the signed-in email is the authorized REC Chair
      if (result.user.email !== 'rec@spup.edu.ph') {
        console.log("Unauthorized email:", result.user.email);
        // Unauthorized access - sign them out immediately
        await firebaseSignOut(auth);
        throw new Error('Unauthorized access. Only the REC Chair can sign in.');
      }
      
      console.log("Authorized REC Chair, redirecting to dashboard");
      // Use window.location for a hard redirect if router.push is not working
      window.location.href = '/rec-chair';
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('isAuthenticated');
      router.push('/rec-chair/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithMicrosoft,
    signOut,
    isAuthenticated: !!user,
  };
} 