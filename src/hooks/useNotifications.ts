'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Registers the service worker, requests notification permission,
 * and subscribes to Supabase Realtime.
 * 
 * @param groupId – if provided, only listen to events in this group
 * @param currentUserId – suppress notifications for the current user's own actions
 * @param options - extra configuration
 */
export function useNotifications(
  groupId?: string, 
  currentUserId?: string, 
  options: { autoSubscribe?: boolean } = { autoSubscribe: true }
) {
  const swRegistered = useRef(false);
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(groupId);

  // Sync activeGroupId if prop changes
  useEffect(() => {
    setActiveGroupId(groupId);
  }, [groupId]);

  // Register service worker once
  useEffect(() => {
    if (swRegistered.current || typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => { swRegistered.current = true; })
        .catch((err) => console.warn('SW registration failed:', err));
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const sendLocalNotification = useCallback((payload: NotificationPayload) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        ...payload,
      });
    } else {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/icon-192.png',
        tag: payload.tag,
        data: { url: payload.url || '/dashboard' },
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    try {
      if (!currentUserId || typeof window === 'undefined') return;
      
      if (!VAPID_PUBLIC_KEY) {
        console.warn('Push subscription blocked: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.');
        return;
      }
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser.');
        return;
      }

      const sw = await navigator.serviceWorker.ready;
      
      // Check for existing subscription first
      const existingSub = await sw.pushManager.getSubscription();
      if (existingSub) {
        return;
      }

      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { endpoint, keys } = sub.toJSON();
      if (!endpoint || !keys) return;

      const { error } = await supabase
        .from('push_subscriptions')
        .insert([{
          user_id: currentUserId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }]);

      if (error) {
        // Handle duplicate subscription (user already subscribed)
        if (error.code !== '23505') throw error;
      }
    } catch (error) {
      console.warn('Push subscription failed:', error);
    }
  }, [currentUserId]);

  // Subscribe to realtime todos
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUserId || !options.autoSubscribe) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      const hasPermission = Notification.permission === 'granted';
      if (!hasPermission) return;

      // If no groupId, we listen to all groups the user is in
      // Supabase's realtime filter is limited, so we either:
      // 1. Subscribe to everything and filter client-side (easier for small sets)
      // 2. Or just subscribe to the specific group if provided.
      
      const filter = activeGroupId ? `group_id=eq.${activeGroupId}` : undefined;

      channel = supabase
        .channel(`todo-notifications-${activeGroupId || 'global'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'todos',
            ...(filter ? { filter } : {}),
          },
          async (payload) => {
            const todo = payload.new as { title: string; creator_id: string; group_id: string };
            if (todo.creator_id === currentUserId) return;

            // If global, verify user is in this group
            if (!activeGroupId) {
              const { data: isMember } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('group_id', todo.group_id)
                .eq('user_id', currentUserId)
                .single();
              if (!isMember) return;
            }

            sendLocalNotification({
              title: '🌱 Neue Aufgabe',
              body: todo.title,
              url: `/group/${todo.group_id}`,
              tag: `todo-${todo.group_id}`,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'todos',
            ...(filter ? { filter } : {}),
          },
          async (payload) => {
            const oldTodo = payload.old as { status: string };
            const newTodo = payload.new as { status: string; title: string; group_id: string, creator_id: string };
            
            if (oldTodo.status === 'pending' && newTodo.status === 'completed') {
              // Only notify if user is in global mode or it matches active group
              if (!activeGroupId) {
                const { data: isMember } = await supabase
                  .from('group_members')
                  .select('group_id')
                  .eq('group_id', newTodo.group_id)
                  .eq('user_id', currentUserId)
                  .single();
                if (!isMember) return;
              }

              sendLocalNotification({
                title: '✅ Aufgabe erledigt',
                body: `"${newTodo.title}" wurde abgeschlossen!`,
                url: `/group/${newTodo.group_id}`,
                tag: `todo-done-${newTodo.group_id}`,
              });
            }
          }
        )
        .subscribe();
    };

    void subscribe();

    if (Notification.permission === 'granted') {
      void subscribeToPush();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeGroupId, currentUserId, sendLocalNotification, subscribeToPush]);

  return { requestPermission, sendLocalNotification, subscribeToPush };
}
