import { useCallback, useEffect, useState } from 'react';
import { depositToWallet, fetchWallet } from '../api/wallet';
import type { Wallet } from '../api/wallet';
import { useAuth } from '../auth/AuthContext';

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWallet();
      setWallet(data);
    } catch {
      // wallet is supplementary UI; a failed fetch just hides the balance
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deposit = useCallback(
    async (amountMinor: number) => {
      const data = await depositToWallet(amountMinor);
      setWallet(data);
    },
    [],
  );

  return { wallet, loading, refresh, deposit };
}
