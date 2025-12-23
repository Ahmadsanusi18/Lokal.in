import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPanel() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Mengambil data pengajuan yang statusnya masih 'pending'
      const { data, error } = await supabase
        .from('seller_applications')
        .select(`*, profiles(username, email)`)
        .eq('status', 'pending');

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, userId: string, action: 'approved' | 'rejected') => {
    try {
      // 1. Update status di tabel pengajuan
      const { error: updateAppError } = await supabase
        .from('seller_applications')
        .update({ status: action })
        .eq('id', id);

      if (updateAppError) throw updateAppError;

      // 2. Jika disetujui, update role di tabel profiles menjadi 'seller'
      if (action === 'approved') {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', userId);
        
        if (updateProfileError) throw updateProfileError;
      }

      Alert.alert("Berhasil", `Permintaan telah ${action === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchApplications(); // Refresh data
    } catch (error: any) {
      Alert.alert("Gagal", error.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#E31B23" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Verifikasi Seller</Text>
      
      {applications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-open-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Tidak ada pengajuan baru.</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.storeName}>{item.store_name}</Text>
                <Text style={styles.userInfo}>Oleh: {item.profiles?.username} ({item.profiles?.email})</Text>
                <Text style={styles.desc}>{item.store_description}</Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.btn, styles.rejectBtn]} 
                  onPress={() => handleAction(item.id, item.user_id, 'rejected')}
                >
                  <Text style={styles.btnText}>Tolak</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btn, styles.approveBtn]} 
                  onPress={() => handleAction(item.id, item.user_id, 'approved')}
                >
                  <Text style={styles.btnText}>Setujui</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 60 },
  header: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3 },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#E31B23' },
  userInfo: { fontSize: 13, color: '#666', marginVertical: 4 },
  desc: { fontSize: 14, color: '#444', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  approveBtn: { backgroundColor: '#28A745' },
  rejectBtn: { backgroundColor: '#DC3545' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: { marginTop: 10, fontSize: 16 }
});