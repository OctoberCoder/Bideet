import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { fetchAuctionById, fetchManagedAuctionById } from '../api/auctions';
import { ApiError } from '../api/client';
import { cacheAuction, getCachedAuction } from '../db/database';
import { useAuth } from '../auth/AuthContext';
import type { Auction } from '../types/auction';

const isNative = Platform.OS !== 'web';

export function useAuctionDetail(id: string) {
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShowingCache, setIsShowingCache] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isNative) {
      const cached = await getCachedAuction(id).catch(() => null);
      if (cached) {
        setAuction(cached);
        setIsShowingCache(true);
      }
    }

    try {
      let fresh: Auction | null = null;
      try {
        fresh = await fetchAuctionById(id);
      } catch (err) {
        // A draft 404s on the public endpoint. Its manager (the creator) can
        // still load it; for anyone else the manager lookup is refused and the
        // original 404 stands. Authority comes from the auction, not the account.
        if (!(err instanceof ApiError && err.status === 404 && user)) throw err;
        try {
          fresh = await fetchManagedAuctionById(id);
        } catch (managedErr) {
          if (managedErr instanceof ApiError && (managedErr.status === 403 || managedErr.status === 404)) throw err;
          throw managedErr;
        }
      }
      setAuction(fresh);
      setIsShowingCache(false);
      if (isNative) await cacheAuction(fresh).catch(() => undefined);
    } catch (err) {
      // If we have a cached copy already on screen, a network failure just
      // means we stay offline-stale rather than showing a blocking error.
      setAuction((current) => {
        if (!current) {
          setError(err instanceof Error ? err.message : 'Failed to load auction');
        }
        return current;
      });
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  return { auction, loading, error, isShowingCache, refresh: load };
}
