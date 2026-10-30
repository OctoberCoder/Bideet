import { apiClient } from './client';
import type { Auction, AuctionStatus, AuctionType } from '../types/auction';

export interface AuctionFormInput {
  title: string;
  description: string;
  images?: string[];
  condition?: string;
  quantity?: number;
  category?: string;
  type: AuctionType;
  openingBidMinor: number;
  reservePriceMinor?: number;
  bidIncrementMinor: number;
  startTime: string;
  endTime: string;
  antiSnipingExtensionSeconds?: number;
  sellerTerms?: string;
}

export function fetchPublishedAuctions(category?: string): Promise<Auction[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiClient.get<Auction[]>(`/auctions${query}`);
}

export function fetchAuctionById(id: string): Promise<Auction> {
  return apiClient.get<Auction>(`/auctions/${id}`);
}

export function fetchMyAuctions(): Promise<Auction[]> {
  return apiClient.get<Auction[]>('/auctions/mine');
}

/** Fetches one of the current seller's own auctions regardless of status (e.g. a draft). */
export function fetchMyAuctionById(id: string): Promise<Auction> {
  return apiClient.get<Auction>(`/auctions/mine/${id}`);
}

export function createAuction(input: AuctionFormInput): Promise<Auction> {
  return apiClient.post<Auction>('/auctions', input);
}

export function updateAuction(id: string, input: Partial<AuctionFormInput>): Promise<Auction> {
  return apiClient.patch<Auction>(`/auctions/${id}`, input);
}

export function transitionAuctionStatus(id: string, status: AuctionStatus): Promise<Auction> {
  return apiClient.patch<Auction>(`/auctions/${id}/status`, { status });
}

export function deleteAuction(id: string): Promise<void> {
  return apiClient.delete<void>(`/auctions/${id}`);
}

/** Seller-only: assigns (or, with null, clears) the auction manager hosting this auction. */
export function assignAuctionManager(id: string, auctionManagerId: string | null): Promise<Auction> {
  return apiClient.patch<Auction>(`/auctions/${id}/manager`, { auctionManagerId });
}

export interface AuctionManagerProfile {
  id: string;
  fullName: string;
}

/** Resolves an auction manager's account by email for assignment — 404 if no such manager exists. */
export function lookupAuctionManagerByEmail(email: string): Promise<AuctionManagerProfile> {
  return apiClient.get<AuctionManagerProfile>(
    `/users/lookup/auction-manager?email=${encodeURIComponent(email)}`,
  );
}

/** Auctions the current user has been assigned to host as auction manager. */
export function fetchManagedAuctions(): Promise<Auction[]> {
  return apiClient.get<Auction[]>('/auctions/managed');
}

/** Assigned auction manager fetching one of their hosted auctions regardless of status. */
export function fetchManagedAuctionById(id: string): Promise<Auction> {
  return apiClient.get<Auction>(`/auctions/managed/${id}`);
}
