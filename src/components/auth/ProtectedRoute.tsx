"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProponentAuthContext } from '@/lib/auth/proponent-auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useProponentAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log("User not authenticated, redirecting to sign-in");
      router.push('/auth/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 