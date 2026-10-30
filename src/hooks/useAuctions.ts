import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { fetchPublishedAuctions } from '../api/auctions';
import { cacheAuctions, getCachedAuctions } from '../db/database';
import type { Auction } from '../types/auction';

const isNative = Platform.OS !== 'web';

export function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingCache, setIsShowingCache] = useState(false);

  const loadFromCache = useCallback(async () => {
    if (!isNative) return;
    try {
      const cached = await getCachedAuctions();
      if (cached.length > 0) {
        setAuctions(cached);
        setIsShowingCache(true);
      }
    } catch {
      // cache is best-effort; ignore failures and fall through to the network
    }
  }, []);

  const loadFromNetwork = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const fresh = await fetchPublishedAuctions();
      setAuctions(fresh);
      setIsShowingCache(false);
      if (isNative) await cacheAuctions(fresh).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await loadFromNetwork();
    })();
  }, [loadFromCache, loadFromNetwork]);

  return {
    auctions,
    loading,
    refreshing,
    error,
    isShowingCache,
    refresh: () => loadFromNetwork(true),
  };
}
