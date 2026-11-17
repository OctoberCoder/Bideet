import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import KeyboardScreen from '../components/KeyboardScreen';
import ProductForm from '../components/ProductForm';
import { deleteCatalogueItem, fetchCatalogueItem, updateCatalogueItem } from '../api/catalogue';
import type { ProductInput } from '../api/catalogue';
import { getErrorMessage } from '../api/client';
import type { Product } from '../types/product';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogueItem(id)
      .then(setProduct)
      .catch((err) => setLoadError(getErrorMessage(err, 'Failed to load the product')));
  }, [id]);

  async function handleSubmit(input: ProductInput) {
    setSubmitting(true);
    setError(null);
    try {
      await updateCatalogueItem(id, input);
      router.back();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save changes'));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Remove this product?', 'It will be deleted from your catalogue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          setError(null);
          try {
            await deleteCatalogueItem(id);
            router.back();
          } catch (err) {
            // e.g. the product is in an auction and locked.
            setError(getErrorMessage(err, 'Failed to remove the product'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
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
      <KeyboardScreen>
        <ProductForm
          initial={product}
          submitLabel="Save changes"
          submitting={submitting}
          serverError={error}
          onSubmit={handleSubmit}
        />
        <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={deleting || submitting}>
          {deleting ? <ActivityIndicator color="#b91c1c" /> : <Text style={styles.deleteText}>Remove from catalogue</Text>}
        </Pressable>
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});
