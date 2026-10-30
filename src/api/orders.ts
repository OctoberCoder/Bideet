import { apiClient } from './client';

export type OrderStatus =
  | 'awaiting_dispatch'
  | 'dispatched'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'refunded';

export interface Order {
  id: string;
  auctionId: string;
  sellerId: string;
  buyerId: string;
  amountMinor: number;
  status: OrderStatus;
  trackingNote: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  confirmDeadlineAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DisputeStatus = 'open' | 'resolved_release' | 'resolved_refund';

export interface Dispute {
  id: string;
  orderId: string;
  raisedByUserId: string;
  reason: string;
  status: DisputeStatus;
  resolvedByUserId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export function fetchOrderForAuction(auctionId: string): Promise<Order> {
  return apiClient.get<Order>(`/auctions/${auctionId}/order`);
}

export function fetchWonOrders(): Promise<Order[]> {
  return apiClient.get<Order[]>('/orders/won');
}

export function fetchSoldOrders(): Promise<Order[]> {
  return apiClient.get<Order[]>('/orders/sold');
}

export function dispatchOrder(orderId: string, trackingNote?: string): Promise<Order> {
  return apiClient.patch<Order>(`/orders/${orderId}/dispatch`, trackingNote ? { trackingNote } : undefined);
}

export function deliverOrder(orderId: string): Promise<Order> {
  return apiClient.patch<Order>(`/orders/${orderId}/deliver`);
}

export function confirmOrder(orderId: string): Promise<Order> {
  return apiClient.patch<Order>(`/orders/${orderId}/confirm`);
}

export function raiseDispute(orderId: string, reason: string): Promise<Dispute> {
  return apiClient.post<Dispute>(`/orders/${orderId}/dispute`, { reason });
}

export function fetchDisputeForOrder(orderId: string): Promise<Dispute | null> {
  return apiClient.get<Dispute | null>(`/orders/${orderId}/dispute`);
}

export type DisputeResolution = 'release' | 'refund';

export function fetchOpenDisputes(): Promise<Dispute[]> {
  return apiClient.get<Dispute[]>('/disputes/open');
}

export function resolveDispute(id: string, resolution: DisputeResolution, note?: string): Promise<Dispute> {
  return apiClient.patch<Dispute>(`/disputes/${id}/resolve`, note ? { resolution, note } : { resolution });
}
