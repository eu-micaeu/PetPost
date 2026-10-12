import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { HeartFilledIcon, NotificationsTabIcon } from '../components/Icons';
import { Skeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useToast } from '../contexts/ToastContext';
import { timeAgo } from '../utils/timeAgo';
import type { FriendshipRequest, NotificationRecord } from '../types';

export function NotificationsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const { refreshUnreadCount } = useNotifications();
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(
    async (silent = false) => {
      if (!user?.id) return;
      const userId = user.id;

      try {
        // 1. Carregar pedidos de amizade pendentes
        const { data: friendshipData, error: friendshipError } = await supabase
          .from('friendships')
          .select('user_id, created_at')
          .eq('friend_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (friendshipError && !silent) {
          toast.show(friendshipError.message, 'error');
        }

        const requesterIds = (friendshipData ?? []).map((req) => req.user_id);
        const { data: requesterProfiles } = requesterIds.length
          ? await supabase.from('profiles').select('id, nickname').in('id', requesterIds)
          : { data: [] };
        const requesterMap = new Map((requesterProfiles ?? []).map((p) => [p.id, p.nickname]));

        setRequests(
          (friendshipData ?? []).map((req) => ({
            id: req.user_id,
            user_id: req.user_id,
            nickname: requesterMap.get(req.user_id) ?? 'petpost',
          })),
        );

        // 2. Carregar notificações de curtidas e atividades (estilo Instagram)
        try {
          const { data: notifData, error: notifError } = await supabase
            .from('notifications')
            .select('id, user_id, actor_id, post_id, type, created_at, read')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(40);

          if (!notifError && notifData) {
            const actorIds = Array.from(new Set(notifData.map((n) => n.actor_id)));
            const postIds = Array.from(
              new Set(notifData.map((n) => n.post_id).filter((id): id is string => Boolean(id))),
            );

            const [actorProfilesRes, postsRes] = await Promise.all([
              actorIds.length
                ? supabase.from('profiles').select('id, nickname').in('id', actorIds)
                : Promise.resolve({ data: [] }),
              postIds.length
                ? supabase.from('posts').select('id, image_url').in('id', postIds)
                : Promise.resolve({ data: [] }),
            ]);

            const actorMap = new Map((actorProfilesRes.data ?? []).map((p) => [p.id, p.nickname]));
            const postMap = new Map((postsRes.data ?? []).map((p) => [p.id, p.image_url]));

            setNotifications(
              notifData.map((n) => ({
                id: n.id,
                user_id: n.user_id,
                actor_id: n.actor_id,
                actor_nickname: actorMap.get(n.actor_id) ?? 'petpost',
                post_id: n.post_id,
                post_image_url: n.post_id ? postMap.get(n.post_id) ?? null : null,
                type: n.type,
                created_at: n.created_at,
                read: Boolean(n.read),
              })),
            );
          }
        } catch {
          // Silencioso se a tabela notifications ainda não tiver sido criada
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [user, toast],
  );

  // 1. Carregamento inicial
  useEffect(() => {
    if (!user?.id) return;
    loadAllData();
  }, [user, loadAllData]);

  // 2. Atualização ao focar na tela e marcar notificações como lidas
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      const userId = user.id;

      loadAllData(true);

      async function markAsRead() {
        try {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          refreshUnreadCount();
        } catch {
          // Silencioso
        }
      }

      markAsRead();
    }, [user, loadAllData, refreshUnreadCount]),
  );

  // 3. Atualização em tempo real (Supabase Realtime + Polling em background)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const channelTopic = `notifications_screen_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
          loadAllData(true);
          refreshUnreadCount();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadAllData(true);
          refreshUnreadCount();
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      loadAllData(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, loadAllData, refreshUnreadCount]);

  async function handleRefresh() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setIsRefreshing(true);
    try {
      await loadAllData(true);
      await refreshUnreadCount();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function respondToRequest(request: FriendshipRequest, status: 'accepted' | 'rejected') {
    if (!user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('user_id', request.user_id)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      toast.show(error.message, 'error');
      return;
    }
    setRequests((currentRequests) => currentRequests.filter((current) => current.user_id !== request.user_id));
    refreshUnreadCount();

    if (status === 'accepted') {
      toast.show(`Amizade com @${request.nickname} confirmada!`, 'success');
    } else {
      toast.show(`Pedido de @${request.nickname} recusado.`, 'info');
    }
  }

  const hasRequests = requests.length > 0;
  const hasNotifications = notifications.length > 0;
  const isEmpty = !hasRequests && !hasNotifications;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#C78EA8"
            colors={['#C78EA8']}
          />
        }
      >
        <View style={styles.headerIconContainer}>
          <NotificationsTabIcon active={true} color="#C78EA8" size={34} />
        </View>
        <Text style={styles.notificationsTitle}>Avisos</Text>
        <Text style={styles.notificationsSubtitle}>
          Acompanhe quem curtiu seus momentos e seus novos pedidos de amizade.
        </Text>

        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <Skeleton width="100%" height={68} borderRadius={16} />
            <Skeleton width="100%" height={68} borderRadius={16} />
            <Skeleton width="100%" height={68} borderRadius={16} />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Tudo tranquilo por aqui.</Text>
            <Text style={styles.emptyStateText}>
              Quando seus amigos curtirem suas fotos ou enviarem pedidos de amizade, eles aparecerão aqui em tempo real.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {/* Seção 1: Pedidos de amizade */}
            {hasRequests && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeaderLabel}>PEDIDOS DE AMIZADE ({requests.length})</Text>
                <View style={styles.itemsList}>
                  {requests.map((request) => (
                    <View style={styles.requestCard} key={request.user_id}>
                      <View style={styles.requestCopy}>
                        <Text style={styles.requestLabel}>PEDIDO DE AMIZADE</Text>
                        <Text style={styles.requestNickname}>@{request.nickname}</Text>
                      </View>
                      <View style={styles.requestActions}>
                        <Pressable
                          style={({ pressed }) => [styles.acceptButton, pressed && { opacity: 0.7 }]}
                          onPress={() => respondToRequest(request, 'accepted')}
                        >
                          <Text style={styles.acceptText}>Aceitar</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.rejectButton, pressed && { opacity: 0.7 }]}
                          onPress={() => respondToRequest(request, 'rejected')}
                        >
                          <Text style={styles.rejectText}>Recusar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Seção 2: Atividade recente (Curtidas estilo Instagram) */}
            {hasNotifications && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeaderLabel}>ATIVIDADE RECENTE</Text>
                <View style={styles.itemsList}>
                  {notifications.map((notif) => {
                    const initial = (notif.actor_nickname?.replace(/^@/, '')[0] || 'P').toUpperCase();
                    return (
                      <View
                        style={[styles.notificationCard, !notif.read && styles.notificationCardUnread]}
                        key={notif.id}
                      >
                        {/* Avatar do autor da curtida com mini badge de coração */}
                        <View style={styles.avatarWrapper}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                          </View>
                          <View style={styles.heartMiniBadge}>
                            <HeartFilledIcon color="#FFF9FB" size={10} />
                          </View>
                        </View>

                        {/* Texto descritivo estilo Instagram */}
                        <View style={styles.notificationCopy}>
                          <Text style={styles.notificationText} numberOfLines={2}>
                            <Text style={styles.nicknameHighlight}>@{notif.actor_nickname}</Text>
                            {' curtiu seu momento.'}
                          </Text>
                          <Text style={styles.timeText}>{timeAgo(notif.created_at)}</Text>
                        </View>

                        {/* Miniatura da foto da publicação à direita */}
                        {notif.post_image_url ? (
                          <Image
                            source={{ uri: notif.post_image_url }}
                            style={styles.postThumbnail}
                            resizeMode="cover"
                          />
                        ) : null}

                        {/* Pontinho sutil de nova notificação não lida */}
                        {!notif.read && <View style={styles.unreadDot} />}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111016' },
  scroll: { flex: 1 },
  notificationsContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1924',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#37303C',
  },
  notificationsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  notificationsSubtitle: {
    color: '#AAA1B0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 310,
    textAlign: 'center',
  },
  loadingWrapper: { width: '100%', gap: 12, marginTop: 28 },
  emptyState: {
    width: '100%',
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 20,
    padding: 24,
    marginTop: 36,
  },
  emptyStateTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: '#AAA1B0', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  sectionsContainer: { width: '100%', marginTop: 26, gap: 24 },
  sectionBlock: { width: '100%' },
  sectionHeaderLabel: {
    color: '#B8AABD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  itemsList: { width: '100%', gap: 10 },
  requestCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 16,
    padding: 14,
  },
  requestCopy: { flex: 1 },
  requestLabel: { color: '#B8AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  requestNickname: { color: '#EAE5ED', fontSize: 16, fontWeight: '800', marginTop: 4 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { backgroundColor: '#B66F8A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  acceptText: { color: '#FFF9FB', fontSize: 12, fontWeight: '800' },
  rejectButton: {
    backgroundColor: '#151319',
    borderWidth: 1,
    borderColor: '#443B49',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  rejectText: { color: '#AAA1B0', fontSize: 12, fontWeight: '700' },
  notificationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#201A26',
    borderColor: '#4D3647',
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2632',
    borderWidth: 1,
    borderColor: '#443B49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#EAE5ED',
    fontSize: 16,
    fontWeight: '800',
  },
  heartMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C78EA8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1B1820',
  },
  notificationCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    color: '#DDD6E2',
    fontSize: 13,
    lineHeight: 18,
  },
  nicknameHighlight: {
    color: '#FFF9FB',
    fontWeight: '800',
  },
  timeText: {
    color: '#8A8192',
    fontSize: 11,
    marginTop: 3,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2C2632',
    borderWidth: 1,
    borderColor: '#37303C',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C78EA8',
    marginLeft: 2,
  },
});

