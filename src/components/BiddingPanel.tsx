import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { placeBid } from '../api/bids';
import { getErrorMessage } from '../api/client';
import { formatNaira } from '../utils/format';
import { formatCountdown } from '../utils/countdown';
import type { Bid } from '../api/bids';
import type { Auction } from '../types/auction';

interface Props {
  auction: Auction;
  liveCurrentBid: number | null;
  liveEndTime: string | null;
  liveStatus?: string | null;
  bids: Bid[];
  onBidPlaced: () => void;
}

const DEFAULT_TOP_UP_MINOR = 50_000_00; // ₦50,000 mock top-up

export default function BiddingPanel({ auction, liveCurrentBid, liveEndTime, liveStatus, bids, onBidPlaced }: Props) {
  const { user } = useAuth();
  const { wallet, deposit, refresh: refreshWallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [now, setNow] = useState(Date.now());

  const effectiveStatus = liveStatus ?? auction.status;
  const endTime = liveEndTime ?? auction.endTime;
  const currentBidMinor = liveCurrentBid ?? Number(auction.currentBidMinor);
  const isOwner = user?.userId === auction.sellerId;
  const isManager = user?.userId === auction.auctionManagerId;
  const isClosed = effectiveStatus !== 'live' || new Date(endTime).getTime() <= now;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const minNextBid = currentBidMinor > 0 ? currentBidMinor + Number(auction.bidIncrementMinor) : Number(auction.openingBidMinor);

  async function handlePlaceBid() {
    const amountMinor = Math.round(Number(amount.replace(/[,\s]/g, '')) * 100);
    if (!amountMinor || Number.isNaN(amountMinor)) {
      setError('Enter a bid amount');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await placeBid(auction.id, amountMinor);
      setAmount('');
      onBidPlaced();
      refreshWallet();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to place bid'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTopUp() {
    setToppingUp(true);
    try {
      await deposit(DEFAULT_TOP_UP_MINOR);
    } finally {
      setToppingUp(false);
    }
  }

  if (effectiveStatus === 'completed' || effectiveStatus === 'cancelled' || effectiveStatus === 'draft') {
    return null;
  }
  if (effectiveStatus !== 'live' && !liveCurrentBid && !liveEndTime) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.countdownRow}>
        <Text style={styles.countdownLabel}>Auction closes</Text>
        <Text style={[styles.countdownValue, isClosed && styles.countdownClosed]}>
          {formatCountdown(endTime, now)}
        </Text>
      </View>

      {!user && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Log in to place a bid.</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </Pressable>
        </View>
      )}

      {user && (isOwner || isManager) && (
        <Text style={styles.disabledText}>You can't bid on an auction you own or host.</Text>
      )}

      {user && !isOwner && !isManager && !isClosed && (
        <>
          <View style={styles.walletRow}>
            <Text style={styles.walletText}>
              Available: {wallet ? formatNaira(wallet.availableMinor) : '—'}
            </Text>
            <Pressable style={styles.topUpButton} onPress={handleTopUp} disabled={toppingUp}>
              {toppingUp ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text style={styles.topUpButtonText}>Top up (test funds)</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.bidRow}>
            <TextInput
              style={styles.input}
              placeholder={`Min ${formatNaira(minNextBid)}`}
              placeholderTextColor="#9ca3af"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.bidButton} onPress={handlePlaceBid} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bidButtonText}>Place bid</Text>}
            </Pressable>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
        </>
      )}

      {isClosed && <Text style={styles.disabledText}>This auction has closed to new bids.</Text>}

      {bids.length > 0 && (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>Recent bids</Text>
          {bids.slice(0, 5).map((bid) => (
            <View key={bid.id} style={styles.historyRow}>
              <Text style={styles.historyAmount}>{formatNaira(bid.amountMinor)}</Text>
              <Text style={styles.historyTime}>{new Date(bid.createdAt).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countdownLabel: { fontSize: 13, color: '#6b7280' },
  countdownValue: { fontSize: 15, fontWeight: '700', color: '#15803d' },
  countdownClosed: { color: '#b91c1c' },
  loginPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loginPromptText: { fontSize: 14, color: '#374151' },
  loginButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabledText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  walletRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  topUpButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#eef2ff', borderRadius: 8 },
  topUpButtonText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  bidRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  bidButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error: { fontSize: 13, color: '#b91c1c' },
  history: { gap: 4, marginTop: 4, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  historyTitle: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyAmount: { fontSize: 13, color: '#111827', fontWeight: '600' },
  historyTime: { fontSize: 12, color: '#9ca3af' },
});
