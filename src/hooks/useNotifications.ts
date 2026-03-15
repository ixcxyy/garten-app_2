'use client';

import { useEffect, useRef, useCallback } from 'react';
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
            if (currentUserId && todo.creator_id === currentUserId) return;
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
          (payload) => {
            const oldTodo = payload.old as { status: string };
            const newTodo = payload.new as { status: string; title: string; group_id: string };
            
            if (oldTodo.status === 'pending' && newTodo.status === 'completed') {
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

    const checkReminders = async () => {
      // Mock reminder check — in a real app, this would be a background job
      // but we can check upcoming tasks from the user's groups on load.
      if (!currentUserId || !groupId) return;

      const { data: upcoming } = await supabase
        .from('todos')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .not('due_date', 'is', null);

      if (upcoming) {
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * oneDayMs;

        upcoming.forEach(todo => {
          const dueDate = new Date(todo.due_date);
          const diff = dueDate.getTime() - now.getTime();
          
          if (diff > 0) {
            if (diff <= oneDayMs) {
              sendLocalNotification({
                title: '⏰ Morgen fällig!',
                body: `Nicht vergessen: ${todo.title}`,
                url: `/group/${todo.group_id}`,
                tag: `reminder-1d-${todo.id}`,
              });
            } else if (diff <= sevenDaysMs && diff > sevenDaysMs - oneDayMs) {
              sendLocalNotification({
                title: '📅 Nächste Woche fällig',
                body: `Bald ist ${todo.title} dran.`,
                url: `/group/${todo.group_id}`,
                tag: `reminder-7d-${todo.id}`,
              });
            }
          }
        });
      }
    };

    void subscribe();
    void checkReminders();
    
    if (Notification.permission === 'granted') {
      void subscribeToPush();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId, requestPermission, sendLocalNotification]);

  const subscribeToPush = useCallback(async () => {
    try {
      if (!currentUserId || typeof window === 'undefined') return;
      
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
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

  return { requestPermission, sendLocalNotification, subscribeToPush };
}
