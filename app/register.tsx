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
  StatusBar
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
    if (username.length < 3) {
      return Alert.alert("Username Terlalu Pendek", "Gunakan minimal 3 karakter.");
    }
    if (password.length < 6) {
      return Alert.alert("Password Lemah", "Gunakan minimal 6 karakter.");
    }
    if (password !== confirm) {
      return Alert.alert("Password Tidak Sesuai", "Konfirmasi password tidak cocok.");
    }

    setLoading(true);

    try {
      // 2. Daftar ke Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      // 3. Simpan Profil Pengguna
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            username: username.toLowerCase().trim(), 
            email: email.trim(),
            full_name: username,
            updated_at: new Date(),
          });

        if (profileError) console.error("Profile Error:", profileError);

        Alert.alert(
          "Registrasi Berhasil", 
          "Akun Anda telah dibuat. Silakan login untuk melanjutkan.", 
          [{ text: "Login Sekarang", onPress: () => router.replace('/login') }]
        );
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("User already registered")) {
        message = "Email sudah digunakan. Gunakan email lain.";
      }
      Alert.alert("Gagal Mendaftar", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FBFBFB" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topDecoration} />
        
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.logoText}>Lokal.in</Text>
            <Text style={styles.tagline}>Gabung Komunitas UMKM</Text>
          </View>

          <Text style={styles.welcomeText}>Buat Akun Baru</Text>

          {/* Input Username */}
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

          {/* Input Email */}
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

          {/* Input Password */}
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

          {/* Input Konfirmasi Password */}
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
          
          <TouchableOpacity 
            style={[styles.regBtn, loading && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={loading}
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
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingVertical: 50 },
  topDecoration: { 
    position: 'absolute', bottom: -50, left: -50, width: 220, height: 220, 
    borderRadius: 110, backgroundColor: '#FFF0F0' 
  },
  card: { 
    width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 30, padding: 30,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 
  },
  header: { alignItems: 'center', marginBottom: 35 },
  logoText: { fontSize: 42, fontWeight: '900', color: '#1A1A1A', letterSpacing: -2 },
  tagline: { fontSize: 13, color: '#E31B23', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  welcomeText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  inputBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', 
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 60,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '600' },
  regBtn: { 
    backgroundColor: '#1A1A1A', padding: 20, borderRadius: 15, 
    alignItems: 'center', marginTop: 10, shadowColor: '#000', 
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 
  },
  regBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#AAA', fontSize: 14, fontWeight: '500' },
  loginLink: { color: '#E31B23', fontWeight: '900', fontSize: 14 },
  legalText: { marginTop: 30, fontSize: 11, color: '#CCC', textAlign: 'center', paddingHorizontal: 30 }
});