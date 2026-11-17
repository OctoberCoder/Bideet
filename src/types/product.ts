export interface Product {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  category: string | null;
  quantity: number;
  openingBidMinor: number;
  bidIncrementMinor: number;
  sellerTerms: string | null;
  createdAt: string;
  updatedAt: string;
}
