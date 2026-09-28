import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import type { PostRecord } from '../types';
import type { Session } from '@supabase/supabase-js';

type PublishScreenProps = {
  session: Session;
  onCancel: () => void;
  onPublished: (post: PostRecord) => void;
};

export function PublishScreen({ session, onCancel, onPublished }: PublishScreenProps) {
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
      const isStorageNotConfigured =
        message.toLowerCase().includes('bucket') || message.toLowerCase().includes('posts');
      Alert.alert(
        isStorageNotConfigured ? 'Storage ainda não configurado' : 'Não foi possível publicar',
        isStorageNotConfigured
          ? 'Execute a migration 001_create_pet_photos.sql no SQL Editor do Supabase e tente novamente.'
          : message,
      );
    }
  }

  return (
    <ScrollView
      style={styles.publishScroll}
      contentContainerStyle={styles.publishContent}
      showsVerticalScrollIndicator={false}
    >
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

const styles = StyleSheet.create({
  publishScroll: { flex: 1, width: '100%' },
  publishContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 28 },
  publishHeader: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { color: '#C78EA8', fontSize: 24, lineHeight: 24 },
  backButtonText: { color: '#C78EA8', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  headerRightSpacer: { width: 70 },
  publishSubtitle: { color: '#AAA1B0', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  imagePickerFrame: { width: '100%', aspectRatio: 1, backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 18 },
  selectedImage: { width: '100%', height: '100%' },
  imagePickerIcon: { color: '#C78EA8', fontSize: 36, marginBottom: 8 },
  imagePickerTitle: { color: '#EAE5ED', fontSize: 16, fontWeight: '800' },
  imagePickerHint: { color: '#AAA1B0', fontSize: 12, marginTop: 4 },
  publishInfoCard: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 16, padding: 16, marginBottom: 20 },
  publishInfoLabel: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 },
  publishInfoText: { color: '#AAA1B0', fontSize: 13, lineHeight: 19 },
  publishSubmitButton: { width: '100%', backgroundColor: '#B66F8A', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  publishSubmitText: { color: '#FFF9FB', fontSize: 15, fontWeight: '800' },
});
