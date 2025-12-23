import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, 
  Platform, Animated 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Variabel di luar fungsi agar nilainya tetap tersimpan meski navigasi berpindah-pindah
// Ini memastikan skeleton HANYA muncul sekali saat aplikasi dibuka
let hasLoadedOnce = false;

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  // loading hanya true jika belum pernah load sama sekali
  const [loading, setLoading] = useState(!hasLoadedOnce);
  const router = useRouter();
  const skeletonValue = new Animated.Value(0);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce) {
        startSkeletonAnimation();
      }
      fetchFavorites();
    }, [])
  );

  const startSkeletonAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonValue, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchFavorites = async () => {
    try {
      // Jika sudah pernah load, jangan tampilkan skeleton lagi (biarkan loading normal/background)
      if (!hasLoadedOnce) setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          business_id,
          businesses (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const cleanData = data?.map(f => f.businesses).filter(b => b !== null) || [];
      setFavorites(cleanData);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      // Tandai sudah pernah load pertama kali
      hasLoadedOnce = true;
      setLoading(false);
    }
  };

  const SkeletonItem = ({ style }: { style: any }) => (
    <Animated.View style={[style, { 
      backgroundColor: '#EBEBEB', 
      opacity: skeletonValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }) 
    }]} />
  );

  const renderSkeletonCard = () => (
    <View style={styles.card}>
      <SkeletonItem style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <View>
          <SkeletonItem style={{ width: 60, height: 12, borderRadius: 4, marginBottom: 8 }} />
          <SkeletonItem style={{ width: '80%', height: 20, borderRadius: 6 }} />
        </View>
        <View style={styles.cardFooter}>
          <SkeletonItem style={{ width: 100, height: 32, borderRadius: 12 }} />
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.card} 
      onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
    >
      <Image 
        source={{ uri: item.image_url?.split('|')[0] || 'https://via.placeholder.com/300' }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardInfo}>
        <View>
          <Text style={styles.businessCategory}>{item.category}</Text>
          <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.detailLink}>
            <Text style={styles.detailLinkText}>Lihat Detail</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#E31B23" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        {loading ? (
          <>
            <SkeletonItem style={{ width: 100, height: 16, borderRadius: 4 }} />
            <SkeletonItem style={{ width: 220, height: 38, borderRadius: 8, marginTop: 8 }} />
          </>
        ) : (
          <>
            <Text style={styles.headerSubtitle}>Koleksi Anda</Text>
            <Text style={styles.headerTitle}>UMKM Favorit</Text>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.listPadding}>
          {[1, 2, 3, 4].map((key) => (
            <React.Fragment key={key}>{renderSkeletonCard()}</React.Fragment>
          ))}
        </View>
      ) : favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark" size={50} color="#E31B23" />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Favorit</Text>
          <Text style={styles.emptySubtitle}>Simpan UMKM yang Anda sukai untuk menemukannya kembali dengan mudah.</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.actionButton} 
            onPress={() => router.push('/(tabs)/umkm')}
          >
            <Text style={styles.actionButtonText}>Jelajahi Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { 
    paddingHorizontal: 25, 
    paddingTop: Platform.OS === 'ios' ? 70 : 60, 
    paddingBottom: 25, 
    backgroundColor: '#fff',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 5,
    zIndex: 10
  },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: '#E31B23', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', marginTop: 4, letterSpacing: -1 },
  listPadding: { padding: 25, paddingBottom: 120 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    marginBottom: 20, 
    padding: 12,
    elevation: 4,
  },
  cardImage: { width: 100, height: 110, borderRadius: 18, backgroundColor: '#F0F0F0' },
  cardInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between', paddingVertical: 4 },
  businessCategory: { fontSize: 11, fontWeight: '800', color: '#E31B23', textTransform: 'uppercase', letterSpacing: 0.5 },
  businessName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  detailLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  detailLinkText: { fontSize: 12, fontWeight: '800', color: '#E31B23', marginRight: 6 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  actionButton: { 
    marginTop: 30, 
    backgroundColor: '#1A1A1A', 
    paddingHorizontal: 25, 
    paddingVertical: 15, 
    borderRadius: 18,
    elevation: 5
  },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});