import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/client';

const DEMO_ACCOUNTS: { label: string; email: string }[] = [
  { label: 'Buyer', email: 'buyer@bideet.demo' },
  { label: 'Seller', email: 'seller@bideet.demo' },
  { label: 'Auction manager', email: 'manager@bideet.demo' },
  { label: 'Admin', email: 'admin@bideet.demo' },
];
const DEMO_PASSWORD = 'Demo1234';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillDemoAccount(demoEmail: string) {
    setMode('login');
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Enter your full name');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName.trim());
      }
      router.back();
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Log in to bid and sell on Bideet' : 'Sign up to start bidding or selling'}
          </Text>

          {mode === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{mode === 'login' ? 'Log in' : 'Sign up'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchModeText}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Text>
          </Pressable>

          {__DEV__ && (
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Try a demo account (dev only)</Text>
              <View style={styles.demoChipsRow}>
                {DEMO_ACCOUNTS.map((account) => (
                  <Pressable
                    key={account.email}
                    style={styles.demoChip}
                    onPress={() => fillDemoAccount(account.email)}
                  >
                    <Text style={styles.demoChipText}>{account.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
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
  error: { color: '#b91c1c', fontSize: 14 },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchModeText: { color: '#2563eb', textAlign: 'center', fontSize: 14, marginTop: 4 },
  demoSection: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  demoLabel: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  demoChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  demoChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoChipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
});
