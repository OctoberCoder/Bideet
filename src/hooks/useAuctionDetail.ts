import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { fetchAuctionById, fetchManagedAuctionById, fetchMyAuctionById } from '../api/auctions';
import { ApiError } from '../api/client';
import { cacheAuction, getCachedAuction } from '../db/database';
import { useAuth } from '../auth/AuthContext';
import type { Auction } from '../types/auction';

const isNative = Platform.OS !== 'web';

export function useAuctionDetail(id: string) {
  const { user, isSeller, isAuctionManager } = useAuth();
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
        // Not-yet-published (e.g. a draft) 404s on the public endpoint — fall
        // back to a role-scoped lookup: seller's own, then assigned manager's.
        if (!(err instanceof ApiError && err.status === 404 && user)) throw err;

        if (isSeller) {
          try {
            fresh = await fetchMyAuctionById(id);
          } catch (ownedErr) {
            if (!(ownedErr instanceof ApiError && ownedErr.status === 404)) throw ownedErr;
          }
        }
        if (!fresh && isAuctionManager) {
          fresh = await fetchManagedAuctionById(id);
        }
        if (!fresh) throw err;
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
  }, [id, user, isSeller, isAuctionManager]);

  useEffect(() => {
    load();
  }, [load]);

  return { auction, loading, error, isShowingCache, refresh: load };
}
