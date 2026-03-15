'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';

export function GlobalNotifications() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Call the hook globally with no groupId
  // This will subscribe to all group changes for this user
  useNotifications(undefined, userId || undefined);

  return null;
}
