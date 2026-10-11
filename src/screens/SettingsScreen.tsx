import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const accountName = nameInput !== null ? nameInput : (user?.user_metadata?.name ?? '');
  const nickname =
    nicknameInput !== null
      ? nicknameInput
      : (profile?.nickname ?? user?.user_metadata?.nickname ?? '');

  async function saveAccount() {
    if (!user?.id) return;
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
      .eq('id', user.id);

    if (profileError) {
      setIsSaving(false);
      Alert.alert(
        'Nickname indisponível',
        profileError.message.includes('duplicate') ? 'Esse nickname já está em uso.' : profileError.message,
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { name: accountName.trim(), nickname: normalizedNickname },
    });
    setIsSaving(false);

    if (error) {
      Alert.alert('Não foi possível salvar', error.message);
      return;
    }

    await refreshProfile();
    Alert.alert('Configurações salvas', 'Seu nome e nickname foram atualizados.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.settingsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.settingsEyebrow}>SUA CONTA</Text>
        <Text style={styles.settingsTitle}>Configurações</Text>
        <Text style={styles.settingsSubtitle}>Gerencie as informações do seu acesso ao PetPost.</Text>

        <View style={styles.settingsCard}>
          <Text style={styles.profileSectionTitle}>Identidade do perfil</Text>
          <Text style={styles.profileSectionText}>Seu nickname aparece em todas as fotos que você publicar.</Text>
          <Text style={styles.settingsLabel}>NOME</Text>
          <TextInput
            value={accountName}
            onChangeText={setNameInput}
            style={styles.settingsInput}
            placeholder="Seu nome"
            placeholderTextColor="#8F8797"
          />
          <Text style={styles.settingsLabel}>@ NICKNAME ÚNICO</Text>
          <TextInput
            value={nickname}
            onChangeText={setNicknameInput}
            style={styles.settingsInput}
            placeholder="seu_nickname"
            placeholderTextColor="#8F8797"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.nicknameHint}>O nickname é único e aparece nas suas publicações.</Text>
          <Text style={styles.settingsLabel}>E-MAIL</Text>
          <View style={styles.emailField}>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <Text style={styles.emailHint}>O e-mail é gerenciado pelo seu provedor de autenticação.</Text>
          <Pressable style={styles.saveButton} onPress={saveAccount} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF9FB" /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.viewProfileButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.viewProfileButtonText}>Ver meu perfil e publicações</Text>
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111016' },
  header: { height: 58, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { color: '#C78EA8', fontSize: 24, lineHeight: 24 },
  backButtonText: { color: '#C78EA8', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  headerRightSpacer: { width: 70 },
  settingsContent: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 32, paddingHorizontal: 22 },
  settingsEyebrow: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  settingsTitle: { color: '#EAE5ED', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  settingsSubtitle: { color: '#AAA1B0', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 24, maxWidth: 300 },
  settingsCard: { width: '100%', backgroundColor: '#1B1820', borderWidth: 1, borderColor: '#37303C', borderRadius: 20, padding: 20 },
  profileSectionTitle: { color: '#EAE5ED', fontSize: 17, fontWeight: '800' },
  profileSectionText: { color: '#AAA1B0', fontSize: 13, marginTop: 4, marginBottom: 16 },
  settingsLabel: { color: '#B8AABD', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  settingsInput: { backgroundColor: '#151319', borderWidth: 1, borderColor: '#443B49', borderRadius: 12, color: '#EAE5ED', paddingHorizontal: 14, height: 48, fontSize: 14 },
  nicknameHint: { color: '#8F8797', fontSize: 11, marginTop: 6 },
  emailField: { backgroundColor: '#151319', borderWidth: 1, borderColor: '#2A2430', borderRadius: 12, paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  emailText: { color: '#8F8797', fontSize: 14 },
  emailHint: { color: '#8F8797', fontSize: 11, marginTop: 6, marginBottom: 16 },
  saveButton: { width: '100%', height: 48, borderRadius: 12, backgroundColor: '#B66F8A', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveButtonText: { color: '#FFF9FB', fontSize: 14, fontWeight: '800' },
  viewProfileButton: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#483C50', backgroundColor: '#211C28', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  viewProfileButtonText: { color: '#F0AEC9', fontSize: 14, fontWeight: '700' },
  logoutButton: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#8A3B4E', backgroundColor: '#28131B', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  logoutText: { color: '#E8A2BF', fontSize: 14, fontWeight: '800' },
});
