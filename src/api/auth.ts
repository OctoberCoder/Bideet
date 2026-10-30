import { apiClient } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function login(email: string, password: string): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/auth/login', { email, password });
}

export function register(email: string, password: string, fullName: string): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/auth/register', { email, password, fullName });
}

export function logout(): Promise<void> {
  return apiClient.post<void>('/auth/logout');
}

export function addRole(role: string): Promise<unknown> {
  return apiClient.post('/users/me/roles', { role });
}
