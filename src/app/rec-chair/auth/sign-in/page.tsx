'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthContext } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function RecChairSignIn() {
  const { signInWithMicrosoft, loading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithMicrosoft();
    } catch (error) {
      setError('Authentication failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-24 h-24 mb-4 relative">
            <Image 
              src="/SPUP-final-logo.png" 
              alt="SPUP Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">REC Chair Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the Research Ethics Committee Chair panel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 hover:text-black"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            )}
            <span>{loading ? 'Signing in...' : 'Sign in with Microsoft'}</span>
          </Button>
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 text-center justify-center">
          Access restricted to authorized REC Chair personnel
        </CardFooter>
      </Card>
    </div>
  );
}
