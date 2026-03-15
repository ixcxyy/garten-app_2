'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Registers the service worker, requests notification permission,
 * and subscribes to Supabase Realtime so that when any group member
 * creates a new todo, a browser notification is fired.
 *
 * @param groupId – if provided, only listen to events in this group
 * @param currentUserId – suppress notifications for the current user's own actions
 */
export function useNotifications(groupId?: string, currentUserId?: string) {
  const swRegistered = useRef(false);

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
      // Send via SW for better reliability
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        ...payload,
      });
    } else {
      // Fallback: direct browser notification
      new Notification(payload.title, {
        body: payload.body,
        icon: '/icon-192.png',
        tag: payload.tag,
        data: { url: payload.url || '/dashboard' },
      });
    }
  }, []);

  // Subscribe to realtime todos for the given group
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const filter = groupId ? `group_id=eq.${groupId}` : undefined;

      channel = supabase
        .channel('todo-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'todos',
            ...(filter ? { filter } : {}),
          },
          (payload) => {
            const todo = payload.new as { title: string; creator_id: string; group_id: string };

            // Don't notify user about their own actions
            if (currentUserId && todo.creator_id === currentUserId) return;

            sendLocalNotification({
              title: '🌱 Neue Aufgabe',
              body: todo.title,
              url: `/group/${todo.group_id}`,
              tag: `todo-${todo.group_id}`,
            });
          }
        )
        .subscribe();
    };

    void subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId, requestPermission, sendLocalNotification]);

  return { requestPermission, sendLocalNotification };
}
