import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/utils/api';

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
  register: (email: string, password: string, name: string, organizationName?: string) => Promise<void>;
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
          console.error('Logout error:', error);
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
        try {
          const response = await authApi.login(email, password);
          const { user, token } = response;
          
          // Store token
          localStorage.setItem('executa-auth-token', token);
          
          // Convert date strings to Date objects
          const userData = {
            ...user,
            createdAt: new Date(user.createdAt)
          };
          
          set({ user: userData, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (email: string, password: string, name: string, organizationName?: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(email, password, name, organizationName || '');
          const { user, token } = response;
          
          // Store token
          localStorage.setItem('executa-auth-token', token);
          
          // Convert date strings to Date objects
          const userData = {
            ...user,
            createdAt: new Date(user.createdAt)
          };
          
          set({ user: userData, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      getCurrentUser: async () => {
        console.log('📋 UserStore: getCurrentUser called');
        const token = localStorage.getItem('executa-auth-token');
        console.log('🔍 UserStore: Token in localStorage:', token ? 'Found' : 'Not found');
        
        if (!token) {
          console.log('❌ UserStore: No token found, setting user to null');
          set({ user: null });
          return;
        }
        
        try {
          console.log('📡 UserStore: Making API call to getCurrentUser...');
          const response = await authApi.getCurrentUser();
          console.log('✅ UserStore: API call successful, response:', response);
          
          const userData = {
            ...response.user,
            createdAt: new Date(response.user.createdAt)
          };
          console.log('👤 UserStore: Setting user data:', userData);
          
          set({ user: userData });
        } catch (error) {
          console.error('❌ UserStore: Get current user error:', error);
          console.log('🧹 UserStore: Clearing token due to API error');
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

