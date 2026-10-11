import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Path, Svg } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { GearIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { timeAgo } from '../utils/timeAgo';
import type { PostRecord } from '../types';

async function fetchFeedData(currentUserId: string): Promise<PostRecord[]> {
  const { data: ownPosts, error: ownPostsError } = await supabase
    .from('posts')
    .select('id, user_id, image_url, created_at')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  if (ownPostsError) throw ownPostsError;

  const friendIds = new Set<string>();
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  friendships?.forEach((friendship) => {
    friendIds.add(friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id);
  });

  let friendPosts: PostRecord[] = [];
  if (friendIds.size > 0) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, image_url, created_at')
      .in('user_id', Array.from(friendIds))
      .order('created_at', { ascending: false });

    if (!error) {
      friendPosts = (data ?? []).map((post) => ({ ...post, nickname: null }));
    }
  }

  const combinedPosts = [...(ownPosts ?? []), ...friendPosts].sort(
    (firstPost, secondPost) =>
      new Date(secondPost.created_at).getTime() - new Date(firstPost.created_at).getTime(),
  );

  const profileIds = Array.from(new Set(combinedPosts.map((post) => post.user_id)));
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, nickname').in('id', profileIds)
    : { data: [] };
  const nicknames = new Map((profiles ?? []).map((profile) => [profile.id, profile.nickname]));

  return combinedPosts.map((post) => ({
    ...post,
    nickname: nicknames.get(post.user_id) ?? null,
  }));
}

export function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);

  const name = user?.user_metadata?.name;

  // Atualização periódica dos horários relativos a cada 30 segundos
  const [, setTick] = useState(0);
  useEffect(() => {
    const tickInterval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(tickInterval);
  }, []);

  // 1. Carregamento inicial do feed
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    async function load() {
      try {
        setFeedError(null);
        const feed = await fetchFeedData(user!.id);
        if (isMounted) setPosts(feed);
      } catch (err) {
        if (isMounted) setFeedError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Atualização suave ao voltar para a aba
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isMounted = true;

      fetchFeedData(user.id)
        .then((feed) => {
          if (isMounted) setPosts(feed);
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [user]),
  );

  // 3. Atualização em tempo real (Supabase Realtime + Polling em segundo plano)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function refreshSilently() {
      try {
        const feed = await fetchFeedData(userId);
        setPosts(feed);
      } catch {
        // Silencioso
      }
    }

    const channel = supabase
      .channel(`realtime:home_feed:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPosts((current) => current.filter((p) => p.id !== payload.old.id));
          } else {
            if (scrollOffsetY.current <= 80) {
              refreshSilently();
            } else {
              setHasNewPosts(true);
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          refreshSilently();
        },
      )
      .subscribe();

    const syncInterval = setInterval(refreshSilently, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
    };
  }, [user]);

  async function handleRefresh() {
    if (!user?.id) return;
    setIsRefreshing(true);
    setHasNewPosts(false);
    try {
      const feed = await fetchFeedData(user.id);
      setPosts(feed);
    } catch {
      // Ignorar erro no pull-to-refresh
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
    if (e.nativeEvent.contentOffset.y <= 30 && hasNewPosts) {
      setHasNewPosts(false);
    }
  }

  function handleScrollToTopAndRefresh() {
    setHasNewPosts(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    if (user?.id) {
      fetchFeedData(user.id).then(setPosts).catch(() => {});
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.homeTopBar}>
        <View style={styles.brandHeaderGroup}>
          <Svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <Path
              d="M41.6667 54.1667V55.2083M58.3334 54.1667V55.2083M50 35.4167C51.3959 35.4167 52.8125 35.6042 54.1667 35.9583C57.875 31.7917 64.6459 30.0417 67.5417 31.25C70.4584 32.4583 66.6667 45.8333 66.6667 45.8333C67.8542 48.0625 68.75 50.5 68.75 53C68.75 62.2917 60.3542 68.75 50 68.75C39.6459 68.75 31.25 62.5 31.25 53C31.25 50.3958 32.2917 48 33.3334 45.8333C33.3334 45.8333 29.3959 32.4583 32.2917 31.25C35.1875 30.0417 42.125 31.7292 45.8334 35.8958C47.2 35.5808 48.5976 35.4201 50 35.4167Z"
              stroke="#C78EA8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M48.4375 58.8542H51.5625L50 60.4167L48.4375 58.8542Z"
              stroke="#C78EA8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/settings')}
          hitSlop={10}
        >
          <GearIcon color="#C78EA8" size={19} />
        </Pressable>
      </View>

      {/* Botão flutuante para novas publicações recebidas ao vivo */}
      {hasNewPosts && (
        <View style={styles.floatingBannerWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.newPostsFloatingButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleScrollToTopAndRefresh}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.newPostsFloatingText}>↑ Novas publicações</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.homeScroll}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#C78EA8"
            colors={['#C78EA8']}
          />
        }
      >
        <Text style={styles.homeEyebrow}>BEM-VINDO AO PETPOST</Text>
        <Text style={styles.homeTitle}>{name ? `Olá, ${name}.` : 'Olá por aí.'}</Text>
        <Text style={styles.homeSubtitle}>
          Acompanhe os momentos do seu pet e descubra as histórias dos pets dos seus amigos.
        </Text>
        {isLoadingPosts ? (
          <ActivityIndicator color="#B66F8A" style={styles.feedLoading} />
        ) : feedError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Não foi possível carregar o feed.</Text>
            <Text style={styles.emptyStateText}>{feedError}</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>O feed da sua comunidade começa aqui.</Text>
            <Text style={styles.emptyStateText}>
              Publique uma foto ou adicione amigos para acompanhar os momentos dos pets que você ama.
            </Text>
          </View>
        ) : (
          <View style={styles.feedList}>
            {posts.map((post) => (
              <View style={styles.feedCard} key={post.id}>
                <Image source={{ uri: post.image_url }} style={styles.feedImage} />
                <View style={styles.feedMeta}>
                  <Text style={styles.feedNickname}>@{post.nickname ?? 'petpost'}</Text>
                  <Text style={styles.feedDate}>{timeAgo(post.created_at)}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#111016' },
  homeTopBar: {
    height: 58,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1824',
    borderWidth: 1,
    borderColor: '#372B40',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  liveText: {
    color: '#D8C7DE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1B1820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBannerWrapper: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    zIndex: 99,
    alignItems: 'center',
  },
  newPostsFloatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#C78EA8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#C78EA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  newPostsFloatingText: {
    color: '#FFF9FB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  homeScroll: { flex: 1 },
  homeContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  homeEyebrow: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  homeTitle: { color: '#EAE5ED', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  homeSubtitle: { color: '#AAA1B0', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320, textAlign: 'center' },
  emptyState: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 22, marginTop: 42 },
  emptyStateTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: '#AAA1B0', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  feedLoading: { marginTop: 40 },
  feedList: { width: '100%', marginTop: 28, gap: 16 },
  feedCard: { backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 18, overflow: 'hidden' },
  feedImage: { width: '100%', aspectRatio: 1 },
  feedMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 },
  feedNickname: { color: '#EAE5ED', fontSize: 13, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 12 },
  feedDate: { color: '#AAA1B0', fontSize: 11, paddingHorizontal: 14, paddingVertical: 12 },
});
