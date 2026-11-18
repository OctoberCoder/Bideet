import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ProductInput } from '../api/catalogue';
import type { Product } from '../types/product';
import { minorToNairaField, nairaToMinor } from '../utils/money';

interface Props {
  initial?: Product;
  submitLabel: string;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (input: ProductInput) => void;
}

function parseImages(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProductForm({ initial, submitLabel, submitting, serverError, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [condition, setCondition] = useState(initial?.condition ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '1');
  const [openingBid, setOpeningBid] = useState(minorToNairaField(initial?.openingBidMinor));
  const [bidIncrement, setBidIncrement] = useState(minorToNairaField(initial?.bidIncrementMinor));
  const [images, setImages] = useState((initial?.images ?? []).join('\n'));
  const [sellerTerms, setSellerTerms] = useState(initial?.sellerTerms ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit() {
    setFormError(null);

    if (title.trim().length < 3) return setFormError('Title must be at least 3 characters');
    if (description.trim().length < 10) return setFormError('Description must be at least 10 characters');
    if (!condition.trim()) return setFormError('Describe the item condition (e.g. New, Used – good)');

    const openingBidMinor = nairaToMinor(openingBid);
    if (!openingBidMinor || openingBidMinor <= 0) return setFormError('Enter a valid starting bid');
    const bidIncrementMinor = nairaToMinor(bidIncrement);
    if (!bidIncrementMinor || bidIncrementMinor <= 0) return setFormError('Enter a valid bid increment');

    const parsedQuantity = quantity.trim() ? Number(quantity) : 1;
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return setFormError('Quantity must be a whole number of at least 1');
    }
    const imageList = parseImages(images);
    if (imageList.length > 10) return setFormError('You can add up to 10 images');

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      condition: condition.trim(),
      category: category.trim() || undefined,
      quantity: parsedQuantity,
      openingBidMinor,
      bidIncrementMinor,
      images: imageList,
      sellerTerms: sellerTerms.trim() || undefined,
    });
  }

  return (
    <View style={styles.content}>
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
          placeholder="What it is, what's included, any flaws..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </Field>

      <View style={styles.row}>
        <Field label="Condition" style={styles.flexField}>
          <TextInput
            style={styles.input}
            placeholder="Used – good"
            placeholderTextColor="#9ca3af"
            value={condition}
            onChangeText={setCondition}
          />
        </Field>
        <Field label="Category (optional)" style={styles.flexField}>
          <TextInput
            style={styles.input}
            placeholder="Electronics"
            placeholderTextColor="#9ca3af"
            value={category}
            onChangeText={setCategory}
          />
        </Field>
      </View>

      <View style={styles.row}>
        <Field label="Starting bid (₦)" style={styles.flexField}>
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

      <Field label="Image links (optional, one per line)">
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="https://..."
          placeholderTextColor="#9ca3af"
          value={images}
          onChangeText={setImages}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={3}
        />
      </Field>

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
