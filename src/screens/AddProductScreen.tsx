import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import KeyboardScreen from '../components/KeyboardScreen';
import ProductForm from '../components/ProductForm';
import { createCatalogueItem } from '../api/catalogue';
import type { ProductInput } from '../api/catalogue';
import { getErrorMessage } from '../api/client';

export default function AddProductScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: ProductInput) {
    setSubmitting(true);
    setError(null);
    try {
      await createCatalogueItem(input);
      router.back();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add the product'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardScreen>
        <ProductForm submitLabel="Add to catalogue" submitting={submitting} serverError={error} onSubmit={handleSubmit} />
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
});
