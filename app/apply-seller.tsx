import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ApplySeller() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApply = async () => {
    // Validasi input
    if (!fullName || !phoneNumber || !storeName || !address || !desc) {
      Alert.alert("Data Tidak Lengkap", "Harap isi semua kolom data diri dan toko.");
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Sesi berakhir, silakan login kembali.");
        return;
      }

      // Cek pengajuan aktif
      const { data: existingApp, error: checkError } = await supabase
        .from('seller_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .or('status.eq.pending,status.eq.approved')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingApp) {
        const message = existingApp.status === 'pending' 
          ? "Pengajuan Anda sedang diproses. Mohon tunggu konfirmasi admin."
          : "Anda sudah terdaftar sebagai seller.";
        
        Alert.alert("Gagal", message);
        router.back();
        return;
      }

      // Simpan data pendaftaran
      const { error: insertError } = await supabase
        .from('seller_applications')
        .insert([
          { 
            user_id: user.id,
            full_name: fullName,
            phone_number: phoneNumber,
            store_name: storeName, 
            business_address: address,
            store_description: desc,
            status: 'pending' 
          }
        ]);

      if (insertError) throw insertError;

      Alert.alert(
        "Berhasil", 
        "Pengajuan telah dikirim! Admin akan meninjau data diri dan tokomu.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      Alert.alert("Kesalahan", error.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text style={styles.title}>Data Pendaftaran</Text>
          <Text style={styles.subtitle}>Lengkapi data diri dan profil UMKM Anda untuk diverifikasi.</Text>

          {/* DATA DIRI */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap Pemilik</Text>
            <TextInput 
              placeholder="Sesuai KTP" 
              style={styles.input} 
              value={fullName}
              onChangeText={setFullName} 
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor WhatsApp</Text>
            <TextInput 
              placeholder="Contoh: 08123456789" 
              style={styles.input} 
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber} 
              placeholderTextColor="#999"
            />
          </View>

          {/* DATA UMKM */}
          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama UMKM / Toko</Text>
            <TextInput 
              placeholder="Contoh: Kerajinan Bambu Lestari" 
              style={styles.input} 
              value={storeName}
              onChangeText={setStoreName} 
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat Lengkap Bisnis</Text>
            <TextInput 
              placeholder="Jl. Raya No. 123, Desa..." 
              style={[styles.input, { height: 80 }]} 
              multiline
              value={address}
              onChangeText={setAddress} 
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi Usaha</Text>
            <TextInput 
              placeholder="Jelaskan produk atau keunggulan UMKM Anda..." 
              style={[styles.input, styles.textArea]} 
              value={desc}
              onChangeText={setDesc} 
              multiline 
              numberOfLines={4}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity 
            style={[styles.btn, loading && styles.btnDisabled]} 
            onPress={handleApply}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>DAFTAR SEKARANG</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  backBtn: { marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 30, margin: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25, lineHeight: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#A0A0A0', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#F8F8F8', padding: 14, borderRadius: 15, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#EEE' },
  textArea: { height: 100, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  btn: { backgroundColor: '#E31B23', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10, elevation: 5 },
  btnDisabled: { backgroundColor: '#FFA3A6' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});