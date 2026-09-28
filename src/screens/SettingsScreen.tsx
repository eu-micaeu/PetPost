import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type SettingsScreenProps = {
  session: Session;
  onSignOut: () => void;
};

export function SettingsScreen({ session, onSignOut }: SettingsScreenProps) {
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
        <TextInput
          value={accountName}
          onChangeText={setAccountName}
          style={styles.settingsInput}
          placeholder="Seu nome"
          placeholderTextColor="#8F8797"
        />
        <Text style={styles.settingsLabel}>@ NICKNAME ÚNICO</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          style={styles.settingsInput}
          placeholder="seu_nickname"
          placeholderTextColor="#8F8797"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.nicknameHint}>O nickname é único e aparece nas suas publicações.</Text>
        <Text style={styles.settingsLabel}>E-MAIL</Text>
        <View style={styles.emailField}>
          <Text style={styles.emailText}>{session.user.email}</Text>
        </View>
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

const styles = StyleSheet.create({
  settingsContent: { flex: 1, width: '100%', alignItems: 'center', paddingTop: 24, paddingBottom: 32 },
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
  logoutButton: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#8A3B4E', backgroundColor: '#28131B', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  logoutText: { color: '#E8A2BF', fontSize: 14, fontWeight: '800' },
});
