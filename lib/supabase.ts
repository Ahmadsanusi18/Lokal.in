import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Gunakan URL dari gambar Data API
const supabaseUrl = 'MASUKKAN_API_SUPABASE';

// Gunakan Publishable Key dari gambar API Keys
const supabaseAnonKey = 'MASUKKAN_SUPABASE_ANON'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
