import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuctionFormInput } from '../api/auctions';
import type { Auction, AuctionType } from '../types/auction';
import { combineDateTimeToIso, isoToDateField, isoToTimeField } from '../utils/dateFields';

interface Props {
  initial?: Auction;
  submitLabel: string;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (input: AuctionFormInput) => void;
}

function nairaToMinor(value: string): number | undefined {
  const cleaned = value.replace(/[,\s]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return undefined;
  return Math.round(parsed * 100);
}

function minorToNairaField(minor?: number | null): string {
  if (minor == null) return '';
  return String(Number(minor) / 100);
}

export default function AuctionForm({ initial, submitLabel, submitting, serverError, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [condition, setCondition] = useState(initial?.condition ?? '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '1');
  const [type] = useState<AuctionType>('timed'); // live (YouTube) auctions are not available yet
  const [openingBid, setOpeningBid] = useState(minorToNairaField(initial?.openingBidMinor));
  const [reservePrice, setReservePrice] = useState(minorToNairaField(initial?.reservePriceMinor));
  const [bidIncrement, setBidIncrement] = useState(minorToNairaField(initial?.bidIncrementMinor));
  const [startDate, setStartDate] = useState(isoToDateField(initial?.startTime));
  const [startTime, setStartTime] = useState(isoToTimeField(initial?.startTime) || '10:00');
  const [endDate, setEndDate] = useState(isoToDateField(initial?.endTime));
  const [endTime, setEndTime] = useState(isoToTimeField(initial?.endTime) || '10:00');
  const [sellerTerms, setSellerTerms] = useState(initial?.sellerTerms ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit() {
    setFormError(null);

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Title must be at least 3 characters');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }
    const openingBidMinor = nairaToMinor(openingBid);
    if (!openingBidMinor || openingBidMinor <= 0) {
      setFormError('Enter a valid opening bid');
      return;
    }
    const bidIncrementMinor = nairaToMinor(bidIncrement);
    if (!bidIncrementMinor || bidIncrementMinor <= 0) {
      setFormError('Enter a valid bid increment');
      return;
    }
    const reservePriceMinor = reservePrice.trim() ? nairaToMinor(reservePrice) : undefined;
    if (reservePrice.trim() && (reservePriceMinor == null || reservePriceMinor < openingBidMinor)) {
      setFormError('Reserve price must be at or above the opening bid');
      return;
    }
    const startIso = combineDateTimeToIso(startDate, startTime);
    if (!startIso) {
      setFormError('Enter a valid start date and time (YYYY-MM-DD, HH:mm)');
      return;
    }
    const endIso = combineDateTimeToIso(endDate, endTime);
    if (!endIso) {
      setFormError('Enter a valid end date and time (YYYY-MM-DD, HH:mm)');
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setFormError('End time must be after start time');
      return;
    }
    const parsedQuantity = quantity.trim() ? Number(quantity) : 1;
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setFormError('Quantity must be a whole number of at least 1');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
      condition: condition.trim() || undefined,
      quantity: parsedQuantity,
      type,
      openingBidMinor,
      bidIncrementMinor,
      reservePriceMinor,
      startTime: startIso,
      endTime: endIso,
      sellerTerms: sellerTerms.trim() || undefined,
    });
  }

  return (
    <View style={styles.content}>
        <View style={styles.typeNotice}>
          <Text style={styles.typeNoticeText}>
            Timed auction (fixed start/end time). Live, YouTube-streamed auctions aren't available yet —
            that streaming design is still being finalised.
          </Text>
        </View>

        <Field label="Title">
          <TextInput
            style={styles.input}
            placeholder="e.g. Vintage 35mm film camera"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Condition, what's included, why it's worth bidding on..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </Field>

        <View style={styles.row}>
          <Field label="Category (optional)" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="Electronics"
              placeholderTextColor="#9ca3af"
              value={category}
              onChangeText={setCategory}
            />
          </Field>
          <Field label="Condition (optional)" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="Used – good"
              placeholderTextColor="#9ca3af"
              value={condition}
              onChangeText={setCondition}
            />
          </Field>
        </View>

        <Field label="Quantity">
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#9ca3af"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
        </Field>

        <View style={styles.row}>
          <Field label="Opening bid (₦)" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="5000"
              placeholderTextColor="#9ca3af"
              value={openingBid}
              onChangeText={setOpeningBid}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Bid increment (₦)" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="500"
              placeholderTextColor="#9ca3af"
              value={bidIncrement}
              onChangeText={setBidIncrement}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>

        <Field label="Reserve price (₦, optional)">
          <TextInput
            style={styles.input}
            placeholder="Minimum price to accept"
            placeholderTextColor="#9ca3af"
            value={reservePrice}
            onChangeText={setReservePrice}
            keyboardType="decimal-pad"
          />
        </Field>

        <Text style={styles.sectionTitle}>Start</Text>
        <View style={styles.row}>
          <Field label="Date" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={startDate}
              onChangeText={setStartDate}
            />
          </Field>
          <Field label="Time" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="HH:mm"
              placeholderTextColor="#9ca3af"
              value={startTime}
              onChangeText={setStartTime}
            />
          </Field>
        </View>

        <Text style={styles.sectionTitle}>End</Text>
        <View style={styles.row}>
          <Field label="Date" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={endDate}
              onChangeText={setEndDate}
            />
          </Field>
          <Field label="Time" style={styles.flexField}>
            <TextInput
              style={styles.input}
              placeholder="HH:mm"
              placeholderTextColor="#9ca3af"
              value={endTime}
              onChangeText={setEndTime}
            />
          </Field>
        </View>

        <Field label="Seller terms (optional)">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Delivery expectations, return policy, etc."
            placeholderTextColor="#9ca3af"
            value={sellerTerms}
            onChangeText={setSellerTerms}
            multiline
            numberOfLines={3}
          />
        </Field>

        {(formError || serverError) && <Text style={styles.error}>{formError ?? serverError}</Text>}

        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{submitLabel}</Text>}
        </Pressable>
    </View>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  typeNotice: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12 },
  typeNoticeText: { fontSize: 13, color: '#1d4ed8', lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  flexField: { flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 4 },
  error: { color: '#b91c1c', fontSize: 14 },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
