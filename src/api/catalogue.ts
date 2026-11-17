import { apiClient } from './client';
import type { Product } from '../types/product';

export interface ProductInput {
  title: string;
  description: string;
  condition: string;
  images?: string[];
  category?: string;
  quantity?: number;
  openingBidMinor: number;
  bidIncrementMinor: number;
  sellerTerms?: string;
}

export function fetchMyCatalogue(): Promise<Product[]> {
  return apiClient.get<Product[]>('/catalogue/mine');
}

export function fetchCatalogueItem(id: string): Promise<Product> {
  return apiClient.get<Product>(`/catalogue/${id}`);
}

export function createCatalogueItem(input: ProductInput): Promise<Product> {
  return apiClient.post<Product>('/catalogue', input);
}

export function updateCatalogueItem(id: string, input: Partial<ProductInput>): Promise<Product> {
  return apiClient.patch<Product>(`/catalogue/${id}`, input);
}

export function deleteCatalogueItem(id: string): Promise<void> {
  return apiClient.delete<void>(`/catalogue/${id}`);
}
