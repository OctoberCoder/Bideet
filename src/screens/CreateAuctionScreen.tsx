import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AuctionForm from '../components/AuctionForm';
import KeyboardScreen from '../components/KeyboardScreen';
import { createAuction } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import type { AuctionFormInput } from '../api/auctions';

export default function CreateAuctionScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: AuctionFormInput) {
    setSubmitting(true);
    setError(null);
    try {
      const auction = await createAuction(input);
      router.replace(`/auction/${auction.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create auction'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardScreen>
        <AuctionForm submitLabel="Save as draft" submitting={submitting} serverError={error} onSubmit={handleSubmit} />
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
});
