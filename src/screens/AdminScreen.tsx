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
import { useOpenDisputes } from '../hooks/useOpenDisputes';
import { resolveDispute } from '../api/orders';
import { getErrorMessage } from '../api/client';
import type { Dispute, DisputeResolution } from '../api/orders';

function DisputeCard({
  dispute,
  onResolve,
  pendingResolution,
}: {
  dispute: Dispute;
  onResolve: (resolution: DisputeResolution) => void;
  pendingResolution: DisputeResolution | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.orderId}>Order {dispute.orderId.slice(0, 8)}</Text>
      <Text style={styles.reason}>{dispute.reason}</Text>
      <Text style={styles.meta}>Raised {new Date(dispute.createdAt).toLocaleString()}</Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionButton, styles.releaseButton]}
          onPress={() => onResolve('release')}
          disabled={pendingResolution !== null}
        >
          {pendingResolution === 'release' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Release to seller</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.refundButton]}
          onPress={() => onResolve('refund')}
          disabled={pendingResolution !== null}
        >
          {pendingResolution === 'refund' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Refund buyer</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { disputes, loading, refreshing, error, refresh } = useOpenDisputes();
  const [pending, setPending] = useState<{ id: string; resolution: DisputeResolution } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleResolve(id: string, resolution: DisputeResolution) {
    setPending({ id, resolution });
    setActionError(null);
    try {
      await resolveDispute(id, resolution);
      await refresh();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to resolve that dispute'));
    } finally {
      setPending(null);
    }
  }

  if (loading && disputes.length === 0) {
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
        <Text style={styles.screenTitle}>Admin</Text>
        <Text style={styles.screenSubtitle}>Open disputes awaiting resolution</Text>
      </View>

      {actionError && <Text style={styles.errorText}>{actionError}</Text>}

      {error && disputes.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {disputes.length === 0 && !error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No open disputes right now.</Text>
        </View>
      )}

      <FlatList
        data={disputes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <DisputeCard
            dispute={item}
            onResolve={(resolution) => handleResolve(item.id, resolution)}
            pendingResolution={pending?.id === item.id ? pending.resolution : null}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 2 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  screenSubtitle: { fontSize: 13, color: '#6b7280' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: '#111827' },
  reason: { fontSize: 15, color: '#374151' },
  meta: { fontSize: 12, color: '#6b7280' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  releaseButton: { backgroundColor: '#2563eb' },
  refundButton: { backgroundColor: '#b91c1c' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  errorText: { fontSize: 14, color: '#b91c1c', textAlign: 'center', paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
