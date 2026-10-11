import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { NotificationsTabIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import type { FriendshipRequest } from '../types';

export function NotificationsScreen() {
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRequests = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('friendships')
          .select('user_id, created_at')
          .eq('friend_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          if (!silent) Alert.alert('Não foi possível carregar avisos', error.message);
          return;
        }

        const requesterIds = (data ?? []).map((request) => request.user_id);
        const { data: profiles } = requesterIds.length
          ? await supabase.from('profiles').select('id, nickname').in('id', requesterIds)
          : { data: [] };
        const nicknameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.nickname]));

        setRequests(
          (data ?? []).map((request) => ({
            id: request.user_id,
            user_id: request.user_id,
            nickname: nicknameById.get(request.user_id) ?? 'petpost',
          })),
        );
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [user?.id],
  );

  // 1. Carregamento inicial
  useEffect(() => {
    if (!user?.id) return;
    loadRequests();
  }, [user?.id, loadRequests]);

  // 2. Atualização ao focar na tela
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadRequests(true);
        refreshUnreadCount();
      }
    }, [user?.id, loadRequests, refreshUnreadCount]),
  );

  // 3. Atualização em tempo real (Supabase Realtime + Polling em background)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const channel = supabase
      .channel(`realtime:notifications_screen:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${userId}`,
        },
        () => {
          loadRequests(true);
          refreshUnreadCount();
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      loadRequests(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, loadRequests, refreshUnreadCount]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadRequests(true);
      await refreshUnreadCount();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function respondToRequest(request: FriendshipRequest, status: 'accepted' | 'rejected') {
    if (!user?.id) return;
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('user_id', request.user_id)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      Alert.alert('Não foi possível atualizar', error.message);
      return;
    }
    setRequests((currentRequests) => currentRequests.filter((current) => current.user_id !== request.user_id));
    refreshUnreadCount();
  }

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
        <View style={{ marginBottom: 12 }}>
          <NotificationsTabIcon active={true} color="#C78EA8" size={36} />
        </View>
        <Text style={styles.notificationsTitle}>Avisos</Text>
        <Text style={styles.notificationsSubtitle}>Pedidos de amizade e novidades da sua comunidade.</Text>
        {isLoading ? (
          <ActivityIndicator color="#B66F8A" style={styles.loadingIndicator} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Tudo tranquilo por aqui.</Text>
            <Text style={styles.emptyStateText}>Quando alguém enviar um pedido, ele aparecerá aqui em tempo real.</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111016' },
  scroll: { flex: 1 },
  notificationsContent: { flexGrow: 1, width: '100%', alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 32 },
  notificationsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  notificationsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  loadingIndicator: { marginTop: 40 },
  emptyState: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 22, marginTop: 32 },
  emptyStateTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: '#AAA1B0', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  requestList: { width: '100%', gap: 10, marginTop: 24 },
  requestCard: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 16, padding: 14 },
  requestCopy: { flex: 1 },
  requestLabel: { color: '#B8AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  requestNickname: { color: '#EAE5ED', fontSize: 16, fontWeight: '800', marginTop: 4 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { backgroundColor: '#B66F8A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  acceptText: { color: '#FFF9FB', fontSize: 12, fontWeight: '800' },
  rejectButton: { backgroundColor: '#151319', borderWidth: 1, borderColor: '#443B49', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  rejectText: { color: '#AAA1B0', fontSize: 12, fontWeight: '700' },
});
