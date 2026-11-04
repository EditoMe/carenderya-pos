import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { PosProvider } from '@/store/pos';
import { PhotosProvider } from '@/store/photos';
import { AdminProvider } from '@/store/admin';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // Landscape-first POS: tablets/phones lock to landscape.
    // Web has limited support — never let it throw.
    (async () => {
      try {
        if (Platform.OS === 'web') return;
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {
        // ignore — orientation lock is best-effort
      }
    })();
  }, []);

  return (
    <PosProvider>
      <PhotosProvider>
        <AdminProvider>
          <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, orientation: 'landscape' }} />
        <Stack.Screen
          name="checkout"
          options={{ presentation: 'modal', headerShown: false, orientation: 'landscape' }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ title: 'Order Detail', orientation: 'landscape' }}
        />
      </Stack>
        </AdminProvider>
      </PhotosProvider>
    </PosProvider>
  );
}
