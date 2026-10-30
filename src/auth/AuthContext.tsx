import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { apiClient, setAccessToken, registerSessionExpiredHandler } from '../api/client';
import { clearTokens, loadTokens, saveTokens } from './tokenStorage';
import { decodeJwt, isExpired } from './decodeJwt';
import type { AuthTokens } from '../api/auth';

interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isSeller: boolean;
  isAuctionManager: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  becomeSeller: () => Promise<void>;
  becomeAuctionManager: () => Promise<void>;
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

  const grantSelfRole = useCallback(
    async (role: string) => {
      await authApi.addRole(role);
      // The access token's role claims are stale until refreshed — the backend
      // re-reads the user's current roles from the DB on every /auth/refresh,
      // so forcing one here gets us a token carrying the new role immediately.
      const stored = await loadTokens();
      if (!stored) return;
      const tokens = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken: stored.refreshToken });
      await applyTokens(tokens);
    },
    [applyTokens],
  );

  const becomeSeller = useCallback(() => grantSelfRole('seller'), [grantSelfRole]);
  const becomeAuctionManager = useCallback(() => grantSelfRole('auction_manager'), [grantSelfRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isSeller: user?.roles.includes('seller') ?? false,
      isAuctionManager: user?.roles.includes('auction_manager') ?? false,
      isAdmin: user?.roles.includes('bideet_admin') ?? false,
      login,
      register: registerAccount,
      logout,
      becomeSeller,
      becomeAuctionManager,
    }),
    [user, isLoading, login, registerAccount, logout, becomeSeller, becomeAuctionManager],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
