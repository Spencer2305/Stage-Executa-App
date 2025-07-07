"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/state/userStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, isLoading } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is an OAuth callback (has token and oauth parameters)
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const isOAuthCallback = token && oauth;

    if (isOAuthCallback) {
      console.log('🔄 OAuth callback detected in AuthGuard, processing...');
      // Handle OAuth in AuthGuard as fallback
      localStorage.setItem('executa-auth-token', token);
      console.log('💾 AuthGuard: Token stored in localStorage');
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('oauth');
      window.history.replaceState({}, '', url.toString());
      
      // Reload to restart auth flow
      window.location.reload();
      return;
    }

    // Only check auth after loading is complete and if it's not an OAuth callback
    if (!isLoading && requireAuth && !user && !isOAuthCallback) {
      console.log('🚫 User not authenticated, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [user, isLoading, requireAuth, redirectTo, router, searchParams]);

  // Show loading while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
} 