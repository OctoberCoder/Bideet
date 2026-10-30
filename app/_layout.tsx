import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auction/[id]" options={{ title: 'Auction' }} />
          <Stack.Screen name="auction/create" options={{ title: 'New auction', presentation: 'modal' }} />
          <Stack.Screen name="auction/[id]/edit" options={{ title: 'Edit auction', presentation: 'modal' }} />
          <Stack.Screen name="login" options={{ title: 'Log in', presentation: 'modal' }} />
          <Stack.Screen name="managed" options={{ title: 'Auctions you host' }} />
          <Stack.Screen name="orders" options={{ title: 'My orders' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
