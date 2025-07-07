import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/utils/api';

// Conditional logger for development only
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: (...args: any[]) => console.error(...args), // Keep errors in production for debugging
};

interface Account {
  id: string;
  accountId: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  company?: string;
  website?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  emailVerified: boolean;
  createdAt: Date;
  account: Account;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  // Async actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName?: string) => Promise<{ redirectTo?: string }>;
  getCurrentUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      
      setUser: (user) => set({ user }),
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          logger.error('Logout error:', error);
        } finally {
          // Clear local storage
          localStorage.removeItem('executa-auth-token');
          localStorage.removeItem('executa-user-storage');
          set({ user: null });
          
          // Redirect to login
          window.location.href = '/login';
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        logger.log('🔐 UserStore: Login attempt for:', email.substring(0, 3) + '***');
        
        try {
          logger.log('📡 UserStore: Calling authApi.login...');
          const response = await authApi.login(email, password);
          logger.log('✅ UserStore: Login API response received:', response);
          
          const { user, token } = response;
          
          // Store token
          localStorage.setItem('executa-auth-token', token);
          logger.log('💾 UserStore: Token stored successfully');
          
          // Convert date strings to Date objects
          const userData = {
            ...user,
            createdAt: new Date(user.createdAt)
          };
          
          set({ user: userData, isLoading: false });
          logger.log('✅ UserStore: User state updated successfully');
        } catch (error) {
          logger.error('❌ UserStore: Login failed with error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (email: string, password: string, name: string, organizationName?: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(email, password, name, organizationName || '');
          const { user, token, redirectTo } = response;
          
          // Store token
          localStorage.setItem('executa-auth-token', token);
          
          // Convert date strings to Date objects
          const userData = {
            ...user,
            createdAt: new Date(user.createdAt)
          };
          
          set({ user: userData, isLoading: false });
          
          return { redirectTo };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      getCurrentUser: async () => {
        logger.log('📋 UserStore: getCurrentUser called');
        const token = localStorage.getItem('executa-auth-token');
        logger.log('🔍 UserStore: Token in localStorage:', token ? 'Found' : 'Not found');
        
        if (!token) {
          logger.log('❌ UserStore: No token found, setting user to null');
          set({ user: null });
          return;
        }
        
        try {
          logger.log('📡 UserStore: Making API call to getCurrentUser...');
          const response = await authApi.getCurrentUser();
          logger.log('✅ UserStore: API call successful, response:', response);
          
          const userData = {
            ...response.user,
            createdAt: new Date(response.user.createdAt)
          };
          logger.log('👤 UserStore: Setting user data:', userData);
          
          set({ user: userData });
        } catch (error) {
          logger.error('❌ UserStore: Get current user error:', error);
          logger.log('🧹 UserStore: Clearing token due to API error');
          // Token might be invalid, clear it
          localStorage.removeItem('executa-auth-token');
          set({ user: null });
        }
      },
    }),
    {
      name: 'executa-user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

