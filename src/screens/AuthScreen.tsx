import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: 'petpost',
  path: 'auth/callback',
});

type AuthMode = 'login' | 'signup';

export function AuthScreen({ onSession: _onSession }: { onSession?: (session: Session | null) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSignup = mode === 'signup';

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
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { name: name.trim(), nickname: nickname.trim().toLowerCase() } },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) {
        const isUnconfirmedEmail =
          result.error.code === 'email_not_confirmed' ||
          result.error.message.toLowerCase().includes('email not confirmed');
        const isExistingEmail =
          result.error.code === 'user_already_exists' ||
          result.error.code === 'email_exists' ||
          result.error.message.toLowerCase().includes('already registered');
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
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continuar com</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.googleButton} onPress={handleGoogle} disabled={isLoading}>
              <View style={styles.googleBadge}>
                <Text style={styles.googleBadgeText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>
              {isSignup ? 'Já possui uma conta?' : 'Ainda não tem uma conta?'}
            </Text>
            <Pressable
              onPress={() => {
                setMode(isSignup ? 'login' : 'signup');
                setName('');
                setNickname('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
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
  keyboardView: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    color: '#EAE5ED',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  introBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#EAE5ED',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#AAA1B0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 290,
  },
  formCard: {
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 24,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#B8AABD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  confirmPasswordLabel: {
    marginTop: 14,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotPassword: {
    color: '#C78EA8',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#111016',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 14,
    color: '#EAE5ED',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  passwordHint: {
    color: '#8F8797',
    fontSize: 11,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#B66F8A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFF9FB',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonArrow: {
    color: '#FFF9FB',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#37303C',
  },
  dividerText: {
    color: '#8F8797',
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#111016',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  googleButtonText: {
    color: '#EAE5ED',
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  switchPrompt: {
    color: '#AAA1B0',
    fontSize: 14,
  },
  switchAction: {
    color: '#C78EA8',
    fontSize: 14,
    fontWeight: '800',
  },
  legalText: {
    color: '#8F8797',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
