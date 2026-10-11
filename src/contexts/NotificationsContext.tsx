import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type NotificationsContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { count, error } = await supabase
        .from('friendships')
        .select('user_id', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (!error && typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch {
      // Ignorar erro silenciosamente
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    let isMounted = true;
    async function init() {
      try {
        const { count, error } = await supabase
          .from('friendships')
          .select('user_id', { count: 'exact', head: true })
          .eq('friend_id', userId)
          .eq('status', 'pending');

        if (isMounted && !error && typeof count === 'number') {
          setUnreadCount(count);
        }
      } catch {
        // Ignorar erro
      }
    }

    init();

    const channelTopic = `user_friendships_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${userId}`,
        },
        () => {
          refreshUnreadCount();
        },
      )
      .subscribe();

    const interval = setInterval(refreshUnreadCount, 10000);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

