export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';
export type AuctionType = 'live' | 'timed';

export interface Auction {
  id: string;
  sellerId: string;
  auctionManagerId: string | null;
  title: string;
  description: string;
  images: string[];
  condition: string | null;
  quantity: number;
  category: string | null;
  type: AuctionType;
  openingBidMinor: number;
  reservePriceMinor: number | null;
  bidIncrementMinor: number;
  currentBidMinor: number;
  startTime: string;
  endTime: string;
  antiSnipingExtensionSeconds: number;
  sellerTerms: string | null;
  status: AuctionStatus;
  createdAt: string;
  updatedAt: string;
}
