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
  StatusBar
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
      // 1. Logika Login Username: Cari email asli di tabel profiles jika input bukan format email
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
        if (authError.message.includes("Email not confirmed")) {
          errorMsg = "Email belum dikonfirmasi. Periksa kotak masuk Anda.";
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FBFBFB" />
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

          {/* Input Username/Email */}
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

          {/* Input Password */}
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

          {/* Tombol Login */}
          <TouchableOpacity 
            style={[styles.loginBtn, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogin} 
            disabled={loading}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  topDecoration: { 
    position: 'absolute', top: -50, right: -50, width: 200, height: 200, 
    borderRadius: 100, backgroundColor: '#FFF0F0' 
  },
  card: { 
    width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 30, padding: 30,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 42, fontWeight: '900', color: '#1A1A1A', letterSpacing: -2 },
  tagline: { fontSize: 13, color: '#E31B23', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  welcomeText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 25 },
  inputBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', 
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 60,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '600' },
  loginBtn: { 
    backgroundColor: '#1A1A1A', padding: 20, borderRadius: 15, 
    alignItems: 'center', marginTop: 10, shadowColor: '#000', 
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 
  },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#AAA', fontSize: 14, fontWeight: '500' },
  signupLink: { color: '#E31B23', fontWeight: '900', fontSize: 14 },
  version: { marginTop: 40, fontSize: 11, color: '#DDD', fontWeight: '700' }
});