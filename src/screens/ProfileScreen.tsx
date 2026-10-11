import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { PostRecord } from '../types';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48 - 12) / 2;

export function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [petCount, setPetCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const displayName = profile?.nickname
    ? `@${profile.nickname}`
    : user?.user_metadata?.name || 'Meu Perfil';
  const initial = (displayName.replace('@', '')[0] || 'P').toUpperCase();

  async function fetchProfileData(userId: string, currentNickname: string | null) {
    const { data: userPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    const { count, error: countError } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    const formattedPosts: PostRecord[] = (userPosts ?? []).map((post) => ({
      ...post,
      nickname: currentNickname,
    }));

    return { posts: formattedPosts, petCount: count ?? 0 };
  }

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchProfileData(
          user!.id,
          profile?.nickname ?? user!.user_metadata?.nickname ?? null,
        );
        if (isMounted) {
          setPosts(data.posts);
          setPetCount(data.petCount);
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do perfil:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  async function handleRefresh() {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const data = await fetchProfileData(
        user.id,
        profile?.nickname ?? user.user_metadata?.nickname ?? null,
      );
      setPosts(data.posts);
      setPetCount(data.petCount);
    } catch (error) {
      console.warn('Erro ao atualizar perfil:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  function confirmDeletePost(postId: string) {
    Alert.alert(
      'Excluir publicação',
      'Tem certeza de que deseja excluir este momento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deletePost(postId),
        },
      ]
    );
  }

  async function deletePost(postId: string) {
    setDeletingPostId(postId);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      Alert.alert('Sucesso', 'Publicação excluída com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      Alert.alert('Erro ao excluir', message);
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/settings')}
          hitSlop={12}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#F0AEC9"
            colors={['#F0AEC9']}
          />
        }
      >
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.user_metadata?.name || 'Tutor do Pet'}
          </Text>
          <Text style={styles.userNickname}>
            @{profile?.nickname || user?.user_metadata?.nickname || 'petpost'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Stats Badges */}
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>
                {posts.length === 1 ? 'Momento' : 'Momentos'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{petCount}</Text>
              <Text style={styles.statLabel}>
                {petCount === 1 ? 'Pet' : 'Pets'}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.publishActionButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push('/publish')}
            >
              <Text style={styles.publishActionText}>＋ Novo Momento</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.editActionButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.editActionText}>Editar Perfil</Text>
            </Pressable>
          </View>
        </View>

        {/* Section Header with View Mode Toggle */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>MINHAS FOTOS</Text>
            <Text style={styles.sectionTitle}>Momentos compartilhados</Text>
          </View>
          <View style={styles.viewModeToggle}>
            <Pressable
              style={[
                styles.modeButton,
                viewMode === 'grid' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'grid' && styles.modeButtonTextActive,
                ]}
              >
                Grade
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                viewMode === 'feed' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('feed')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'feed' && styles.modeButtonTextActive,
                ]}
              >
                Lista
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading ? (
          <ActivityIndicator color="#F0AEC9" style={styles.loadingIndicator} />
        ) : posts.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>📷</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhum momento publicado</Text>
            <Text style={styles.emptySubtitle}>
              Você ainda não compartilhou fotos dos seus pets. Que tal publicar sua
              primeira foto agora?
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push('/publish')}
            >
              <Text style={styles.emptyButtonText}>Compartilhar uma foto</Text>
            </Pressable>
          </View>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <View style={styles.gridContainer}>
            {posts.map((post) => (
              <View key={post.id} style={styles.gridItem}>
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridDate}>
                    {new Date(post.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </Text>
                  <Pressable
                    style={styles.gridDeleteBtn}
                    onPress={() => confirmDeletePost(post.id)}
                    hitSlop={8}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.gridDeleteText}>🗑</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Feed/List View */
          <View style={styles.feedContainer}>
            {posts.map((post) => (
              <View key={post.id} style={styles.feedCard}>
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.feedImage}
                  resizeMode="cover"
                />
                <View style={styles.feedMeta}>
                  <View>
                    <Text style={styles.feedNickname}>
                      @{post.nickname ?? 'petpost'}
                    </Text>
                    <Text style={styles.feedDate}>
                      {new Date(post.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.feedDeleteButton,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => confirmDeletePost(post.id)}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? (
                      <ActivityIndicator size="small" color="#E57373" />
                    ) : (
                      <Text style={styles.feedDeleteText}>Excluir</Text>
                    )}
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
  container: {
    flex: 1,
    backgroundColor: '#111016',
  },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#201D28',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    color: '#C78EA8',
    fontSize: 26,
    lineHeight: 26,
  },
  backButtonText: {
    color: '#C78EA8',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFF9FB',
    fontSize: 17,
    fontWeight: '700',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1722',
    borderWidth: 1,
    borderColor: '#2F2A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: '#C78EA8',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#171420',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 22,
    alignItems: 'center',
    marginBottom: 26,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#272031',
    borderWidth: 2,
    borderColor: '#F0AEC9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#F0AEC9',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    color: '#FFF9FB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  userNickname: {
    color: '#C78EA8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#7F7888',
    fontSize: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#100D17',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#231E2D',
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 18,
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFF9FB',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8E8597',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#292336',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  publishActionButton: {
    flex: 1,
    backgroundColor: '#C78EA8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishActionText: {
    color: '#FFF9FB',
    fontSize: 14,
    fontWeight: '700',
  },
  editActionButton: {
    flex: 1,
    backgroundColor: '#221D2C',
    borderWidth: 1,
    borderColor: '#383147',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionText: {
    color: '#DDD5E4',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: '#B66F8A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#FFF9FB',
    fontSize: 18,
    fontWeight: '700',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#171420',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 2,
  },
  modeButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#292235',
  },
  modeButtonText: {
    color: '#7B7484',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#F0AEC9',
  },
  loadingIndicator: {
    marginTop: 40,
  },
  emptyCard: {
    backgroundColor: '#171420',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282333',
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#231E2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    color: '#FFF9FB',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#8E8597',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#C78EA8',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFF9FB',
    fontSize: 14,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1722',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#272233',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 16, 22, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridDate: {
    color: '#E0D8E6',
    fontSize: 11,
    fontWeight: '600',
  },
  gridDeleteBtn: {
    padding: 2,
  },
  gridDeleteText: {
    color: '#FF7676',
    fontSize: 13,
  },
  feedContainer: {
    gap: 18,
  },
  feedCard: {
    backgroundColor: '#171420',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#282335',
    overflow: 'hidden',
  },
  feedImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#100D16',
  },
  feedMeta: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedNickname: {
    color: '#FFF9FB',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedDate: {
    color: '#847C8C',
    fontSize: 12,
  },
  feedDeleteButton: {
    backgroundColor: 'rgba(239, 83, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 83, 80, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  feedDeleteText: {
    color: '#EF5350',
    fontSize: 12,
    fontWeight: '700',
  },
});
