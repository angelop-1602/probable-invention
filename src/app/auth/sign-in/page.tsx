'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProponentAuthContext } from '@/lib/auth/proponent-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ProponentSignIn() {
  const { signInWithEmail, signUpWithEmail, signInWithMicrosoft, signInWithGoogle, loading } = useProponentAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Sign In form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  // Sign Up form state
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await signInWithEmail(signInData.email, signInData.password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed. Please try again.';
      setError(errorMessage);
      console.error(error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      setError(null);
      await signUpWithEmail(signUpData.email, signUpData.password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed. Please try again.';
      setError(errorMessage);
      console.error(error);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setError(null);
      await signInWithMicrosoft();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microsoft sign in failed. Please try again.';
      setError(errorMessage);
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed. Please try again.';
      setError(errorMessage);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 py-8 box-shadow: rgba(50, 50, 93, 0.25) 0px 30px 60px -12px inset, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px inset;">
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
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign in to submit and track your research protocol applications
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full py-6 flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 hover:text-black"
              onClick={handleMicrosoftSignIn}
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
              <span>Continue with Microsoft</span>
            </Button>

            <Button
              variant="outline"
              className="w-full py-6 flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 hover:text-black"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Tabs */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                      placeholder="Enter your password (min. 6 characters)"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 text-center justify-center">
          <div className="space-y-2">
            <p>By signing in, you agree to our terms and conditions</p>
            <Link href="/" className="text-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 