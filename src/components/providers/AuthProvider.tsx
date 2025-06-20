"use client";

import { useEffect, useState } from 'react';
import { useUserStore } from '@/state/userStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { user, getCurrentUser, setLoading, setUser } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 AuthProvider: Starting authentication initialization...');
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('executa-auth-token');
      console.log('🔍 AuthProvider: Token check:', token ? 'Token found' : 'No token');
      
      if (token) {
        console.log('🔑 AuthProvider: Token found, validating user session...');
        setLoading(true);
        
        try {
          console.log('📡 AuthProvider: Calling getCurrentUser API...');
          await getCurrentUser();
          console.log('✅ AuthProvider: User session validation successful');
        } catch (error) {
          console.error('❌ AuthProvider: User session validation failed:', error);
          // Token might be invalid or expired, clear everything
          console.log('🧹 AuthProvider: Clearing auth data due to validation failure');
          localStorage.removeItem('executa-auth-token');
          localStorage.removeItem('executa-user-storage');
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('🔓 AuthProvider: No auth token found, user not authenticated');
        // No token, make sure user state is cleared
        setUser(null);
        setLoading(false);
      }
      
      console.log('🏁 AuthProvider: Authentication initialization complete');
      setIsInitialized(true);
    };

    // Only initialize once
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, getCurrentUser, setLoading, setUser]);

  // Show loading spinner while initializing authentication
  if (!isInitialized) {
    console.log('⏳ AuthProvider: Showing loading state during initialization');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('🎯 AuthProvider: Rendering children with auth state:', user ? 'User authenticated' : 'User not authenticated');
  return <>{children}</>;
} 