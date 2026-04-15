import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
  Modal, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/sync';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/Theme';
import * as Haptics from 'expo-haptics';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  sku_manager: 'SKU Manager',
  stock_counter: 'Stock Counter',
  stock_counter_toko: 'Counter — Toko',
  stock_counter_gudang: 'Counter — Gudang',
  cashier: 'Kasir',
  driver: 'Driver',
  production: 'Produksi',
};

export default function HomeScreen({ navigation }: any) {
  const { user, role, canCount } = useAuth();
  
  const [queueCount, setQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // New States for Phase 10
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState({ 
    healthy: 0, 
    warning: 0, 
    critical: 0 
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Sessions
      const sessionsRes = await api.get('/sessions');
      const active = (sessionsRes.data || []).filter((s: any) => s.status !== 'completed');
      setSessionCount(active.length);

      // 2. Fetch Branches
      const branchesRes = await api.get('/branches');
      setBranches(branchesRes.data || []);
      if (branchesRes.data?.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesRes.data[0]);
      }

      // 3. Fetch AI Insights & Aging (Demand Analytics)
      const agingRes = await api.get('/analytics/inventory-aging');
      const agingData = agingRes.data || [];
      const stats = { healthy: 0, warning: 0, critical: 0 };
      agingData.forEach((item: any) => {
        if (item.status === 'Critical') stats.critical++;
        else if (item.status === 'Warning') stats.warning++;
        else stats.healthy++;
      });
      setHealthStats(stats);

      // 4. Fetch Prediction Advice (AI Insight)
      const predictRes = await api.get('/analytics/inventory-demand');
      const products = predictRes.data || [];
      if (products.length > 0) {
        const topAdvice = products[0].advice || "Semua stok terkendali dengan baik.";
        setAiInsight(topAdvice);
      }
    } catch (err) {
      console.log('Error fetching home data:', err);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchData();
    const unsub = NetInfo.addEventListener(s => setIsOnline(!!s.isConnected));
    return () => unsub();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await syncService.syncAll();
    const q = await syncService.getQueue();
    const ls = await syncService.getLastSync();
    setQueueCount(q.length);
    if (ls) setLastSync(new Date(ls).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    setIsSyncing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Glass Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandTitle}>Kazana</Text>
          <TouchableOpacity 
            style={styles.branchSelector} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsBranchModalVisible(true);
            }}
          >
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.branchName} numberOfLines={1}>
              {selectedBranch?.name || 'Pilih Cabang'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="scan-outline" size={24} color={COLORS.text.main} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications-outline" size={24} color={COLORS.text.main} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{ROLE_LABELS[role] || role}</Text>
          </View>
        </View>

        {/* AI Insight Card - Glassmorphism */}
        {aiInsight && (
          <LinearGradient
            colors={['#4f46e5', '#818cf8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiCard}
          >
            <View style={styles.aiIconBox}>
              <Ionicons name="sparkles" size={20} color={COLORS.text.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI Tactical Insight</Text>
              <Text style={styles.aiContent} numberOfLines={2}>
                {aiInsight}
              </Text>
            </View>
            <TouchableOpacity style={styles.aiDetailsBtn}>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text.white} />
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Bento Grid Stats */}
        <View style={styles.bentoGrid}>
          {/* Main Sync Row */}
          <TouchableOpacity 
            style={[styles.bentoCard, styles.syncFullWidth, !isOnline && styles.syncOffline]} 
            onPress={handleSync}
            disabled={!isOnline || isSyncing}
          >
            <View style={styles.syncContent}>
              <View style={[styles.syncIconBox, { backgroundColor: isOnline ? '#ecfdf5' : '#fffbeb' }]}>
                <Ionicons 
                  name={isOnline ? 'cloud-done' : 'cloud-offline'} 
                  size={24} 
                  color={isOnline ? COLORS.status.success : COLORS.status.warning} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bentoMutedTitle}>Status Sinkronisasi</Text>
                <Text style={styles.bentoValue}>
                  {isSyncing ? 'Menyingkronkan...' : isOnline ? 'Device Online' : 'Offline Mode'}
                </Text>
              </View>
              {queueCount > 0 && (
                <View style={styles.syncBadge}>
                  <Text style={styles.syncBadgeText}>{queueCount} Pending</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Activity Cards */}
          <View style={styles.bentoRow}>
            <TouchableOpacity style={styles.bentoCardSmall} onPress={() => navigation.navigate('Opname')}>
              <LinearGradient colors={['#ffffff', '#f1f5f9']} style={styles.bentoCardContent}>
                <Ionicons name="clipboard" size={24} color={COLORS.primary} />
                <Text style={styles.bentoValueSmall}>{sessionCount}</Text>
                <Text style={styles.bentoLabel}>Sesi Aktif</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bentoCardSmall} onPress={() => navigation.navigate('Terima')}>
              <LinearGradient colors={['#ffffff', '#f1f5f9']} style={styles.bentoCardContent}>
                <Ionicons name="cube" size={24} color={COLORS.status.success} />
                <Text style={styles.bentoValueSmall}>Receiving</Text>
                <Text style={styles.bentoLabel}>Barang Masuk</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stock Health Card */}
          <View style={[styles.bentoCard, styles.healthCard]}>
            <View style={styles.healthHeader}>
              <Text style={styles.healthTitle}>Unit Health Analysis</Text>
              <View style={styles.healthInfoIcon}>
                <Ionicons name="analytics" size={14} color={COLORS.text.muted} />
              </View>
            </View>
            
            <View style={styles.healthStatsRow}>
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatVal, { color: COLORS.status.success }]}>{healthStats.healthy}</Text>
                <Text style={styles.healthStatLabel}>Healthy</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatVal, { color: COLORS.status.warning }]}>{healthStats.warning}</Text>
                <Text style={styles.healthStatLabel}>Warning</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatVal, { color: COLORS.status.error }]}>{healthStats.critical}</Text>
                <Text style={styles.healthStatLabel}>Critical</Text>
              </View>
            </View>
            
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { backgroundColor: COLORS.status.success, flex: healthStats.healthy || 1 }]} />
              <View style={[styles.healthBarFill, { backgroundColor: COLORS.status.warning, flex: healthStats.warning || 0 }]} />
              <View style={[styles.healthBarFill, { backgroundColor: COLORS.status.error, flex: healthStats.critical || 0 }]} />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Branch Selector Modal */}
      <Modal visible={isBranchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setIsBranchModalVisible(false)} />
          <BlurView intensity={100} tint="light" style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Pilih Cabang / Gudang</Text>
              <TouchableOpacity onPress={() => setIsBranchModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.text.muted} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={branches}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.branchItem, selectedBranch?.id === item.id && styles.branchItemSelected]}
                  onPress={() => {
                    setSelectedBranch(item);
                    setIsBranchModalVisible(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={[styles.branchIcon, { backgroundColor: item.type === 'warehouse' ? '#ecfdf5' : '#eff6ff' }]}>
                    <Ionicons 
                      name={item.type === 'warehouse' ? 'business' : 'storefront'} 
                      size={20} 
                      color={item.type === 'warehouse' ? COLORS.status.success : COLORS.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.branchItemName}>{item.name}</Text>
                    <Text style={styles.branchItemType}>{item.address || (item.type === 'warehouse' ? 'Main Warehouse' : 'Physical Store')}</Text>
                  </View>
                  {selectedBranch?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flex: 1 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: COLORS.secondary, letterSpacing: -0.5 },
  branchSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  branchName: { fontSize: 11, fontWeight: '700', color: COLORS.text.muted, maxWidth: 120 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.border, 
    alignItems: 'center', justifyContent: 'center' 
  },
  notificationDot: { 
    position: 'absolute', top: 10, right: 10, width: 8, height: 8, 
    borderRadius: 4, backgroundColor: COLORS.status.error, zIndex: 1,
    borderWidth: 2, borderColor: COLORS.card
  },
  scrollContent: { padding: SPACING.md },
  welcomeSection: { marginBottom: SPACING.lg },
  greetingText: { fontSize: 14, color: COLORS.text.muted, fontWeight: '500' },
  userName: { fontSize: 28, fontWeight: '900', color: COLORS.secondary, marginTop: -2 },
  roleTag: { 
    marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(79, 70, 229, 0.08)', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 
  },
  roleTagText: { fontSize: 11, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase' },
  
  aiCard: { 
    borderRadius: RADIUS.bento, padding: SPACING.md, flexDirection: 'row', 
    alignItems: 'center', gap: 12, marginBottom: SPACING.md, ...SHADOWS.medium 
  },
  aiIconBox: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', justifyContent: 'center' 
  },
  aiTitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  aiContent: { fontSize: 14, color: COLORS.text.white, fontWeight: '600', lineHeight: 20 },
  aiDetailsBtn: { padding: 4 },

  bentoGrid: { gap: SPACING.md },
  bentoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.bento, padding: SPACING.md, ...SHADOWS.light, borderWidth: 1, borderColor: COLORS.border },
  syncFullWidth: { paddingVertical: 14 },
  syncOffline: { backgroundColor: '#fffbeb' },
  syncContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bentoMutedTitle: { fontSize: 11, color: COLORS.text.muted, fontWeight: '600' },
  bentoValue: { fontSize: 16, color: COLORS.secondary, fontWeight: '800' },
  syncBadge: { backgroundColor: 'rgba(79, 70, 229, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  syncBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },

  bentoRow: { flexDirection: 'row', gap: SPACING.md },
  bentoCardSmall: { flex: 1, height: 120, borderRadius: RADIUS.bento, overflow: 'hidden', ...SHADOWS.light },
  bentoCardContent: { flex: 1, padding: SPACING.md, justifyContent: 'center', alignItems: 'center', gap: 4 },
  bentoValueSmall: { fontSize: 20, fontWeight: '900', color: COLORS.secondary },
  bentoLabel: { fontSize: 11, color: COLORS.text.muted, fontWeight: '600' },

  healthCard: { gap: 12 },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthTitle: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  healthInfoIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  healthStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  healthStatItem: { alignItems: 'center' },
  healthStatVal: { fontSize: 22, fontWeight: '900' },
  healthStatLabel: { fontSize: 10, color: COLORS.text.muted, fontWeight: '700', textTransform: 'uppercase' },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  healthBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  healthBarFill: { height: '100%' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalSheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { padding: SPACING.md, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  modalList: { padding: SPACING.md },
  branchItem: { 
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, 
    borderRadius: RADIUS.md, marginBottom: 8, gap: 12 
  },
  branchItemSelected: { backgroundColor: 'rgba(79, 70, 229, 0.05)', borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.2)' },
  branchIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  branchItemName: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  branchItemType: { fontSize: 12, color: COLORS.text.muted },
});
