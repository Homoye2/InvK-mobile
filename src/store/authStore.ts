import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'ADMIN_GENERAL' | 'ADMIN_COMMERCANT' | 'EMPLOYE';

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  trialEndsAt?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  // Set after registration so HomeScreen can show the welcome modal
  justRegistered: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string, fromRegister?: boolean) => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearJustRegistered: () => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hydrated: false,
  justRegistered: false,

  setAuth: async (user, accessToken, refreshToken, fromRegister = false) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    set({ user, accessToken, isAuthenticated: true, justRegistered: fromRegister });
  },

  setUser: (user) => {
    AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  clearJustRegistered: () => set({ justRegistered: false }),

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, accessToken: null, isAuthenticated: false, justRegistered: false });
  },

  hydrate: async () => {
    try {
      const [token, userStr] = await AsyncStorage.multiGet(['accessToken', 'user']);
      const accessToken = token[1];
      const user = userStr[1] ? JSON.parse(userStr[1]) : null;
      if (accessToken && user) {
        set({ user, accessToken, isAuthenticated: true });
      }
    } catch {}
    set({ hydrated: true });
  },
}));
