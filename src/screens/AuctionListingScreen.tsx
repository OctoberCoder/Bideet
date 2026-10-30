import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuctions } from '../hooks/useAuctions';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/client';
import { formatAuctionWindow, formatNaira } from '../utils/format';
import type { Auction } from '../types/auction';

const STATUS_LABEL: Record<Auction['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live now',
  paused: 'Paused',
  completed: 'Ended',
  cancelled: 'Cancelled',
};

function AuctionCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const currentBid = Number(auction.currentBidMinor) > 0 ? auction.currentBidMinor : auction.openingBidMinor;
  const isLive = auction.status === 'live';
  return (
    <Pressable style={styles.card} onPress={onPress}>
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
  );
}

export default function AuctionListingScreen() {
  const { auctions, loading, refreshing, error, isShowingCache, refresh } = useAuctions();
  const {
    user,
    isSeller,
    isAuctionManager,
    isAdmin,
    isLoading: authLoading,
    logout,
    becomeSeller,
    becomeAuctionManager,
  } = useAuth();
  const [upgrading, setUpgrading] = React.useState<'seller' | 'auction_manager' | null>(null);

  async function handleBecomeSeller() {
    setUpgrading('seller');
    try {
      await becomeSeller();
      Alert.alert('You can now sell', 'Look for the + button to create your first auction.');
    } catch (err) {
      Alert.alert('Could not start selling', getErrorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setUpgrading(null);
    }
  }

  async function handleBecomeAuctionManager() {
    setUpgrading('auction_manager');
    try {
      await becomeAuctionManager();
      Alert.alert('You are now a host', 'Open "My hosting" to see auctions assigned to you.');
    } catch (err) {
      Alert.alert('Could not become a host', getErrorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setUpgrading(null);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Auctions</Text>
          {isShowingCache && <Text style={styles.offlineBadge}>Showing saved data</Text>}
        </View>
        {!authLoading && !user && (
          <Pressable style={styles.authButton} onPress={() => router.push('/login')}>
            <Text style={styles.authButtonText}>Log in</Text>
          </Pressable>
        )}
        {!authLoading && user && (
          <View style={styles.headerActions}>
            <Pressable style={styles.authButton} onPress={() => router.push('/orders')}>
              <Text style={styles.authButtonText}>My orders</Text>
            </Pressable>
            {isAuctionManager && (
              <Pressable style={styles.authButton} onPress={() => router.push('/managed')}>
                <Text style={styles.authButtonText}>My hosting</Text>
              </Pressable>
            )}
            {isAdmin && (
              <Pressable style={styles.authButton} onPress={() => router.push('/admin')}>
                <Text style={styles.authButtonText}>Admin</Text>
              </Pressable>
            )}
            {!isSeller && (
              <Pressable
                style={styles.authButton}
                onPress={handleBecomeSeller}
                disabled={upgrading !== null}
              >
                {upgrading === 'seller' ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={styles.authButtonText}>Start selling</Text>
                )}
              </Pressable>
            )}
            {!isAuctionManager && (
              <Pressable
                style={styles.authButton}
                onPress={handleBecomeAuctionManager}
                disabled={upgrading !== null}
              >
                {upgrading === 'auction_manager' ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={styles.authButtonText}>Become a host</Text>
                )}
              </Pressable>
            )}
            <Pressable style={styles.authButton} onPress={() => logout()}>
              <Text style={styles.authButtonText}>Log out</Text>
            </Pressable>
          </View>
        )}
      </View>

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
          <Text style={styles.emptyText}>No published auctions yet.</Text>
        </View>
      )}

      <FlatList
        data={auctions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <AuctionCard
            auction={item}
            onPress={() => router.push(`/auction/${item.id}`)}
          />
        )}
      />

      {isSeller && (
        <Pressable style={styles.fab} onPress={() => router.push('/auction/create')}>
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: 220,
  },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#111827' },
  offlineBadge: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  authButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  authButtonText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: -2 },
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
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center' },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#6b7280' },
});
