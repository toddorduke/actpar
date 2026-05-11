import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = () => {
  const { user } = useContext(AuthContext);
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Register service worker on mount
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, [supported]);

  // Check if already subscribed in DB
  useEffect(() => {
    if (!user || !supported) return;
    const check = async () => {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (!existing) { setSubscribed(false); return; }
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', existing.endpoint)
        .maybeSingle();
      setSubscribed(!!data);
    };
    check();
  }, [user, supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { endpoint, keys } = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'endpoint' });

      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }, [user, supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user, supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
};
