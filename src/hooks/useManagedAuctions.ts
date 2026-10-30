import { useCallback, useEffect, useState } from 'react';
import { fetchManagedAuctions } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import type { Auction } from '../types/auction';

export function useManagedAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await fetchManagedAuctions();
      setAuctions(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your hosted auctions'));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { auctions, loading, refreshing, error, refresh: () => load(true) };
}
