import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
  StyleSheet, Modal, TextInput, ScrollView, Alert, Animated, Easing,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SyncStatus from '../components/SyncStatus';

export default function SessionListScreen({ navigation }: any) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationTab, setLocationTab] = useState('semua');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    logout, user, role, showAllLocationTabs,
    canCountToko, canCountGudang, canCreateSession
  } = useAuth();

  const translateX = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState<any>({});

  // Get visible tabs ordered consistently
  const visibleTabs = useMemo(() => {
    const tabs = [];
    if (showAllLocationTabs) tabs.push('semua');
    if (canCountToko) tabs.push('toko');
    if (canCountGudang) tabs.push('gudang');
    return tabs;
  }, [showAllLocationTabs, canCountToko, canCountGudang]);

  // Set default tab based on role
  useEffect(() => {
    let target = 'semua';
    if (role === 'stock_counter_toko') target = 'toko';
    else if (role === 'stock_counter_gudang') target = 'gudang';
    
    if (visibleTabs.includes(target)) {
      setLocationTab(target);
    } else if (visibleTabs.length > 0) {
      setLocationTab(visibleTabs[0]);
    }
  }, [role, visibleTabs]);

  // Handle slide animation
  useEffect(() => {
    if (tabLayouts[locationTab]) {
      Animated.spring(translateX, {
        toValue: tabLayouts[locationTab].x,
        useNativeDriver: true,
        tension: 50,
        friction: 9
      }).start();
    }
  }, [locationTab, tabLayouts]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Fetch sessions error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  const filteredSessions = useMemo(() => {
    if (locationTab === 'semua') return sessions;
    return sessions.filter((s: any) => s.locationType === locationTab);
  }, [sessions, locationTab]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={{ backgroundColor: '#ffffff', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }}
      onPress={() => navigation.navigate('OpnameDetail', { sessionId: item.id, title: item.title })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        {/* Left icon */}
        <View style={{ backgroundColor: '#f0f5ff', padding: 14, borderRadius: 12 }}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#2563eb" />
        </View>
        {/* Right chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' }}>
            <MaterialCommunityIcons name={item.locationType === 'gudang' ? 'warehouse' : 'storefront-outline'} size={14} color="#1e293b" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{item.locationType === 'gudang' ? 'Gudang' : 'Toko'}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: item.status === 'completed' ? '#dcfce7' : '#fef3c7', borderWidth: 1, borderColor: item.status === 'completed' ? '#bbf7d0' : '#fde68a' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: item.status === 'completed' ? '#166534' : '#d97706' }}>
              {item.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 }}>{item.title || 'Sesi Opname'}</Text>
      <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>{item.notes || 'No additional notes provided.'}</Text>

      {item.assignedTo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <MaterialCommunityIcons name="account-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, color: '#64748b' }}>Petugas: {item.assignedTo}</Text>
        </View>
      )}

      <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name="calendar-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: '#64748b' }}>
          Started {new Date(item.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header aligned exactly to web screenshot */}
      <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1, marginBottom: 8 }}>Opname Sessions</Text>
        <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 20 }}>Track and audit your stock counting sessions.</Text>
        {canCreateSession && (
          <TouchableOpacity onPress={() => setIsCreateOpen(true)} style={{ backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>New Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Animated Segmented Location Tabs */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#f1f5f9', 
          padding: 4, 
          borderRadius: 14, 
          alignSelf: 'flex-start', 
          borderWidth: 1, 
          borderColor: '#e2e8f0',
          position: 'relative',
          minHeight: 48
        }}>
          {/* Sliding background pill */}
          {tabLayouts[locationTab] && (
            <Animated.View style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: tabLayouts[locationTab].width,
              backgroundColor: '#ffffff',
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              transform: [{ translateX }]
            }} />
          )}

          {visibleTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setTabLayouts((prev: any) => ({ ...prev, [tab]: { x, width } }));
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 10,
                gap: 8,
                zIndex: 2
              }}
              onPress={() => setLocationTab(tab)}
              activeOpacity={1}
            >
              <MaterialCommunityIcons 
                name={
                  tab === 'semua' ? "package-variant-closed" : 
                  tab === 'toko' ? "storefront-outline" : "warehouse"
                } 
                size={16} 
                color={locationTab === tab ? '#2563eb' : '#64748b'} 
              />
              <Text style={{ 
                fontSize: 15, 
                fontWeight: '700', 
                color: locationTab === tab ? '#0f172a' : '#64748b' 
              }}>
                {tab === 'semua' ? 'Semua' : tab === 'toko' ? 'Toko' : 'Gudang'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SyncStatus />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Sessions Yet</Text>
              <Text style={styles.emptyText}>Start a new stock opname session to begin auditing.</Text>
              {canCreateSession && (
                <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setIsCreateOpen(true)}>
                  <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
                  <Text style={styles.emptyCreateBtnText}>Start Session</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Create Session Modal */}
      <CreateSessionModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchSessions();
        }}
        defaultLocationType={locationTab === 'semua' ? 'toko' : locationTab}
        showLocationSelect={showAllLocationTabs}
        canCountToko={canCountToko}
        canCountGudang={canCountGudang}
      />
    </SafeAreaView>
  );
}

