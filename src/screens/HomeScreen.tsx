import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Path, Svg } from 'react-native-svg';
import { useFocusEffect, useScrollToTop } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTabBarSpace } from '../components/TabBar';
import { FeedPostCard } from '../components/FeedPostCard';
import { FeedCardSkeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { fetchFeedPage, mergeFirstPage } from '../lib/feed';
import { useAuth } from '../contexts/AuthContext';
import type { PostRecord } from '../types';

const BACKGROUND_SYNC_MS = 30000;
const REALTIME_DEBOUNCE_MS = 600;

function FeedSeparator() {
  return <View style={styles.feedSeparator} />;
}

export function HomeScreen() {
  const { user } = useAuth();
  const userId = user?.id;
  const tabBarSpace = useTabBarSpace();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const listRef = useRef<FlatList<PostRecord>>(null);
  useScrollToTop(listRef);
  const scrollOffsetY = useRef(0);
  const postsRef = useRef<PostRecord[]>([]);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    postsRef.current = posts;
    hasMoreRef.current = hasMore;
  }, [posts, hasMore]);

  const name = user?.user_metadata?.name;

  /** Recarrega só a primeira página, mantendo as páginas antigas já carregadas. */
  const refreshFirstPage = useCallback(async () => {
    if (!userId) return;
    const page = await fetchFeedPage(userId);
    const merged = mergeFirstPage(postsRef.current, page.posts);
    postsRef.current = merged;
    setPosts(merged);
    if (merged.length === page.posts.length) setHasMore(page.hasMore);
    setFeedError(null);
  }, [userId]);

  /** Volta o feed para a primeira página (pull-to-refresh / "novas publicações"). */
  const resetFeed = useCallback(async () => {
    if (!userId) return;
    const page = await fetchFeedPage(userId);
    postsRef.current = page.posts;
    setPosts(page.posts);
    setHasMore(page.hasMore);
    setFeedError(null);
  }, [userId]);

  const loadMore = useCallback(async () => {
    const last = postsRef.current[postsRef.current.length - 1];
    if (!userId || !last || !hasMoreRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await fetchFeedPage(userId, last.created_at);
      const knownIds = new Set(postsRef.current.map((p) => p.id));
      const next = [...postsRef.current, ...page.posts.filter((p) => !knownIds.has(p.id))];
      postsRef.current = next;
      setPosts(next);
      setHasMore(page.hasMore);
    } catch {
      // Silencioso: o próximo onEndReached tenta de novo
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [userId]);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (!userId) return;
      const targetPost = postsRef.current.find((p) => p.id === postId);
      if (!targetPost) return;
      const nextLiked = !targetPost.is_liked;

      // Atualização otimista imediata na UI
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                is_liked: nextLiked,
                likes_count: Math.max(0, (p.likes_count ?? 0) + (nextLiked ? 1 : -1)),
              },
        ),
      );

      // Persistência no Supabase
      try {
        if (nextLiked) {
          const { error: likeErr } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId });

          // Se a curtida foi salva com sucesso e o post pertence a outro usuário, enviar notificação estilo Instagram
          if (!likeErr && targetPost.user_id !== userId) {
            await supabase.from('notifications').insert({
              user_id: targetPost.user_id,
              actor_id: userId,
              post_id: postId,
              type: 'like',
            });
          }
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);

          if (targetPost.user_id !== userId) {
            await supabase
              .from('notifications')
              .delete()
              .eq('actor_id', userId)
              .eq('post_id', postId)
              .eq('type', 'like');
          }
        }
      } catch {
        // Silencioso
      }
    },
    [userId],
  );

  // 1. Carregamento inicial + atualização suave ao voltar para a aba
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      refreshFirstPage()
        .catch((err) => {
          if (postsRef.current.length === 0) {
            setFeedError(err instanceof Error ? err.message : 'Erro ao carregar');
          }
        })
        .finally(() => setIsLoadingPosts(false));
    }, [userId, refreshFirstPage]),
  );

  // 2. Atualização em tempo real (Supabase Realtime + sincronização em segundo plano)
  useEffect(() => {
    if (!userId) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Vários eventos seguidos (ex.: curtidas) viram uma única busca.
    function scheduleRefresh() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshFirstPage().catch(() => {});
      }, REALTIME_DEBOUNCE_MS);
    }

    const channelTopic = `home_feed_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelTopic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          setPosts((current) => current.filter((p) => p.id !== payload.old.id));
        } else if (scrollOffsetY.current <= 80) {
          scheduleRefresh();
        } else {
          setHasNewPosts(true);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (payload) => {
        const record = (payload.new ?? payload.old) as { post_id?: string } | undefined;
        // Ignora curtidas em posts que não estão no feed carregado
        if (record?.post_id && !postsRef.current.some((p) => p.id === record.post_id)) return;
        scheduleRefresh();
      })
      .subscribe();

    const syncInterval = setInterval(() => {
      refreshFirstPage().catch(() => {});
    }, BACKGROUND_SYNC_MS);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
    };
  }, [userId, refreshFirstPage]);

  async function handleRefresh() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setIsRefreshing(true);
    setHasNewPosts(false);
    try {
      await resetFeed();
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setHasNewPosts(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    resetFeed().catch(() => {});
  }

  const renderPost = useCallback<ListRenderItem<PostRecord>>(
    ({ item }) => (
      <FeedPostCard
        post={item}
        isLiked={Boolean(item.is_liked)}
        likesCount={item.likes_count ?? 0}
        onToggleLike={handleToggleLike}
      />
    ),
    [handleToggleLike],
  );

  const listHeader = (
    <View style={styles.homeHeader}>
      <Text style={styles.homeEyebrow}>BEM-VINDO AO PETPOST</Text>
      <Text style={styles.homeTitle}>{name ? `Olá, ${name}.` : 'Olá por aí.'}</Text>
      <Text style={styles.homeSubtitle}>
        Acompanhe os momentos do seu pet e descubra as histórias dos pets dos seus amigos.
      </Text>
    </View>
  );

  const listEmpty = isLoadingPosts ? (
    <View style={styles.skeletonList}>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  ) : feedError ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Não foi possível carregar o feed.</Text>
      <Text style={styles.emptyStateText}>{feedError}</Text>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>O feed da sua comunidade começa aqui.</Text>
      <Text style={styles.emptyStateText}>
        Publique uma foto ou adicione amigos para acompanhar os momentos dos pets que você ama.
      </Text>
    </View>
  );

  const listFooter =
    posts.length === 0 ? null : isLoadingMore ? (
      <ActivityIndicator color="#C78EA8" style={styles.listFooter} />
    ) : !hasMore ? (
      <Text style={[styles.listFooter, styles.endOfFeedText]}>Você está em dia com o feed 🐾</Text>
    ) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.homeTopBar}>
        <View style={styles.brandHeaderGroup}>
          <Svg width="40" height="40" viewBox="0 0 100 100" fill="none">
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
        </View>
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

      <FlatList
        ref={listRef}
        data={isLoadingPosts || feedError ? [] : posts}
        keyExtractor={(post) => post.id}
        renderItem={renderPost}
        ItemSeparatorComponent={FeedSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        style={styles.homeScroll}
        contentContainerStyle={[styles.homeContent, { paddingBottom: tabBarSpace }]}
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
      />
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
    gap: 8,
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
  homeContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  homeHeader: { alignItems: 'center', marginBottom: 28 },
  homeEyebrow: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  homeTitle: { color: '#EAE5ED', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  homeSubtitle: { color: '#AAA1B0', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320, textAlign: 'center' },
  emptyState: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 22, marginTop: 14 },
  emptyStateTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: '#AAA1B0', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  skeletonList: { width: '100%', gap: 16 },
  feedSeparator: { height: 16 },
  listFooter: { marginTop: 24 },
  endOfFeedText: { color: '#827989', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
