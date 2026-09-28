import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import type { PetRecord } from '../types';
import { getAgeString, getSpeciesEmoji, isValidBirthDate } from '../utils/petHelpers';
import type { Session } from '@supabase/supabase-js';

export function PetsScreen({ session }: { session: Session }) {
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
    const { data, error } = await supabase
      .from('pets')
      .select('id, name, species, breed, birth_date, sex, image_url')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Não foi possível carregar seus pets', error.message);
      setIsFormVisible(true);
    } else {
      setPets(data ?? []);
      if ((data ?? []).length === 0) setIsFormVisible(true);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadPets();
  }, [session.user.id]);

  async function choosePetImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às suas fotos para escolher uma imagem do pet.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExistingImageUrl(null);
    }
  }

  function resetForm() {
    setName('');
    setSpecies('Cachorro');
    setBreed('');
    setBirthDate('');
    setSex('');
    setImageUri(null);
    setExistingImageUrl(null);
    setIsSpeciesOpen(false);
    setEditingPetId(null);
    setIsFormVisible(false);
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

  async function savePet() {
    if (!name.trim() || !species.trim()) {
      Alert.alert('Preencha os campos', 'Informe pelo menos o nome e a espécie do seu pet.');
      return;
    }
    if (birthDate && !isValidBirthDate(birthDate)) {
      Alert.alert('Data inválida', 'Informe uma data existente no formato AAAA-MM-DD e que não seja futura.');
      return;
    }
    setIsSaving(true);
    try {
      let imageUrl: string | null = existingImageUrl;
      if (imageUri) {
        const imageResponse = await fetch(imageUri);
        const imageBlob = await imageResponse.blob();
        const filePath = `${session.user.id}/pets/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, imageBlob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('pet-photos').getPublicUrl(filePath).data.publicUrl;
      }
      const petPayload = {
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || null,
        birth_date: birthDate || null,
        sex: sex.trim() || null,
        image_url: imageUrl,
      };
      const query = editingPetId
        ? supabase.from('pets').update(petPayload).eq('id', editingPetId).eq('user_id', session.user.id)
        : supabase.from('pets').insert({ user_id: session.user.id, ...petPayload });

      const { data, error } = await query.select('id, name, species, breed, birth_date, sex, image_url').single();
      if (error) throw error;

      setPets((currentPets) =>
        editingPetId
          ? currentPets.map((pet) => (pet.id === editingPetId ? data : pet))
          : [data, ...currentPets],
      );
      resetForm();
      Alert.alert(editingPetId ? 'Pet atualizado' : 'Pet cadastrado', `${data.name} foi salvo no seu perfil.`);
    } catch (error) {
      Alert.alert('Não foi possível cadastrar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.petsContent}>
      <Text style={styles.petsIcon}>🐾</Text>
      <Text style={styles.petsTitle}>Seus pets</Text>
      <Text style={styles.petsSubtitle}>Crie um perfil para cada companheiro e guarde os momentos especiais.</Text>

      {isLoading ? (
        <ActivityIndicator color="#B66F8A" style={styles.loadingIndicator} />
      ) : pets.length === 0 && !isFormVisible ? (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabTitle}>Cadastre seu primeiro pet</Text>
          <Text style={styles.emptyTabText}>Você poderá ter um ou vários pets no seu perfil.</Text>
        </View>
      ) : (
        <View style={styles.petList}>
          {pets.map((pet) => {
            const age = getAgeString(pet.birth_date);
            return (
              <Pressable
                key={pet.id}
                style={({ pressed }) => [styles.petCard, pressed && styles.petCardPressed]}
                onPress={() => editPet(pet)}
              >
                <View style={styles.petAvatarWrapper}>
                  {pet.image_url ? (
                    <Image source={{ uri: pet.image_url }} style={styles.petAvatarImage} />
                  ) : (
                    <View style={styles.petAvatarFallback}>
                      <Text style={styles.petAvatarEmoji}>{getSpeciesEmoji(pet.species)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.petInfoContainer}>
                  <Text style={styles.petName} numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <Text style={styles.petMinimalDetails} numberOfLines={1}>
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ''}
                    {age ? ` · ${age}` : ''}
                  </Text>
                </View>

                <Text style={styles.petChevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {isFormVisible && (
        <View style={styles.petForm}>
          <Text style={styles.petFormTitle}>{editingPetId ? 'Editar pet' : 'Novo pet'}</Text>

          <Text style={styles.fieldLabel}>NOME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Luna"
            placeholderTextColor="#8F8797"
            style={styles.fieldInput}
          />

          <Text style={styles.fieldLabel}>ESPÉCIE</Text>
          <Pressable style={styles.comboButton} onPress={() => setIsSpeciesOpen((current) => !current)}>
            <Text style={styles.comboValue}>{species}</Text>
            <Text style={styles.comboArrow}>{isSpeciesOpen ? '⌃' : '⌄'}</Text>
          </Pressable>
          {isSpeciesOpen && (
            <View style={styles.comboOptions}>
              {speciesOptions.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.comboOption, option === species && styles.comboOptionSelected]}
                  onPress={() => {
                    setSpecies(option);
                    setIsSpeciesOpen(false);
                  }}
                >
                  <Text style={[styles.comboOptionText, option === species && styles.comboOptionTextSelected]}>
                    {option}
                  </Text>
                  {option === species && <Text style={styles.comboCheck}>✓</Text>}
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>RAÇA (OPCIONAL)</Text>
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="Ex: vira-lata"
            placeholderTextColor="#8F8797"
            style={styles.fieldInput}
          />

          <Text style={styles.fieldLabel}>DATA DE NASCIMENTO (OPCIONAL)</Text>
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#8F8797"
            style={styles.fieldInput}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.dateHint}>Formato: AAAA-MM-DD · não pode ser uma data futura.</Text>

          <Text style={styles.fieldLabel}>SEXO DO PET (OPCIONAL)</Text>
          <View style={styles.sexOptions}>
            {sexOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.sexOption, sex === option && styles.sexOptionSelected]}
                onPress={() => setSex(option)}
              >
                <Text style={[styles.sexOptionText, sex === option && styles.sexOptionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.petImageButton} onPress={choosePetImage}>
            {imageUri || existingImageUrl ? (
              <Image source={{ uri: imageUri ?? existingImageUrl ?? undefined }} style={styles.petImagePreview} />
            ) : (
              <Text style={styles.petImageButtonText}>＋ Adicionar foto</Text>
            )}
          </Pressable>

          <View style={styles.petFormActions}>
            <Pressable style={styles.petCancelButton} onPress={resetForm}>
              <Text style={styles.petCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={savePet} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color="#FFF9FB" />
              ) : (
                <Text style={styles.saveButtonText}>{editingPetId ? 'Salvar alterações' : 'Cadastrar pet'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {!isFormVisible && (
        <Pressable style={styles.primaryButton} onPress={() => setIsFormVisible(true)}>
          <Text style={styles.primaryButtonText}>＋ Cadastrar pet</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  petsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  petsIcon: { fontSize: 36, marginBottom: 12 },
  petsTitle: { color: '#EAE5ED', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  petsSubtitle: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  loadingIndicator: { marginTop: 40 },
  emptyTab: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingTop: 40, paddingBottom: 20 },
  emptyTabTitle: { color: '#EAE5ED', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyTabText: { color: '#AAA1B0', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  petList: { width: '100%', marginTop: 12 },
  petCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#251D2A',
  },
  petCardPressed: { opacity: 0.6 },
  petAvatarWrapper: { marginRight: 14 },
  petAvatarImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E1B24' },
  petAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#26222C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarEmoji: { fontSize: 22 },
  petInfoContainer: { flex: 1, justifyContent: 'center' },
  petName: { color: '#EAE5ED', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  petMinimalDetails: { color: '#8F8797', fontSize: 13 },
  petChevron: { color: '#4A4152', fontSize: 24, paddingLeft: 10, paddingRight: 4, paddingBottom: 2 },
  petForm: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 18, marginTop: 26 },
  petFormTitle: { color: '#EAE5ED', fontSize: 18, fontWeight: '800', marginBottom: 18 },
  fieldLabel: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  fieldInput: { backgroundColor: '#151319', borderWidth: 1, borderColor: '#443B49', borderRadius: 12, color: '#EAE5ED', paddingHorizontal: 14, height: 48, fontSize: 14 },
  dateHint: { color: '#8F8797', fontSize: 11, marginTop: 6, marginBottom: 4 },
  comboButton: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comboValue: { color: '#EAE5ED', fontSize: 14 },
  comboArrow: { color: '#C78EA8', fontSize: 20, lineHeight: 20 },
  comboOptions: { backgroundColor: '#242028', borderWidth: 1, borderColor: '#443B49', borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  comboOption: { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comboOptionSelected: { backgroundColor: '#352832' },
  comboOptionText: { color: '#AAA1B0', fontSize: 13 },
  comboOptionTextSelected: { color: '#FFF9FB', fontWeight: '800' },
  comboCheck: { color: '#C78EA8', fontSize: 16, fontWeight: '800' },
  sexOptions: { flexDirection: 'row', gap: 8, marginBottom: 17 },
  sexOption: { flex: 1, minHeight: 44, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, borderColor: '#443B49', backgroundColor: '#151319', alignItems: 'center', justifyContent: 'center' },
  sexOptionSelected: { borderColor: '#B66F8A', backgroundColor: '#352832' },
  sexOptionText: { color: '#AAA1B0', fontSize: 12, textAlign: 'center' },
  sexOptionTextSelected: { color: '#FFF9FB', fontWeight: '800' },
  petImageButton: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#6B5160', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 12, marginBottom: 16 },
  petImageButtonText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  petImagePreview: { width: '100%', height: '100%' },
  petFormActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  petCancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#6B5160', alignItems: 'center', justifyContent: 'center' },
  petCancelText: { color: '#C78EA8', fontSize: 13, fontWeight: '800' },
  saveButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFF9FB', fontSize: 13, fontWeight: '800' },
  primaryButton: {
    width: '100%',
    backgroundColor: '#B66F8A',
    borderRadius: 14,
    height: 52,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#FFF9FB', fontSize: 15, fontWeight: '700' },
});
