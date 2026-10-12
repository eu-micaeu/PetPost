import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/Avatar';
import { FeedCardSkeleton, PetCardSkeleton } from '../components/Skeleton';
import { CakeIcon, CameraIcon, ChevronLeftIcon, PawIcon, SpeciesIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import {
  acceptFriendRequest,
  fetchFriendshipStatus,
  sendFriendRequest,
  type FriendshipStatus,
} from '../lib/friendships';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAgeString } from '../utils/petHelpers';
import type { PetRecord } from '../types';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 40 - 12) / 2;

type PublicProfile = { id: string; nickname: string | null; avatar_url: string | null };
type PublicPost = { id: string; image_url: string; created_at: string };
type SegmentType = 'pets' | 'posts';

type UserProfileData = Awaited<ReturnType<typeof fetchUserProfileData>>;

async function fetchUserProfileData(currentUserId: string, userId: string) {
  const [data, friendship] = await Promise.all([
    fetchPublicProfile(userId),
    fetchFriendshipStatus(currentUserId, userId),
  ]);
  return { ...data, friendship };
}

async function fetchPublicProfile(userId: string) {
  const [profileRes, petsRes, postsRes] = await Promise.all([
    supabase.from('profiles').select('id, nickname, avatar_url').eq('id', userId).maybeSingle(),
    supabase
      .from('pets')
      .select('id, name, species, breed, birth_date, sex, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  if (profileRes.error) throw profileRes.error;

  // Pets e posts podem vir vazios por causa do RLS (ex.: ainda não são amigos)
  return {
    profile: profileRes.data as PublicProfile | null,
    pets: (petsRes.data ?? []) as PetRecord[],
    posts: (postsRes.data ?? []) as PublicPost[],
  };
}

export function UserProfileScreen({ userId }: { userId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [friendship, setFriendship] = useState<FriendshipStatus>('none');
  const [activeSegment, setActiveSegment] = useState<SegmentType>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingFriendship, setIsUpdatingFriendship] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentUserId = user?.id;

  function applyData(data: UserProfileData) {
    setProfile(data.profile);
    setPets(data.pets);
    setPosts(data.posts);
    setFriendship(data.friendship);
    setLoadError(null);
  }

  function applyError(error: unknown) {
    setLoadError(error instanceof Error ? error.message : 'Erro ao carregar o perfil.');
  }

  useEffect(() => {
    if (!currentUserId) return;
    // O próprio perfil tem a tela completa (com edição) na aba Perfil
    if (currentUserId === userId) {
      router.replace('/profile');
      return;
    }

    let active = true;
    fetchUserProfileData(currentUserId, userId)
      .then((data) => active && applyData(data))
      .catch((error) => active && applyError(error))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [currentUserId, userId]);

  async function handleRefresh() {
    if (!currentUserId) return;
    setIsRefreshing(true);
    try {
      applyData(await fetchUserProfileData(currentUserId, userId));
    } catch (error) {
      applyError(error);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleFriendshipAction() {
    if (!user?.id || !profile) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }

    setIsUpdatingFriendship(true);
    if (friendship === 'none') {
      const error = await sendFriendRequest(user.id, userId);
      if (error) toast.show(error, 'error');
      else {
        setFriendship('sent');
        toast.show(`Pedido de amizade enviado para @${profile.nickname}!`, 'success');
      }
    } else if (friendship === 'received') {
      const error = await acceptFriendRequest(user.id, userId);
      if (error) toast.show(error, 'error');
      else {
        setFriendship('friends');
        toast.show(`Amizade com @${profile.nickname} confirmada!`, 'success');
        handleRefresh();
      }
    }
    setIsUpdatingFriendship(false);
  }

  function selectSegment(segment: SegmentType) {
    try {
      Haptics.selectionAsync();
    } catch {
      // Silencioso
    }
    setActiveSegment(segment);
  }

  const nickname = profile?.nickname ? `@${profile.nickname}` : 'Perfil';
  const friendshipButton = {
    none: { label: 'Adicionar amigo', style: styles.primaryAction, textStyle: styles.primaryActionText },
    received: { label: 'Aceitar pedido', style: styles.primaryAction, textStyle: styles.primaryActionText },
    sent: { label: 'Pedido enviado', style: styles.secondaryAction, textStyle: styles.secondaryActionText },
    friends: { label: 'Amigos ✓', style: styles.secondaryAction, textStyle: styles.secondaryActionText },
  }[friendship];
  const canActOnFriendship = friendship === 'none' || friendship === 'received';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ChevronLeftIcon color="#C78EA8" size={20} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {nickname}
        </Text>
        <View style={styles.headerRightSpacer} />
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
        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <PetCardSkeleton />
            <FeedCardSkeleton />
          </View>
        ) : loadError || !profile ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {loadError ? 'Não foi possível carregar o perfil.' : 'Perfil não encontrado.'}
            </Text>
            {loadError && <Text style={styles.emptySubtitle}>{loadError}</Text>}
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <Avatar
                uri={profile.avatar_url}
                name={profile.nickname}
                size={84}
                style={styles.avatarCircle}
                textStyle={styles.avatarText}
              />
              <Text style={styles.userNickname}>{nickname}</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{posts.length}</Text>
                  <Text style={styles.statLabel}>{posts.length === 1 ? 'foto' : 'fotos'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{pets.length}</Text>
                  <Text style={styles.statLabel}>{pets.length === 1 ? 'pet' : 'pets'}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  friendshipButton.style,
                  pressed && canActOnFriendship && { opacity: 0.85 },
                ]}
                onPress={handleFriendshipAction}
                disabled={!canActOnFriendship || isUpdatingFriendship}
                accessibilityRole="button"
              >
                {isUpdatingFriendship ? (
                  <ActivityIndicator color="#FFF9FB" />
                ) : (
                  <Text style={friendshipButton.textStyle}>{friendshipButton.label}</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.segmentSwitcher}>
              {(['posts', 'pets'] as const).map((segment) => {
                const active = activeSegment === segment;
                const color = active ? '#F0AEC9' : '#8E8698';
                return (
                  <Pressable
                    key={segment}
                    style={[styles.segmentTab, active && styles.segmentTabActive]}
                    onPress={() => selectSegment(segment)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.segmentTabInner}>
                      {segment === 'posts' ? (
                        <CameraIcon color={color} size={16} />
                      ) : (
                        <PawIcon color={color} size={16} />
                      )}
                      <Text style={[styles.segmentTabText, active && styles.segmentTabTextActive]}>
                        {segment === 'posts' ? `Fotos (${posts.length})` : `Pets (${pets.length})`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {activeSegment === 'posts' ? (
              posts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Nenhum momento por aqui</Text>
                  <Text style={styles.emptySubtitle}>
                    {friendship === 'friends'
                      ? `${nickname} ainda não publicou fotos.`
                      : `Adicione ${nickname} como amigo para acompanhar os momentos dos pets.`}
                  </Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {posts.map((post) => (
                    <View key={post.id} style={styles.gridItem}>
                      <Image source={{ uri: post.image_url }} style={styles.gridImage} resizeMode="cover" />
                      <View style={styles.gridOverlay}>
                        <Text style={styles.gridDate}>
                          {new Date(post.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : pets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
                <Text style={styles.emptySubtitle}>{nickname} ainda não apresentou os pets.</Text>
              </View>
            ) : (
              <View style={styles.petList}>
                {pets.map((pet) => {
                  const age = getAgeString(pet.birth_date);
                  return (
                    <View key={pet.id} style={styles.petCard}>
                      {pet.image_url ? (
                        <Image source={{ uri: pet.image_url }} style={styles.petCardImage} />
                      ) : (
                        <View style={styles.petCardFallback}>
                          <SpeciesIcon species={pet.species} color="#F0AEC9" size={24} />
                        </View>
                      )}
                      <View style={styles.petCardDetails}>
                        <Text style={styles.petCardName} numberOfLines={1}>
                          {pet.name}
                        </Text>
                        <Text style={styles.petCardSubtitle} numberOfLines={1}>
                          {pet.species}
                          {pet.breed ? ` · ${pet.breed}` : ''}
                          {pet.sex ? ` · ${pet.sex}` : ''}
                        </Text>
                        {age && (
                          <View style={styles.petAgePill}>
                            <CakeIcon color="#C78EA8" size={12} />
                            <Text style={styles.petAgeText}>{age}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111016' },
  header: {
    height: 58,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backButtonText: { color: '#C78EA8', fontSize: 15, fontWeight: '700' },
  headerTitle: { flex: 1, color: '#EAE5ED', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  headerRightSpacer: { width: 70 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  skeletonGroup: { gap: 14 },
  profileCard: {
    backgroundColor: '#171420',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: { backgroundColor: '#272031', borderWidth: 2, borderColor: '#F0AEC9', marginBottom: 12 },
  avatarText: { color: '#F0AEC9', fontSize: 34, fontWeight: '800' },
  userNickname: { color: '#FFF9FB', fontSize: 20, fontWeight: '800' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 18 },
  stat: { alignItems: 'center', minWidth: 70 },
  statValue: { color: '#FFF9FB', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#8A8292', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#2F2A3B', marginHorizontal: 18 },
  actionButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: { backgroundColor: '#B66F8A' },
  primaryActionText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  secondaryAction: { backgroundColor: '#221D2C', borderWidth: 1, borderColor: '#383147' },
  secondaryActionText: { color: '#DDD5E4', fontSize: 14, fontWeight: '700' },
  segmentSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#171420',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  segmentTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segmentTabActive: { backgroundColor: '#292235' },
  segmentTabText: { color: '#8E8698', fontSize: 13, fontWeight: '600' },
  segmentTabTextActive: { color: '#F0AEC9', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#171420',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: { color: '#FFF9FB', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: '#8A8292', fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1722',
    borderWidth: 1,
    borderColor: '#272233',
  },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 16, 22, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  gridDate: { color: '#E0D8E6', fontSize: 11, fontWeight: '600' },
  petList: { gap: 12 },
  petCard: {
    backgroundColor: '#171420',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#282335',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  petCardImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#100D16' },
  petCardFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#231E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCardDetails: { flex: 1 },
  petCardName: { color: '#FFF9FB', fontSize: 16, fontWeight: '700' },
  petCardSubtitle: { color: '#8A8292', fontSize: 12, marginTop: 2 },
  petAgePill: {
    backgroundColor: '#221C2B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  petAgeText: { color: '#C78EA8', fontSize: 11, fontWeight: '700' },
});
