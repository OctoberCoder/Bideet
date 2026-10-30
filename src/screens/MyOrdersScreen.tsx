import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fetchSoldOrders, fetchWonOrders } from '../api/orders';
import type { Order, OrderStatus } from '../api/orders';
import { getErrorMessage } from '../api/client';
import { formatNaira } from '../utils/format';

type Tab = 'won' | 'sold';

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_dispatch: 'Awaiting dispatch',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  confirmed: 'Complete',
  disputed: 'Disputed',
  refunded: 'Refunded',
};

const DONE_STATUSES = new Set<OrderStatus>(['confirmed', 'refunded']);

export default function MyOrdersScreen() {
  const [tab, setTab] = useState<Tab>('won');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const data = which === 'won' ? await fetchWonOrders() : await fetchSoldOrders();
      setOrders(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'won' && styles.tabActive]} onPress={() => setTab('won')}>
          <Text style={[styles.tabText, tab === 'won' && styles.tabTextActive]}>Won</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'sold' && styles.tabActive]} onPress={() => setTab('sold')}>
          <Text style={[styles.tabText, tab === 'sold' && styles.tabTextActive]}>Sold</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {tab === 'won' ? "You haven't won any auctions yet." : "You haven't sold anything yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/auction/${item.auctionId}`)}>
              <View style={styles.cardRow}>
                <Text style={styles.amount}>{formatNaira(item.amountMinor)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'disputed' && styles.statusBadgeDispute,
                    DONE_STATUSES.has(item.status) && styles.statusBadgeDone,
                  ]}
                >
                  <Text style={styles.statusText}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  tabRow: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  statusBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeDispute: { backgroundColor: '#fee2e2' },
  statusBadgeDone: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  date: { fontSize: 13, color: '#6b7280' },
});
