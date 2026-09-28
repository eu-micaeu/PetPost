import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { FriendshipRequest } from '../types';
import type { Session } from '@supabase/supabase-js';

export function NotificationsScreen({ session }: { session: Session }) {
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadRequests() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('friendships')
      .select('user_id, created_at')
      .eq('friend_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Não foi possível carregar avisos', error.message);
      setIsLoading(false);
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
    setIsLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, [session.user.id]);

  async function respondToRequest(request: FriendshipRequest, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('user_id', request.user_id)
      .eq('friend_id', session.user.id)
      .eq('status', 'pending');

    if (error) {
      Alert.alert('Não foi possível atualizar', error.message);
      return;
    }
    setRequests((currentRequests) => currentRequests.filter((current) => current.user_id !== request.user_id));
  }

  return (
    <View style={styles.notificationsContent}>
      <Text style={styles.notificationsIcon}>♢</Text>
      <Text style={styles.notificationsTitle}>Avisos</Text>
      <Text style={styles.notificationsSubtitle}>Pedidos de amizade e novidades da sua comunidade.</Text>
      {isLoading ? (
        <ActivityIndicator color="#B66F8A" style={styles.loadingIndicator} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Tudo tranquilo por aqui.</Text>
          <Text style={styles.emptyStateText}>Quando alguém enviar um pedido, ele aparecerá aqui.</Text>
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
                <Pressable style={styles.acceptButton} onPress={() => respondToRequest(request, 'accepted')}>
                  <Text style={styles.acceptText}>Aceitar</Text>
                </Pressable>
                <Pressable style={styles.rejectButton} onPress={() => respondToRequest(request, 'rejected')}>
                  <Text style={styles.rejectText}>Recusar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notificationsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 28 },
  notificationsIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 16 },
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
