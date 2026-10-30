import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useManagedAuctions } from '../hooks/useManagedAuctions';
import { transitionAuctionStatus } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import { formatAuctionWindow, formatNaira } from '../utils/format';
import { ALLOWED_TRANSITIONS, TRANSITION_LABEL } from '../utils/auctionTransitions';
import type { Auction, AuctionStatus } from '../types/auction';

const STATUS_LABEL: Record<Auction['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live now',
  paused: 'Paused',
  completed: 'Ended',
  cancelled: 'Cancelled',
};

/** Hosting actions a manager realistically drives from this list — excludes draft/cancelled dead-ends. */
const HOSTING_ACTIONS: AuctionStatus[] = ['live', 'paused', 'completed', 'cancelled'];

function ManagedAuctionCard({
  auction,
  onPress,
  onTransition,
  pendingTransition,
}: {
  auction: Auction;
  onPress: () => void;
  onTransition: (status: AuctionStatus) => void;
  pendingTransition: AuctionStatus | null;
}) {
  const currentBid = Number(auction.currentBidMinor) > 0 ? auction.currentBidMinor : auction.openingBidMinor;
  const isLive = auction.status === 'live';
  const actions = ALLOWED_TRANSITIONS[auction.status].filter((s) => HOSTING_ACTIONS.includes(s));

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>
            {auction.title}
          </Text>
          <View style={[styles.statusBadge, isLive && styles.statusBadgeLive]}>
            <Text style={[styles.statusText, isLive && styles.statusTextLive]}>
              {STATUS_LABEL[auction.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>{formatAuctionWindow(auction.startTime, auction.endTime)}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.bidLabel}>
            {Number(auction.currentBidMinor) > 0 ? 'Current bid' : 'Opening bid'}
          </Text>
          <Text style={styles.bidAmount}>{formatNaira(currentBid)}</Text>
        </View>
      </Pressable>

      {actions.length > 0 && (
        <View style={styles.actionsRow}>
          {actions.map((status) => (
            <Pressable
              key={status}
              style={[styles.actionButton, status === 'cancelled' && styles.actionButtonDanger]}
              onPress={() => onTransition(status)}
              disabled={pendingTransition !== null}
            >
              {pendingTransition === status ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{TRANSITION_LABEL[status]}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ManagedAuctionsScreen() {
  const { auctions, loading, refreshing, error, refresh } = useManagedAuctions();
  const [pending, setPending] = useState<{ id: string; status: AuctionStatus } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleTransition(id: string, status: AuctionStatus) {
    setPending({ id, status });
    setActionError(null);
    try {
      await transitionAuctionStatus(id, status);
      await refresh();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to update the auction'));
    } finally {
      setPending(null);
    }
  }

  if (loading && auctions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Auctions you host</Text>
      </View>

      {actionError && <Text style={styles.errorText}>{actionError}</Text>}

      {error && auctions.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {auctions.length === 0 && !error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No auctions assigned to you yet. A seller assigns you from their auction's edit screen.
          </Text>
        </View>
      )}

      <FlatList
        data={auctions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <ManagedAuctionCard
            auction={item}
            onPress={() => router.push(`/auction/${item.id}`)}
            onTransition={(status) => handleTransition(item.id, status)}
            pendingTransition={pending?.id === item.id ? pending.status : null}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#111827', flex: 1 },
  meta: { fontSize: 13, color: '#6b7280' },
  statusBadge: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeLive: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  statusTextLive: { color: '#15803d' },
  cardFooter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  bidLabel: { fontSize: 13, color: '#6b7280' },
  bidAmount: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonDanger: { backgroundColor: '#b91c1c' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  errorText: { fontSize: 14, color: '#b91c1c', textAlign: 'center', paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
