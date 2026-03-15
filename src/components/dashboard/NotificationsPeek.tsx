import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserPlus, Info, CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NotificationsPeekProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPeek: React.FC<NotificationsPeekProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifications(data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
        
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'invite': return <UserPlus size={16} className="text-[var(--color-brand)]" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <Info size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-[32px] bg-white p-2 shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] mb-1">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-extrabold tracking-tight">Benachrichtigungen</h3>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand)]">
                  {unreadCount} Neu
                </span>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-1 p-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-subtle)]">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <p className="text-[12px] font-medium">Laden...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-subtle)]">
                    <Bell size={20} strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] font-bold">Alles aktuell</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-1 px-8">
                    Keine neuen Benachrichtigungen vorhanden.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className="relative group flex gap-4 rounded-2xl px-4 py-3 transition-all hover:bg-[var(--color-canvas)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft group-hover:bg-[var(--color-canvas)]">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-bold leading-none">{notif.title}</p>
                        <p className="text-[10px] font-medium text-[var(--color-subtle)]">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      <p className="text-[12px] leading-relaxed text-[var(--color-muted)] line-clamp-2">
                        {notif.content}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="absolute left-2 top-4 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] shadow-[0_0_8px_var(--color-brand)]" />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-1 pt-1 border-t border-[var(--color-border)]">
                <button 
                  onClick={markAsRead}
                  className="flex w-full items-center justify-center rounded-2xl py-3 text-[12px] font-bold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-foreground)]"
                >
                  Alle als gelesen markieren
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
