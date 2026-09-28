import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <View style={styles.loadingScreen}>
            <ActivityIndicator color="#B66F8A" size="large" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (session) {
    return (
      <SafeAreaProvider>
        <HomeScreen session={session} onSignOut={() => supabase.auth.signOut()} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111016' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
