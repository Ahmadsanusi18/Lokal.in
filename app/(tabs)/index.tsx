import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  Dimensions, ScrollView, StatusBar, Platform, Animated,
  RefreshControl 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Makanan', icon: 'fast-food-outline' },
  { id: '2', name: 'Minuman', icon: 'beer-outline' },
  { id: '3', name: 'Fashion', icon: 'shirt-outline' },
  { id: '4', name: 'Jasa', icon: 'construct-outline' },
  { id: '5', name: 'Kriya', icon: 'color-palette-outline' },
];

const PRODUCT_GALLERY = [
  { id: '1', image: require('../../assets/img/kuliner.jpg'), title: 'Kuliner Lokal' },
  { id: '2', image: require('../../assets/img/sayur.jpg'), title: 'Sayur Segar' },
  { id: '3', image: require('../../assets/img/kriya.jpg'), title: 'Kerajinan Tangan' },
  { id: '4', image: require('../../assets/img/pasar.jpg'), title: 'Pasar Tradisional' },
];

const WHY_US = [
  { id: '1', title: 'Produk Terpilih', desc: 'Kurasi UMKM terbaik yang telah melewati verifikasi kualitas.', icon: 'shield-checkmark-outline' },
  { id: '2', title: 'Harga Jujur', desc: 'Transaksi langsung yang menguntungkan produsen dan konsumen.', icon: 'cash-outline' },
  { id: '3', title: 'Dukungan Lokal', desc: 'Setiap Rupiah membantu ekonomi tetangga berkembang.', icon: 'heart-outline' },
];

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('Pelanggan');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const skeletonValue = new Animated.Value(0);

  useEffect(() => {
    startSkeletonAnimation();
    fetchData(true);
  }, []);

  const startSkeletonAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonValue, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonValue, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchData = async (isFirstLoad: boolean) => {
    if (isFirstLoad) setInitialLoading(true);
    await getUser();
    if (isFirstLoad) {
      setTimeout(() => setInitialLoading(false), 600);
    }
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('username, full_name').eq('id', user.id).single();
        if (profile?.username) setUserName(profile.username);
        else if (profile?.full_name) setUserName(profile.full_name);
        else {
          const nameFromEmail = user.email?.split('@')[0];
          setUserName(nameFromEmail ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) : 'Pelanggan');
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const SkeletonItem = ({ style, color = '#EBEBEB' }: { style: any, color?: string }) => (
    <Animated.View style={[style, { 
      backgroundColor: color, 
      opacity: skeletonValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }) 
    }]} />
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView 
        bounces={true} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E31B23']} />}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          {initialLoading ? (
            <SkeletonItem style={StyleSheet.absoluteFillObject} color="#333" />
          ) : (
            <>
              <Image source={require('../../assets/img/index.jpg')} style={styles.headerImage} />
              <View style={styles.headerOverlay} />
            </>
          )}
          
          {/* TOP NAVIGATION ACTIONS */}
          {!initialLoading && (
            <>
              {/* SISI KIRI: Tombol Info */}
              <View style={styles.topLeftNav}>
                <TouchableOpacity style={styles.infoCircleBtn} onPress={() => router.push('/info')}>
                  <Ionicons name="information-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* SISI KANAN: Tombol Logout */}
              <View style={styles.topRightNav}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={styles.logoutButtonText}>Keluar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.welcomeTextGroup}>
            {initialLoading ? (
              <>
                <SkeletonItem style={styles.skeletonGreeting} color="#555" />
                <SkeletonItem style={styles.skeletonBrand} color="#555" />
              </>
            ) : (
              <>
                <Text style={styles.greetingText}>Halo, {userName}</Text>
                <Text style={styles.mainBrandText}>
                  Lokal<Text style={styles.brandDotIn}>.in</Text>
                </Text>
              </>
            )}
          </View>
        </View>

        {/* WHITE CONTENT AREA */}
        <View style={styles.whiteSection}>
          {/* HERO SECTION */}
          {initialLoading ? (
            <View style={styles.loadingHeroGroup}>
              <SkeletonItem style={styles.skeletonHeroIcon} />
              <SkeletonItem style={styles.skeletonHeroTitle} />
              <SkeletonItem style={styles.skeletonHeroDesc} />
              <SkeletonItem style={styles.skeletonHeroButton} />
            </View>
          ) : (
            <View style={styles.heroSection}>
              <View style={styles.iconCircleLarge}><Ionicons name="storefront-outline" size={35} color="#E31B23" /></View>
              <Text style={styles.heroTitle}>Ekonomi Tetangga</Text>
              <Text style={styles.heroDescription}>Temukan potensi terbaik di sekitar Anda. Setiap pembelian mendukung pertumbuhan komunitas lokal.</Text>
              <TouchableOpacity activeOpacity={0.9} style={styles.actionButtonMain} onPress={() => router.push('/(tabs)/umkm')}>
                <Text style={styles.actionButtonText}>Mulai Jelajah</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* KATEGORI PILIHAN */}
          <View style={styles.sectionWrapper}>
            {initialLoading ? <SkeletonItem style={styles.skeletonSectionTitle} /> : <Text style={styles.titleText}>Kategori Pilihan</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {initialLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ alignItems: 'center', marginRight: 15 }}>
                    <SkeletonItem style={styles.skeletonCategoryCard} />
                    <SkeletonItem style={styles.skeletonCategoryText} />
                  </View>
                ))
              ) : (
                CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.minimalCategoryCard}>
                    <View style={styles.categoryIconBackground}>
                      <Ionicons name={cat.icon as any} size={26} color="#1A1A1A" />
                    </View>
                    <Text style={styles.categoryLabelText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* METRICS BAR */}
          {initialLoading ? <SkeletonItem style={styles.skeletonMetricsBar} /> : (
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}><Text style={styles.metricNumber}>50+</Text><Text style={styles.metricTitle}>Mitra</Text></View>
              <View style={styles.metricSeparator} /><View style={styles.metricItem}><Text style={styles.metricNumber}>12</Text><Text style={styles.metricTitle}>Wilayah</Text></View>
              <View style={styles.metricSeparator} /><View style={styles.metricItem}><Text style={styles.metricNumber}>24h</Text><Text style={styles.metricTitle}>Update</Text></View>
            </View>
          )}

          {/* INSPIRASI PRODUK */}
          <View style={styles.sectionWrapper}>
            <View style={styles.flexHeader}>
              {initialLoading ? <SkeletonItem style={styles.skeletonSectionTitle} /> : (
                <>
                  <Text style={styles.titleText}>Inspirasi Produk</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/umkm')}><Text style={styles.linkText}>Lihat Semua</Text></TouchableOpacity>
                </>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {initialLoading ? [1, 2].map(i => <SkeletonItem key={i} style={styles.skeletonGalleryCard} />) : 
                PRODUCT_GALLERY.map((item) => (
                  <View key={item.id} style={styles.galleryCardFrame}>
                    <Image source={item.image} style={styles.galleryImageSource} /> 
                    <View style={styles.galleryLabelOverlay}><Text style={styles.galleryTitleText}>{item.title}</Text></View>
                  </View>
                ))}
            </ScrollView>
          </View>

          {/* MENGAPA HARUS LOKAL.IN */}
          <View style={styles.sectionWrapper}>
            {initialLoading ? <SkeletonItem style={styles.skeletonSectionTitle} /> : <Text style={styles.titleText}>Mengapa Lokal.in?</Text>}
            {initialLoading ? [1, 2, 3].map(i => <SkeletonItem key={i} style={styles.skeletonWhyCard} />) : 
              WHY_US.map((item) => (
                <View key={item.id} style={styles.whyUsCard}>
                  <View style={styles.whyUsIconContainer}><Ionicons name={item.icon as any} size={24} color="#E31B23" /></View>
                  <View style={styles.whyUsContent}>
                    <Text style={styles.whyUsTitle}>{item.title}</Text>
                    <Text style={styles.whyUsDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))
            }
          </View>

          {/* FOOTER SECTION */}
          <View style={styles.footerContainer}>
            <View style={styles.footerBrandRow}>
              <Text style={styles.footerBrandText}>Lokal.in</Text>
              <View style={styles.socialIconsRow}>
                <Ionicons name="logo-instagram" size={20} color="#777" style={{ marginRight: 15 }} />
                <Ionicons name="logo-facebook" size={20} color="#777" style={{ marginRight: 15 }} />
                <Ionicons name="logo-twitter" size={20} color="#777" />
              </View>
            </View>
            
            {/* FOOTER INFO LINKS */}
            <View style={styles.footerLinkGroup}>
               <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/info')}>
                  <Ionicons name="information-circle" size={16} color="#E31B23" />
                  <Text style={styles.footerLinkText}>Tentang Aplikasi</Text>
               </TouchableOpacity>
               <View style={styles.footerDot} />
               <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/info')}>
                  <Text style={styles.footerLinkText}>Bantuan</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.footerDivider} />
            <Text style={styles.copyrightText}>© 2025 Lokal.in – Ahmad Sanusi</Text>
            <Text style={styles.footerAddress}>Lebak, Banten, Indonesia</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  headerContainer: { height: 420, width: width, position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  
  // NAVIGASI ATAS
  topLeftNav: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, left: 25, zIndex: 10 },
  topRightNav: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, right: 25, zIndex: 10 },
  
  infoCircleBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)' 
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    paddingHorizontal: 16, 
    height: 48, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)' 
  },
  logoutButtonText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  
  welcomeTextGroup: { position: 'absolute', bottom: 80, left: 30 },
  greetingText: { color: '#fff', fontSize: 20, fontWeight: '500', opacity: 0.9 },
  mainBrandText: { color: '#fff', fontSize: 56, fontWeight: '900', letterSpacing: -2, marginTop: -5 },
  brandDotIn: { color: '#E31B23' },
  
  whiteSection: { flex: 1, backgroundColor: '#FBFBFB', marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 25, paddingTop: 40 },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  iconCircleLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 4 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  heroDescription: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 26, marginTop: 12 },
  actionButtonMain: { backgroundColor: '#E31B23', width: '100%', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  sectionWrapper: { marginTop: 45 },
  titleText: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
  flexHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  linkText: { color: '#E31B23', fontWeight: '800', fontSize: 14 },
  minimalCategoryCard: { width: 85, alignItems: 'center', marginRight: 15 },
  categoryIconBackground: { width: 65, height: 65, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  categoryLabelText: { marginTop: 12, fontSize: 13, color: '#1A1A1A', fontWeight: '700' },
  metricsBar: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 25, paddingVertical: 25, marginTop: 50, justifyContent: 'space-around' },
  metricItem: { alignItems: 'center' },
  metricNumber: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  metricTitle: { color: '#A0A0A0', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  metricSeparator: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.1)' },
  galleryCardFrame: { width: 220, height: 280, marginRight: 20, borderRadius: 30, overflow: 'hidden', backgroundColor: '#EEE' },
  galleryImageSource: { width: '100%', height: '100%' },
  galleryLabelOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  galleryTitleText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  whyUsCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 15, elevation: 2 },
  whyUsIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  whyUsContent: { flex: 1 },
  whyUsTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  whyUsDesc: { fontSize: 13, color: '#777', lineHeight: 20 },
  
  // FOOTER
  footerContainer: { marginTop: 60, paddingBottom: 100, alignItems: 'center' },
  footerBrandRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  footerBrandText: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  socialIconsRow: { flexDirection: 'row' },
  footerLinkGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  footerLink: { flexDirection: 'row', alignItems: 'center' },
  footerLinkText: { color: '#555', fontSize: 14, fontWeight: '700', marginHorizontal: 5 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 10 },
  footerDivider: { width: '100%', height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  copyrightText: { fontSize: 13, color: '#777', fontWeight: '600' },
  footerAddress: { fontSize: 12, color: '#AAA', marginTop: 5 },
  
  // SKELETONS
  loadingHeroGroup: { alignItems: 'center', marginBottom: 30 },
  skeletonLogout: { width: 90, height: 38, borderRadius: 20 },
  skeletonGreeting: { width: 120, height: 20, borderRadius: 6, marginBottom: 12 },
  skeletonBrand: { width: 200, height: 55, borderRadius: 12 },
  skeletonHeroIcon: { width: 80, height: 80, borderRadius: 40, marginBottom: 20 },
  skeletonHeroTitle: { width: 220, height: 30, borderRadius: 8, marginBottom: 15 },
  skeletonHeroDesc: { width: '100%', height: 50, borderRadius: 10 },
  skeletonHeroButton: { width: '100%', height: 65, borderRadius: 20, marginTop: 30 },
  skeletonSectionTitle: { width: 160, height: 26, borderRadius: 6, marginBottom: 20 },
  skeletonCategoryCard: { width: 65, height: 65, borderRadius: 22 },
  skeletonCategoryText: { width: 50, height: 12, borderRadius: 4, marginTop: 10 },
  skeletonMetricsBar: { width: '100%', height: 95, borderRadius: 25, marginTop: 50 },
  skeletonGalleryCard: { width: 220, height: 280, borderRadius: 30, marginRight: 20 },
  skeletonWhyCard: { width: '100%', height: 100, borderRadius: 25, marginBottom: 15 },
});