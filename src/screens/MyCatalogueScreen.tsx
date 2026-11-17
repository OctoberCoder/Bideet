import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCatalogue } from '../hooks/useCatalogue';
import { formatNaira } from '../utils/format';
import type { Product } from '../types/product';

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.condition}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {product.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerLabel}>Starting bid</Text>
        <Text style={styles.price}>{formatNaira(product.openingBidMinor)}</Text>
      </View>
    </Pressable>
  );
}

export default function MyCatalogueScreen() {
  const { items, loading, refreshing, error, refresh, reload } = useCatalogue();

  // Pick up adds/edits/deletes made on the other screens when returning here.
  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading && items.length === 0) {
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
      {error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={reload}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Your catalogue is empty</Text>
              <Text style={styles.emptyText}>
                Add the products you want to sell. You can apply them to an auction later.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => router.push(`/catalogue/${item.id}`)} />
          )}
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/catalogue/new')}>
        <Text style={styles.fabText}>+ Add product</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  listContent: { padding: 16, paddingBottom: 96, gap: 12 },
  emptyContainer: { flexGrow: 1 },
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
  badge: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  description: { fontSize: 14, color: '#6b7280' },
  cardFooter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  footerLabel: { fontSize: 13, color: '#6b7280' },
  price: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  errorText: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  primaryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
