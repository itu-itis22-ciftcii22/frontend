import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { UserResponse, loginAuthTokenPost, readCurrentUserAuthMeGet } from './api/generated';
import { setApiToken, setUnauthorizedCallback } from './api/client';

const TOKEN_KEY = 'assetview_jwt_token';
const isWeb = Platform.OS === 'web';

const TokenStore = {
  async getToken(): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to get token', e);
      return null;
    }
  },
  async setToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.error('Failed to set token', e);
    }
  },
  async deleteToken(): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to delete token', e);
    }
  }
};

export interface SavedAccount {
  email: string;
  token: string;
  user: UserResponse;
}

const ACCOUNTS_KEY = 'assetview_saved_accounts';

const AccountsStore = {
  async getAccounts(): Promise<SavedAccount[]> {
    try {
      if (isWeb) {
        const val = localStorage.getItem(ACCOUNTS_KEY);
        return val ? JSON.parse(val) : [];
      } else {
        const val = await SecureStore.getItemAsync(ACCOUNTS_KEY);
        return val ? JSON.parse(val) : [];
      }
    } catch (e) {
      console.error('Failed to get saved accounts', e);
      return [];
    }
  },
  async setAccounts(accounts: SavedAccount[]): Promise<void> {
    try {
      const val = JSON.stringify(accounts);
      if (isWeb) {
        localStorage.setItem(ACCOUNTS_KEY, val);
      } else {
        await SecureStore.setItemAsync(ACCOUNTS_KEY, val);
      }
    } catch (e) {
      console.error('Failed to set saved accounts', e);
    }
  }
};

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
  removeSavedAccount: (email: string) => Promise<void>;
  clearActiveSession: () => Promise<void>;
  savedAccounts: SavedAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Initialize and check token
  useEffect(() => {
    async function loadStoredToken() {
      const storedToken = await TokenStore.getToken();
      if (storedToken) {
        setTokenState(storedToken);
        setApiToken(storedToken);
        try {
          const profile = await readCurrentUserAuthMeGet();
          setUser(profile || null);
        } catch (e) {
          console.warn('Invalid token on startup, clearing...', e);
          await TokenStore.deleteToken();
          setApiToken(null);
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    async function loadSavedAccounts() {
      const accounts = await AccountsStore.getAccounts();
      setSavedAccounts(accounts);
    }

    loadStoredToken();
    loadSavedAccounts();
  }, []);

  // Hook up unauthorized fetch callback to logout automatically on 401
  useEffect(() => {
    setUnauthorizedCallback(async () => {
      await logout();
    });
    return () => {
      setUnauthorizedCallback(() => {});
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginAuthTokenPost({
        body: {
          username: email,
          password: password,
        }
      });
      const jwt = res?.access_token;
      if (!jwt) {
        throw new Error('Authentication failed: token not found');
      }
      await TokenStore.setToken(jwt);
      setTokenState(jwt);
      setApiToken(jwt);
      const profile = await readCurrentUserAuthMeGet();
      setUser(profile || null);

      if (profile) {
        const newAccount: SavedAccount = {
          email: profile.email,
          token: jwt,
          user: profile
        };
        const updated = [
          newAccount,
          ...savedAccounts.filter((a) => a.email.toLowerCase() !== profile.email.toLowerCase())
        ];
        setSavedAccounts(updated);
        await AccountsStore.setAccounts(updated);
      }
    } catch (e) {
      await TokenStore.deleteToken();
      setTokenState(null);
      setApiToken(null);
      setUser(null);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const currentUserEmail = user?.email;
    await TokenStore.deleteToken();
    setTokenState(null);
    setApiToken(null);
    setUser(null);
    if (currentUserEmail) {
      const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== currentUserEmail.toLowerCase());
      setSavedAccounts(updated);
      await AccountsStore.setAccounts(updated);
    }
    setIsLoading(false);
  };

  const switchAccount = async (email: string) => {
    setIsLoading(true);
    const target = savedAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (target) {
      await TokenStore.setToken(target.token);
      setTokenState(target.token);
      setApiToken(target.token);
      try {
        const profile = await readCurrentUserAuthMeGet();
        setUser(profile || null);
      } catch (e) {
        console.warn('Failed to switch to saved account, token might be expired', e);
        const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
        setSavedAccounts(updated);
        await AccountsStore.setAccounts(updated);
        await TokenStore.deleteToken();
        setTokenState(null);
        setApiToken(null);
        setUser(null);
      }
    } else {
      await logout();
    }
    setIsLoading(false);
  };

  const removeSavedAccount = async (email: string) => {
    const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    setSavedAccounts(updated);
    await AccountsStore.setAccounts(updated);
    if (user && user.email.toLowerCase() === email.toLowerCase()) {
      await logout();
    }
  };

  const clearActiveSession = async () => {
    setIsLoading(true);
    if (user && token) {
      const exists = savedAccounts.some((a) => a.email.toLowerCase() === user.email.toLowerCase());
      if (!exists) {
        const newAccount: SavedAccount = {
          email: user.email,
          token: token,
          user: user
        };
        const updated = [
          newAccount,
          ...savedAccounts.filter((a) => a.email.toLowerCase() !== user.email.toLowerCase())
        ];
        setSavedAccounts(updated);
        await AccountsStore.setAccounts(updated);
      }
    }
    await TokenStore.deleteToken();
    setTokenState(null);
    setApiToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    switchAccount,
    removeSavedAccount,
    clearActiveSession,
    savedAccounts,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
