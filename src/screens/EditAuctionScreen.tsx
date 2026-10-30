import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AuctionForm from '../components/AuctionForm';
import AssignManagerCard from '../components/AssignManagerCard';
import KeyboardScreen from '../components/KeyboardScreen';
import { fetchMyAuctionById, transitionAuctionStatus, updateAuction } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import type { Auction } from '../types/auction';
import type { AuctionFormInput } from '../api/auctions';

export default function EditAuctionScreen({ auctionId }: { auctionId: string }) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyAuctionById(auctionId);
        setAuction(data);
      } catch (err) {
        setLoadError(getErrorMessage(err, 'Failed to load auction'));
      } finally {
        setLoading(false);
      }
    })();
  }, [auctionId]);

  async function handleSubmit(input: AuctionFormInput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateAuction(auctionId, input);
      router.replace(`/auction/${auctionId}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to save changes'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelAuction() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await transitionAuctionStatus(auctionId, 'cancelled');
      router.replace(`/auction/${auctionId}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to cancel auction'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
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
          <Text style={styles.errorText}>{loadError ?? 'Auction not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canAssignManager = auction.status !== 'completed' && auction.status !== 'cancelled';

  // Terms are locked once an auction is published (PRD 8.2: explicit state transitions
  // only) — the backend rejects a PATCH here, so editing is offered only for drafts.
  if (auction.status !== 'draft') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardScreen contentContainerStyle={styles.lockedContent}>
          <View style={styles.lockedInfo}>
            <Text style={styles.lockedTitle}>This auction is published</Text>
            <Text style={styles.lockedBody}>
              Terms are locked once an auction leaves draft status. Cancel it to stop the auction, or
              contact support if something needs correcting.
            </Text>
            {submitError && <Text style={styles.errorText}>{submitError}</Text>}
            <Pressable style={styles.cancelButton} onPress={handleCancelAuction} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel this auction</Text>
              )}
            </Pressable>
          </View>
          {canAssignManager && (
            <AssignManagerCard auction={auction} onAssigned={setAuction} />
          )}
        </KeyboardScreen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardScreen contentContainerStyle={styles.draftWrapper}>
        <AssignManagerCard auction={auction} onAssigned={setAuction} />
        <AuctionForm
          initial={auction}
          submitLabel="Save changes"
          submitting={submitting}
          serverError={submitError}
          onSubmit={handleSubmit}
        />
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6fb' },
  draftWrapper: { gap: 16 },
  lockedContent: { gap: 16 },
  lockedInfo: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center' },
  lockedTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  lockedBody: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  cancelButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: { color: '#fff', fontWeight: '700' },
});
