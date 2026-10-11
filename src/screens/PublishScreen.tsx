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
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { decode } from 'base64-arraybuffer';
import {
  CameraIcon,
  ChevronLeftIcon,
  GalleryIcon,
  SpeciesIcon,
  XIcon,
} from '../components/Icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { PetRecord, PostRecord } from '../types';

type PublishScreenProps = {
  onCancel?: () => void;
  onPublished?: (post: PostRecord) => void;
};

export function PublishScreen({ onCancel, onPublished }: PublishScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Carregar lista de pets do usuário para associar ao post
  useEffect(() => {
    if (!user?.id) return;
    async function loadPets() {
      try {
        const { data } = await supabase
          .from('pets')
          .select('id, name, species, breed, birth_date, sex, image_url')
          .eq('user_id', user!.id)
          .order('name');
        if (data) {
          setPets(data);
        }
      } catch {
        // Silencioso
      }
    }
    loadPets();
  }, [user]);

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }

  async function takePhoto() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show('Permita o acesso à câmera para tirar fotos.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function chooseFromGallery() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Permita o acesso à galeria para escolher uma foto.', 'error');
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
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  function handleSelectPet(petId: string) {
    try {
      Haptics.selectionAsync();
    } catch {
      // Silencioso
    }
    setSelectedPetId((prev) => (prev === petId ? null : petId));
  }

  function clearImage() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silencioso
    }
    setImageUri(null);
    setImageBase64(null);
  }

  async function publishImage() {
    if (!user?.id) return;
    if (!imageUri) {
      toast.show('Escolha ou tire uma foto antes de publicar.', 'info');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Silencioso
    }

    setIsPublishing(true);
    try {
      const filePath = `${user.id}/${Date.now()}.jpg`;
      let fileData: ArrayBuffer | Blob;
      if (imageBase64) {
        fileData = decode(imageBase64);
      } else {
        const imageResponse = await fetch(imageUri);
        fileData = await imageResponse.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicData.publicUrl,
      });

      if (postError) throw postError;

      setIsPublishing(false);
      const newPost: PostRecord = {
        id: filePath,
        user_id: user.id,
        image_url: publicData.publicUrl,
        created_at: new Date().toISOString(),
        nickname: user.user_metadata?.nickname,
      };

      toast.show('Momento publicado com sucesso!', 'success');

      if (onPublished) {
        onPublished(newPost);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      setIsPublishing(false);
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      toast.show(message, 'error');
    }
  }

  return (
    <ScrollView
      style={styles.publishScroll}
      contentContainerStyle={styles.publishContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabeçalho */}
      <View style={styles.publishHeader}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={handleCancel}
          hitSlop={12}
        >
          <ChevronLeftIcon color="#C78EA8" size={20} />
          <Text style={styles.backButtonText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Novo momento</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <Text style={styles.publishSubtitle}>Compartilhe uma foto especial do seu pet.</Text>

      {/* Frame da Imagem */}
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.selectedImage} />
          <Pressable style={styles.removeImageButton} onPress={clearImage} hitSlop={8}>
            <XIcon color="#FFF9FB" size={18} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.actionButtonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.chooseMediaCard,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={takePhoto}
          >
            <View style={styles.iconCircle}>
              <CameraIcon color="#C78EA8" size={28} />
            </View>
            <Text style={styles.chooseMediaTitle}>Tirar foto</Text>
            <Text style={styles.chooseMediaHint}>Usar a câmera</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.chooseMediaCard,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={chooseFromGallery}
          >
            <View style={styles.iconCircle}>
              <GalleryIcon color="#C78EA8" size={28} />
            </View>
            <Text style={styles.chooseMediaTitle}>Galeria</Text>
            <Text style={styles.chooseMediaHint}>Escolher foto</Text>
          </Pressable>
        </View>
      )}

      {/* Seção de seleção do Pet */}
      {pets.length > 0 && (
        <View style={styles.petSection}>
          <Text style={styles.sectionLabel}>QUAL PET ESTÁ NESSE MOMENTO? (OPCIONAL)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petChipsScroll}
          >
            {pets.map((pet) => {
              const isSelected = selectedPetId === pet.id;
              return (
                <Pressable
                  key={pet.id}
                  style={({ pressed }) => [
                    styles.petChip,
                    isSelected && styles.petChipSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleSelectPet(pet.id)}
                >
                  <SpeciesIcon
                    species={pet.species}
                    size={16}
                    color={isSelected ? '#FFF9FB' : '#C78EA8'}
                  />
                  <Text style={[styles.petChipText, isSelected && styles.petChipTextSelected]}>
                    {pet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Dica */}
      <View style={styles.publishInfoCard}>
        <Text style={styles.publishInfoLabel}>DICA DO PETPOST</Text>
        <Text style={styles.publishInfoText}>
          Uma foto por dia é o bastante para guardar a história do seu pet na comunidade.
        </Text>
      </View>

      {/* Botão de Enviar */}
      <Pressable
        style={({ pressed }) => [
          styles.publishSubmitButton,
          !imageUri && styles.publishSubmitButtonDisabled,
          pressed && imageUri && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}
        onPress={publishImage}
        disabled={isPublishing || !imageUri}
      >
        {isPublishing ? (
          <ActivityIndicator color="#FFF9FB" />
        ) : (
          <Text style={styles.publishSubmitText}>Publicar momento</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  publishScroll: { flex: 1, width: '100%', backgroundColor: '#111016' },
  publishContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 32 },
  publishHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backButtonText: { color: '#C78EA8', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  headerRightSpacer: { width: 70 },
  publishSubtitle: { color: '#AAA1B0', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  chooseMediaCard: {
    flex: 1,
    aspectRatio: 1.1,
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#27202C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chooseMediaTitle: {
    color: '#EAE5ED',
    fontSize: 15,
    fontWeight: '800',
  },
  chooseMediaHint: {
    color: '#AAA1B0',
    fontSize: 12,
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#B8AABD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  petChipsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  petChipSelected: {
    backgroundColor: '#B66F8A',
    borderColor: '#D48DA9',
  },
  petChipText: {
    color: '#AAA1B0',
    fontSize: 13,
    fontWeight: '700',
  },
  petChipTextSelected: {
    color: '#FFF9FB',
  },
  publishInfoCard: {
    width: '100%',
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  publishInfoLabel: {
    color: '#B8AABD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  publishInfoText: { color: '#AAA1B0', fontSize: 13, lineHeight: 19 },
  publishSubmitButton: {
    width: '100%',
    backgroundColor: '#B66F8A',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishSubmitButtonDisabled: {
    opacity: 0.5,
  },
  publishSubmitText: { color: '#FFF9FB', fontSize: 15, fontWeight: '800' },
});
