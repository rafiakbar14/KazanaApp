import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, role, logout } = useAuth();
  
  const displayRole = role === 'admin' ? 'Administrator' : role.toUpperCase().replace(/_/g, ' ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil & Pengaturan</Text>
          <Text style={styles.headerSubtitle}>Kelola akun dan referensi aplikasi Anda.</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'User').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Pengguna Kazana'}</Text>
              <Text style={styles.userRole}>{displayRole}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Setting Menus */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>AKUN SAYA</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuText}>Keamanan & Sandi</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#ef4444" />
            </View>
            <Text style={styles.menuText}>Notifikasi Perangkat</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>SISTEM KAZANA</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="database-sync-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.menuText}>Penyimpanan & Cache</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#fefce8' }]}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#eab308" />
            </View>
            <Text style={styles.menuText}>Pusat Bantuan</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Keluar Sesi (Logout)</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Kazana Mobile v1.0.0</Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1, marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#64748b' },
  
  profileSection: { paddingHorizontal: 20, marginBottom: 32 },
  profileCard: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4, letterSpacing: -0.5 },
  userRole: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  editBtn: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 16 },
  
  menuContainer: { backgroundColor: '#ffffff', marginHorizontal: 20, borderRadius: 20, paddingVertical: 8, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginLeft: 20, marginTop: 12, marginBottom: 8, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  
  logoutWrapper: { marginTop: 16, paddingHorizontal: 20, alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', paddingVertical: 16, width: '100%', borderRadius: 16, gap: 10, marginBottom: 16 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  versionText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' }
});
