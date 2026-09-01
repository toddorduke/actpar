import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Expo push only works on physical iOS/Android devices via a native build --
// it's a no-op on web (this codebase's only testable target in this
// environment) and on simulators without a real push credential. Callers
// should treat a null return as "not available here", not an error.
export async function registerForPushNotifications(userId) {
  if (Platform.OS === 'web' || !Device.isDevice || !userId) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  if (!token) return null;

  await supabase.from('expo_push_tokens').upsert(
    { user_id: userId, token },
    { onConflict: 'user_id,token' }
  );

  return token;
}
