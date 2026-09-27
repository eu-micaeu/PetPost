import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Circle, Path, Svg } from 'react-native-svg';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: 'petpost',
  path: 'auth/callback',
});

type AuthMode = 'login' | 'signup';

type HomeTab = 'home' | 'friends' | 'notifications' | 'pets' | 'settings' | 'publish';

type PostRecord = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  nickname?: string;
};

function HomeTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.25L12 3.5L21 10.25V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.25Z"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
    </Svg>
  );
}

function FriendsTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21V19C16 16.7909 14.2091 15 12 15H7C4.79086 15 3 16.7909 3 19V21"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Circle
        cx="9.5"
        cy="7.5"
        r="3.5"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Path
        d="M17 11C18.6569 11 20 9.65685 20 8C20 6.34315 18.6569 5 17 5"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21V19C20.9964 17.5878 20.0887 16.3411 18.75 15.85"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotificationsTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(199, 142, 168, 0.16)' : 'none'}
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={color}
        strokeWidth={active ? 2.3 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PetsTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      {/* 4 Toe beans */}
      <Path d="M5.2 7.5C6.1 7.5 6.8 8.4 6.8 9.5C6.8 10.6 6.1 11.5 5.2 11.5C4.3 11.5 3.6 10.6 3.6 9.5C3.6 8.4 4.3 7.5 5.2 7.5Z" />
      <Path d="M9.2 3.5C10.2 3.5 11 4.5 11 5.8C11 7.1 10.2 8.1 9.2 8.1C8.2 8.1 7.4 7.1 7.4 5.8C7.4 4.5 8.2 3.5 9.2 3.5Z" />
      <Path d="M14.8 3.5C15.8 3.5 16.6 4.5 16.6 5.8C16.6 7.1 15.8 8.1 14.8 8.1C13.8 8.1 13 7.1 13 5.8C13 4.5 13.8 3.5 14.8 3.5Z" />
      <Path d="M18.8 7.5C19.7 7.5 20.4 8.4 20.4 9.5C20.4 10.6 19.7 11.5 18.8 11.5C17.9 11.5 17.2 10.6 17.2 9.5C17.2 8.4 17.9 7.5 18.8 7.5Z" />
      {/* Main metacarpal pad */}
      <Path d="M12 11C8.6 11 6.5 13.2 6.5 15.8C6.5 18.2 8.8 20.5 12 20.5C15.2 20.5 17.5 18.2 17.5 15.8C17.5 13.2 15.4 11 12 11Z" />
    </Svg>
  );
}

function HomeScreen({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const name = session.user.user_metadata?.name;
  const [activeTab, setActiveTab] = useState<HomeTab>('home');
  const [previousTab, setPreviousTab] = useState<HomeTab>('home');
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

      if (!error) friendPosts = data ?? [];
    }

    const combinedPosts = [...(ownPosts ?? []), ...friendPosts].sort((firstPost, secondPost) =>
      new Date(secondPost.created_at).getTime() - new Date(firstPost.created_at).getTime(),
    );
    const profileIds = Array.from(new Set(combinedPosts.map((post) => post.user_id)));
    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('id, nickname').in('id', profileIds)
      : { data: [] };
    const nicknames = new Map((profiles ?? []).map((profile) => [profile.id, profile.nickname]));
    setPosts(combinedPosts.map((post) => ({ ...post, nickname: nicknames.get(post.user_id) })));
    setIsLoadingPosts(false);
  }

  useEffect(() => {
    loadPosts();
  }, [session.user.id]);

  function handleTabChange(tab: HomeTab) {
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
        <View style={styles.homeLogo}>
          <Svg width="82" height="82" viewBox="0 0 100 100" fill="none">
            <Path
              d="M41.6667 54.1667V55.2083M58.3334 54.1667V55.2083M50 35.4167C51.3959 35.4167 52.8125 35.6042 54.1667 35.9583C57.875 31.7917 64.6459 30.0417 67.5417 31.25C70.4584 32.4583 66.6667 45.8333 66.6667 45.8333C67.8542 48.0625 68.75 50.5 68.75 53C68.75 62.2917 60.3542 68.75 50 68.75C39.6459 68.75 31.25 62.5 31.25 53C31.25 50.3958 32.2917 48 33.3334 45.8333C33.3334 45.8333 29.3959 32.4583 32.2917 31.25C35.1875 30.0417 42.125 31.7292 45.8334 35.8958C47.2 35.5808 48.5976 35.4201 50 35.4167Z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            <Path d="M48.4375 58.8542H51.5625L50 60.4167L48.4375 58.8542Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={styles.homeEyebrow}>BEM-VINDO AO PETPOST</Text>
        <Text style={styles.homeTitle}>{name ? `Olá, ${name}.` : 'Olá por aí.'}</Text>
        <Text style={styles.homeSubtitle}>Acompanhe os momentos do seu pet e descubra as histórias dos pets dos seus amigos.</Text>
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
            <Text style={styles.emptyStateText}>Publique uma foto ou adicione amigos para acompanhar os momentos dos pets que você ama.</Text>
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
              <Svg width="26" height="26" viewBox="0 0 100 100" fill="none">
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
              <Text style={styles.homeTopBarTitle}>petpost</Text>
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
      <View style={styles.bottomBar}>
        <NavItem
          label="Início"
          active={activeTab === 'home'}
          onPress={() => handleTabChange('home')}
        >
          <HomeTabIcon
            active={activeTab === 'home'}
            color={activeTab === 'home' ? '#E8A2BF' : '#7F7784'}
          />
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
        <NavItem
          label="Pets"
          active={activeTab === 'pets'}
          onPress={() => handleTabChange('pets')}
        >
          <PetsTabIcon
            active={activeTab === 'pets'}
            color={activeTab === 'pets' ? '#E8A2BF' : '#7F7784'}
          />
        </NavItem>
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        pressed && { opacity: 0.65 },
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      <View style={[styles.navIconContainer, active && styles.navIconContainerActive]}>
        {children}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      <View style={[styles.navActiveDot, active && styles.navActiveDotVisible]} />
    </Pressable>
  );
}

