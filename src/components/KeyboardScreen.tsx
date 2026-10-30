import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
}

/**
 * Standard wrapper for any screen with text inputs: ScrollView so the focused
 * input auto-scrolls into view, KeyboardAvoidingView so iOS doesn't leave the
 * keyboard covering it (Android handles this itself via the default
 * windowSoftInputMode="adjustResize" — see app.json — so `behavior` is
 * intentionally undefined there; setting one too would double-shrink content).
 */
export default function KeyboardScreen({ children, contentContainerStyle }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 48 },
});
