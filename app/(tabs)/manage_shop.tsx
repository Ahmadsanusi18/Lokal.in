import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { supabase } from '../../lib/supabase'; 
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ManageShopScreen() {
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMyBusinesses();
  }, []);

  const fetchMyBusinesses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('businesses') 
          .select('*')
          .eq('user_id', user.id) 
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMyBusinesses(data || []);
      }
    } catch (error: any) {
      console.error("Error fetch Businesses:", error.message);
      Alert.alert("Error", "Gagal mengambil data bisnis Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Hapus Bisnis",
      "Apakah Anda yakin ingin menghapus data UMKM ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase
              .from('businesses')
              .delete()
              .eq('id', id);
            
            if (!error) {
              fetchMyBusinesses();
            } else {
              Alert.alert("Gagal", "Terjadi kesalahan saat menghapus data.");
            }
          } 
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBusinesses();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E31B23" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UMKM Milik Saya</Text>
        <Text style={styles.headerSubtitle}>Kelola bisnis yang telah Anda daftarkan</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {myBusinesses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>Belum ada bisnis yang ditambahkan</Text>
            <TouchableOpacity 
              style={styles.addBtnSmall}
              onPress={() => router.push('/umkm')}
            >
              <Text style={styles.addBtnTextSmall}>Tambah Sekarang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myBusinesses.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              {/* Card utama bisa diklik untuk masuk ke detail */}
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push({
                    pathname: "/details", // Sesuaikan dengan path file detail Anda (misal: /details/[id])
                    params: { id: item.id }
                })}
              >
                <View style={styles.cardHeader}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={30} color="#999" />
                    </View>
                  )}
                  
                  <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name || item.nama_bisnis}</Text>
                    <Text style={styles.category}>{item.category || 'Kategori UMKM'}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description || "Tidak ada deskripsi."}
                    </Text>
                  </View>

                  {/* Tombol Hapus diletakkan di luar Touchable utama agar tidak bentrok */}
                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E31B23" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/umkm')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FFF', padding: 25, paddingTop: 60, borderBottomWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 13, color: '#777', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  cardContainer: { marginBottom: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 70, height: 70, borderRadius: 15 },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 15, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1, marginLeft: 15 },
  name: { fontSize: 17, fontWeight: '800', color: '#333' },
  category: { fontSize: 12, color: '#E31B23', fontWeight: 'bold', textTransform: 'uppercase', marginVertical: 2 },
  description: { fontSize: 12, color: '#666', lineHeight: 18 },
  deleteBtn: { padding: 10, backgroundColor: '#FFF0F0', borderRadius: 12, marginLeft: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, color: '#999', fontSize: 16, fontWeight: '600' },
  addBtnSmall: { marginTop: 15, backgroundColor: '#E31B23', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  addBtnTextSmall: { color: '#FFF', fontWeight: '700' },
  fab: { position: 'absolute', bottom: 100, right: 25, backgroundColor: '#E31B23', width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#E31B23', shadowOpacity: 0.4, shadowRadius: 15 },
});