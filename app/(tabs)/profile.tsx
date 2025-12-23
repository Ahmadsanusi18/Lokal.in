import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, Alert, ScrollView, ActivityIndicator, Platform, StatusBar, Animated 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

let profileHasLoadedOnce = false;

export default function ProfileScreen() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(!profileHasLoadedOnce);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState(''); 
  const [role, setRole] = useState('user'); 
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const skeletonValue = new Animated.Value(0);

  useEffect(() => {
    if (!profileHasLoadedOnce) startSkeletonAnimation();
    getProfile();
  }, []);

  const startSkeletonAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonValue, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        
        // 1. Ambil data Profile
        const { data, error } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .single();
        
        if (data) {
          setFullName(data.full_name || '');
          setUsername(data.username || '');
          setPhone(data.phone_number || '');
          setAddress(data.address || '');
          setAvatarUrl(data.avatar_url || '');
          setGender(data.gender || '');
          setRole(data.role || 'user');
        }

        // 2. Cek status pengajuan seller
        const { data: appData } = await supabase
          .from('seller_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (appData) setApplicationStatus(appData.status);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      profileHasLoadedOnce = true;
      setInitialLoading(false);
    }
  }

  const pickImage = async () => {
    if (!isEditing) {
      Alert.alert("Mode Baca", "Aktifkan mode edit untuk mengganti foto profil.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Izin Ditolak", "Maaf, kami butuh izin galeri untuk mengganti foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, 
    });
    if (!result.canceled && result.assets[0].base64) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (image: any) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), { 
          contentType: 'image/jpeg',
          upsert: true 
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Gagal mengunggah foto profil.');
    } finally {
      setUploading(false);
    }
  };

  async function updateProfile() {
    try {
      setActionLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User tidak ditemukan');
      const updates = {
        id: user.id,
        full_name: fullName,
        username: username,
        phone_number: phone,
        address: address,
        avatar_url: avatarUrl,
        email: email,
        gender: gender,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      Alert.alert("Berhasil", "Data profil Anda telah diperbarui.");
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Gagal Update", error.message);
    } finally {
      setActionLoading(false);
    }
  }

  const SkeletonItem = ({ style, color = '#EBEBEB' }: { style: any, color?: string }) => (
    <Animated.View style={[style, { 
      backgroundColor: color, 
      opacity: skeletonValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }) 
    }]} />
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        <LinearGradient colors={['#1A1A1A', '#333333']} style={styles.headerGradient}>
          {initialLoading ? (
            <View style={{ alignItems: 'center' }}>
              <SkeletonItem style={styles.avatarSkeleton} color="#444" />
              <SkeletonItem style={{ width: 180, height: 28, borderRadius: 8, marginTop: 15 }} color="#444" />
              <SkeletonItem style={{ width: 140, height: 16, borderRadius: 6, marginTop: 8 }} color="#444" />
            </View>
          ) : (
            <>
              <TouchableOpacity activeOpacity={0.8} style={styles.avatarWrapper} onPress={pickImage} disabled={uploading}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}><Ionicons name="person-outline" size={50} color="#E31B23" /></View>
                )}
                {isEditing && (
                  <View style={styles.cameraBadge}>
                    {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profileNameText}>{fullName || 'Pengguna Lokal'}</Text>
              
              <View style={[styles.roleBadge, role === 'admin' ? styles.badgeAdmin : role === 'seller' ? styles.badgeSeller : styles.badgeBuyer]}>
                <Ionicons 
                  name={role === 'admin' ? "shield-checkmark" : role === 'seller' ? "storefront" : "person"} 
                  size={12} color="#FFF" style={{ marginRight: 5 }}
                />
                <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
              </View>

              <Text style={styles.profileEmailText}>{email}</Text>
            </>
          )}
        </LinearGradient>

        {/* MODIFIKASI: Banner Upgrade Role */}
        {!initialLoading && !isEditing && role === 'buyer' && (
          <View style={{ paddingHorizontal: 25, marginTop: -30 }}>
            {applicationStatus === 'pending' ? (
              <View style={[styles.upgradeCard, { backgroundColor: '#FFF9E6', borderColor: '#FFE58F', borderWidth: 1 }]}>
                <View style={styles.upgradeGradient}>
                  <Ionicons name="time" size={30} color="#D48806" style={{ marginRight: 15 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upgradeTitle, { color: '#D48806' }]}>Verifikasi Diproses</Text>
                    <Text style={[styles.upgradeSubtitle, { color: '#855800' }]}>Admin sedang meninjau tokomu.</Text>
                  </View>
                </View>
              </View>
            ) : applicationStatus === 'rejected' ? (
              <TouchableOpacity 
                style={[styles.upgradeCard, { backgroundColor: '#FFF1F0', borderColor: '#FFA39E', borderWidth: 1 }]}
                onPress={() => router.push('/apply-seller')}
              >
                <View style={styles.upgradeGradient}>
                  <Ionicons name="close-circle" size={30} color="#CF1322" style={{ marginRight: 15 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upgradeTitle, { color: '#CF1322' }]}>Pengajuan Ditolak</Text>
                    <Text style={[styles.upgradeSubtitle, { color: '#820014' }]}>Klik untuk daftar ulang.</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.upgradeCard} 
                onPress={() => router.push('/apply-seller')}
              >
                <LinearGradient colors={['#E31B23', '#8C1007']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.upgradeGradient}>
                  <Ionicons name="rocket" size={30} color="#FFF" style={{ marginRight: 15 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeTitle}>Mulai Berjualan</Text>
                    <Text style={styles.upgradeSubtitle}>Daftarkan tokomu sekarang!</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.contentBody}>
          <View style={styles.sectionHeader}>
            {initialLoading ? (
              <><SkeletonItem style={{ width: 150, height: 22, borderRadius: 6 }} /><SkeletonItem style={{ width: 40, height: 14, borderRadius: 4 }} /></>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.editLink}>Ubah</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.formCard}>
            {initialLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.inputGroup}>
                  <SkeletonItem style={{ width: 80, height: 12, borderRadius: 4, marginBottom: 10 }} />
                  <SkeletonItem style={{ width: '100%', height: 55, borderRadius: 15 }} />
                </View>
              ))
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput 
                    style={[styles.textInput, !isEditing && styles.textInputLocked]} 
                    value={username} onChangeText={setUsername} editable={isEditing} placeholder="Username"
                    placeholderTextColor="#CCC"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Lengkap</Text>
                  <TextInput 
                    style={[styles.textInput, !isEditing && styles.textInputLocked]} 
                    value={fullName} onChangeText={setFullName} editable={isEditing} placeholder="Nama Lengkap"
                    placeholderTextColor="#CCC"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jenis Kelamin</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity 
                      disabled={!isEditing}
                      style={[styles.genderOption, gender === 'Laki-laki' && styles.genderSelected, !isEditing && gender !== 'Laki-laki' && styles.genderDisabled]} 
                      onPress={() => setGender('Laki-laki')}
                    >
                      <Ionicons name="male" size={18} color={gender === 'Laki-laki' ? '#FFF' : '#888'} />
                      <Text style={[styles.genderText, gender === 'Laki-laki' && styles.genderTextSelected]}>Laki-laki</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      disabled={!isEditing}
                      style={[styles.genderOption, gender === 'Perempuan' && styles.genderSelected, !isEditing && gender !== 'Perempuan' && styles.genderDisabled]} 
                      onPress={() => setGender('Perempuan')}
                    >
                      <Ionicons name="female" size={18} color={gender === 'Perempuan' ? '#FFF' : '#888'} />
                      <Text style={[styles.genderText, gender === 'Perempuan' && styles.genderTextSelected]}>Perempuan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WhatsApp</Text>
                  <TextInput 
                    style={[styles.textInput, !isEditing && styles.textInputLocked]} 
                    value={phone} onChangeText={setPhone} editable={isEditing} keyboardType="phone-pad" placeholder="08xxxxx"
                    placeholderTextColor="#CCC"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Alamat Domisili</Text>
                  <TextInput 
                    style={[styles.textInput, styles.textArea, !isEditing && styles.textInputLocked]} 
                    value={address} onChangeText={setAddress} editable={isEditing} multiline placeholder="Alamat lengkap"
                    placeholderTextColor="#CCC"
                  />
                </View>
              </>
            )}
          </View>

          {!initialLoading && (
            isEditing ? (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={updateProfile} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Perubahan</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditing(false); getProfile(); }}>
                  <Text style={styles.cancelButtonText}>Batalkan Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
                <Ionicons name="log-out-outline" size={20} color="#E31B23" />
                <Text style={styles.signOutText}>Keluar Akun</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  headerGradient: { 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 80 : 70, 
    paddingBottom: 40, 
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    elevation: 10,
  },
  avatarWrapper: { marginBottom: 15 },
  avatarSkeleton: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
  avatarPlaceholder: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' 
  },
  avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFFFFF' },
  cameraBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#E31B23', width: 36, height: 36, 
    borderRadius: 18, justifyContent: 'center', alignItems: 'center', 
    borderWidth: 3, borderColor: '#1A1A1A' 
  },
  profileNameText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 10, letterSpacing: -0.5 },
  profileEmailText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginTop: 10 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  roleBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  badgeAdmin: { backgroundColor: '#B8860B' },
  badgeSeller: { backgroundColor: '#2E8B57' },
  badgeBuyer: { backgroundColor: 'rgba(255,255,255,0.2)' },
  contentBody: { paddingHorizontal: 25, marginTop: 30 },
  upgradeCard: { borderRadius: 25, overflow: 'hidden', elevation: 8 },
  upgradeGradient: { flexDirection: 'row', alignItems: 'center', padding: 22 },
  upgradeTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  upgradeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  editLink: { fontSize: 14, fontWeight: '800', color: '#E31B23' },
  formCard: { backgroundColor: '#fff', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  textInput: { backgroundColor: '#FBFBFB', borderRadius: 15, padding: 16, color: '#1A1A1A', fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: '#F0F0F0' },
  textInputLocked: { backgroundColor: '#F5F5F5', color: '#777', borderColor: '#EEEEEE' },
  textArea: { height: 100, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFB', padding: 16, borderRadius: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  genderSelected: { backgroundColor: '#E31B23', borderColor: '#E31B23' },
  genderDisabled: { opacity: 0.5 },
  genderText: { marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#888' },
  genderTextSelected: { color: '#FFF' },
  buttonContainer: { marginTop: 30, gap: 15 },
  saveButton: { backgroundColor: '#E31B23', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
  saveButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cancelButton: { padding: 10, alignItems: 'center' },
  cancelButtonText: { color: '#A0A0A0', fontWeight: '800', fontSize: 14 },
  signOutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, padding: 20, borderRadius: 20, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFE0E0' },
  signOutText: { color: '#E31B23', fontWeight: '900', fontSize: 16, marginLeft: 10 }
});