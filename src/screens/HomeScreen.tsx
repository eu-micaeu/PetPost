import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Path, Svg } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import type { PostRecord, TabType } from '../types';
import { NavItem } from '../components/NavItem';
import {
  FriendsTabIcon,
  HomeTabIcon,
  NotificationsTabIcon,
  PetsTabIcon,
} from '../components/Icons';
import { FriendsScreen } from './FriendsScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { PetsScreen } from './PetsScreen';
import { SettingsScreen } from './SettingsScreen';
import { PublishScreen } from './PublishScreen';
import type { Session } from '@supabase/supabase-js';

type HomeScreenProps = {
  session: Session;
  onSignOut: () => void;
};

export function HomeScreen({ session, onSignOut }: HomeScreenProps) {
  const name = session.user.user_metadata?.name;
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  async function loadPosts() {
    setIsLoadingPosts(true);
    setFeedError(null);

    const { data: ownPosts, error: ownPostsError } = await supabase
      .from('posts')
      .select('id, user_id, image_url, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (ownPostsError) {
      setFeedError(ownPostsError.message);
      setIsLoadingPosts(false);
      return;
    }

    const friendIds = new Set<string>();
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

    friendships?.forEach((friendship) => {
      friendIds.add(friendship.user_id === session.user.id ? friendship.friend_id : friendship.user_id);
    });

    let friendPosts: PostRecord[] = [];
    if (friendIds.size > 0) {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, image_url, created_at')
        .in('user_id', Array.from(friendIds))
        .order('created_at', { ascending: false });

      if (!error) {
        friendPosts = (data ?? []).map(post => ({ ...post, nickname: null }));
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
    setPosts(combinedPosts.map((post) => ({ ...post, nickname: nicknames.get(post.user_id) ?? null })));
    setIsLoadingPosts(false);
  }

  useEffect(() => {
    loadPosts();
  }, [session.user.id]);

  function handleTabChange(tab: TabType) {
    if (activeTab !== 'settings' && activeTab !== 'publish') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tab);
  }

  function handlePublish() {
    if (activeTab !== 'publish') {
      setPreviousTab(activeTab);
    }
    setActiveTab('publish');
  }

  function renderTabContent() {
    if (activeTab === 'friends') {
      return <FriendsScreen session={session} />;
    }

    if (activeTab === 'notifications') {
      return <NotificationsScreen session={session} />;
    }

    if (activeTab === 'pets') {
      return <PetsScreen session={session} />;
    }

    if (activeTab === 'settings') {
      return <SettingsScreen session={session} onSignOut={onSignOut} />;
    }

    return (
      <>
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
                  <Text style={styles.feedDate}>{new Date(post.created_at).toLocaleDateString('pt-BR')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </>
    );
  }

  if (activeTab === 'publish') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <PublishScreen
          session={session}
          onCancel={() => setActiveTab(previousTab)}
          onPublished={(post) => {
            setPosts((currentPosts) => [post, ...currentPosts]);
            setActiveTab('home');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.homeTopBar}>
        {activeTab === 'settings' ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
              onPress={() => setActiveTab(previousTab)}
              hitSlop={12}
            >
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Configurações</Text>
            <View style={styles.headerRightSpacer} />
          </>
        ) : (
          <>
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
            <Pressable
              style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
              onPress={() => {
                setPreviousTab(activeTab);
                setActiveTab('settings');
              }}
              hitSlop={10}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
          </>
        )}
      </View>
      <ScrollView
        style={styles.homeScroll}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem label="Início" active={activeTab === 'home'} onPress={() => handleTabChange('home')}>
          <HomeTabIcon active={activeTab === 'home'} color={activeTab === 'home' ? '#E8A2BF' : '#7F7784'} />
        </NavItem>
        <NavItem
          label="Amigos"
          active={activeTab === 'friends'}
          onPress={() => handleTabChange('friends')}
        >
          <FriendsTabIcon
            active={activeTab === 'friends'}
            color={activeTab === 'friends' ? '#E8A2BF' : '#7F7784'}
          />
        </NavItem>
        <View style={styles.fabContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.publishFab,
              pressed && { transform: [{ scale: 0.93 }], opacity: 0.9 },
            ]}
            onPress={handlePublish}
            hitSlop={8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5V19M5 12H19"
                stroke="#FFF9FB"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
        <NavItem
          label="Avisos"
          active={activeTab === 'notifications'}
          onPress={() => handleTabChange('notifications')}
        >
          <NotificationsTabIcon
            active={activeTab === 'notifications'}
            color={activeTab === 'notifications' ? '#E8A2BF' : '#7F7784'}
          />
        </NavItem>
        <NavItem label="Pets" active={activeTab === 'pets'} onPress={() => handleTabChange('pets')}>
          <PetsTabIcon active={activeTab === 'pets'} color={activeTab === 'pets' ? '#E8A2BF' : '#7F7784'} />
        </NavItem>
      </View>
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
  homeTopBarTitle: { color: '#EAE5ED', fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1B1820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { color: '#C78EA8', fontSize: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { color: '#C78EA8', fontSize: 24, lineHeight: 24 },
  backButtonText: { color: '#C78EA8', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  headerRightSpacer: { width: 50 },
  homeScroll: { flex: 1 },
  homeContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
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
  bottomNav: {
    height: 64,
    backgroundColor: '#111016',
    borderTopWidth: 1,
    borderTopColor: '#25202B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B66F8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B66F8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
