import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      return Alert.alert("Data Kosong", "Username/Email dan Password wajib diisi.");
    }
    
    setLoading(true);
    const cleanIdentifier = identifier.trim();
    let emailToLogin = cleanIdentifier;

    try {
      // 1. Logika Login Username: Cari email asli di tabel profiles
      if (!cleanIdentifier.includes('@')) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', cleanIdentifier) 
          .maybeSingle();

        if (profileError) throw new Error("Gagal memvalidasi profil.");

        if (data?.email) {
          emailToLogin = data.email;
        } else {
          setLoading(false);
          return Alert.alert("Gagal", "Username tersebut tidak ditemukan.");
        }
      }

      // 2. Proses Otentikasi Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password,
      });

      if (authError) {
        let errorMsg = "Password salah atau akun tidak terdaftar.";
        // Memberi tahu user jika belum verifikasi email
        if (authError.message.includes("Email not confirmed")) {
          errorMsg = "Email belum dikonfirmasi. Periksa kotak masuk/spam email Anda.";
        }
        Alert.alert("Akses Ditolak", errorMsg);
      } else {
        router.replace('/(tabs)/umkm');
      }
    } catch (err: any) {
      Alert.alert("Sistem Error", err.message || "Terjadi gangguan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBFBFB" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dekorasi Aksen */}
          <View style={styles.topDecoration} />
          
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.logoText}>Lokal.in</Text>
              <Text style={styles.tagline}>Membangun Ekonomi Lokal</Text>
            </View>

            <Text style={styles.welcomeText}>Masuk ke Akun Anda</Text>

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Username atau Email" 
                  style={styles.input} 
                  value={identifier} 
                  onChangeText={setIdentifier} 
                  autoCapitalize="none" 
                  placeholderTextColor="#AAA"
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Password" 
                  style={styles.input} 
                  secureTextEntry={secureText} 
                  value={password} 
                  onChangeText={setPassword} 
                  autoCapitalize="none"
                  placeholderTextColor="#AAA"
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons 
                    name={secureText ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#CCC" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tombol Login */}
            <TouchableOpacity 
              style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>MASUK</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.version}>v1.0.4 - Lokal.in Project</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFBFB' },
  container: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'android' ? 40 : 20
  },
  topDecoration: { 
    position: 'absolute', top: -70, right: -70, width: 200, height: 200, 
    borderRadius: 100, backgroundColor: '#FFF0F0', zIndex: -1 
  },
  card: { 
    width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 30, 
    padding: 25, elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logoText: { fontSize: 38, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1.5 },
  tagline: { fontSize: 11, color: '#E31B23', fontWeight: '800', textTransform: 'uppercase' },
  welcomeText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  inputContainer: { width: '100%' },
  inputBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', 
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 58,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '600', paddingVertical: 0 },
  loginBtn: { 
    backgroundColor: '#1A1A1A', height: 58, borderRadius: 15, 
    justifyContent: 'center', alignItems: 'center', marginTop: 10 
  },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#AAA', fontSize: 14, fontWeight: '500' },
  signupLink: { color: '#E31B23', fontWeight: '900', fontSize: 14 },
  version: { marginTop: 30, fontSize: 10, color: '#DDD', fontWeight: '700' }
});