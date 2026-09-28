import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function FriendsScreen({ session }: { session: Session }) {
  const [nicknameQuery, setNicknameQuery] = useState('');
  const [result, setResult] = useState<{ id: string; nickname: string } | null>(null);
  const [friends, setFriends] = useState<{ id: string; nickname: string }[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function loadFriends() {
    setIsLoadingFriends(true);
    const { data: relationships, error } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

    if (error) {
      Alert.alert('Não foi possível carregar amizades', error.message);
      setIsLoadingFriends(false);
      return;
    }

    const friendIds = (relationships ?? []).map((relationship) =>
      relationship.user_id === session.user.id ? relationship.friend_id : relationship.user_id,
    );
    const { data: profiles } = friendIds.length
      ? await supabase.from('profiles').select('id, nickname').in('id', friendIds)
      : { data: [] };
    setFriends(profiles ?? []);
    setIsLoadingFriends(false);
  }

  useEffect(() => {
    loadFriends();
  }, [session.user.id]);

  async function searchFriend() {
    const nickname = nicknameQuery.trim().replace(/^@/, '').toLowerCase();
    if (!nickname) {
      Alert.alert('Digite um nickname', 'Informe o nickname de alguém para buscar.');
      return;
    }

    setIsSearching(true);
    setResult(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('nickname', nickname)
      .maybeSingle();
    setIsSearching(false);

    if (error) {
      Alert.alert('Não foi possível buscar', error.message);
      return;
    }
    if (!data) {
      Alert.alert('Nickname não encontrado', 'Confira a escrita e tente novamente.');
      return;
    }
    if (data.id === session.user.id) {
      Alert.alert('Esse é o seu nickname', 'Busque outra pessoa para adicionar.');
      return;
    }
    setResult(data);
  }

  async function sendFriendRequest() {
    if (!result) return;
    setIsSending(true);
    const { error } = await supabase.from('friendships').insert({
      user_id: session.user.id,
      friend_id: result.id,
      status: 'pending',
    });
    setIsSending(false);

    if (error) {
      Alert.alert(
        'Não foi possível enviar',
        error.message.includes('duplicate') ? 'Você já enviou um pedido para essa pessoa.' : error.message,
      );
      return;
    }
    Alert.alert('Pedido enviado', `@${result.nickname} receberá seu pedido de amizade.`);
  }

  return (
    <View style={styles.friendsContent}>
      <Text style={styles.friendsIcon}>◎</Text>
      <Text style={styles.friendsTitle}>Encontre seus amigos</Text>
      <Text style={styles.friendsSubtitle}>Busque pelo nickname e acompanhe os momentos do pet deles.</Text>
      <View style={styles.friendSearchRow}>
        <TextInput
          value={nicknameQuery}
          onChangeText={setNicknameQuery}
          placeholder="@nickname"
          placeholderTextColor="#8F8797"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.friendSearchInput}
          onSubmitEditing={searchFriend}
        />
        <Pressable style={styles.friendSearchButton} onPress={searchFriend} disabled={isSearching}>
          {isSearching ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.friendSearchButtonText}>Buscar</Text>}
        </Pressable>
      </View>
      {result && (
        <View style={styles.friendResultCard}>
          <View>
            <Text style={styles.friendResultLabel}>PERFIL ENCONTRADO</Text>
            <Text style={styles.friendResultNickname}>@{result.nickname}</Text>
          </View>
          <Pressable style={styles.addFriendButton} onPress={sendFriendRequest} disabled={isSending}>
            {isSending ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.addFriendText}>Adicionar</Text>}
          </Pressable>
        </View>
      )}
      <View style={styles.friendsListHeader}>
        <Text style={styles.friendsListTitle}>Suas amizades</Text>
        <Text style={styles.friendsCount}>{friends.length}</Text>
      </View>
      {isLoadingFriends ? (
        <ActivityIndicator color="#B66F8A" style={styles.loadingIndicator} />
      ) : friends.length === 0 ? (
        <Text style={styles.friendsEmptyText}>Você ainda não tem amizades aceitas.</Text>
      ) : (
        <View style={styles.friendList}>
          {friends.map((friend) => (
            <View style={styles.friendListItem} key={friend.id}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>{friend.nickname.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.friendListNickname}>@{friend.nickname}</Text>
              <Text style={styles.friendOnline}>●</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  friendsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 28 },
  friendsIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 16 },
  friendsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  friendsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  loadingIndicator: { marginTop: 40 },
  friendSearchRow: { width: '100%', flexDirection: 'row', gap: 9, marginTop: 28 },
  friendSearchInput: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', color: '#EAE5ED', paddingHorizontal: 14, fontSize: 14 },
  friendSearchButton: { height: 50, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  friendSearchButtonText: { color: '#FFF9FB', fontSize: 13, fontWeight: '800' },
  friendResultCard: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 16, padding: 15, marginTop: 18 },
  friendResultLabel: { color: '#B8AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  friendResultNickname: { color: '#EAE5ED', fontSize: 16, fontWeight: '800', marginTop: 5 },
  addFriendButton: { backgroundColor: '#B66F8A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  addFriendText: { color: '#FFF9FB', fontSize: 12, fontWeight: '800' },
  friendsListHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 34, marginBottom: 12 },
  friendsListTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  friendsCount: { color: '#C78EA8', fontSize: 12, fontWeight: '800' },
  friendsEmptyText: { color: '#8F8797', fontSize: 13, marginTop: 20, textAlign: 'center' },
  friendList: { width: '100%', gap: 10 },
  friendListItem: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  friendAvatarText: { color: '#FFF9FB', fontSize: 16, fontWeight: '800' },
  friendListNickname: { flex: 1, color: '#EAE5ED', fontSize: 15, fontWeight: '700' },
  friendOnline: { color: '#52B788', fontSize: 10 },
});
