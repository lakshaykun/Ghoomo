/**
 * Root layout – wraps everything in providers
 */
import '../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { RideProvider } from '../src/context/RideContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RideProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RideProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
