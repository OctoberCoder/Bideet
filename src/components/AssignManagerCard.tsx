import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { assignAuctionManager, lookupAuctionManagerByEmail } from '../api/auctions';
import { getErrorMessage } from '../api/client';
import type { Auction } from '../types/auction';

interface Props {
  auction: Auction;
  onAssigned: (auction: Auction) => void;
}

export default function AssignManagerCard({ auction, onAssigned }: Props) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!email.trim()) {
      setError('Enter the auction manager\'s email');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const profile = await lookupAuctionManagerByEmail(email.trim());
      const updated = await assignAuctionManager(auction.id, profile.id);
      onAssigned(updated);
      setEmail('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to assign that auction manager'));
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassign() {
    setBusy(true);
    setError(null);
    try {
      const updated = await assignAuctionManager(auction.id, null);
      onAssigned(updated);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove the auction manager'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Auction manager</Text>
      <Text style={styles.subtitle}>
        Have a professional auction manager host and run this auction's live session on your behalf.
      </Text>

      {auction.auctionManagerId ? (
        <View style={styles.assignedRow}>
          <Text style={styles.assignedText}>An auction manager is assigned to this auction.</Text>
          <Pressable style={styles.unassignButton} onPress={handleUnassign} disabled={busy}>
            {busy ? <ActivityIndicator size="small" color="#b91c1c" /> : <Text style={styles.unassignButtonText}>Remove</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.assignRow}>
          <TextInput
            style={styles.input}
            placeholder="manager@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable style={styles.assignButton} onPress={handleAssign} disabled={busy}>
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.assignButtonText}>Assign</Text>}
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  assignRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  assignButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  assignedText: { fontSize: 13, color: '#374151', flex: 1 },
  unassignButton: { paddingHorizontal: 10, paddingVertical: 6 },
  unassignButtonText: { color: '#b91c1c', fontWeight: '700', fontSize: 13 },
  error: { fontSize: 13, color: '#b91c1c' },
});
