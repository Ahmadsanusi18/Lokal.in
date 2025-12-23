import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, Image, ActivityIndicator, KeyboardAvoidingView, 
  Platform, StatusBar, Keyboard 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; 
import { Ionicons } from '@expo/vector-icons';

export default function BusinessForm() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); 
  const [images, setImages] = useState<string[]>([]);
  const [catalogItems, setCatalogItems] = useState([{ name: '', price: '' }]);
  
  const [openingHour, setOpeningHour] = useState('08:00');
  const [closingHour, setClosingHour] = useState('21:00');

  const [form, setForm] = useState({
    name: '',
    category: '',
    address: '',
    description: '',
    whatsapp_number: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    checkAuth();
    if (id) fetchOldData();
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Cek role user dari profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Hanya Admin dan Seller yang bisa edit, Buyer hanya bisa masuk jika ingin daftar baru (id tidak ada)
    if (id && profile?.role === 'buyer') {
      Alert.alert("Akses Terbatas", "Anda tidak memiliki izin untuk mengubah data ini.");
      router.back();
    }
  };

  const fetchOldData = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        category: data.category || '',
        address: data.address || '',
        description: data.description || '',
        whatsapp_number: data.whatsapp_number || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
      setOpeningHour(data.opening_hour?.slice(0, 5) || '08:00');
      setClosingHour(data.closing_hour?.slice(0, 5) || '21:00');
      
      if (data.image_url) setImages(data.image_url.split('|'));
      if (data.catalog) {
        const items = data.catalog.split(',').map((str: string) => {
          const [name, price] = str.split(':');
          return { name: name?.trim() || '', price: price?.trim() || '' };
        });
        setCatalogItems(items);
      }
    }
  };

  const getLocation = async () => {
    try {
      setLocationLoading(true);
      Keyboard.dismiss();
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Izin Ditolak", "Aplikasi butuh izin lokasi.");
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setForm({
        ...form,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      Alert.alert("Berhasil", "Lokasi GPS saat ini telah dikunci.");
    } catch (error) {
      Alert.alert("Gagal", "Pastikan GPS perangkat Anda aktif.");
    } finally {
      setLocationLoading(false);
    }
  };

  const getCoordsFromAddress = async () => {
    if (!form.address || form.address.length < 5) {
      Alert.alert("Alamat Belum Lengkap", "Silakan ketik alamat yang lebih spesifik.");
      return;
    }
    try {
      setLocationLoading(true);
      Keyboard.dismiss();
      const searchQuery = `${form.name}, ${form.address}`;
      const result = await Location.geocodeAsync(searchQuery);

      if (result.length > 0) {
        setForm({ ...form, latitude: result[0].latitude, longitude: result[0].longitude });
        Alert.alert("Berhasil", "Titik koordinat ditemukan.");
      } else {
        const fallback = await Location.geocodeAsync(form.address);
        if (fallback.length > 0) {
          setForm({ ...form, latitude: fallback[0].latitude, longitude: fallback[0].longitude });
          Alert.alert("Info", "Koordinat ditemukan berdasarkan alamat.");
        } else {
          Alert.alert("Tidak Ditemukan", "Coba ketik alamat dengan lebih detail.");
        }
      }
    } catch (error) {
      Alert.alert("Gagal", "Kesalahan saat mencari alamat.");
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.3, 
      base64: true,
    });
    if (!result.canceled) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const validateTime = (time: string) => /^([01]\d|2[0-3]):?([0-5]\d)$/.test(time);

  const handleSave = async () => {
    if (!form.name || images.length === 0 || !form.latitude) {
      Alert.alert("Data Tidak Lengkap", "Nama, Foto, dan Lokasi wajib diisi.");
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir");

      const catalogString = catalogItems
        .filter(item => item.name.trim() !== '')
        .map(item => `${item.name.trim()}:${item.price.trim()}`)
        .join(',');

      const payload = { 
        ...form, 
        user_id: user.id, // Pastikan pemilik UMKM tercatat
        image_url: images.join('|'), 
        catalog: catalogString, 
        opening_hour: openingHour, 
        closing_hour: closingHour 
      };

      const { error } = id 
        ? await supabase.from('businesses').update(payload).eq('id', id) 
        : await supabase.from('businesses').insert([payload]);
      
      if (error) throw error;

      // LOGIKA UPGRADE ROLE: Jika pendaftaran baru, ubah role user jadi seller
      if (!id) {
        await supabase
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', user.id);
      }

      Alert.alert("Sukses", id ? "Data diperbarui." : "UMKM berhasil dipublikasikan.");
      router.replace('/(tabs)/umkm');
    } catch (error: any) {
      Alert.alert("Gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{id ? 'Modifikasi Bisnis' : 'Pendaftaran UMKM'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Galeri Visual</Text>
          <Text style={styles.cardSub}>Gunakan foto produk atau toko Anda.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgScroll}>
            {images.map((img, i) => (
              <View key={i} style={styles.imgFrame}>
                <Image source={{ uri: img }} style={styles.imgReal} />
                <TouchableOpacity style={styles.imgRemove} onPress={() => {
                  const n = [...images]; n.splice(i, 1); setImages(n);
                }}>
                  <Ionicons name="close-circle" size={22} color="#E31B23" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color="#E31B23" />
              <Text style={styles.imgPickerText}>Tambah</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identitas Bisnis</Text>
          
          <Text style={styles.fieldLabel}>Nama UMKM</Text>
          <TextInput style={styles.fieldInput} placeholder="Contoh: Kopi Lokal" value={form.name} onChangeText={t => setForm({...form, name: t})} />

          <Text style={styles.fieldLabel}>Sektor Kategori</Text>
          <TextInput style={styles.fieldInput} placeholder="Kuliner / Kerajinan" value={form.category} onChangeText={t => setForm({...form, category: t})} />

          <View style={styles.flexRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Jam Buka</Text>
              <TextInput style={styles.fieldInput} placeholder="08:00" value={openingHour} onChangeText={setOpeningHour} />
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Jam Tutup</Text>
              <TextInput style={styles.fieldInput} placeholder="21:00" value={closingHour} onChangeText={setClosingHour} />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Nomor WhatsApp</Text>
          <TextInput style={styles.fieldInput} placeholder="628xxx" keyboardType="phone-pad" value={form.whatsapp_number} onChangeText={t => setForm({...form, whatsapp_number: t})} />
          
          <Text style={styles.fieldLabel}>Deskripsi</Text>
          <TextInput style={[styles.fieldInput, styles.fieldArea]} multiline placeholder="Ceritakan keunggulan produk Anda..." value={form.description} onChangeText={t => setForm({...form, description: t})} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lokasi Presisi</Text>
          <Text style={styles.fieldLabel}>Alamat Operasional</Text>
          <TextInput style={[styles.fieldInput, styles.fieldArea]} multiline placeholder="Nama jalan, nomor, RT/RW..." value={form.address} onChangeText={t => setForm({...form, address: t})} />

          <View style={styles.locBtnRow}>
            <TouchableOpacity style={styles.btnOutline} onPress={getCoordsFromAddress} disabled={locationLoading}>
              <Ionicons name="search" size={16} color="#E31B23" />
              <Text style={styles.btnOutlineText}>Verifikasi Alamat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimarySmall} onPress={getLocation} disabled={locationLoading}>
              {locationLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Ionicons name="locate" size={16} color="#fff" /><Text style={styles.btnPrimaryTextSmall}>GPS</Text></>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.coordGrid}>
            <View style={styles.coordItem}>
              <Text style={styles.coordData}>{form.latitude ? form.latitude.toFixed(5) : '--'}</Text>
              <Text style={styles.coordSub}>Lat</Text>
            </View>
            <View style={styles.coordItem}>
              <Text style={styles.coordData}>{form.longitude ? form.longitude.toFixed(5) : '--'}</Text>
              <Text style={styles.coordSub}>Lon</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.flexRowBetween}>
            <Text style={styles.cardTitle}>Daftar Produk</Text>
            <TouchableOpacity style={styles.btnMinimal} onPress={() => setCatalogItems([...catalogItems, { name: '', price: '' }])}>
              <Ionicons name="add-circle" size={20} color="#E31B23" />
              <Text style={styles.btnMinimalText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {catalogItems.map((item, index) => (
            <View key={index} style={styles.catalogRow}>
              <TextInput style={[styles.fieldInput, {flex: 2, marginTop: 0}]} placeholder="Produk" value={item.name} onChangeText={(v) => {
                const n = [...catalogItems]; n[index].name = v; setCatalogItems(n);
              }} />
              <TextInput style={[styles.fieldInput, {flex: 1.2, marginLeft: 10, marginTop: 0}]} placeholder="Harga" keyboardType="numeric" value={item.price} onChangeText={(v) => {
                const n = [...catalogItems]; n[index].price = v; setCatalogItems(n);
              }} />
              <TouchableOpacity style={styles.trash} onPress={() => {
                const n = [...catalogItems]; n.splice(index, 1); setCatalogItems(n);
              }}>
                <Ionicons name="trash-outline" size={20} color="#CCC" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.btnFinal, { opacity: loading ? 0.7 : 1 }]} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.btnFinalText}>{id ? 'PERBARUI DATA' : 'PUBLIKASIKAN'}</Text>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  navBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  scrollContent: { padding: 25 },
  card: { backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#AAA', fontWeight: '500', marginBottom: 15 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#E31B23', marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  fieldInput: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 14, fontSize: 15, marginTop: 8, color: '#1A1A1A', fontWeight: '600', borderWidth: 1, borderColor: '#F0F0F0' },
  fieldArea: { height: 90, textAlignVertical: 'top' },
  imgScroll: { flexDirection: 'row' },
  imgFrame: { marginRight: 15, position: 'relative', paddingVertical: 10 },
  imgReal: { width: 120, height: 120, borderRadius: 20 },
  imgRemove: { position: 'absolute', top: 0, right: -5, backgroundColor: '#fff', borderRadius: 15 },
  imgPicker: { width: 120, height: 120, backgroundColor: '#FFF5F5', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E31B23', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  imgPickerText: { fontSize: 12, color: '#E31B23', fontWeight: '900', marginTop: 5 },
  flexRow: { flexDirection: 'row' },
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  locBtnRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  btnPrimarySmall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E31B23', padding: 14, borderRadius: 15 },
  btnPrimaryTextSmall: { color: '#fff', fontSize: 13, fontWeight: '900', marginLeft: 6 },
  btnOutline: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 15, borderWidth: 1, borderColor: '#E31B23' },
  btnOutlineText: { color: '#E31B23', fontSize: 13, fontWeight: '900', marginLeft: 6 },
  coordGrid: { flexDirection: 'row', marginTop: 20, gap: 12 },
  coordItem: { flex: 1, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 15, alignItems: 'center' },
  coordData: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },
  coordSub: { fontSize: 10, color: '#AAA', fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  btnMinimal: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  btnMinimalText: { color: '#E31B23', fontWeight: '900', fontSize: 13, marginLeft: 4 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  trash: { marginLeft: 10, padding: 5 },
  btnFinal: { backgroundColor: '#1A1A1A', padding: 22, borderRadius: 20, marginTop: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  btnFinalText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});