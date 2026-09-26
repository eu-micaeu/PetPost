import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Post = {
  id: number;
  petName: string;
  owner: string;
  image: string;
  time: string;
  likes: number;
  liked: boolean;
  accent: string;
};

const initialPosts: Post[] = [
  {
    id: 1,
    petName: 'Nino',
    owner: 'marina.costa',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&q=85',
    time: 'há 12 min',
    likes: 248,
    liked: true,
    accent: '#FF4F9A',
  },
  {
    id: 2,
    petName: 'Lola',
    owner: 'bia.amorim',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&q=85',
    time: 'há 1 h',
    likes: 184,
    liked: false,
    accent: '#9B5CFF',
  },
];

const categories = ['Todos', 'Perto de você', 'Em alta'];

export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState('Início');

  function toggleLike(id: number) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    );
  }

  function startPost() {
    Alert.alert('Seu momento', 'A câmera e a galeria entram aqui no próximo passo.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SÁBADO, 26 DE SETEMBRO</Text>
            <Text style={styles.title}>Bom dia, Marina <Text style={styles.titleMark}>✦</Text></Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => setActiveTab('Perfil')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=85' }}
              style={styles.profileImage}
            />
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakCopy}>
            <Text style={styles.streakLabel}>SEQUÊNCIA ATUAL</Text>
            <Text style={styles.streakNumber}>07 <Text style={styles.streakDays}>dias</Text></Text>
            <Text style={styles.streakHint}>Você está cuidando desse ritual.</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>✦</Text>
            <Text style={styles.streakBadgeText}>CONSTÂNCIA</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Hoje na comunidade</Text>
            <Text style={styles.sectionSubtitle}>Pequenos momentos, grandes histórias.</Text>
          </View>
          <Text style={styles.countText}>1.2k <Text style={styles.countLabel}>pets</Text></Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[styles.category, activeCategory === category && styles.categoryActive]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {posts.map((post) => (
          <View style={styles.postCard} key={post.id}>
            <View style={styles.postMeta}>
              <View style={styles.petAvatarWrap}>
                <Image source={{ uri: post.image }} style={styles.petAvatar} />
                <View style={[styles.petStatus, { backgroundColor: post.accent }]} />
              </View>
              <View style={styles.postIdentity}>
                <Text style={styles.petName}>{post.petName}</Text>
                <Text style={styles.ownerName}>por @{post.owner}  ·  {post.time}</Text>
              </View>
              <Pressable onPress={() => Alert.alert('Mais opções', 'Em breve você poderá salvar ou compartilhar este momento.')} hitSlop={12}>
                <Text style={styles.more}>•••</Text>
              </Pressable>
            </View>
            <Image source={{ uri: post.image }} style={styles.postImage} />
            <View style={styles.postActions}>
              <Pressable style={styles.likeButton} onPress={() => toggleLike(post.id)}>
                <Text style={[styles.heart, post.liked && styles.heartLiked]}>{post.liked ? '♥' : '♡'}</Text>
                <Text style={styles.likes}>{post.likes}</Text>
              </Pressable>
              <Text style={styles.photoTag}>MOMENTO DO DIA</Text>
              <Text style={styles.share}>↗</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        {['Início', 'Descobrir', 'Perfil'].map((tab, index) => (
          <Pressable key={tab} style={styles.navItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.navIcon, activeTab === tab && styles.navIconActive]}>{['⌂', '⌕', '◉'][index]}</Text>
            <Text style={[styles.navLabel, activeTab === tab && styles.navLabelActive]}>{tab}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.addButton} onPress={startPost}>
          <Text style={styles.addIcon}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08070B',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#A9A2B7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: '#F9F5FF',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleMark: { color: '#FF4F9A' },
  profileButton: { position: 'relative' },
  profileImage: { width: 45, height: 45, borderRadius: 23, borderWidth: 3, borderColor: '#FF4F9A' },
  onlineDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: '#8EF0C4', borderWidth: 2, borderColor: '#08070B', right: 0, bottom: 1 },
  streakCard: {
    backgroundColor: '#181321',
    borderRadius: 20,
    padding: 20,
    minHeight: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  streakCopy: { justifyContent: 'space-between' },
  streakLabel: { color: '#B5A6C9', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  streakNumber: { color: '#F9F5FF', fontSize: 39, fontWeight: '800', lineHeight: 45 },
  streakDays: { fontSize: 16, fontWeight: '600', color: '#B5A6C9' },
  streakHint: { color: '#C5BBD3', fontSize: 12 },
  streakBadge: { alignItems: 'center', justifyContent: 'center', width: 90, borderLeftWidth: 1, borderLeftColor: '#3D304D', paddingLeft: 14 },
  streakIcon: { color: '#FF4F9A', fontSize: 37, marginBottom: 4 },
  streakBadgeText: { color: '#FF86B9', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 29, marginBottom: 14 },
  sectionTitle: { color: '#F9F5FF', fontSize: 19, fontWeight: '800' },
  sectionSubtitle: { color: '#A9A2B7', fontSize: 12, marginTop: 4 },
  countText: { color: '#FF4F9A', fontSize: 15, fontWeight: '800' },
  countLabel: { color: '#A9A2B7', fontSize: 11, fontWeight: '600' },
  categoryRow: { gap: 8, paddingBottom: 17 },
  category: { borderWidth: 1, borderColor: '#30283B', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  categoryActive: { backgroundColor: '#9B5CFF', borderColor: '#9B5CFF' },
  categoryText: { color: '#A9A2B7', fontSize: 12, fontWeight: '700' },
  categoryTextActive: { color: '#FFFFFF' },
  postCard: { backgroundColor: '#14111B', borderRadius: 18, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#292332' },
  postMeta: { height: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  petAvatarWrap: { position: 'relative' },
  petAvatar: { width: 38, height: 38, borderRadius: 19 },
  petStatus: { position: 'absolute', right: -1, bottom: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#14111B' },
  postIdentity: { flex: 1, marginLeft: 10 },
  petName: { color: '#F9F5FF', fontSize: 14, fontWeight: '800' },
  ownerName: { color: '#A9A2B7', fontSize: 11, marginTop: 3 },
  more: { color: '#A9A2B7', letterSpacing: 2, fontWeight: '800' },
  postImage: { width: '100%', aspectRatio: 1.13, backgroundColor: '#211A2C' },
  postActions: { height: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heart: { color: '#F9F5FF', fontSize: 27, lineHeight: 30 },
  heartLiked: { color: '#FF4F9A' },
  likes: { color: '#F9F5FF', fontSize: 12, fontWeight: '800' },
  photoTag: { flex: 1, textAlign: 'center', color: '#8E849E', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  share: { color: '#F9F5FF', fontSize: 23, fontWeight: '300' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 83, backgroundColor: '#100D15', borderTopWidth: 1, borderTopColor: '#292332', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 19 },
  navItem: { alignItems: 'center', minWidth: 63 },
  navIcon: { color: '#80768F', fontSize: 23, height: 27 },
  navIconActive: { color: '#FF4F9A' },
  navLabel: { color: '#80768F', fontSize: 10, fontWeight: '700', marginTop: 2 },
  navLabelActive: { color: '#FF4F9A' },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#9B5CFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#9B5CFF', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  addIcon: { color: '#FFFFFF', fontSize: 29, fontWeight: '300', lineHeight: 32 },
});
