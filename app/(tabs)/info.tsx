import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Linking, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Tambahkan ini

const { width } = Dimensions.get('window');

export default function InfoScreen() {
  const router = useRouter(); // Inisialisasi router
  const developerName = "Ahmad Sanusi"; 
  const nim = "1123031018"; 
  const university = "Universitas Faletehan"; 

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      
      {/* Tombol Kembali Melayang */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        {/* Visual Header with Gradient */}
        <LinearGradient colors={['#E31B23', '#8C1007']} style={styles.topHeader}>
          <View style={styles.avatarFrame}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + developerName + '&background=FFFFFF&color=E31B23&size=200' }} 
              style={styles.avatarImage} 
            />
          </View>
          <Text style={styles.nameLabel}>{developerName}</Text>
          <Text style={styles.roleLabel}>Fullstack Mobile Developer</Text>
        </LinearGradient>

        <View style={styles.contentBody}>
          {/* Profile Details Card */}
          <View style={styles.profileCard}>
            <View style={styles.detailItem}>
              <View style={styles.iconBackground}>
                <Ionicons name="card-outline" size={20} color="#E31B23" />
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.fieldLabel}>Identitas Mahasiswa</Text>
                <Text style={styles.fieldValue}>{nim}</Text>
              </View>
            </View>

            <View style={styles.horizontalDivider} />

            <View style={styles.detailItem}>
              <View style={styles.iconBackground}>
                <Ionicons name="school-outline" size={20} color="#E31B23" />
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.fieldLabel}>Institusi Pendidikan</Text>
                <Text style={styles.fieldValue}>{university}</Text>
              </View>
            </View>

            <View style={styles.horizontalDivider} />

            <View style={styles.detailItem}>
              <View style={styles.iconBackground}>
                <Ionicons name="layers-outline" size={20} color="#E31B23" />
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.fieldLabel}>Teknologi Utama</Text>
                <Text style={styles.fieldValue}>React Native • Expo • Supabase</Text>
              </View>
            </View>
          </View>

          {/* Application Insight Section */}
          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>Visi Lokal.in</Text>
            <Text style={styles.insightDescription}>
              Lokal.in hadir sebagai jembatan digital untuk memperkuat ekosistem ekonomi mikro. 
              Kami percaya bahwa kemudahan dalam menemukan produk tetangga adalah langkah awal 
              menuju kemandirian ekonomi komunitas.
            </Text>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.buttonStack}>
            <TouchableOpacity 
              activeOpacity={0.9}
              style={styles.primaryActionButton} 
              onPress={() => Linking.openURL('https://github.com/Ahmadsanusi18')}
            >
              <Ionicons name="logo-github" size={22} color="#fff" />
              <Text style={styles.primaryActionText}>Repositori GitHub</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.secondaryActionButton} 
              onPress={() => Linking.openURL('https://www.instagram.com/a.saan_?igsh=MTFyOHJhMWZmZ3l1dQ%3D%3D&utm_source=qr')}
            >
              <Ionicons name="logo-instagram" size={22} color="#1A1A1A" />
              <Text style={styles.secondaryActionText}>Ikuti Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.appVersionSection}>
          <Text style={styles.versionText}>Lokal.in v1.0.0 Stable</Text>
          <Text style={styles.copyrightText}>© 2025 Ahmad Sanusi</Text>
        </View>
        
        <View style={{ height: 120 }} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FBFBFB' },
  // Gaya untuk tombol kembali
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    paddingTop: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: 70,
    alignItems: 'center',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    elevation: 15,
    shadowColor: '#E31B23',
    shadowOpacity: 0.2,
    shadowRadius: 25,
  },
  avatarFrame: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 70,
    marginBottom: 20,
  },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff' },
  nameLabel: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  roleLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  
  contentBody: { paddingHorizontal: 25 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    marginTop: -50,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  iconBackground: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  horizontalDivider: { height: 1, backgroundColor: '#F0F0F0', width: '100%' },
  textGroup: { marginLeft: 18, flex: 1 },
  fieldLabel: { fontSize: 11, color: '#A0A0A0', textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 },
  fieldValue: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 3 },
  
  insightBox: { marginTop: 40, paddingHorizontal: 5 },
  insightTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12, color: '#1A1A1A' },
  insightDescription: { fontSize: 15, color: '#666', lineHeight: 26, textAlign: 'left' },
  
  buttonStack: { marginTop: 35 },
  primaryActionButton: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    gap: 12
  },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  secondaryActionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    gap: 12
  },
  secondaryActionText: { color: '#1A1A1A', fontWeight: '800', fontSize: 16 },
  
  appVersionSection: { marginTop: 40, alignItems: 'center' },
  versionText: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', opacity: 0.5 },
  copyrightText: { fontSize: 11, color: '#BBB', marginTop: 4, fontWeight: '600' },
});