"use client";
import { Button } from '@/components/ui/button';
import { useProponentAuthContext } from '@/lib/auth/proponent-auth-context';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SignOutButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SignOutButton({ 
  variant = "outline", 
  size = "default", 
  className = "",
  showIcon = true,
  children
}: SignOutButtonProps) {
  const { signOut, user } = useProponentAuthContext();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {children || (isSigningOut ? 'Signing out...' : 'Sign Out')}
    </Button>
  );
} 