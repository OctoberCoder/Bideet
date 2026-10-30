import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * expo-secure-store has no web implementation, so the browser preview falls
 * back to AsyncStorage there. Native builds always use the Keychain/Keystore.
 */
const ACCESS_KEY = 'bideet:accessToken';
const REFRESH_KEY = 'bideet:refreshToken';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  try {
    const value = await SecureStore.getItemAsync(key);
    // A prior save may have fallen back to AsyncStorage (see setItem) — check there too.
    return value ?? AsyncStorage.getItem(key);
  } catch (err) {
    console.warn(`SecureStore.getItemAsync failed for "${key}", falling back to AsyncStorage`, err);
    return AsyncStorage.getItem(key);
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    // Some devices/Android versions fail to initialize the Keystore (e.g. no
    // lock screen set, a fresh AVD, certain OEM ROMs) — expo-secure-store
    // throws rather than degrading gracefully. Falling back to AsyncStorage
    // keeps login/signup working there instead of hard-failing auth entirely;
    // it's less secure (not OS-encrypted) but only holds short-lived JWTs.
    console.warn(`SecureStore.setItemAsync failed for "${key}", falling back to AsyncStorage`, err);
    await AsyncStorage.setItem(key, value);
  }
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key).catch(() => undefined); // clears any fallback-stored copy too
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`SecureStore.deleteItemAsync failed for "${key}"`, err);
  }
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([setItem(ACCESS_KEY, tokens.accessToken), setItem(REFRESH_KEY, tokens.refreshToken)]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
}
