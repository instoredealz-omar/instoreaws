import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  membershipPlan: string;
  isPromotionalUser: boolean;
  totalSavings?: string;
  dealsClaimed?: number;
  city?: string;
  state?: string;
  membershipExpiry?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string, password: string) => Promise<User>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateToken: (token: string) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credential: string, password: string) => {
        try {
          const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: {
              credential,
              password,
            },
          });
          
          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });
          
          // Set token for future requests
          localStorage.setItem('auth_token', data.token);
          
          return data.user;
        } catch (error) {
          throw error;
        }
      },

      signup: async (userData: any) => {
        try {
          const response = await apiRequest('/api/auth/signup', {
            method: 'POST',
            body: userData,
          });
          
          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });
          
          // Set token for future requests
          localStorage.setItem('auth_token', data.token);
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        // Check if token is old format (pipe-separated) and clear it
        if (!token.startsWith('eyJ')) {
          console.log('Clearing old token format, please log in again');
          localStorage.removeItem('auth_token');
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            set({
              user: userData,
              token,
              isAuthenticated: true,
            });
          } else {
            localStorage.removeItem('auth_token');
            set({ isAuthenticated: false, user: null, token: null });
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ isAuthenticated: false, user: null, token: null });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          });
        }
      },

      updateToken: (token: string) => {
        set({ token, isAuthenticated: true });
        
        // Fetch user data when token is set
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(response => {
          if (response.ok) {
            return response.json();
          } else {
            localStorage.removeItem('auth_token');
            set({ isAuthenticated: false, user: null, token: null });
          }
        }).then(userData => {
          if (userData) {
            set({
              user: userData,
              token,
              isAuthenticated: true,
            });
          }
        }).catch(error => {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('auth_token');
          set({ isAuthenticated: false, user: null, token: null });
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper to get auth header for API requests
export const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to check if user has required role
export const hasRole = (user: User | null, allowedRoles: string[]): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

// Helper to check if user has required membership level
export const hasMembershipLevel = (user: User | null, requiredLevel: string): boolean => {
  if (!user) return false;
  
  const levels = { basic: 1, premium: 2, ultimate: 3 };
  const userLevel = levels[user.membershipPlan as keyof typeof levels] || 1;
  const required = levels[requiredLevel as keyof typeof levels] || 1;
  
  return userLevel >= required;
};
