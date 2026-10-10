import { SettingsScreen } from '../screens/SettingsScreen';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (!session) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerRightSpacer} />
      </View>
      <SettingsScreen session={session} onSignOut={() => supabase.auth.signOut()} />
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
});