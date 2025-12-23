import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, 
  ActivityIndicator, RefreshControl, Dimensions, Platform, StatusBar, TextInput, ScrollView 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- FUNGSI HAVERSINE ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function UmkmScreen() {
  const [items, setItems] = useState<any[]>([]); 
  const [filteredItems, setFilteredItems] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  
  // PERBAIKAN: Gunakan state userRole
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);
  const router = useRouter();

  const categories = ['Semua', 'Makanan', 'Minuman', 'Fashion', 'Jasa', 'Kriya'];

  useFocusEffect(
    useCallback(() => {
      fetchData();
      checkUserData();
    }, [])
  );

  const checkUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // PERBAIKAN: Ambil role dan avatar dari profile secara dinamis
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setAvatarUrl(profile.avatar_url);
        setUserRole(profile.role);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      let currentCoords = null;
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        currentCoords = { lat: location.coords.latitude, lon: location.coords.longitude };
        setUserCoords(currentCoords);
      }

      const { data, error } = await supabase.from('businesses').select('*');
      if (error) throw error;

      if (data) {
        let itemsWithDistance = data.map(item => ({
          ...item,
          distance: currentCoords ? calculateDistance(currentCoords.lat, currentCoords.lon, item.latitude, item.longitude) : null
        }));

        if (currentCoords) {
          itemsWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }

        setItems(itemsWithDistance);
        setFilteredItems(itemsWithDistance);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (query: string, category: string) => {
    let result = items.filter(item => {
      const matchQuery = item.name?.toLowerCase().includes(query.toLowerCase()) || item.category?.toLowerCase().includes(query.toLowerCase());
      const matchCategory = category === 'Semua' || item.category === category;
      return matchQuery && matchCategory;
    });
    setFilteredItems(result);
  };

  const getOpenStatus = (opening: string, closing: string) => {
    if (!opening || !closing) return { label: 'TUTUP', color: '#EF4444' };
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);
    return (currentTime >= (openH * 60 + openM) && currentTime < (closeH * 60 + closeM)) 
      ? { label: 'BUKA', color: '#22C55E' } : { label: 'TUTUP', color: '#EF4444' };
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getOpenStatus(item.opening_hour, item.closing_hour);
    return (
      <TouchableOpacity 
        activeOpacity={0.95} 
        style={styles.card} 
        onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
      >
        <Image 
          source={{ uri: item.image_url?.split('|')[0] || 'https://via.placeholder.com/400' }} 
          style={styles.cardImage} 
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradient} />
        
        <View style={styles.cardHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: status.color }]}>
            <Text style={styles.statusTagText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={14} color="#E31B23" />
              <Text style={styles.locationInfoText} numberOfLines={1}>Produk Lokal Unggulan</Text>
            </View>
            {item.distance !== null && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>{item.distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topSection}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.mainTitle}>Jelajahi</Text>
            <Text style={styles.subTitle}>Produk & Jasa Lokal</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={() => router.push('/(tabs)/profile')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImg} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={22} color="#E31B23" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#A0A0A0" />
          <TextInput
            style={styles.searchField}
            placeholder="Cari warung atau kerajinan..."
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); applyFilters(t, selectedCategory); }}
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => { setSelectedCategory(cat); applyFilters(searchQuery, cat); }}
              style={[styles.catItem, selectedCategory === cat && styles.catItemActive]}
            >
              <Text style={[styles.catItemText, selectedCategory === cat && styles.catItemTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#E31B23" />
          <Text style={styles.loadingText}>Mencari UMKM terbaik...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={['#E31B23']} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={80} color="#DDD" />
              <Text style={styles.emptyTitle}>Tidak Menemukan Apapun</Text>
              <Text style={styles.emptyDesc}>Coba ganti kata kunci atau kategori lain.</Text>
            </View>
          }
        />
      )}

      {/* PERBAIKAN: Admin dan Seller bisa melihat tombol tambah */}
      {(userRole === 'admin' || userRole === 'seller') && (
        <TouchableOpacity style={styles.adminFab} onPress={() => router.push('/add-business')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ... styles tetap sama dengan kode Anda ...
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  topSection: { 
    backgroundColor: '#fff', 
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
    paddingBottom: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15
  },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
  mainTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    letterSpacing: -1,
    lineHeight: 38 
  },
  subTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#777', 
    marginTop: 4, 
    lineHeight: 22 
  },
  profileBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#F5F5F5', 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  profileImg: { width: '100%', height: '100%' },
  profilePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F0' },
  
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    marginHorizontal: 25, borderRadius: 18, paddingHorizontal: 15, height: 55, marginTop: 25
  },
  searchField: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  
  categoryScroll: { paddingHorizontal: 25, marginTop: 20, gap: 10, paddingBottom: 5 },
  catItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEE' },
  catItemActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  catItemText: { fontSize: 13, fontWeight: '800', color: '#777' },
  catItemTextActive: { color: '#fff' },

  listContent: { padding: 25, paddingBottom: 100 },
  card: { height: 260, borderRadius: 30, marginBottom: 25, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardHeader: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  categoryTag: { backgroundColor: 'rgba(227, 27, 35, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryTagText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  
  cardBody: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  businessName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  locationInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationInfoText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 5, fontWeight: '600' },
  distanceBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  distanceBadgeText: { color: '#1A1A1A', fontSize: 11, fontWeight: '900' },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 14, fontWeight: '700', color: '#777' },
  
  adminFab: { position: 'absolute', bottom: 100, right: 25, backgroundColor: '#E31B23', width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#E31B23', shadowOpacity: 0.4, shadowRadius: 15 },
  
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginTop: 15 },
  emptyDesc: { fontSize: 14, color: '#AAA', marginTop: 5 }
});