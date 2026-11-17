import { useCallback, useState } from 'react';
import { fetchMyCatalogue } from '../api/catalogue';
import { getErrorMessage } from '../api/client';
import type { Product } from '../types/product';

/** Loading is driven by the screen (on focus), so edits made on other screens show up on return. */
export function useCatalogue() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await fetchMyCatalogue());
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your catalogue'));
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  return { items, loading, refreshing, error, refresh: () => load(true), reload: () => load() };
}