function EmptyTab({ icon, title, text, action }: { icon: string; title: string; text: string; action?: string }) {
  return (
    <View style={styles.emptyTab}>
      <Text style={styles.emptyTabIcon}>{icon}</Text>
      <Text style={styles.emptyTabTitle}>{title}</Text>
      <Text style={styles.emptyTabText}>{text}</Text>
      {action && <Pressable style={styles.secondaryButton} onPress={() => Alert.alert(action, 'Esta ação será conectada ao Supabase na próxima etapa.')}><Text style={styles.secondaryButtonText}>{action}</Text></Pressable>}
    </View>
  );
}

type PetRecord = { id: string; name: string; species: string; breed: string | null; birth_date: string | null; sex: string | null; image_url: string | null };

function PetsScreen({ session }: { session: Session }) {
  const speciesOptions = ['Cachorro', 'Gato', 'Ave', 'Coelho', 'Outro'];
  const sexOptions = ['Macho', 'Fêmea', 'Não informar'];
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Cachorro');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadPets() {
    setIsLoading(true);
    const { data, error } = await supabase.from('pets').select('id, name, species, breed, birth_date, sex, image_url').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Não foi possível carregar seus pets', error.message);
      setIsFormVisible(true);
    }
    else {
      setPets(data ?? []);
      if ((data ?? []).length === 0) setIsFormVisible(true);
    }
    setIsLoading(false);
  }

  useEffect(() => { loadPets(); }, [session.user.id]);

  async function choosePetImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permissão necessária', 'Permita o acesso às suas fotos para escolher uma imagem do pet.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setExistingImageUrl(null); }
  }

  function resetForm() {
    setName(''); setSpecies('Cachorro'); setBreed(''); setBirthDate(''); setSex(''); setImageUri(null); setExistingImageUrl(null); setIsSpeciesOpen(false); setEditingPetId(null); setIsFormVisible(false);
  }

  function editPet(pet: PetRecord) {
    setEditingPetId(pet.id);
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed ?? '');
    setBirthDate(pet.birth_date ?? '');
    setSex(pet.sex ?? '');
    setImageUri(null);
    setExistingImageUrl(pet.image_url);
    setIsFormVisible(true);
  }

  function isValidBirthDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date <= today;
  }

  async function savePet() {
    if (!name.trim() || !species.trim()) { Alert.alert('Preencha os campos', 'Informe pelo menos o nome e a espécie do seu pet.'); return; }
    if (birthDate && !isValidBirthDate(birthDate)) { Alert.alert('Data inválida', 'Informe uma data existente no formato AAAA-MM-DD e que não seja futura.'); return; }
    setIsSaving(true);
    try {
      let imageUrl: string | null = existingImageUrl;
      if (imageUri) {
        const imageResponse = await fetch(imageUri);
        const imageBlob = await imageResponse.blob();
        const filePath = `${session.user.id}/pets/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('pet-photos').upload(filePath, imageBlob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('pet-photos').getPublicUrl(filePath).data.publicUrl;
      }
      const petPayload = { name: name.trim(), species: species.trim(), breed: breed.trim() || null, birth_date: birthDate || null, sex: sex.trim() || null, image_url: imageUrl };
      const query = editingPetId
        ? supabase.from('pets').update(petPayload).eq('id', editingPetId).eq('user_id', session.user.id)
        : supabase.from('pets').insert({ user_id: session.user.id, ...petPayload });
      const { data, error } = await query.select('id, name, species, breed, birth_date, sex, image_url').single();
      if (error) throw error;
      setPets((currentPets) => editingPetId ? currentPets.map((pet) => pet.id === editingPetId ? data : pet) : [data, ...currentPets]);
      resetForm();
      Alert.alert(editingPetId ? 'Pet atualizado' : 'Pet cadastrado', `${data.name} foi salvo no seu perfil.`);
    } catch (error) { Alert.alert('Não foi possível cadastrar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setIsSaving(false); }
  }

  return (
    <View style={styles.petsContent}>
      <Text style={styles.petsIcon}>⌁</Text><Text style={styles.petsTitle}>Seus pets</Text>
      <Text style={styles.petsSubtitle}>Crie um perfil para cada companheiro e guarde os momentos especiais.</Text>
      {isLoading ? <ActivityIndicator color="#B66F8A" style={styles.feedLoading} /> : pets.length === 0 && !isFormVisible ? <View style={styles.emptyTab}><Text style={styles.emptyTabTitle}>Cadastre seu primeiro pet</Text><Text style={styles.emptyTabText}>Você poderá ter um ou vários pets no seu perfil.</Text></View> : <View style={styles.petList}>{pets.map((pet) => <Pressable style={styles.petCard} key={pet.id} onPress={() => editPet(pet)}><View>{pet.image_url ? <Image source={{ uri: pet.image_url }} style={styles.petAvatarImage} /> : <View style={styles.petAvatar}><Text style={styles.petAvatarText}>{pet.name.charAt(0).toUpperCase()}</Text></View>}</View><View style={styles.petCopy}><Text style={styles.petName}>{pet.name}</Text><Text style={styles.petDetails}>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</Text></View><Text style={styles.petEditLabel}>Editar</Text></Pressable>)}</View>}
      {isFormVisible && <View style={styles.petForm}>
        <Text style={styles.petFormTitle}>{editingPetId ? 'Editar pet' : 'Novo pet'}</Text>
        <Text style={styles.settingsLabel}>NOME</Text><TextInput value={name} onChangeText={setName} placeholder="Ex: Luna" placeholderTextColor="#8F8797" style={styles.settingsInput} />
        <Text style={styles.settingsLabel}>ESPÉCIE</Text>
        <Pressable style={styles.comboButton} onPress={() => setIsSpeciesOpen((current) => !current)}>
          <Text style={styles.comboValue}>{species}</Text><Text style={styles.comboArrow}>{isSpeciesOpen ? '⌃' : '⌄'}</Text>
        </Pressable>
        {isSpeciesOpen && <View style={styles.comboOptions}>{speciesOptions.map((option) => <Pressable key={option} style={[styles.comboOption, option === species && styles.comboOptionSelected]} onPress={() => { setSpecies(option); setIsSpeciesOpen(false); }}><Text style={[styles.comboOptionText, option === species && styles.comboOptionTextSelected]}>{option}</Text>{option === species && <Text style={styles.comboCheck}>✓</Text>}</Pressable>)}</View>}
        <Text style={styles.settingsLabel}>RAÇA (OPCIONAL)</Text><TextInput value={breed} onChangeText={setBreed} placeholder="Ex: vira-lata" placeholderTextColor="#8F8797" style={styles.settingsInput} />
        <Text style={styles.settingsLabel}>DATA DE NASCIMENTO (OPCIONAL)</Text><TextInput value={birthDate} onChangeText={setBirthDate} placeholder="AAAA-MM-DD" placeholderTextColor="#8F8797" style={styles.settingsInput} keyboardType="numbers-and-punctuation" /><Text style={styles.dateHint}>Formato: AAAA-MM-DD · não pode ser uma data futura.</Text>
        <Text style={styles.settingsLabel}>SEXO DO PET (OPCIONAL)</Text>
        <View style={styles.sexOptions}>{sexOptions.map((option) => <Pressable key={option} style={[styles.sexOption, sex === option && styles.sexOptionSelected]} onPress={() => setSex(option)}><Text style={[styles.sexOptionText, sex === option && styles.sexOptionTextSelected]}>{option}</Text></Pressable>)}</View>
        <Pressable style={styles.petImageButton} onPress={choosePetImage}>{imageUri || existingImageUrl ? <Image source={{ uri: imageUri ?? existingImageUrl ?? undefined }} style={styles.petImagePreview} /> : <Text style={styles.petImageButtonText}>＋ Adicionar foto</Text>}</Pressable>
        <View style={styles.petFormActions}><Pressable style={styles.petCancelButton} onPress={resetForm}><Text style={styles.petCancelText}>Cancelar</Text></Pressable><Pressable style={styles.saveButton} onPress={savePet} disabled={isSaving}>{isSaving ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.saveButtonText}>{editingPetId ? 'Salvar alterações' : 'Cadastrar pet'}</Text>}</Pressable></View>
      </View>}
      {!isFormVisible && <Pressable style={styles.primaryButton} onPress={() => setIsFormVisible(true)}><Text style={styles.primaryButtonText}>＋ Cadastrar pet</Text></Pressable>}
    </View>
  );
}

function FriendsScreen({ session }: { session: Session }) {
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
      Alert.alert('Não foi possível enviar', error.message.includes('duplicate') ? 'Você já enviou um pedido para essa pessoa.' : error.message);
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
      {isLoadingFriends ? <ActivityIndicator color="#B66F8A" style={styles.feedLoading} /> : friends.length === 0 ? (
        <Text style={styles.friendsEmptyText}>Você ainda não tem amizades aceitas.</Text>
      ) : (
        <View style={styles.friendList}>
          {friends.map((friend) => (
            <View style={styles.friendListItem} key={friend.id}>
              <View style={styles.friendAvatar}><Text style={styles.friendAvatarText}>{friend.nickname.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.friendListNickname}>@{friend.nickname}</Text>
              <Text style={styles.friendOnline}>●</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type FriendRequest = { user_id: string; created_at: string; nickname: string };

function NotificationsScreen({ session }: { session: Session }) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
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
    setRequests((data ?? []).map((request) => ({ ...request, nickname: nicknameById.get(request.user_id) ?? 'petpost' })));
    setIsLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, [session.user.id]);

  async function respondToRequest(request: FriendRequest, status: 'accepted' | 'rejected') {
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
      {isLoading ? <ActivityIndicator color="#B66F8A" style={styles.feedLoading} /> : requests.length === 0 ? (
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
                <Pressable style={styles.acceptButton} onPress={() => respondToRequest(request, 'accepted')}><Text style={styles.acceptText}>Aceitar</Text></Pressable>
                <Pressable style={styles.rejectButton} onPress={() => respondToRequest(request, 'rejected')}><Text style={styles.rejectText}>Recusar</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PublishScreen({ session, onCancel, onPublished }: { session: Session; onCancel: () => void; onPublished: (post: PostRecord) => void }) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às suas fotos para escolher um momento.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function publishImage() {
    if (!imageUri) {
      Alert.alert('Escolha uma foto', 'Selecione uma imagem do seu pet antes de publicar.');
      return;
    }

    setIsPublishing(true);
    try {
      const imageResponse = await fetch(imageUri);
      const imageBlob = await imageResponse.blob();
      const filePath = `${session.user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, imageBlob, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
      const { error: postError } = await supabase.from('posts').insert({
        user_id: session.user.id,
        image_url: publicData.publicUrl,
      });

      if (postError) throw postError;

      setIsPublishing(false);
      onPublished({
        id: filePath,
        user_id: session.user.id,
        image_url: publicData.publicUrl,
        created_at: new Date().toISOString(),
        nickname: session.user.user_metadata?.nickname,
      });
    } catch (error) {
      setIsPublishing(false);
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      const isStorageNotConfigured = message.toLowerCase().includes('bucket') || message.toLowerCase().includes('posts');
      Alert.alert(
        isStorageNotConfigured ? 'Storage ainda não configurado' : 'Não foi possível publicar',
        isStorageNotConfigured
          ? 'Execute a migration 001_create_pet_photos.sql no SQL Editor do Supabase e tente novamente.'
          : message,
      );
    }
  }

  return (
    <ScrollView style={styles.publishScroll} contentContainerStyle={styles.publishContent} showsVerticalScrollIndicator={false}>
      <View style={styles.publishHeader}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={onCancel} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backButtonText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Novo momento</Text>
        <View style={styles.headerRightSpacer} />
      </View>
      <Text style={styles.publishSubtitle}>Compartilhe uma foto especial do seu pet.</Text>

      <Pressable style={styles.imagePickerFrame} onPress={chooseImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.selectedImage} />
        ) : (
          <>
            <Text style={styles.imagePickerIcon}>＋</Text>
            <Text style={styles.imagePickerTitle}>Escolher uma foto</Text>
            <Text style={styles.imagePickerHint}>Use uma imagem da sua galeria</Text>
          </>
        )}
      </Pressable>

      <View style={styles.publishInfoCard}>
        <Text style={styles.publishInfoLabel}>DICA DO PETPOST</Text>
        <Text style={styles.publishInfoText}>Uma foto por dia é o bastante para guardar a história do seu pet.</Text>
      </View>
      <Pressable style={styles.publishSubmitButton} onPress={publishImage} disabled={isPublishing}>
        {isPublishing ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.publishSubmitText}>Publicar momento</Text>}
      </Pressable>
    </ScrollView>
  );
}

