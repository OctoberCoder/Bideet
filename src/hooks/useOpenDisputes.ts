import { useCallback, useEffect, useState } from 'react';
import { fetchOpenDisputes } from '../api/orders';
import { getErrorMessage } from '../api/client';
import type { Dispute } from '../api/orders';

export function useOpenDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await fetchOpenDisputes();
      setDisputes(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load open disputes'));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { disputes, loading, refreshing, error, refresh: () => load(true) };
}
