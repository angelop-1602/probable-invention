/**
 * Types for authentication system
 */
import { User } from 'firebase/auth';

/**
 * Authentication context type
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithMicrosoft: () => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  signInWithMicrosoft: () => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
} 