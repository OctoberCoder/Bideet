import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useAuctionOrder } from '../hooks/useAuctionOrder';
import { dispatchOrder, deliverOrder, confirmOrder, raiseDispute } from '../api/orders';
import { getErrorMessage } from '../api/client';
import { formatNaira } from '../utils/format';
import type { Auction } from '../types/auction';
import type { OrderStatus } from '../api/orders';

interface Props {
  auction: Auction;
  statusOverride?: string | null;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_dispatch: 'Awaiting dispatch',
  dispatched: 'Dispatched',
  delivered: 'Delivered — awaiting confirmation',
  confirmed: 'Order complete',
  disputed: 'Dispute open',
  refunded: 'Refunded',
};

export default function AuctionResultBanner({ auction, statusOverride }: Props) {
  const { user } = useAuth();
  const isOwner = user?.userId === auction.sellerId;
  const isManager = user?.userId === auction.auctionManagerId;
  const effectiveStatus = statusOverride ?? auction.status;
  const { order, dispute, checked, refresh } = useAuctionOrder(auction.id, !!user && effectiveStatus === 'completed');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNote, setTrackingNote] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  if (effectiveStatus !== 'completed' || !checked) return null;

  if (!order) {
    if (isOwner || isManager) {
      return (
        <View style={styles.banner}>
          <Text style={styles.title}>Auction closed — no winning bid</Text>
        </View>
      );
    }
    return null;
  }

  const isWinner = user?.userId === order.buyerId;
  if (!isOwner && !isWinner) return null;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      setTrackingNote('');
      setShowDisputeForm(false);
      setDisputeReason('');
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  }

  const canDispute = isWinner && ['awaiting_dispatch', 'dispatched', 'delivered'].includes(order.status);

  return (
    <View style={[styles.banner, styles.bannerSold]}>
      <Text style={styles.title}>
        {isWinner ? 'You won this auction!' : `Sold for ${formatNaira(order.amountMinor)}`}
      </Text>
      {isWinner && <Text style={styles.subtitle}>Winning bid: {formatNaira(order.amountMinor)}</Text>}
      <Text style={styles.status}>{STATUS_LABEL[order.status]}</Text>

      {order.trackingNote && <Text style={styles.trackingNote}>Tracking: {order.trackingNote}</Text>}

      {order.status === 'delivered' && order.confirmDeadlineAt && (
        <Text style={styles.deadline}>
          Auto-confirms on {new Date(order.confirmDeadlineAt).toLocaleDateString()} if not confirmed sooner.
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Seller actions */}
      {isOwner && order.status === 'awaiting_dispatch' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Tracking note (optional)"
            placeholderTextColor="#9ca3af"
            value={trackingNote}
            onChangeText={setTrackingNote}
          />
          <Pressable style={styles.button} onPress={() => run(() => dispatchOrder(order.id, trackingNote || undefined))} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mark as dispatched</Text>}
          </Pressable>
        </>
      )}
      {isOwner && order.status === 'dispatched' && (
        <Pressable style={styles.button} onPress={() => run(() => deliverOrder(order.id))} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mark as delivered</Text>}
        </Pressable>
      )}

      {/* Buyer actions */}
      {isWinner && order.status === 'delivered' && (
        <Pressable style={styles.button} onPress={() => run(() => confirmOrder(order.id))} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm receipt</Text>}
        </Pressable>
      )}

      {order.status === 'disputed' && (
        <View style={styles.disputeBox}>
          <Text style={styles.disputeTitle}>Dispute open — our team is reviewing it.</Text>
          {dispute?.reason && <Text style={styles.disputeReason}>Reason: {dispute.reason}</Text>}
        </View>
      )}

      {order.status === 'refunded' && dispute?.resolutionNote && (
        <View style={styles.disputeBox}>
          <Text style={styles.disputeReason}>{dispute.resolutionNote}</Text>
        </View>
      )}

      {canDispute && !showDisputeForm && (
        <Pressable onPress={() => setShowDisputeForm(true)}>
          <Text style={styles.disputeLink}>Report a problem</Text>
        </Pressable>
      )}
      {canDispute && showDisputeForm && (
        <View style={styles.disputeForm}>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="What went wrong? (at least 10 characters)"
            placeholderTextColor="#9ca3af"
            value={disputeReason}
            onChangeText={setDisputeReason}
            multiline
          />
          <Pressable
            style={styles.disputeButton}
            onPress={() => run(() => raiseDispute(order.id, disputeReason))}
            disabled={busy || disputeReason.trim().length < 10}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit dispute</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  bannerSold: { backgroundColor: '#ecfdf5' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#374151' },
  status: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  trackingNote: { fontSize: 13, color: '#374151' },
  deadline: { fontSize: 12, color: '#92400e' },
  error: { fontSize: 13, color: '#b91c1c' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disputeBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, gap: 4 },
  disputeTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  disputeReason: { fontSize: 13, color: '#78350f' },
  disputeLink: { fontSize: 13, color: '#b91c1c', fontWeight: '600', marginTop: 4 },
  disputeForm: { gap: 8, marginTop: 4 },
  disputeButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
