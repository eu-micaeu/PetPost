import { PublishScreen } from '../screens/PublishScreen';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

export default function PublishModal() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (!session) return null;

  return (
    <PublishScreen
      session={session}
      onCancel={() => router.back()}
      onPublished={() => router.replace('/(tabs)')}
    />
  );
}