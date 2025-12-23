import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  image_url: string;
}

export default function ExploreScreen() {
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase.from('businesses').select('*');
    if (!error && data) setItems(data as Business[]);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Jelajahi UMKM 🔍</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
          >
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>{item.category} • {item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8f9fa', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 3 },
  image: { width: '100%', height: 150 },
  info: { padding: 12 },
  name: { fontSize: 18, fontWeight: 'bold' },
  category: { color: '#666', marginTop: 4 }
});