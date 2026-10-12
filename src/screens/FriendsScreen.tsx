import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useScrollToTop } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTabBarSpace } from '../components/TabBar';
import { Avatar } from '../components/Avatar';
import { ChevronRightIcon, FriendsTabIcon, XIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import {
  acceptFriendRequest,
  fetchFriendshipStatuses,
  sendFriendRequest,
  type FriendshipStatus,
} from '../lib/friendships';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

type ProfileSummary = { id: string; nickname: string; avatar_url: string | null };

type SearchState = {
  term: string;
  results: ProfileSummary[];
  statuses: Map<string, FriendshipStatus>;
  error: string | null;
};

export function FriendsScreen() {
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const tabBarSpace = useTabBarSpace();
  useScrollToTop(scrollRef);
  const toast = useToast();
  const [nicknameQuery, setNicknameQuery] = useState('');
  const [search, setSearch] = useState<SearchState | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [friends, setFriends] = useState<ProfileSummary[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const searchTerm = nicknameQuery.trim().replace(/^@/, '').toLowerCase();
  const canSearch = searchTerm.length >= MIN_SEARCH_LENGTH;
  const isSearching = canSearch && search?.term !== searchTerm;

  const fetchFriends = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        const { data: relationships, error } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) {
          if (!silent) Alert.alert('Não foi possível carregar amizades', error.message);
          return;
        }

        const friendIds = (relationships ?? []).map((relationship) =>
          relationship.user_id === user.id ? relationship.friend_id : relationship.user_id,
        );
        const { data: profiles } = friendIds.length
          ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', friendIds)
          : { data: [] };

        setFriends(profiles ?? []);
      } finally {
        if (!silent) setIsLoadingFriends(false);
      }
    },
    [user?.id],
  );

  // 1. Carregamento inicial
  useEffect(() => {
    if (!user?.id) return;
    fetchFriends();
  }, [user?.id, fetchFriends]);

  // 2. Atualização ao focar na tela
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchFriends(true);
      }
    }, [user?.id, fetchFriends]),
  );

  // 3. Atualização em tempo real (Supabase Realtime + Polling)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const channelTopic = `friends_screen_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          fetchFriends(true);
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchFriends(true);
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, fetchFriends]);

  async function handleRefresh() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setIsRefreshing(true);
    try {
      await fetchFriends(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Busca parcial enquanto digita (com debounce)
  useEffect(() => {
    if (!user?.id || !canSearch) return;
    const currentUserId = user.id;
    let cancelled = false;

    const timer = setTimeout(async () => {
      // Escapa os curingas do LIKE para buscar o texto literal
      const pattern = `%${searchTerm.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      const [{ data, error }, statuses] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .ilike('nickname', pattern)
          .neq('id', currentUserId)
          .order('nickname')
          .limit(8),
        fetchFriendshipStatuses(currentUserId),
      ]);
      if (cancelled) return;

      // Quem começa com o texto digitado aparece primeiro
      const results = ((data ?? []) as ProfileSummary[]).sort(
        (a, b) => Number(b.nickname.startsWith(searchTerm)) - Number(a.nickname.startsWith(searchTerm)),
      );
      setSearch({ term: searchTerm, results, statuses, error: error?.message ?? null });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, canSearch, user?.id]);

  function setSearchStatus(profileId: string, status: FriendshipStatus) {
    setSearch((current) =>
      current ? { ...current, statuses: new Map(current.statuses).set(profileId, status) } : current,
    );
  }

  async function handleSearchAction(profile: ProfileSummary, status: FriendshipStatus) {
    if (!user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }

    setActingOnId(profile.id);
    if (status === 'none') {
      const error = await sendFriendRequest(user.id, profile.id);
      if (error) toast.show(error, 'error');
      else {
        setSearchStatus(profile.id, 'sent');
        toast.show(`Pedido de amizade enviado para @${profile.nickname}!`, 'success');
      }
    } else if (status === 'received') {
      const error = await acceptFriendRequest(user.id, profile.id);
      if (error) toast.show(error, 'error');
      else {
        setSearchStatus(profile.id, 'friends');
        toast.show(`Amizade com @${profile.nickname} confirmada!`, 'success');
        fetchFriends(true);
      }
    }
    setActingOnId(null);
  }

  function openProfile(profileId: string) {
    router.push(`/user/${profileId}`);
  }

  function renderSearchAction(profile: ProfileSummary) {
    const status = search?.statuses.get(profile.id) ?? 'none';
    if (status === 'friends' || status === 'sent') {
      return (
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{status === 'friends' ? 'Amigos' : 'Pendente'}</Text>
        </View>
      );
    }
    return (
      <Pressable
        style={({ pressed }) => [styles.addFriendButton, pressed && { opacity: 0.85 }]}
        onPress={() => handleSearchAction(profile, status)}
        disabled={actingOnId === profile.id}
        hitSlop={6}
      >
        {actingOnId === profile.id ? (
          <ActivityIndicator color="#FFF9FB" size="small" />
        ) : (
          <Text style={styles.addFriendText}>{status === 'received' ? 'Aceitar' : 'Adicionar'}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.friendsContent, { paddingBottom: tabBarSpace }]}
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
        <View style={{ marginBottom: 14 }}>
          <FriendsTabIcon active={true} color="#C78EA8" size={36} />
        </View>
        <Text style={styles.friendsTitle}>Encontre seus amigos</Text>
        <Text style={styles.friendsSubtitle}>Busque pelo nickname e acompanhe os momentos do pet deles.</Text>
        <View style={styles.friendSearchRow}>
          <TextInput
            value={nicknameQuery}
            onChangeText={setNicknameQuery}
            placeholder="Buscar @nickname"
            placeholderTextColor="#8F8797"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.friendSearchInput}
          />
          <View style={styles.searchAccessory}>
            {isSearching ? (
              <ActivityIndicator color="#C78EA8" size="small" />
            ) : nicknameQuery.length > 0 ? (
              <Pressable onPress={() => setNicknameQuery('')} hitSlop={10} accessibilityLabel="Limpar busca">
                <XIcon color="#8F8797" size={16} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {searchTerm.length > 0 && !canSearch && (
          <Text style={styles.searchHint}>Digite pelo menos {MIN_SEARCH_LENGTH} letras.</Text>
        )}

        {canSearch && search?.term === searchTerm && (
          <View style={styles.searchResults}>
            {search.error ? (
              <Text style={styles.searchHint}>Não foi possível buscar: {search.error}</Text>
            ) : search.results.length === 0 ? (
              <Text style={styles.searchHint}>Nenhum perfil encontrado para “{searchTerm}”.</Text>
            ) : (
              search.results.map((profile) => (
                <Pressable
                  key={profile.id}
                  style={({ pressed }) => [styles.friendListItem, pressed && { opacity: 0.8 }]}
                  onPress={() => openProfile(profile.id)}
                  accessibilityRole="link"
                  accessibilityLabel={`Ver perfil de @${profile.nickname}`}
                >
                  <Avatar
                    uri={profile.avatar_url}
                    name={profile.nickname}
                    size={40}
                    style={styles.friendAvatar}
                    textStyle={styles.friendAvatarText}
                  />
                  <Text style={styles.friendListNickname} numberOfLines={1}>
                    @{profile.nickname}
                  </Text>
                  {renderSearchAction(profile)}
                </Pressable>
              ))
            )}
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
              <Pressable
                style={({ pressed }) => [styles.friendListItem, pressed && { opacity: 0.8 }]}
                key={friend.id}
                onPress={() => openProfile(friend.id)}
                accessibilityRole="link"
                accessibilityLabel={`Ver perfil de @${friend.nickname}`}
              >
                <Avatar
                  uri={friend.avatar_url}
                  name={friend.nickname}
                  size={40}
                  style={styles.friendAvatar}
                  textStyle={styles.friendAvatarText}
                />
                <Text style={styles.friendListNickname}>@{friend.nickname}</Text>
                <ChevronRightIcon color="#8F8797" size={18} />
              </Pressable>
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
  friendsContent: { flexGrow: 1, width: '100%', alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
  friendsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  friendsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  loadingIndicator: { marginTop: 40 },
  friendSearchRow: { width: '100%', flexDirection: 'row', marginTop: 24 },
  friendSearchInput: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', color: '#EAE5ED', paddingLeft: 14, paddingRight: 40, fontSize: 14 },
  searchAccessory: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  searchHint: { width: '100%', color: '#8F8797', fontSize: 12, marginTop: 10, textAlign: 'center' },
  searchResults: { width: '100%', gap: 8, marginTop: 14 },
  statusPill: { backgroundColor: '#221D2C', borderWidth: 1, borderColor: '#383147', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  statusPillText: { color: '#B8AABD', fontSize: 12, fontWeight: '700' },
  addFriendButton: { minWidth: 82, alignItems: 'center', backgroundColor: '#B66F8A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
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
});
