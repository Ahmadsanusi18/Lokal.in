import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, ScrollView, Linking, TouchableOpacity, 
  StyleSheet, Alert, Dimensions, ActivityIndicator, StatusBar, TextInput, Platform,
  Share 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Interface untuk TypeScript agar tidak 'unknown'
interface CartType {
  [key: string]: number;
}

export default function Details() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [biz, setBiz] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State untuk Keranjang Pesanan
  const [cart, setCart] = useState<CartType>({});
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => { 
    if (id) loadAllData();
  }, [id]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchDetail(), fetchReviews(), checkIfFavorite()]);
    setLoading(false);
  };

  const fetchDetail = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('id', id).single();
    if (data) {
      setBiz(data);
      checkAccess(data.user_id);
      fetchOwnerProfile(data.user_id);
    }
  };

  const fetchOwnerProfile = async (ownerId: string) => {
    const { data } = await supabase
      .from('profiles') 
      .select('username, full_name, avatar_url')
      .eq('id', ownerId)
      .maybeSingle();
    
    if (data) setOwnerProfile(data);
  };

  const checkAccess = async (ownerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const isAdmin = user.email === 'lokalin@gmail.com';
      const isOwner = user.id === ownerId;
      setHasAccess(isAdmin || isOwner);
    }
  };

  const checkIfFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('business_id', id).maybeSingle();
    setIsFavorite(!!data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').eq('business_id', id).order('created_at', { ascending: false });
    setReviews(data || []);
  };

  // --- LOGIKA KERANJANG ---
  const addToCart = (menuName: string) => {
    setCart((prev) => ({
      ...prev,
      [menuName]: (prev[menuName] || 0) + 1
    }));
  };

  const removeFromCart = (menuName: string) => {
    setCart((prev) => {
      const newQty = (prev[menuName] || 0) - 1;
      const newCart = { ...prev };
      if (newQty <= 0) {
        delete newCart[menuName];
      } else {
        newCart[menuName] = newQty;
      }
      return newCart;
    });
  };

  const handleWhatsAppOrder = () => {
    if (!biz?.whatsapp_number) return Alert.alert("Error", "Nomor WhatsApp tidak tersedia.");
    
    const itemsInCart = Object.entries(cart);
    if (itemsInCart.length === 0) {
        // Jika keranjang kosong, gunakan chat biasa
        const cleanPhone = biz.whatsapp_number.replace(/\D/g, '');
        const message = `Halo ${biz?.name}, saya menemukan UMKM Anda di Lokal.in...`;
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
        return;
    }

    let orderList = "";
    let totalPrice = 0;

    const catalogData = biz.catalog.split(',').reduce((acc: any, curr: string) => {
        const [name, price] = curr.split(':');
        acc[name.trim()] = parseInt(price?.replace(/\D/g, '') || '0');
        return acc;
    }, {});

    itemsInCart.forEach(([name, qty]) => {
      const price = catalogData[name] || 0;
      orderList += `- ${name} (${qty}x)\n`;
      totalPrice += (price * qty);
    });

    const cleanPhone = biz.whatsapp_number.replace(/\D/g, '');
    const message = `Halo ${biz?.name},\nsaya ingin memesan via Lokal.in:\n\n${orderList}\nTotal Estimasi: Rp${totalPrice.toLocaleString('id-ID')}\n\nMohon diproses ya, terima kasih!`;
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
  };

  const openMaps = () => {
    if (!biz?.address) return;
    const encodedQuery = encodeURIComponent(`${biz.name}, ${biz.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedQuery}`,
      android: `geo:0,0?q=${encodedQuery}`,
    });
    Linking.openURL(url || '').catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`));
  };

  const handleDelete = async () => {
    Alert.alert("Konfirmasi", "Hapus data UMKM ini secara permanen?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          const { error } = await supabase.from('businesses').delete().eq('id', id);
          if (!error) {
            Alert.alert("Sukses", "Data telah dihapus.");
            router.replace('/(tabs)/umkm');
          }
        } 
      }
    ]);
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert("Perhatian", "Silakan login untuk menyimpan favorit.");
    
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('business_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert([{ user_id: user.id, business_id: id }]);
      setIsFavorite(true);
      await Notifications.scheduleNotificationAsync({
        content: { title: "Favorit Tersimpan", body: `${biz?.name} ditambahkan ke bookmark Anda.` },
        trigger: null,
      });
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Cek UMKM ${biz?.name} di Lokal.in!\n📍 ${biz?.address}` });
    } catch (e) {}
  };

  const getOpenStatus = () => {
    if (!biz?.opening_hour || !biz?.closing_hour) return { label: 'TUTUP', color: '#EF4444' };
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = biz.opening_hour.split(':').map(Number);
    const [ch, cm] = biz.closing_hour.split(':').map(Number);
    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    return (current >= open && current < close) ? { label: 'BUKA', color: '#22C55E' } : { label: 'TUTUP', color: '#EF4444' };
  };

  const submitReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert("Login", "Silakan login terlebih dahulu.");
    if (!comment.trim()) return;
    setSubmitting(true);
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const { error } = await supabase.from('reviews').insert([{ 
      business_id: id, user_id: user.id, user_name: profile?.username || "Pengguna", rating, comment: comment.trim() 
    }]);
    if (!error) {
      setComment(''); fetchReviews();
      Alert.alert("Terima Kasih", "Ulasan Anda sangat berarti bagi UMKM ini.");
    }
    setSubmitting(false);
  };

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#E31B23" /></View>;

  const imageList = biz?.image_url ? biz.image_url.split('|') : [];
  const status = getOpenStatus();
  const cartItemCount: number = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Banner Images */}
        <View style={styles.imageContainer}>
          <ScrollView horizontal pagingEnabled onScroll={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {imageList.length > 0 ? imageList.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img.trim() }} style={styles.bannerImage} />
            )) : <View style={styles.placeholderImg}><Ionicons name="image-outline" size={60} color="#DDD" /></View>}
          </ScrollView>
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.topGradient} />
          <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionCircle} onPress={onShare}><Ionicons name="share-social-outline" size={20} color="#1A1A1A" /></TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={toggleFavorite}><Ionicons name={isFavorite ? "bookmark" : "bookmark-outline"} size={22} color={isFavorite ? "#E31B23" : "#1A1A1A"} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentBox}>
          {hasAccess && (
            <View style={styles.adminRow}>
              <TouchableOpacity style={styles.adminBtnEdit} onPress={() => router.push({ pathname: '/add-business', params: { id } })}>
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.adminBtnTextEdit}>Edit Bisnis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminBtnDel} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#E31B23" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.flexRowBetween}>
            <View style={styles.tagRow}>
              <View style={styles.categoryTag}><Text style={styles.categoryText}>{biz?.category || 'UMKM'}</Text></View>
              <View style={[styles.statusTag, { borderColor: status.color + '40' }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingBadgeText}>{reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : "0.0"}</Text>
            </View>
          </View>

          <Text style={styles.title}>{biz?.name}</Text>
          
          <TouchableOpacity style={styles.infoRow} onPress={openMaps}>
            <View style={styles.iconCircle}><Ionicons name="location" size={16} color="#E31B23" /></View>
            <View style={{flex: 1}}>
                <Text style={styles.addressText}>{biz?.address}</Text>
                <Text style={styles.mapLink}>Petunjuk Arah</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}><Ionicons name="time" size={16} color="#666" /></View>
            <Text style={styles.timeText}>Jam Operasional: {biz?.opening_hour?.slice(0, 5)} - {biz?.closing_hour?.slice(0, 5)} WIB</Text>
          </View>

          

          <Text style={[styles.sectionHeader, { marginTop: 25 }]}>Informasi UMKM</Text>
          <Text style={styles.description}>{biz?.description || 'Tidak ada deskripsi tersedia.'}</Text>

          <Text style={[styles.sectionHeader, { marginTop: 30 }]}>Menu & Keranjang</Text>
          <View style={styles.catalogCard}>
            {biz?.catalog ? biz.catalog.split(',').map((item: string, i: number) => {
              const [name, price] = item.split(':');
              const menuName = name?.trim();
              const currentQty = cart[menuName] || 0;

              return (
                <View key={i} style={styles.menuItemOrder}>
                  <View style={{flex: 1}}>
                    <Text style={styles.menuName}>{menuName}</Text>
                    <Text style={styles.menuPrice}>{price ? `Rp${price.trim()}` : '-'}</Text>
                  </View>
                  <View style={styles.qtyContainer}>
                    {currentQty > 0 && (
                      <>
                        <TouchableOpacity onPress={() => removeFromCart(menuName)} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={16} color="#E31B23" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{currentQty}</Text>
                      </>
                    )}
                    <TouchableOpacity onPress={() => addToCart(menuName)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={16} color="#E31B23" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }) : <Text style={styles.noData}>Belum ada daftar menu.</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.waButton, cartItemCount === 0 && { backgroundColor: '#25D366' }]} 
            onPress={handleWhatsAppOrder}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text style={styles.waText}>
                {cartItemCount > 0 ? `Pesan ${cartItemCount} Item via WhatsApp` : 'Chat WhatsApp'}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <Text style={styles.sectionHeader}>Pemilik UMKM</Text>
          <View style={styles.ownerCard}>
            <Image 
              source={{ uri: ownerProfile?.avatar_url || `https://ui-avatars.com/api/?name=${ownerProfile?.full_name || 'Owner'}&background=E31B23&color=fff` }} 
              style={styles.ownerAvatar} 
            />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{ownerProfile?.full_name || ownerProfile?.username || 'Pemilik UMKM'}</Text>
              <Text style={styles.ownerRole}>Verified Seller Lokal.in</Text>
            </View>
            <TouchableOpacity style={styles.contactOwnerBtn} onPress={handleWhatsAppOrder}>
               <Ionicons name="chatbubbles-outline" size={20} color="#E31B23" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionHeader}>Berikan Penilaian</Text>
          <View style={styles.reviewInputContainer}>
            <View style={styles.starInputRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons name={s <= rating ? "star" : "star-outline"} size={32} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.commentInput} placeholder="Ceritakan pengalaman Anda..." value={comment} onChangeText={setComment} multiline />
            <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>KIRIM ULASAN</Text>}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 40 }]}>Ulasan Pengguna ({reviews.length})</Text>
          {reviews.map((rev, idx) => (
            <View key={rev.id || idx} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Image source={{ uri: `https://ui-avatars.com/api/?name=${rev.user_name}&background=random` }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.revUser}>{rev.user_name}</Text>
                  <View style={styles.revStars}>{[...Array(5)].map((_, i) => <Ionicons key={i} name={i < rev.rating ? "star" : "star-outline"} size={10} color="#FFC107" />)}</View>
                </View>
                <Text style={styles.revDate}>{new Date(rev.created_at).toLocaleDateString('id-ID')}</Text>
              </View>
              <Text style={styles.revText}>{rev.comment}</Text>
            </View>
          ))}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: 380, position: 'relative' },
  bannerImage: { width: width, height: 380 },
  placeholderImg: { width: width, height: 380, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  floatingBack: { position: 'absolute', top: 50, left: 20, backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 5 },
  rightActions: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', gap: 10 },
  actionCircle: { backgroundColor: '#fff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  contentBox: { paddingHorizontal: 25, marginTop: -30, backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingTop: 30 },
  adminRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  adminBtnEdit: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 15, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', gap: 8 },
  adminBtnTextEdit: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  adminBtnDel: { width: 55, height: 55, borderRadius: 15, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FEE2E2' },
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagRow: { flexDirection: 'row', gap: 8 },
  categoryTag: { backgroundColor: '#FFF1F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryText: { color: '#E31B23', fontSize: 12, fontWeight: '900' },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '900' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  ratingBadgeText: { fontWeight: '900', color: '#92400E', fontSize: 13 },
  title: { fontSize: 26, fontWeight: '900', marginTop: 15, color: '#1A1A1A', letterSpacing: -0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  addressText: { marginLeft: 10, color: '#444', flex: 1, fontSize: 14, fontWeight: '500' },
  mapLink: { marginLeft: 10, color: '#E31B23', fontSize: 12, fontWeight: '800' },
  timeText: { marginLeft: 10, color: '#666', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 30 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#F1F3F5' },
  ownerAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
  ownerInfo: { flex: 1, marginLeft: 15 },
  ownerName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  ownerRole: { fontSize: 12, color: '#666', marginTop: 2 },
  contactOwnerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 24, marginTop: 10 },
  catalogCard: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  menuItemOrder: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 15, marginBottom: 10, elevation: 1 },
  menuName: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  menuPrice: { fontSize: 14, fontWeight: '800', color: '#E31B23' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FEE2E2' },
  qtyText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', minWidth: 15, textAlign: 'center' },
  waButton: { backgroundColor: '#25D366', flexDirection: 'row', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  waText: { color: '#fff', fontWeight: '900', marginLeft: 10, fontSize: 16 },
  reviewInputContainer: { marginTop: 15 },
  starInputRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 15 },
  commentInput: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#F3F4F6', fontSize: 15 },
  submitBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  reviewCard: { marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  revUser: { fontWeight: '700', color: '#1A1A1A', fontSize: 14 },
  revStars: { flexDirection: 'row', marginTop: 2 },
  revDate: { fontSize: 11, color: '#9CA3AF' },
  revText: { marginTop: 10, color: '#4B5563', fontSize: 14, lineHeight: 22 },
  noData: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }
});