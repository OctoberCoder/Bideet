import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuctionDetail } from '../hooks/useAuctionDetail';
import { useLiveAuctionRoom } from '../hooks/useLiveAuctionRoom';
import { useAuth } from '../auth/AuthContext';
import { transitionAuctionStatus } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import { formatAuctionWindow, formatNaira } from '../utils/format';
import BiddingPanel from '../components/BiddingPanel';
import AuctionResultBanner from '../components/AuctionResultBanner';
import KeyboardScreen from '../components/KeyboardScreen';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { auction, loading, error, isShowingCache, refresh } = useAuctionDetail(id ?? '');
  const { bids, liveCurrentBid, liveEndTime, liveStatus } = useLiveAuctionRoom(id ?? '');
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (liveStatus === 'completed') refresh();
  }, [liveStatus, refresh]);

  if (loading && !auction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!auction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Auction not found'}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentBid =
    liveCurrentBid ?? (Number(auction.currentBidMinor) > 0 ? auction.currentBidMinor : auction.openingBidMinor);
  const isOwner = user?.userId === auction.sellerId;
  const isManager = user?.userId === auction.auctionManagerId;

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      await transitionAuctionStatus(auction!.id, 'scheduled');
      refresh();
    } catch (err) {
      setPublishError(getErrorMessage(err, 'Failed to publish auction'));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardScreen contentContainerStyle={styles.content}>
        {isShowingCache && <Text style={styles.offlineBadge}>Showing saved data — pull to refresh</Text>}

        {isOwner && (
          <View style={styles.ownerBar}>
            <Text style={styles.ownerBarText}>
              {auction.status === 'draft' ? 'Draft — only visible to you' : 'You own this auction'}
            </Text>
            {auction.status === 'draft' && (
              <Pressable onPress={() => router.push(`/auction/${auction.id}/edit`)}>
                <Text style={styles.ownerBarLink}>Edit</Text>
              </Pressable>
            )}
          </View>
        )}

        {!isOwner && isManager && (
          <View style={styles.ownerBar}>
            <Text style={styles.ownerBarText}>You're hosting this auction</Text>
            <Pressable onPress={() => router.push('/managed')}>
              <Text style={styles.ownerBarLink}>Manage</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.title}>{auction.title}</Text>
        <Text style={styles.meta}>{formatAuctionWindow(auction.startTime, auction.endTime)}</Text>

        {isOwner && auction.status === 'draft' && (
          <View>
            {publishError && <Text style={styles.errorText}>{publishError}</Text>}
            <Pressable style={styles.publishButton} onPress={handlePublish} disabled={publishing}>
              {publishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.publishButtonText}>Publish auction</Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.bidCard}>
          <Text style={styles.bidLabel}>
            {liveCurrentBid != null || Number(auction.currentBidMinor) > 0 ? 'Current bid' : 'Opening bid'}
          </Text>
          <Text style={styles.bidAmount}>{formatNaira(currentBid)}</Text>
          <Text style={styles.increment}>
            Bid increment: {formatNaira(auction.bidIncrementMinor)}
          </Text>
        </View>

        <AuctionResultBanner auction={auction} statusOverride={liveStatus} />

        <BiddingPanel
          auction={auction}
          liveCurrentBid={liveCurrentBid}
          liveEndTime={liveEndTime}
          liveStatus={liveStatus}
          bids={bids}
          onBidPlaced={refresh}
        />

        <Section title="Description">
          <Text style={styles.body}>{auction.description}</Text>
        </Section>

        <Section title="Details">
          <DetailRow label="Type" value={auction.type === 'live' ? 'Live auction' : 'Timed auction'} />
          <DetailRow label="Quantity" value={String(auction.quantity)} />
          {auction.condition && <DetailRow label="Condition" value={auction.condition} />}
          {auction.category && <DetailRow label="Category" value={auction.category} />}
          {auction.reservePriceMinor != null && (
            <DetailRow label="Reserve price" value={formatNaira(auction.reservePriceMinor)} />
          )}
          {isOwner && (
            <DetailRow
              label="Auction manager"
              value={auction.auctionManagerId ? 'Assigned' : 'None — self-hosted'}
            />
          )}
        </Section>

        {auction.sellerTerms && (
          <Section title="Seller terms">
            <Text style={styles.body}>{auction.sellerTerms}</Text>
          </Section>
        )}

      </KeyboardScreen>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  offlineBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ownerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownerBarText: { fontSize: 13, color: '#3730a3', fontWeight: '500' },
  ownerBarLink: { fontSize: 13, color: '#2563eb', fontWeight: '700' },
  publishButton: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  publishButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6b7280' },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bidLabel: { fontSize: 13, color: '#6b7280' },
  bidAmount: { fontSize: 28, fontWeight: '700', color: '#2563eb' },
  increment: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center' },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
});
