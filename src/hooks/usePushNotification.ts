import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'default';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotification() {
  const [status, setStatus]               = useState<PushStatus>('default');
  const [subscription, setSubscription]   = useState<PushSubscription | null>(null);
  const [loading, setLoading]             = useState(false);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!isSupported) { setStatus('unsupported'); return; }
    setStatus(Notification.permission as PushStatus);
  }, [isSupported]);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setStatus(perm as PushStatus);
      if (perm !== 'granted') return false;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setSubscription(sub);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const json   = sub.toJSON();
        const keys   = json.keys as { p256dh: string; auth: string };
        const { error } = await supabase.from('push_subscriptions').insert({
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh:   keys.p256dh,
          auth:     keys.auth,
        });
        if (error && error.code !== '23505') console.error('Failed to save push sub:', error);

        // Enable notifications on profile
        await supabase.from('user_profiles')
          .update({ notification_enabled: true })
          .eq('id', user.id);
      }
      return true;
    } catch (err) {
      console.error('Push subscribe error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    await subscription.unsubscribe();
    setSubscription(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').update({ notification_enabled: false }).eq('id', user.id);
    }
  };

  const saveNotificationTime = async (time: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('user_profiles')
      .update({ notification_time: time })
      .eq('id', user.id);
    if (error) console.error('Failed to save notification time:', error);
  };

  return { status, subscription, loading, isSupported, subscribe, unsubscribe, saveNotificationTime };
}
