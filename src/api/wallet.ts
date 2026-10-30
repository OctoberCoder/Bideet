import { apiClient } from './client';

export interface Wallet {
  userId: string;
  availableMinor: number;
  reservedMinor: number;
  createdAt: string;
  updatedAt: string;
}

export function fetchWallet(): Promise<Wallet> {
  return apiClient.get<Wallet>('/wallet/me');
}

/** Dev/test top-up — not a real payment. See backend WalletController comment. */
export function depositToWallet(amountMinor: number): Promise<Wallet> {
  return apiClient.post<Wallet>('/wallet/deposit', { amountMinor });
}
