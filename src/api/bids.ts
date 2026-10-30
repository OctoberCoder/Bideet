import { apiClient } from './client';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amountMinor: number;
  createdAt: string;
}

export function fetchBids(auctionId: string): Promise<Bid[]> {
  return apiClient.get<Bid[]>(`/auctions/${auctionId}/bids`);
}

export function placeBid(auctionId: string, amountMinor: number): Promise<Bid> {
  return apiClient.post<Bid>(`/auctions/${auctionId}/bids`, { amountMinor });
}
