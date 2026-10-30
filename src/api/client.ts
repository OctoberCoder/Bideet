import { Platform } from 'react-native';
import { clearTokens, loadTokens, saveTokens } from '../auth/tokenStorage';

/**
 * Point this at the NestJS backend. On a physical device/emulator "localhost"
 * means the device itself, not your Mac — use your machine's LAN IP there.
 * Android emulator can reach the host via 10.0.2.2.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:3000`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Pulls a human-readable message out of any caught error — an ApiError's
 * server message, or any other Error's own message (a thrown SecureStore
 * failure, a JSON parse error, etc.) — falling back only when the error truly
 * carries nothing useful. Showing the real message instead of a generic
 * "something went wrong" is what makes a failure like this diagnosable from
 * the UI itself instead of needing device logs.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
/** Serializes concurrent refresh attempts so parallel 401s don't each kick off their own refresh. */
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Called by AuthContext; invoked when a refresh attempt fails and the user must log in again. */
export function registerSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const stored = await loadTokens();
      if (!stored) return null;
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
        if (!response.ok) return null;
        const tokens = await response.json();
        await saveTokens(tokens);
        accessToken = tokens.accessToken;
        return tokens.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() throws on DNS failure, refused/unreachable connection, etc. — this is
    // never a server-side error, so give a message that points at the actual cause.
    throw new ApiError(
      0,
      `Can't reach the server at ${API_BASE_URL}. Make sure your phone is on the same Wi-Fi as the backend and it's running.`,
    );
  }

  if (response.status === 401 && !isRetry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    await clearTokens();
    accessToken = null;
    onSessionExpired?.();
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body?.message ?? message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