// ─── Create Session Modal ──────────────────────────────────────────────────────

function CreateSessionModal({
  visible, onClose, onCreated,
  defaultLocationType, showLocationSelect, canCountToko, canCountGudang,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultLocationType: string;
  showLocationSelect: boolean;
  canCountToko: boolean;
  canCountGudang: boolean;
}) {
  const [step, setStep] = useState<'staff' | 'details'>('staff');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [locationType, setLocationType] = useState(defaultLocationType || 'toko');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('staff');
      setTitle('');
      setNotes('');
      setLocationType(defaultLocationType || 'toko');
      setSelectedStaffIds([]);
      fetchStaff(defaultLocationType || 'toko');
    }
  }, [visible, defaultLocationType]);

  const fetchStaff = async (loc: string) => {
    setLoadingStaff(true);
    try {
      const res = await api.get('/staff');
      const all = res.data || [];
      // Filter by locationType (active only)
      const filtered = all.filter((s: any) => s.active === 1 && s.locationType === loc);
      setStaffList(filtered);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleLocationChange = (loc: string) => {
    setLocationType(loc);
    setSelectedStaffIds([]);
    fetchStaff(loc);
  };

  const toggleStaff = (id: number) => {
    setSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Validasi', 'Judul sesi tidak boleh kosong.');
      return;
    }

    const assignedStaff = staffList
      .filter(s => selectedStaffIds.includes(s.id))
      .map(s => s.name)
      .join(', ');

    setIsSaving(true);
    try {
      await api.post('/sessions', {
        title: title.trim(),
        notes: notes.trim() || null,
        locationType,
        assignedTo: assignedStaff,
        startedByName: staffList.find(s => selectedStaffIds.includes(s.id))?.name || '',
      });
      onCreated();
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal membuat sesi. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep('staff');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={modalStyles.container}>
        {/* Modal Header */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={step === 'details' ? () => setStep('staff') : handleClose} style={modalStyles.backBtn}>
            <MaterialCommunityIcons name={step === 'details' ? 'arrow-left' : 'close'} size={22} color="#334155" />
          </TouchableOpacity>
          <View style={modalStyles.headerText}>
            <Text style={modalStyles.headerTitle}>
              {step === 'staff' ? 'Pilih Petugas' : 'Detail Sesi'}
            </Text>
            <Text style={modalStyles.headerSubtitle}>
              {step === 'staff' ? 'Langkah 1 dari 2' : 'Langkah 2 dari 2'}
            </Text>
          </View>
          {step === 'details' && (
            <TouchableOpacity
              style={[modalStyles.saveBtn, isSaving && modalStyles.saveBtnDisabled]}
              onPress={handleCreate}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={modalStyles.saveBtnText}>Buat</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Step Indicator */}
        <View style={modalStyles.stepIndicator}>
          <View style={[modalStyles.stepDot, modalStyles.stepDotActive]} />
          <View style={modalStyles.stepLine} />
          <View style={[modalStyles.stepDot, step === 'details' && modalStyles.stepDotActive]} />
        </View>

        <ScrollView style={modalStyles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          {step === 'staff' ? (
            <>
              {/* Location selector */}
              {showLocationSelect && (
                <View style={modalStyles.section}>
                  <Text style={modalStyles.sectionLabel}>Lokasi</Text>
                  <View style={modalStyles.locationRow}>
                    {canCountToko && (
                      <TouchableOpacity
                        style={[modalStyles.locationBtn, locationType === 'toko' && modalStyles.locationBtnActive]}
                        onPress={() => handleLocationChange('toko')}
                      >
                        <MaterialCommunityIcons
                          name="storefront"
                          size={20}
                          color={locationType === 'toko' ? '#3b82f6' : '#64748b'}
                        />
                        <Text style={[modalStyles.locationBtnText, locationType === 'toko' && modalStyles.locationBtnTextActive]}>
                          Toko
                        </Text>
                      </TouchableOpacity>
                    )}
                    {canCountGudang && (
                      <TouchableOpacity
                        style={[modalStyles.locationBtn, locationType === 'gudang' && modalStyles.locationBtnActive]}
                        onPress={() => handleLocationChange('gudang')}
                      >
                        <MaterialCommunityIcons
                          name="warehouse"
                          size={20}
                          color={locationType === 'gudang' ? '#3b82f6' : '#64748b'}
                        />
                        <Text style={[modalStyles.locationBtnText, locationType === 'gudang' && modalStyles.locationBtnTextActive]}>
                          Gudang
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Staff list */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionLabel}>
                  Pilih Petugas ({locationType === 'gudang' ? 'Gudang' : 'Toko'})
                </Text>
                <Text style={modalStyles.sectionHint}>Pilih minimal 1 petugas untuk melanjutkan</Text>
                {loadingStaff ? (
                  <View style={modalStyles.loadingBox}>
                    <ActivityIndicator color="#3b82f6" />
                  </View>
                ) : staffList.length === 0 ? (
                  <View style={modalStyles.emptyBox}>
                    <MaterialCommunityIcons name="account-off-outline" size={40} color="#cbd5e1" />
                    <Text style={modalStyles.emptyText}>Tidak ada petugas aktif untuk lokasi ini</Text>
                  </View>
                ) : (
                  staffList.map((staff: any) => {
                    const isSelected = selectedStaffIds.includes(staff.id);
                    return (
                      <TouchableOpacity
                        key={staff.id}
                        style={[modalStyles.staffItem, isSelected && modalStyles.staffItemSelected]}
                        onPress={() => toggleStaff(staff.id)}
                      >
                        <View style={[modalStyles.staffAvatar, isSelected && modalStyles.staffAvatarSelected]}>
                          <Text style={[modalStyles.staffAvatarText, isSelected && { color: '#ffffff' }]}>
                            {staff.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[modalStyles.staffName, isSelected && modalStyles.staffNameSelected]}>
                          {staff.name}
                        </Text>
                        {isSelected && (
                          <MaterialCommunityIcons name="check-circle" size={22} color="#3b82f6" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <TouchableOpacity
                style={[
                  modalStyles.continueBtn,
                  selectedStaffIds.length === 0 && modalStyles.continueBtnDisabled
                ]}
                onPress={() => selectedStaffIds.length > 0 && setStep('details')}
                disabled={selectedStaffIds.length === 0}
              >
                <Text style={modalStyles.continueBtnText}>
                  Lanjutkan ({selectedStaffIds.length} dipilih)
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#ffffff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Session details */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionLabel}>Judul Sesi *</Text>
                <TextInput
                  style={modalStyles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="contoh: Opname Bulanan Juni 2026"
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
              </View>

              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionLabel}>Catatan (Opsional)</Text>
                <TextInput
                  style={[modalStyles.input, modalStyles.inputMultiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Tambahkan catatan untuk sesi ini..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Summary card */}
              <View style={modalStyles.summaryCard}>
                <Text style={modalStyles.summaryTitle}>Ringkasan</Text>
                <View style={modalStyles.summaryRow}>
                  <MaterialCommunityIcons name={locationType === 'gudang' ? 'warehouse' : 'storefront'} size={16} color="#64748b" />
                  <Text style={modalStyles.summaryLabel}>Lokasi:</Text>
                  <Text style={modalStyles.summaryValue}>{locationType === 'gudang' ? 'Gudang' : 'Toko'}</Text>
                </View>
                <View style={modalStyles.summaryRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={16} color="#64748b" />
                  <Text style={modalStyles.summaryLabel}>Petugas:</Text>
                  <Text style={modalStyles.summaryValue} numberOfLines={2}>
                    {staffList.filter(s => selectedStaffIds.includes(s.id)).map(s => s.name).join(', ')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 4 },
  newSessionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f1f5f9', gap: 6 },
  tabBtnActive: { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#1e293b' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingVertical: 16, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconBox: { marginBottom: 16, padding: 24, backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, gap: 8 },
  emptyCreateBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#ffffff', marginBottom: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { padding: 8, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: 12 },
  badgeContainer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  locationBadgeText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  statusBadgePrimary: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusTextSuccess: { color: '#10b981' },
  statusTextPrimary: { color: '#3b82f6' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  cardNotes: { fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 18 },
  petugasContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  petugasText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardDate: { fontSize: 12, color: '#64748b' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  saveBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#ffffff', marginBottom: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0' },
  stepDotActive: { backgroundColor: '#3b82f6' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginHorizontal: 8 },
  body: { flex: 1 },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHint: { fontSize: 12, color: '#94a3b8', marginBottom: 12, marginTop: -4 },
  locationRow: { flexDirection: 'row', gap: 12 },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#ffffff', gap: 8 },
  locationBtnActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.05)' },
  locationBtnText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  locationBtnTextActive: { color: '#3b82f6' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  staffItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', marginBottom: 8, gap: 12 },
  staffItemSelected: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.04)' },
  staffAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  staffAvatarSelected: { backgroundColor: '#3b82f6' },
  staffAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  staffName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  staffNameSelected: { color: '#1e293b' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', marginHorizontal: 16, marginTop: 24, paddingVertical: 16, borderRadius: 16, gap: 8 },
  continueBtnDisabled: { backgroundColor: '#94a3b8' },
  continueBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1e293b' },
  inputMultiline: { minHeight: 110, paddingTop: 14 },
  summaryCard: { marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', width: 60 },
  summaryValue: { fontSize: 13, color: '#1e293b', fontWeight: '500', flex: 1 },
});
