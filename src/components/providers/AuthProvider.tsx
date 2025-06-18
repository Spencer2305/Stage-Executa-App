"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/state/userStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { user, getCurrentUser, setLoading } = useUserStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have a token in localStorage
      const token = localStorage.getItem('executa-auth-token');
      
      if (token && !user) {
        console.log('🔑 Found auth token, initializing user...');
        setLoading(true);
        
        try {
          await getCurrentUser();
          console.log('✅ User initialization successful');
        } catch (error) {
          console.error('❌ User initialization failed:', error);
          // Token might be invalid, will be cleared by getCurrentUser
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - only run once on mount

  return <>{children}</>;
} 