function SettingsScreen({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [accountName, setAccountName] = useState(session.user.user_metadata?.name ?? '');
  const [nickname, setNickname] = useState(session.user.user_metadata?.nickname ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('nickname')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.nickname) setNickname(data.nickname);
      });
  }, [session.user.id]);

  async function saveAccount() {
    if (!accountName.trim()) {
      Alert.alert('Informe seu nome', 'Digite um nome para salvar as configurações.');
      return;
    }

    const normalizedNickname = nickname.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedNickname)) {
      Alert.alert('Nickname inválido', 'Use de 3 a 24 caracteres: letras, números ou _.');
      return;
    }

    setIsSaving(true);
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ nickname: normalizedNickname })
      .eq('id', session.user.id);

    if (profileError) {
      setIsSaving(false);
      Alert.alert('Nickname indisponível', profileError.message.includes('duplicate') ? 'Esse nickname já está em uso.' : profileError.message);
      return;
    }

    const { error } = await supabase.auth.updateUser({ data: { name: accountName.trim(), nickname: normalizedNickname } });
    setIsSaving(false);

    if (error) {
      Alert.alert('Não foi possível salvar', error.message);
      return;
    }

    Alert.alert('Configurações salvas', 'Seu nome e nickname foram atualizados.');
  }

  return (
    <View style={styles.settingsContent}>
      <Text style={styles.settingsEyebrow}>SUA CONTA</Text>
      <Text style={styles.settingsTitle}>Configurações</Text>
      <Text style={styles.settingsSubtitle}>Gerencie as informações do seu acesso ao PetPost.</Text>

      <View style={styles.settingsCard}>
        <Text style={styles.profileSectionTitle}>Identidade do perfil</Text>
        <Text style={styles.profileSectionText}>Seu nickname aparece em todas as fotos que você publicar.</Text>
        <Text style={styles.settingsLabel}>NOME</Text>
        <TextInput value={accountName} onChangeText={setAccountName} style={styles.settingsInput} placeholder="Seu nome" placeholderTextColor="#8F8797" />
        <Text style={styles.settingsLabel}>@ NICKNAME ÚNICO</Text>
        <TextInput value={nickname} onChangeText={setNickname} style={styles.settingsInput} placeholder="seu_nickname" placeholderTextColor="#8F8797" autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.nicknameHint}>O nickname é único e aparece nas suas publicações.</Text>
        <Text style={styles.settingsLabel}>E-MAIL</Text>
        <View style={styles.emailField}><Text style={styles.emailText}>{session.user.email}</Text></View>
        <Text style={styles.emailHint}>O e-mail é gerenciado pelo seu provedor de autenticação.</Text>
        <Pressable style={styles.saveButton} onPress={saveAccount} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={onSignOut}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSignup = mode === 'signup';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#B66F8A" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (session) {
    return <HomeScreen session={session} onSignOut={() => supabase.auth.signOut()} />;
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim() || (isSignup && (!name.trim() || !nickname.trim() || !confirmPassword.trim()))) {
      Alert.alert('Preencha os campos', 'Precisamos desses dados para continuar.');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      Alert.alert('As senhas não coincidem', 'Confira os dois campos de senha e tente novamente.');
      return;
    }

    if (isSignup && !/^[a-z0-9_]{3,24}$/.test(nickname.trim().toLowerCase())) {
      Alert.alert('Nickname inválido', 'Use de 3 a 24 caracteres, apenas letras minúsculas, números ou _.');
      return;
    }

    if (isSignup && password.length < 6) {
      Alert.alert('Senha muito curta', 'Sua senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim(), nickname: nickname.trim().toLowerCase() } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) {
        const isUnconfirmedEmail = result.error.code === 'email_not_confirmed' || result.error.message.toLowerCase().includes('email not confirmed');
        const isExistingEmail = result.error.code === 'user_already_exists' || result.error.code === 'email_exists' || result.error.message.toLowerCase().includes('already registered');
        Alert.alert(
          isUnconfirmedEmail ? 'Confirme seu e-mail' : isExistingEmail ? 'E-mail já cadastrado' : 'Não foi possível continuar',
          isUnconfirmedEmail
            ? 'Abra o link enviado para seu e-mail antes de entrar no PetPost.'
            : isExistingEmail
              ? 'Entre com esse e-mail ou use outro para criar uma conta nova.'
              : result.error.message,
        );
        return;
      }

      setSession(result.data.session);

      Alert.alert(
        isSignup ? 'Conta criada' : 'Login realizado',
        isSignup && !result.data.session
          ? 'Enviamos um link de confirmação. Abra seu e-mail para liberar o acesso à Home.'
          : 'Bem-vindo ao PetPost!',
      );
    } catch (error) {
      Alert.alert(
        'Erro de conexão',
        error instanceof Error ? error.message : 'Não foi possível acessar o Supabase. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogle() {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;

      const code = new URL(result.url).searchParams.get('code');
      if (!code) throw new Error('O Google não retornou um código de autenticação.');

      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;

      Alert.alert('Login realizado', 'Bem-vindo ao PetPost!');
    } catch (error) {
      Alert.alert('Não foi possível entrar com Google', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Svg width="104" height="104" viewBox="0 0 100 100" fill="none">
                <Path
                  d="M41.6667 54.1667V55.2083M58.3334 54.1667V55.2083M50 35.4167C51.3959 35.4167 52.8125 35.6042 54.1667 35.9583C57.875 31.7917 64.6459 30.0417 67.5417 31.25C70.4584 32.4583 66.6667 45.8333 66.6667 45.8333C67.8542 48.0625 68.75 50.5 68.75 53C68.75 62.2917 60.3542 68.75 50 68.75C39.6459 68.75 31.25 62.5 31.25 53C31.25 50.3958 32.2917 48 33.3334 45.8333C33.3334 45.8333 29.3959 32.4583 32.2917 31.25C35.1875 30.0417 42.125 31.7292 45.8334 35.8958C47.2 35.5808 48.5976 35.4201 50 35.4167Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M48.4375 58.8542H51.5625L50 60.4167L48.4375 58.8542Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.brandName}>petpost</Text>
          </View>

          <View style={styles.introBlock}>
            <Text style={styles.title}>{isSignup ? 'Crie seu cantinho.' : 'Que bom ter você aqui.'}</Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Crie sua identidade e compartilhe momentos com a comunidade.'
                : 'Entre para acompanhar os momentos mais fofos.'}
            </Text>
          </View>

          <View style={styles.formCard}>
            {isSignup && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SEU NOME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Como podemos chamar você?"
                  placeholderTextColor="#8F8797"
                  style={styles.input}
                  autoCapitalize="words"
                />
                <Text style={styles.inputLabel}>NICKNAME</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="ex: amigodopet"
                  placeholderTextColor="#8F8797"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-MAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                placeholderTextColor="#8F8797"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>SENHA</Text>
                {!isSignup && (
                  <Pressable onPress={() => Alert.alert('Recuperar senha', 'Em breve você poderá recuperar seu acesso por e-mail.')}>
                    <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor="#8F8797"
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />
              {isSignup && (
                <>
                  <Text style={[styles.inputLabel, styles.confirmPasswordLabel]}>CONFIRMAR SENHA</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repita sua senha"
                    placeholderTextColor="#8F8797"
                    style={styles.input}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.passwordHint}>Use pelo menos 6 caracteres.</Text>
                </>
              )}
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignup ? 'Criar minha conta' : 'Entrar no PetPost'} <Text style={styles.buttonArrow}>→</Text>
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou continuar com</Text>
              <View style={styles.divider} />
            </View>

            <Pressable style={styles.googleButton} onPress={handleGoogle}>
              <View style={styles.googleIcon}><Text style={styles.googleG}>G</Text></View>
              <Text style={styles.googleText}>Continuar com Google</Text>
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}</Text>
            <Pressable onPress={() => setMode(isSignup ? 'login' : 'signup')}>
              <Text style={styles.switchAction}>{isSignup ? 'Entrar' : 'Criar conta'}</Text>
            </Pressable>
          </View>

          <Text style={styles.legalText}>Ao continuar, você concorda com nossos termos e política de privacidade.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111016' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  homeTopBar: { height: 58, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeTopBarTitle: { color: '#EAE5ED', fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  settingsButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B1820', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { color: '#C78EA8', fontSize: 20 },
  homeScroll: { flex: 1 },
  homeContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  homeLogo: { marginBottom: 28 },
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
  publishButton: { backgroundColor: '#B66F8A', borderRadius: 13, paddingHorizontal: 22, paddingVertical: 14, marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  publishButtonText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  emptyTab: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 48 },
  emptyTabIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 22 },
  emptyTabTitle: { color: '#EAE5ED', fontSize: 23, fontWeight: '800', textAlign: 'center' },
  emptyTabText: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 310, textAlign: 'center' },
  friendsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 62 },
  friendsIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 20 },
  friendsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  friendsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 310, textAlign: 'center' },
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
  petsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 38, paddingBottom: 24 },
  petsIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 16 },
  petsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  petsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 310, textAlign: 'center' },
  petList: { width: '100%', gap: 10, marginTop: 28 },
  petCard: { width: '100%', minHeight: 76, backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  petAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  petAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  petAvatarText: { color: '#FFF9FB', fontSize: 20, fontWeight: '800' },
  petCopy: { marginLeft: 13, flex: 1 },
  petName: { color: '#EAE5ED', fontSize: 16, fontWeight: '800' },
  petDetails: { color: '#AAA1B0', fontSize: 12, marginTop: 5 },
  petEditLabel: { color: '#C78EA8', fontSize: 11, fontWeight: '800' },
  petForm: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 18, marginTop: 26 },
  petFormTitle: { color: '#EAE5ED', fontSize: 18, fontWeight: '800', marginBottom: 18 },
  petImageButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B5160', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16 },
  petImageButtonText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  petImagePreview: { width: '100%', height: '100%' },
  petFormActions: { flexDirection: 'row', gap: 10 },
  petCancelButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B5160', alignItems: 'center', justifyContent: 'center' },
  petCancelText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  comboButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comboValue: { color: '#EAE5ED', fontSize: 14 },
  comboArrow: { color: '#C78EA8', fontSize: 20, lineHeight: 20 },
  comboOptions: { backgroundColor: '#242028', borderWidth: 1, borderColor: '#443B49', borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  comboOption: { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comboOptionSelected: { backgroundColor: '#352832' },
  comboOptionText: { color: '#AAA1B0', fontSize: 13 },
  comboOptionTextSelected: { color: '#FFF9FB', fontWeight: '800' },
  comboCheck: { color: '#C78EA8', fontSize: 16, fontWeight: '800' },
  sexOptions: { flexDirection: 'row', gap: 8, marginBottom: 17 },
  sexOption: { flex: 1, minHeight: 46, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', alignItems: 'center', justifyContent: 'center' },
  sexOptionSelected: { borderColor: '#B66F8A', backgroundColor: '#352832' },
  sexOptionText: { color: '#AAA1B0', fontSize: 12, textAlign: 'center' },
  sexOptionTextSelected: { color: '#FFF9FB', fontWeight: '800' },
  friendList: { width: '100%', gap: 10 },
  friendListItem: { width: '100%', minHeight: 62, backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  friendAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  friendAvatarText: { color: '#FFF9FB', fontSize: 15, fontWeight: '800' },
  friendListNickname: { color: '#EAE5ED', fontSize: 14, fontWeight: '800', marginLeft: 11, flex: 1 },
  friendOnline: { color: '#91B9A6', fontSize: 10 },
  notificationsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 62 },
  notificationsIcon: { color: '#C78EA8', fontSize: 42, marginBottom: 20 },
  notificationsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  notificationsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 310, textAlign: 'center' },
  requestList: { width: '100%', gap: 12, marginTop: 28 },
  requestCard: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 16, padding: 15, gap: 14 },
  requestCopy: { gap: 5 },
  requestLabel: { color: '#B8AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  requestNickname: { color: '#EAE5ED', fontSize: 16, fontWeight: '800' },
  requestActions: { flexDirection: 'row', gap: 9 },
  acceptButton: { flex: 1, height: 42, borderRadius: 10, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: '#FFF9FB', fontSize: 12, fontWeight: '800' },
  rejectButton: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#6B5160', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#C78EA8', fontSize: 12, fontWeight: '800' },
  secondaryButton: { borderWidth: 1, borderColor: '#6B5160', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 22 },
  secondaryButtonText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  bottomBar: { height: 78, borderTopWidth: 1, borderTopColor: '#37303C', backgroundColor: '#1B1820', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 16 },
  navItem: { width: 58, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#807783', fontSize: 23, height: 27 },
  navIconActive: { color: '#C78EA8' },
  navLabel: { color: '#807783', fontSize: 10, fontWeight: '700', marginTop: 2 },
  navLabelActive: { color: '#C78EA8' },
  publishFab: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center', marginTop: -24, borderWidth: 4, borderColor: '#111016' },
  publishFabText: { color: '#FFF9FB', fontSize: 27, lineHeight: 30, fontWeight: '300' },
  publishContent: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 30 },
  publishHeader: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backArrow: { color: '#C78EA8', fontSize: 38, fontWeight: '300', lineHeight: 40 },
  headerSpacer: { width: 28 },
  publishTitle: { color: '#EAE5ED', fontSize: 18, fontWeight: '800' },
  publishSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8 },
  imagePickerFrame: { width: '100%', aspectRatio: 1, backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#6B5160', borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 28 },
  imagePickerIcon: { color: '#C78EA8', fontSize: 38, fontWeight: '300' },
  imagePickerTitle: { color: '#EAE5ED', fontSize: 16, fontWeight: '800', marginTop: 10 },
  imagePickerHint: { color: '#8F8797', fontSize: 12, marginTop: 5 },
  selectedImage: { width: '100%', height: '100%' },
  publishInfoCard: { backgroundColor: '#242028', borderRadius: 14, padding: 16, marginTop: 20 },
  publishInfoLabel: { color: '#B8AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  publishInfoText: { color: '#AAA1B0', fontSize: 12, lineHeight: 18, marginTop: 5 },
  publishSubmitButton: { height: 52, borderRadius: 13, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  publishSubmitText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  signOutButton: { marginTop: 28, paddingVertical: 12, paddingHorizontal: 20 },
  signOutText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  settingsContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 34 },
  settingsEyebrow: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  settingsTitle: { color: '#EAE5ED', fontSize: 29, fontWeight: '800', marginTop: 9 },
  settingsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8 },
  settingsCard: { backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 18, marginTop: 28 },
  profileSectionTitle: { color: '#EAE5ED', fontSize: 16, fontWeight: '800' },
  profileSectionText: { color: '#AAA1B0', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 18 },
  settingsLabel: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  settingsInput: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', color: '#EAE5ED', paddingHorizontal: 14, fontSize: 14, marginBottom: 17 },
  dateHint: { color: '#756D79', fontSize: 11, lineHeight: 16, marginTop: -10, marginBottom: 16 },
  emailField: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#37303C', backgroundColor: '#242028', justifyContent: 'center', paddingHorizontal: 14 },
  emailText: { color: '#AAA1B0', fontSize: 14 },
  emailHint: { color: '#756D79', fontSize: 11, lineHeight: 16, marginTop: 8 },
  saveButton: { height: 50, borderRadius: 12, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  logoutButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B5160', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  logoutText: { color: '#C78EA8', fontSize: 14, fontWeight: '800' },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 44, paddingBottom: 28 },
  brandBlock: { alignItems: 'center', marginBottom: 52 },
  logoMark: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#EAE5ED', fontSize: 28, fontWeight: '800', letterSpacing: -1, marginTop: 14 },
  tagline: { color: '#AAA1B0', fontSize: 12, marginTop: 4, letterSpacing: 0.4 },
  introBlock: { marginBottom: 24 },
  title: { color: '#EAE5ED', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8 },
  formCard: { backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 22, padding: 18 },
  inputGroup: { marginBottom: 17 },
  inputLabel: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  confirmPasswordLabel: { marginTop: 17 },
  passwordHint: { color: '#756D79', fontSize: 11, marginTop: 7 },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotPassword: { color: '#C78EA8', fontSize: 11, fontWeight: '700' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', color: '#EAE5ED', paddingHorizontal: 14, fontSize: 14 },
  nicknameHint: { color: '#756D79', fontSize: 11, marginTop: -9, marginBottom: 5 },
  primaryButton: { height: 52, borderRadius: 13, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center', marginTop: 2, shadowColor: '#B66F8A', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  primaryButtonText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  buttonArrow: { fontSize: 19, fontWeight: '400' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 21 },
  divider: { flex: 1, height: 1, backgroundColor: '#403844' },
  dividerText: { color: '#8F8797', fontSize: 10 },
  googleButton: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#242028', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3EFF2', alignItems: 'center', justifyContent: 'center' },
  googleG: { color: '#6F829E', fontSize: 14, fontWeight: '800' },
  googleText: { color: '#EAE5ED', fontSize: 13, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 26 },
  switchText: { color: '#AAA1B0', fontSize: 13 },
  switchAction: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  legalText: { color: '#756D79', textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 24, paddingHorizontal: 18 },
});
