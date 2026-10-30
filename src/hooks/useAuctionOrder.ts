import { useCallback, useEffect, useState } from 'react';
import { fetchDisputeForOrder, fetchOrderForAuction } from '../api/orders';
import type { Dispute, Order } from '../api/orders';
import { ApiError } from '../api/client';

/** Fetches the order (and its dispute, if any) for a closed auction, once the viewer is the buyer or seller. */
export function useAuctionOrder(auctionId: string, enabled: boolean) {
  const [order, setOrder] = useState<Order | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !auctionId) return;
    try {
      const data = await fetchOrderForAuction(auctionId);
      setOrder(data);
      try {
        const d = await fetchDisputeForOrder(data.id);
        setDispute(d);
      } catch {
        setDispute(null);
      }
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        // swallow other errors too; this is a supplementary panel, not critical path
      }
      setOrder(null);
      setDispute(null);
    } finally {
      setChecked(true);
    }
  }, [auctionId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, dispute, checked, refresh: load };
}
