import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    // Mengecek apakah user berada di area yang butuh login
    const inTabsGroup = segments[0] === '(tabs)';
    const inDetails = segments[0] === 'details';
    const inAddBusiness = segments[0] === 'add-business';
    
    // Gabungkan pengecekan halaman yang diproteksi
    const isProtectedRoute = inTabsGroup || inDetails || inAddBusiness;

    setTimeout(() => {
      if (!session && isProtectedRoute) {
        // Jika tidak ada session tapi mencoba akses halaman dalam, lempar ke login
        router.replace('/login');
      } else if (session && segments[0] === 'login') {
        // Jika sudah login tapi di halaman login, lempar ke home
        router.replace('/(tabs)');
      }
    }, 0);
  }, [session, segments, isReady]);

  return (
    // Kita matikan semua header bawaan karena kita sudah pakai header kustom
    // Ini juga membuat transisi antar halaman jadi lebih halus
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      
      {/* PENTING: Kita set headerShown: false untuk details dan add-business 
         karena Anda sudah membuat desain header manual yang lebih bagus di dalam filenya.
      */}
      <Stack.Screen 
        name="details" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right' // Memberikan efek transisi geser yang modern
        }} 
      />
      <Stack.Screen 
        name="add-business" 
        options={{ 
          headerShown: false,
          animation: 'fade_from_bottom' // Efek muncul dari bawah untuk form
        }} 
      />
    </Stack>
  );
}