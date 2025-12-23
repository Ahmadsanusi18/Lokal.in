import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'; 
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRole();
  }, []);

  async function getRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data) setRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFBFB' }}>
        <ActivityIndicator size="large" color="#E31B23" />
      </View>
    );
  }

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#E31B23',
      tabBarInactiveTintColor: '#999',
      headerShown: false, 
      tabBarStyle: {
        position: 'absolute', 
        bottom: 0, // Diangkat sedikit agar tidak menempel bawah
        left: 20, right: 20,
        height: 75, borderRadius: 25,     
        backgroundColor: '#fff',
        elevation: 8, 
        paddingBottom: 12,
        borderTopWidth: 0,
        // Tambahkan shadow untuk iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
    }}>
      
      <Tabs.Screen name="index" options={{
        title: 'Beranda',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
        ),
      }} />

      <Tabs.Screen name="umkm" options={{
        title: 'UMKM',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "storefront" : "storefront-outline"} size={22} color={color} />
        ),
      }} />

      {/* ADMIN PANEL - Menggunakan href: null untuk menghapus space sepenuhnya */}
      <Tabs.Screen
        name="admin_panel"
        options={{
          title: 'Verifikasi',
          href: role === 'admin' ? '/admin_panel' : null, 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* MANAGE SHOP - Menggunakan href: null untuk menghapus space sepenuhnya */}
      <Tabs.Screen
        name="manage_shop"
        options={{
          title: 'Toko Saya',
          href: role === 'seller' ? '/manage_shop' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="favorites" options={{
        title: 'Favorit',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "heart" : "heart-outline"} size={22} color={color} />
        ),
      }} />

      <Tabs.Screen name="profile" options={{
        title: 'Profil',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
        ),
      }} />
      
      {/* Sembunyikan route internal */}
      <Tabs.Screen name="explore" options={{ href: null }} />
     <Tabs.Screen name="info" options={{ href: null }} />
    </Tabs>
  );
}