import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setAccessToken, registerSessionExpiredHandler } from '../api/client';
import { clearTokens, loadTokens, saveTokens } from './tokenStorage';
import { decodeJwt, isExpired } from './decodeJwt';

interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromAccessToken(accessToken: string): AuthUser | null {
  const payload = decodeJwt(accessToken);
  if (!payload || isExpired(payload)) return null;
  return { userId: payload.sub, email: payload.email, roles: payload.roles };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
    (async () => {
      const stored = await loadTokens();
      if (stored) {
        setAccessToken(stored.accessToken);
        setUser(userFromAccessToken(stored.accessToken));
      }
      setIsLoading(false);
    })();
    return () => registerSessionExpiredHandler(null);
  }, [handleSessionExpired]);

  const applyTokens = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    await saveTokens(tokens);
    setAccessToken(tokens.accessToken);
    setUser(userFromAccessToken(tokens.accessToken));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      await applyTokens(tokens);
    },
    [applyTokens],
  );

  const registerAccount = useCallback(
    async (email: string, password: string, fullName: string) => {
      const tokens = await authApi.register(email, password, fullName);
      await applyTokens(tokens);
    },
    [applyTokens],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort server-side session revoke; clear locally regardless
    }
    await clearTokens();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin: user?.roles.includes('bideet_admin') ?? false,
      login,
      register: registerAccount,
      logout,
    }),
    [user, isLoading, login, registerAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
