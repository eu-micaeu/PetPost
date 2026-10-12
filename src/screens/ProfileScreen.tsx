import React, { useCallback, useEffect, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { PetRecord, PostRecord } from '../types';
import { getAgeString, isValidBirthDate } from '../utils/petHelpers';
import * as Haptics from 'expo-haptics';
import { useToast } from '../contexts/ToastContext';
import { FeedCardSkeleton, PetCardSkeleton } from '../components/Skeleton';
import {
  CakeIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GearIcon,
  PawIcon,
  PlusIcon,
  SpeciesIcon,
  TrashIcon,
} from '../components/Icons';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 44 - 12) / 2;

async function fetchProfileData(userId: string, currentNickname: string | null) {
  const [petsRes, postsRes] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name, species, breed, birth_date, sex, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, user_id, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (petsRes.error) throw petsRes.error;
  if (postsRes.error) throw postsRes.error;

  const formattedPosts: PostRecord[] = (postsRes.data ?? []).map((post) => ({
    ...post,
    nickname: currentNickname,
  }));

  return {
    pets: petsRes.data ?? [],
    posts: formattedPosts,
  };
}

type SegmentType = 'pets' | 'posts';

export function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const toast = useToast();

  // Navigation segment
  const [activeSegment, setActiveSegment] = useState<SegmentType>('pets');

  // Data states
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pet form state
  const speciesOptions = ['Cachorro', 'Gato', 'Ave', 'Coelho', 'Outro'];
  const sexOptions = ['Macho', 'Fêmea', 'Não informar'];
  const [isPetFormVisible, setIsPetFormVisible] = useState(false);
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('Cachorro');
  const [petBreed, setPetBreed] = useState('');
  const [petBirthDate, setPetBirthDate] = useState('');
  const [petSex, setPetSex] = useState('');
  const [petImageUri, setPetImageUri] = useState<string | null>(null);
  const [petImageBase64, setPetImageBase64] = useState<string | null>(null);
  const [petExistingImageUrl, setPetExistingImageUrl] = useState<string | null>(null);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  // Posts state
  const [postViewMode, setPostViewMode] = useState<'grid' | 'feed'>('grid');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const displayName = profile?.nickname
    ? `@${profile.nickname}`
    : user?.user_metadata?.name || 'Meu Perfil';
  const initial = (displayName.replace('@', '')[0] || 'P').toUpperCase();

  // 1. Carregamento inicial
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    async function load() {
      try {
        const nickname = profile?.nickname ?? user!.user_metadata?.nickname ?? null;
        const data = await fetchProfileData(user!.id, nickname);
        if (isMounted) {
          setPets(data.pets);
          setPosts(data.posts);
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do perfil:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  // 2. Atualização ao focar na tela
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isMounted = true;
      const nickname = profile?.nickname ?? user.user_metadata?.nickname ?? null;

      fetchProfileData(user.id, nickname)
        .then((data) => {
          if (isMounted) {
            setPets(data.pets);
            setPosts(data.posts);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [user, profile]),
  );

  // 3. Atualização em tempo real (Supabase Realtime + Polling em background)
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function refreshSilently() {
      try {
        const nickname = profile?.nickname ?? user?.user_metadata?.nickname ?? null;
        const data = await fetchProfileData(userId, nickname);
        setPets(data.pets);
        setPosts(data.posts);
      } catch {
        // Silencioso
      }
    }

    const channelTopic = `profile_screen_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshSilently();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshSilently();
        },
      )
      .subscribe();

    const interval = setInterval(refreshSilently, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, profile?.nickname, user?.user_metadata?.nickname]);

  async function handleRefresh() {
    if (!user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setIsRefreshing(true);
    try {
      const nickname = profile?.nickname ?? user.user_metadata?.nickname ?? null;
      const data = await fetchProfileData(user.id, nickname);
      setPets(data.pets);
      setPosts(data.posts);
    } finally {
      setIsRefreshing(false);
    }
  }

  // --- Pet Handlers ---
  async function choosePetImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às suas fotos para escolher uma foto do pet.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPetImageUri(result.assets[0].uri);
      setPetImageBase64(result.assets[0].base64 ?? null);
      setPetExistingImageUrl(null);
    }
  }

  function resetPetForm() {
    setPetName('');
    setPetSpecies('Cachorro');
    setPetBreed('');
    setPetBirthDate('');
    setPetSex('');
    setPetImageUri(null);
    setPetImageBase64(null);
    setPetExistingImageUrl(null);
    setIsSpeciesOpen(false);
    setEditingPetId(null);
    setIsPetFormVisible(false);
  }

  function openEditPet(pet: PetRecord) {
    setEditingPetId(pet.id);
    setPetName(pet.name);
    setPetSpecies(pet.species);
    setPetBreed(pet.breed ?? '');
    setPetBirthDate(pet.birth_date ?? '');
    setPetSex(pet.sex ?? '');
    setPetImageUri(null);
    setPetImageBase64(null);
    setPetExistingImageUrl(pet.image_url);
    setIsPetFormVisible(true);
    setActiveSegment('pets');
  }

  async function savePet() {
    if (!user?.id) return;
    if (!petName.trim() || !petSpecies.trim()) {
      Alert.alert('Preencha os campos', 'Informe pelo menos o nome e a espécie do seu pet.');
      return;
    }
    if (petBirthDate && !isValidBirthDate(petBirthDate)) {
      Alert.alert('Data inválida', 'Informe uma data existente no formato AAAA-MM-DD e que não seja futura.');
      return;
    }

    setIsSavingPet(true);
    try {
      let imageUrl: string | null = petExistingImageUrl;
      if (petImageUri) {
        const filePath = `${user.id}/pets/${Date.now()}.jpg`;
        let fileData: ArrayBuffer | Blob;
        if (petImageBase64) {
          fileData = decode(petImageBase64);
        } else {
          const imageResponse = await fetch(petImageUri);
          fileData = await imageResponse.blob();
        }

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, fileData, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('pet-photos').getPublicUrl(filePath).data.publicUrl;
      }

      const petPayload = {
        name: petName.trim(),
        species: petSpecies.trim(),
        breed: petBreed.trim() || null,
        birth_date: petBirthDate || null,
        sex: petSex.trim() || null,
        image_url: imageUrl,
      };

      const query = editingPetId
        ? supabase.from('pets').update(petPayload).eq('id', editingPetId).eq('user_id', user.id)
        : supabase.from('pets').insert({ user_id: user.id, ...petPayload });

      const { data, error } = await query
        .select('id, name, species, breed, birth_date, sex, image_url')
        .single();

      if (error) throw error;

      setPets((current) =>
        editingPetId
          ? current.map((p) => (p.id === editingPetId ? data : p))
          : [data, ...current],
      );
      resetPetForm();
      toast.show(
        editingPetId
          ? `${data.name} atualizado com sucesso!`
          : `${data.name} cadastrado com sucesso!`,
        'success',
      );
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Não foi possível salvar o pet.', 'error');
    } finally {
      setIsSavingPet(false);
    }
  }

  function confirmDeletePet(petId: string, petNameText: string) {
    Alert.alert(
      'Excluir pet',
      `Tem certeza que deseja remover ${petNameText} do seu perfil?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deletePet(petId),
        },
      ],
    );
  }

  async function deletePet(petId: string) {
    setDeletingPetId(petId);
    try {
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;
      setPets((current) => current.filter((p) => p.id !== petId));
      toast.show('Pet removido com sucesso.', 'info');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Erro ao excluir o pet.', 'error');
    } finally {
      setDeletingPetId(null);
    }
  }

  // --- Post Handlers ---
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
      ],
    );
  }

  async function deletePost(postId: string) {
    setDeletingPostId(postId);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.show('Momento excluído.', 'info');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Erro ao excluir.', 'error');
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/settings')}
          hitSlop={12}
        >
          <GearIcon color="#C78EA8" size={18} />
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
        {/* User Hero Card */}
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

          {/* Quick Profile Actions */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.editActionButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.editActionText}>Editar Conta</Text>
            </Pressable>
          </View>
        </View>

        {/* Segment Switcher */}
        <View style={styles.segmentSwitcher}>
          <Pressable
            style={[
              styles.segmentTab,
              activeSegment === 'pets' && styles.segmentTabActive,
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {
                // Silencioso
              }
              setActiveSegment('pets');
            }}
          >
            <View style={styles.segmentTabInner}>
              <PawIcon
                color={activeSegment === 'pets' ? '#F0AEC9' : '#8E8698'}
                size={16}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  activeSegment === 'pets' && styles.segmentTabTextActive,
                ]}
              >
                Meus Pets ({pets.length})
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.segmentTab,
              activeSegment === 'posts' && styles.segmentTabActive,
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {
                // Silencioso
              }
              setActiveSegment('posts');
            }}
          >
            <View style={styles.segmentTabInner}>
              <CameraIcon
                color={activeSegment === 'posts' ? '#F0AEC9' : '#8E8698'}
                size={16}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  activeSegment === 'posts' && styles.segmentTabTextActive,
                ]}
              >
                Minhas Fotos ({posts.length})
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Loading Indicator com Skeleton */}
        {isLoading ? (
          <View style={{ gap: 14, marginTop: 16 }}>
            {activeSegment === 'pets' ? (
              <>
                <PetCardSkeleton />
                <PetCardSkeleton />
              </>
            ) : (
              <FeedCardSkeleton />
            )}
          </View>
        ) : activeSegment === 'pets' ? (
          /* ================= PETS TAB ================= */
          <View style={styles.segmentContent}>
            {/* Header with Add Button */}
            <View style={styles.subHeader}>
              <View>
                <Text style={styles.subEyebrow}>COMPANHEIROS</Text>
                <Text style={styles.subTitle}>Seus pets cadastrados</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.addPetButton,
                  isPetFormVisible && styles.addPetButtonCancel,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  if (isPetFormVisible) {
                    resetPetForm();
                  } else {
                    resetPetForm();
                    setIsPetFormVisible(true);
                  }
                }}
              >
                <View style={styles.buttonWithIcon}>
                  {!isPetFormVisible && <PlusIcon color="#F0AEC9" size={14} />}
                  <Text style={styles.addPetButtonText}>
                    {isPetFormVisible ? 'Fechar' : 'Adicionar Pet'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Collapsible Add/Edit Pet Form */}
            {isPetFormVisible && (
              <View style={styles.petFormCard}>
                <Text style={styles.formTitle}>
                  {editingPetId ? 'Editar perfil do pet' : 'Cadastrar novo pet'}
                </Text>

                {/* Pet Photo Picker */}
                <Pressable style={styles.photoPicker} onPress={choosePetImage}>
                  {petImageUri || petExistingImageUrl ? (
                    <Image
                      source={{ uri: petImageUri || petExistingImageUrl! }}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <CameraIcon color="#C78EA8" size={26} />
                      <Text style={styles.photoText}>Escolher foto do pet</Text>
                    </View>
                  )}
                </Pressable>

                {/* Name */}
                <Text style={styles.inputLabel}>NOME DO PET *</Text>
                <TextInput
                  value={petName}
                  onChangeText={setPetName}
                  placeholder="Ex: Thor, Mel, Pipoca"
                  placeholderTextColor="#8F8797"
                  style={styles.textInput}
                />

                {/* Species Dropdown */}
                <Text style={styles.inputLabel}>ESPÉCIE *</Text>
                <Pressable
                  style={styles.comboButton}
                  onPress={() => setIsSpeciesOpen((prev) => !prev)}
                >
                  <View style={styles.comboValueGroup}>
                    <SpeciesIcon species={petSpecies} size={18} color="#F0AEC9" />
                    <Text style={styles.comboValue}>{petSpecies}</Text>
                  </View>
                  {isSpeciesOpen ? (
                    <ChevronUpIcon color="#C78EA8" size={16} />
                  ) : (
                    <ChevronDownIcon color="#C78EA8" size={16} />
                  )}
                </Pressable>
                {isSpeciesOpen && (
                  <View style={styles.comboOptions}>
                    {speciesOptions.map((opt) => (
                      <Pressable
                        key={opt}
                        style={[
                          styles.comboOption,
                          opt === petSpecies && styles.comboOptionActive,
                        ]}
                        onPress={() => {
                          setPetSpecies(opt);
                          setIsSpeciesOpen(false);
                        }}
                      >
                        <View style={styles.speciesOptionRow}>
                          <SpeciesIcon
                            species={opt}
                            size={18}
                            color={opt === petSpecies ? '#F0AEC9' : '#DDD5E5'}
                          />
                          <Text
                            style={[
                              styles.comboOptionText,
                              opt === petSpecies && styles.comboOptionTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Breed */}
                <Text style={styles.inputLabel}>RAÇA</Text>
                <TextInput
                  value={petBreed}
                  onChangeText={setPetBreed}
                  placeholder="Ex: Golden Retriever, SRD, Siamês"
                  placeholderTextColor="#8F8797"
                  style={styles.textInput}
                />

                {/* Sex Options */}
                <Text style={styles.inputLabel}>SEXO</Text>
                <View style={styles.sexRow}>
                  {sexOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      style={[
                        styles.sexButton,
                        petSex === opt && styles.sexButtonActive,
                      ]}
                      onPress={() => setPetSex(opt)}
                    >
                      <Text
                        style={[
                          styles.sexButtonText,
                          petSex === opt && styles.sexButtonTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Birth Date */}
                <Text style={styles.inputLabel}>DATA DE NASCIMENTO (AAAA-MM-DD)</Text>
                <TextInput
                  value={petBirthDate}
                  onChangeText={setPetBirthDate}
                  placeholder="Ex: 2022-05-15"
                  placeholderTextColor="#8F8797"
                  style={styles.textInput}
                  keyboardType="numbers-and-punctuation"
                />

                {/* Form Buttons */}
                <View style={styles.formButtonRow}>
                  <Pressable
                    style={styles.cancelFormBtn}
                    onPress={resetPetForm}
                    disabled={isSavingPet}
                  >
                    <Text style={styles.cancelFormText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.saveFormBtn}
                    onPress={savePet}
                    disabled={isSavingPet}
                  >
                    {isSavingPet ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveFormText}>
                        {editingPetId ? 'Salvar Alterações' : 'Cadastrar Pet'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Pets List */}
            {pets.length === 0 && !isPetFormVisible ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <PawIcon color="#C78EA8" size={28} />
                </View>
                <Text style={styles.emptyTitle}>Nenhum pet cadastrado ainda</Text>
                <Text style={styles.emptySubtitle}>
                  Adicione o perfil do seu pet para acompanhar a idade e compartilhar fotos especiais com seus amigos!
                </Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    resetPetForm();
                    setIsPetFormVisible(true);
                  }}
                >
                  <View style={styles.buttonWithIcon}>
                    <PlusIcon color="#FFF9FB" size={16} />
                    <Text style={styles.emptyButtonText}>Cadastrar meu primeiro pet</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <View style={styles.petList}>
                {pets.map((pet) => {
                  const age = getAgeString(pet.birth_date);
                  return (
                    <View key={pet.id} style={styles.petCard}>
                      <View style={styles.petCardLeft}>
                        {pet.image_url ? (
                          <Image
                            source={{ uri: pet.image_url }}
                            style={styles.petCardImage}
                          />
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

                      {/* Edit / Delete Buttons */}
                      <View style={styles.petCardActions}>
                        <Pressable
                          style={styles.petEditBtn}
                          onPress={() => openEditPet(pet)}
                          hitSlop={8}
                        >
                          <Text style={styles.petEditText}>Editar</Text>
                        </Pressable>
                        <Pressable
                          style={styles.petDeleteBtn}
                          onPress={() => confirmDeletePet(pet.id, pet.name)}
                          hitSlop={8}
                          disabled={deletingPetId === pet.id}
                        >
                          {deletingPetId === pet.id ? (
                            <ActivityIndicator size="small" color="#FF7676" />
                          ) : (
                            <TrashIcon color="#EF5350" size={15} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* ================= POSTS TAB ================= */
          <View style={styles.segmentContent}>
            {/* Header with View Toggle */}
            <View style={styles.subHeader}>
              <View>
                <Text style={styles.subEyebrow}>HISTÓRICO</Text>
                <Text style={styles.subTitle}>Fotos que você publicou</Text>
              </View>
              <View style={styles.viewModeToggle}>
                <Pressable
                  style={[
                    styles.modeButton,
                    postViewMode === 'grid' && styles.modeButtonActive,
                  ]}
                  onPress={() => setPostViewMode('grid')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      postViewMode === 'grid' && styles.modeButtonTextActive,
                    ]}
                  >
                    Grade
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modeButton,
                    postViewMode === 'feed' && styles.modeButtonActive,
                  ]}
                  onPress={() => setPostViewMode('feed')}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      postViewMode === 'feed' && styles.modeButtonTextActive,
                    ]}
                  >
                    Lista
                  </Text>
                </Pressable>
              </View>
            </View>

            {posts.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <CameraIcon color="#C78EA8" size={28} />
                </View>
                <Text style={styles.emptyTitle}>Nenhum momento publicado</Text>
                <Text style={styles.emptySubtitle}>
                  Você ainda não compartilhou fotos dos seus pets. Que tal publicar sua primeira foto agora?
                </Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push('/publish')}
                >
                  <View style={styles.buttonWithIcon}>
                    <PlusIcon color="#FFF9FB" size={16} />
                    <Text style={styles.emptyButtonText}>Publicar uma foto</Text>
                  </View>
                </Pressable>
              </View>
            ) : postViewMode === 'grid' ? (
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
                          <TrashIcon color="#FF7676" size={14} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              /* Feed View */
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
                          <ActivityIndicator size="small" color="#EF5350" />
                        ) : (
                          <View style={styles.feedDeleteInner}>
                            <TrashIcon color="#EF5350" size={14} />
                            <Text style={styles.feedDeleteText}>Excluir</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
  headerTitle: {
    color: '#FFF9FB',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1722',
    borderWidth: 1,
    borderColor: '#2F2A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  profileCard: {
    backgroundColor: '#171420',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
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
  actionRow: {
    flexDirection: 'row',
    width: '100%',
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
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#171420',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2535',
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  segmentTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentTabActive: {
    backgroundColor: '#292235',
  },
  segmentTabText: {
    color: '#8E8698',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    color: '#F0AEC9',
    fontWeight: '700',
  },
  segmentContent: {
    width: '100%',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subEyebrow: {
    color: '#B66F8A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  subTitle: {
    color: '#FFF9FB',
    fontSize: 17,
    fontWeight: '700',
  },
  addPetButton: {
    backgroundColor: '#262031',
    borderWidth: 1,
    borderColor: '#C78EA8',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addPetButtonCancel: {
    backgroundColor: '#1F1A25',
    borderColor: '#4A4154',
  },
  addPetButtonText: {
    color: '#F0AEC9',
    fontSize: 12,
    fontWeight: '700',
  },
  petFormCard: {
    backgroundColor: '#191522',
    borderWidth: 1,
    borderColor: '#332B3F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  formTitle: {
    color: '#FFF9FB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  photoPicker: {
    width: '100%',
    height: 120,
    backgroundColor: '#120F18',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D2638',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  photoText: {
    color: '#8F8698',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#8F8698',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#13101A',
    borderWidth: 1,
    borderColor: '#2F273B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF9FB',
    fontSize: 14,
  },
  comboButton: {
    backgroundColor: '#13101A',
    borderWidth: 1,
    borderColor: '#2F273B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comboValue: {
    color: '#FFF9FB',
    fontSize: 14,
  },
  comboOptions: {
    backgroundColor: '#171320',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#382F46',
    marginTop: 6,
    overflow: 'hidden',
  },
  comboOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#251E31',
  },
  comboOptionActive: {
    backgroundColor: '#261F34',
  },
  speciesOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comboOptionText: {
    color: '#DDD5E5',
    fontSize: 13,
  },
  comboOptionTextActive: {
    color: '#F0AEC9',
    fontWeight: '700',
  },
  sexRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sexButton: {
    flex: 1,
    backgroundColor: '#13101A',
    borderWidth: 1,
    borderColor: '#2F273B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  sexButtonActive: {
    backgroundColor: '#261F34',
    borderColor: '#C78EA8',
  },
  sexButtonText: {
    color: '#8F8698',
    fontSize: 12,
    fontWeight: '600',
  },
  sexButtonTextActive: {
    color: '#F0AEC9',
    fontWeight: '700',
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelFormBtn: {
    flex: 1,
    backgroundColor: '#201A29',
    borderWidth: 1,
    borderColor: '#372D45',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelFormText: {
    color: '#9C92A6',
    fontSize: 13,
    fontWeight: '700',
  },
  saveFormBtn: {
    flex: 2,
    backgroundColor: '#C78EA8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFormText: {
    color: '#FFF9FB',
    fontSize: 13,
    fontWeight: '700',
  },
  petList: {
    gap: 12,
  },
  petCard: {
    backgroundColor: '#171420',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#282335',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  petCardImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#100D16',
  },
  petCardFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#231E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCardDetails: {
    flex: 1,
  },
  petCardName: {
    color: '#FFF9FB',
    fontSize: 16,
    fontWeight: '700',
  },
  petCardSubtitle: {
    color: '#8A8292',
    fontSize: 12,
    marginTop: 2,
  },
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
  petAgeText: {
    color: '#C78EA8',
    fontSize: 11,
    fontWeight: '700',
  },
  petCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petEditBtn: {
    backgroundColor: '#221D2C',
    borderWidth: 1,
    borderColor: '#372E43',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  petEditText: {
    color: '#DDD5E4',
    fontSize: 12,
    fontWeight: '600',
  },
  petDeleteBtn: {
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 83, 80, 0.25)',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#171420',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282333',
    padding: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#231E2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#C78EA8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFF9FB',
    fontSize: 13,
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
  feedContainer: {
    gap: 16,
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
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  feedDeleteInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  feedDeleteText: {
    color: '#EF5350',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingIndicator: {
    marginTop: 40,
  },
});
