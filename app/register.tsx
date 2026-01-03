import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(true);
  const [showConfirm, setShowConfirm] = useState(true);
  const router = useRouter();

  const handleRegister = async () => {
    const { username, email, password, confirm } = form;
    
    // 1. Validasi Input
    if (!username || !email || !password) {
      return Alert.alert("Data Tidak Lengkap", "Harap isi semua kolom wajib.");
    }
    if (password !== confirm) {
      return Alert.alert("Password Tidak Sesuai", "Konfirmasi password tidak cocok.");
    }

    setLoading(true);

    try {
      // 2. Daftar ke Supabase Auth dengan Deep Linking Redirect
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          // PENTING: Gunakan scheme dari app.json Anda agar link email membuka APK
          emailRedirectTo: 'lokaldekat://login', 
        },
      });

      if (authError) throw authError;

      // 3. Simpan Profil Pengguna (Hanya jika user berhasil dibuat)
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            username: username.toLowerCase().trim(), 
            email: email.trim(),
            full_name: username,
            updated_at: new Date(),
          });

        if (profileError) throw profileError;

        // Jika email verifikasi AKTIF di dashboard, beri tahu user untuk cek email
        // Jika email verifikasi MATI, user bisa langsung login
        Alert.alert(
          "Registrasi Berhasil", 
          "Silakan cek kotak masuk (atau folder spam) email Anda untuk melakukan verifikasi sebelum masuk.", 
          [{ text: "Kembali ke Login", onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "Email sudah digunakan. Gunakan email lain.";
      }
      Alert.alert("Gagal Mendaftar", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBFBFB" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.mainContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dekorasi tetap proporsional */}
          <View style={styles.topDecoration} />
          
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.logoText}>Lokal.in</Text>
              <Text style={styles.tagline}>Gabung Komunitas UMKM</Text>
            </View>

            <Text style={styles.welcomeText}>Buat Akun Baru</Text>

            {/* Input Groups dengan Fixed Height agar tidak numpuk */}
            <View style={styles.inputContainer}>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Username" 
                  style={styles.input} 
                  value={form.username}
                  onChangeText={t => setForm({...form, username: t})} 
                  autoCapitalize="none" 
                  placeholderTextColor="#AAA"
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Email" 
                  style={styles.input} 
                  value={form.email}
                  onChangeText={t => setForm({...form, email: t})} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  placeholderTextColor="#AAA"
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Password" 
                  style={styles.input} 
                  secureTextEntry={showPass} 
                  value={form.password}
                  onChangeText={t => setForm({...form, password: t})} 
                  placeholderTextColor="#AAA"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#CCC" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#E31B23" style={styles.icon} />
                <TextInput 
                  placeholder="Ulangi Password" 
                  style={styles.input} 
                  secureTextEntry={showConfirm} 
                  value={form.confirm}
                  onChangeText={t => setForm({...form, confirm: t})} 
                  placeholderTextColor="#AAA"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#CCC" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.regBtn, loading && { opacity: 0.7 }]} 
              onPress={handleRegister} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.regBtnText}>DAFTAR</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.legalText}>
            Dengan mendaftar, Anda setuju dengan Syarat & Ketentuan Lokal.in
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFBFB' },
  mainContainer: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: Platform.OS === 'android' ? 40 : 20 
  },
  topDecoration: { 
    position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, 
    borderRadius: 100, backgroundColor: '#FFF0F0', zIndex: -1 
  },
  card: { 
    width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 30, padding: 25,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 8 
  },
  header: { alignItems: 'center', marginBottom: 25 },
  logoText: { fontSize: 38, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1.5 },
  tagline: { fontSize: 11, color: '#E31B23', fontWeight: '800', textTransform: 'uppercase' },
  welcomeText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  inputContainer: { width: '100%' },
  inputBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', 
    borderRadius: 15, marginBottom: 12, paddingHorizontal: 15, height: 58,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '600', paddingVertical: 0 },
  regBtn: { 
    backgroundColor: '#1A1A1A', height: 58, borderRadius: 15, 
    justifyContent: 'center', alignItems: 'center', marginTop: 10 
  },
  regBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#AAA', fontSize: 14, fontWeight: '500' },
  loginLink: { color: '#E31B23', fontWeight: '900', fontSize: 14 },
  legalText: { marginTop: 30, fontSize: 10, color: '#CCC', textAlign: 'center', paddingHorizontal: 30 }
});