import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, Modal, StyleSheet, ScrollView, Image, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { syncService } from '../services/sync';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/Theme';
import * as Haptics from 'expo-haptics';

const RecordItem = React.memo(({ item, offlinePhotos, isReadOnly, handleUpdateStock, handleTakePhoto, showPhotoOptions }: any) => {
  const isCounted = item.actualStock !== null;
  const localPhotos = offlinePhotos[item.productId] || [];
  const photosPending = localPhotos.length;
  const itemPhotos = item.photos || [];

  const [inputValue, setInputValue] = useState(item.actualStock?.toString() || '');
  
  useEffect(() => { setInputValue(item.actualStock?.toString() || ''); }, [item.actualStock]);

  return (
    <View style={webStyles.card}>
      <View style={webStyles.cardHeader}>
        <View style={webStyles.imageBox}>
          {itemPhotos.length > 0 ? (
             <Image source={{ uri: itemPhotos[0].url }} style={{width: '100%', height: '100%', borderRadius: RADIUS.sm}} />
          ) : (
             <MaterialCommunityIcons name="image-outline" size={24} color={COLORS.text.light} />
          )}
        </View>
        
        <View style={webStyles.cardInfo}>
          <Text style={webStyles.cardTitle}>{item.product.name}</Text>
          {item.product.productCode ? <Text style={webStyles.cardCondition}>{item.product.productCode}</Text> : null}
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'space-between'}}>
            {item.product.category && (
              <View style={webStyles.categoryPill}>
                <Text style={webStyles.categoryPillText}>{item.product.category.toUpperCase()}</Text>
              </View>
            )}
            {isCounted && <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.status.success} />}
          </View>
        </View>
      </View>

      <View style={webStyles.inputRowContainer}>
        <Text style={webStyles.aktualLabel}>JUMLAH AKTUAL</Text>
        <View style={webStyles.inputRowGroup}>
          <TextInput
            style={[webStyles.aktualInput, isReadOnly && webStyles.readOnlyInput]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="-"
            keyboardType="numeric"
            editable={!isReadOnly}
          />
          {!isReadOnly && (
            <TouchableOpacity 
              style={webStyles.aktualBtnSave} 
              onPress={() => handleUpdateStock(item, inputValue)}
            >
              <MaterialCommunityIcons name="check-bold" size={20} color={COLORS.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={webStyles.actionRowContainer}>
        <View style={[webStyles.cameraMiniCircle, { overflow: 'hidden', borderStyle: (localPhotos[0] || itemPhotos[0]?.url) ? 'solid' : 'dashed' }]}>
          {(localPhotos[0] || itemPhotos[0]?.url) ? (
             <Image source={{ uri: localPhotos[0] || itemPhotos[0]?.url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          ) : (
             <MaterialCommunityIcons name="camera-outline" size={16} color={COLORS.text.light} />
          )}
        </View>
        
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          {!isReadOnly && (
            <TouchableOpacity style={webStyles.ambilFotoBtn} onPress={() => handleTakePhoto(item)}>
              <MaterialCommunityIcons name="camera-outline" size={16} color={COLORS.primary} />
              <Text style={webStyles.ambilFotoText}>Ambil Foto</Text>
              {photosPending > 0 && (
                <View style={webStyles.pendingBadge}>
                  <Text style={{color: 'white', fontSize: 10}}>{photosPending}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {(photosPending > 0 || itemPhotos.length > 0) && (
            <TouchableOpacity onPress={() => showPhotoOptions(item)}>
               <Text style={webStyles.lihatText}>Lihat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

export default function OpnameDetailScreen({ route, navigation }: any) {
  const { sessionId, title } = route.params;
  const { canCompleteSession } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  
  // Modals & Loaders
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{productId: number, photos: string[]} | null>(null);

  // Offline Photos state
  const [offlinePhotos, setOfflinePhotos] = useState<Record<number, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalUpload, setTotalUpload] = useState(0);

  const OFFLINE_PHOTOS_KEY = `opname_offline_photos_${sessionId}`;

  const loadOfflinePhotos = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(OFFLINE_PHOTOS_KEY);
      if (saved) setOfflinePhotos(JSON.parse(saved));
    } catch {}
  }, [OFFLINE_PHOTOS_KEY]);

  useEffect(() => { loadOfflinePhotos(); }, [loadOfflinePhotos]);

  const saveOfflinePhoto = async (productId: number, uri: string) => {
    const updated = { ...offlinePhotos };
    if (!updated[productId]) updated[productId] = [];
    updated[productId].push(uri);
    setOfflinePhotos(updated);
    await AsyncStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(updated));
  };

  const clearOfflinePhotos = async () => {
    setOfflinePhotos({});
    await AsyncStorage.removeItem(OFFLINE_PHOTOS_KEY);
  };

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      setSession(res.data);
      setRecords(res.data.records || []);
    } catch (err) {
      Alert.alert('Error', 'Gagal memuat detail sesi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchDetail();
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Semua Kategori');
    records.forEach(r => { if (r.product.category) cats.add(r.product.category); });
    return Array.from(cats);
  }, [records]);

  // Handle Filtering
  useEffect(() => {
    let result = records;
    if (activeCategory && activeCategory !== 'Semua Kategori') {
      result = result.filter(r => r.product.category === activeCategory);
    }
    if (activeStatus && activeStatus !== 'Semua Status') {
      const targetCounted = activeStatus === 'Sudah Dihitung';
      result = result.filter(r => (r.actualStock !== null) === targetCounted);
    }
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(r =>
        r.product.name.toLowerCase().includes(query) ||
        r.product.sku.toLowerCase().includes(query) ||
        (r.product.productCode || '').toLowerCase().includes(query)
      );
    }
    setFilteredRecords(result);
  }, [search, records, activeCategory, activeStatus]);

  const stats = useMemo(() => {
    if (!records.length) return { total: 0, counted: 0, progress: 0 };
    const total = records.length;
    const counted = records.filter(r => r.actualStock !== null).length;
    const progress = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, progress };
  }, [records]);

  const isReadOnly = session?.status === 'completed';

  const handleUpdateStock = async (record: any, newStock: string) => {
    if (isReadOnly) return;
    const stockNum = parseInt(newStock);
    if (isNaN(stockNum)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, actualStock: stockNum } : r));
    await syncService.addUpdate(sessionId, record.productId, stockNum);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTakePhoto = async (record: any) => {
    if (isReadOnly) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Dibutuhkan akses ke kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.6 });
    if (!result.canceled && result.assets[0].uri) {
      await saveOfflinePhoto(record.productId, result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const showPhotoOptions = (record: any) => {
    const localPhotos = offlinePhotos[record.productId] || [];
    const serverPhotos = record.photos?.map((p: any) => p.url) || [];
    const allPhotos = [...localPhotos, ...serverPhotos];
    
    if (allPhotos.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerData({ productId: record.productId, photos: allPhotos });
  };

  const handleCompleteSession = () => {
    const uncounted = stats.total - stats.counted;
    const message = uncounted > 0
      ? `Masih ada ${uncounted} item belum dihitung. Yakin memfinalisasi sesi?`
      : 'Semua item dihitung. Yakin Finalisasi?';

    Alert.alert('Finalisasi Sesi', message, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Finalisasi',
        onPress: async () => {
          setIsCompleting(true);
          try {
            // Priority 1: Upload offline photos
            const pendingUploads: { productId: number, uri: string }[] = [];
            Object.keys(offlinePhotos).forEach(pId => {
              offlinePhotos[Number(pId)].forEach(uri => {
                pendingUploads.push({ productId: Number(pId), uri });
              });
            });

            setTotalUpload(pendingUploads.length);
            setUploadProgress(0);

            for (let i = 0; i < pendingUploads.length; i++) {
              const { productId, uri } = pendingUploads[i];
              const fileType = uri.split('.').pop() || 'jpg';
              const formData = new FormData();
              // @ts-ignore
              formData.append('photo', { uri, name: `photo.${fileType}`, type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}` });
              await api.post(`/upload/opname-photo/${sessionId}/${productId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              setUploadProgress(i + 1);
            }

            await clearOfflinePhotos();

            // Priority 2: Finalize
            await api.post(`/sessions/${sessionId}/complete`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sukses', 'Sesi opname berhasil disimpan secara permanen.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Gagal', err.response?.data?.message || 'Gagal finalisasi/upload foto.');
          } finally {
            setIsCompleting(false);
            setTotalUpload(0);
            setUploadProgress(0);
          }
        }
      }
    ]);
  };

  const listData = useMemo(() => {
     return [
       { id: 'header_area', type: 'header' },
       { id: 'filter_area', type: 'filter' },
       ...filteredRecords.map(r => ({ id: `record_${r.id}`, type: 'record', item: r }))
     ];
  }, [filteredRecords]);

  const renderItemRaw = ({ item, index }: any) => {
    if (item.type === 'header') {
      return (
        <View style={webStyles.pageHeaderArea}>
          <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <TouchableOpacity style={webStyles.backBtn} onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <Text style={webStyles.titleText}>{title.toUpperCase()}</Text>
              </View>
            </View>
            <View style={[webStyles.inProgressBadge, isReadOnly && webStyles.completedBadge]}>
                <Text style={[webStyles.inProgressText, isReadOnly && webStyles.completedText]}>
                  {isReadOnly ? 'COMPLETED' : 'IN PROGRESS'}
                </Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12}}>
            <View style={webStyles.subBadge}>
               <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.secondary} />
               <Text style={{fontSize: 12, fontWeight: '700'}}>{session?.locationType === 'gudang' ? 'Gudang' : 'Toko'}</Text>
            </View>
            <Text style={webStyles.subTextInfo}>Dimulai pada {session?.startedAt ? new Date(session.startedAt).toLocaleDateString('id-ID') : 'N/A'} | {stats.total} SKU</Text>
          </View>

          <View style={webStyles.progressRow}>
            <View style={webStyles.progressBarBg}>
               <View style={[webStyles.progressBarFill, {width: `${stats.progress}%` }]} />
            </View>
            <Text style={webStyles.progressLabel}>{stats.counted}/{stats.total} ({stats.progress}%)</Text>
          </View>

          {!isReadOnly && canCompleteSession && (
             <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16}}>
               <TouchableOpacity 
                 disabled={isCompleting}
                 style={webStyles.finalizeBtn} 
                 onPress={handleCompleteSession}
               >
                 {isCompleting ? (
                   <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                     <ActivityIndicator size="small" color="#ffffff" />
                     {totalUpload > 0 && <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>{uploadProgress}/{totalUpload}</Text>}
                   </View>
                 ) : (
                   <>
                     <MaterialCommunityIcons name="check-circle-outline" size={18} color="#ffffff" style={{marginRight: 6}} />
                     <Text style={{color: '#ffffff', fontWeight: 'bold', fontSize: 13}}>Finalize Sesi</Text>
                   </>
                 )}
               </TouchableOpacity>
             </View>
          )}
        </View>
      );
    }
    if (item.type === 'filter') {
      return (
        <View style={webStyles.filterArea}>
          <View style={webStyles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.text.light} />
            <TextInput
               style={webStyles.searchInput}
               placeholder="Cari SKU atau Nama Produk..."
               value={search}
               onChangeText={setSearch}
               placeholderTextColor={COLORS.text.light}
            />
          </View>

          <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
             <TouchableOpacity style={webStyles.dropdownSelect} onPress={() => setIsFilterModalOpen(true)}>
                <MaterialCommunityIcons name="filter-outline" size={16} color={COLORS.text.muted} />
                <Text style={webStyles.dropdownText} numberOfLines={1}>{activeCategory || 'Semua Kategori'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.text.muted} style={{marginLeft: 'auto'}} />
             </TouchableOpacity>

             <TouchableOpacity style={webStyles.dropdownSelect} onPress={() => {
                 setActiveStatus(prev => prev === 'Sudah Dihitung' ? 'Belum Dihitung' : prev === 'Belum Dihitung' ? 'Semua Status' : 'Sudah Dihitung');
             }}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.text.muted} />
                <Text style={webStyles.dropdownText} numberOfLines={1}>{activeStatus || 'Semua Status'}</Text>
             </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: index === 2 ? 16 : 0 }}>
        <RecordItem 
          item={item.item} 
          offlinePhotos={offlinePhotos} 
          isReadOnly={isReadOnly} 
          handleUpdateStock={handleUpdateStock} 
          handleTakePhoto={handleTakePhoto} 
          showPhotoOptions={showPhotoOptions} 
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={webStyles.safeArea}>
         <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
           <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={webStyles.safeArea}>
      <FlatList
        data={listData}
        renderItem={renderItemRaw}
        keyExtractor={item => item.id}
        stickyHeaderIndices={[1]}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      />

      {/* Category Modal */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setIsFilterModalOpen(false)} />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border }} />
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 15 }}>Pilih Kategori</Text>
              <ScrollView>
                {categories.map((c: string) => {
                  const isSelected = activeCategory === c || (c === 'Semua Kategori' && activeCategory === null);
                  return (
                    <TouchableOpacity key={c} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        setActiveCategory(c === 'Semua Kategori' ? null : c);
                        setIsFilterModalOpen(false);
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 16, color: isSelected ? COLORS.primary : COLORS.text.main, fontWeight: isSelected ? '700' : '500' }}>{c}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photos Viewer */}
      <Modal visible={!!viewerData} animationType="fade" transparent>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center'}}>
           <TouchableOpacity onPress={() => setViewerData(null)} style={{position: 'absolute', top: 50, right: 20, zIndex: 100}}>
             <Ionicons name="close-circle" size={32} color="white" />
           </TouchableOpacity>
           <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {viewerData?.photos.map((uri, idx) => (
                <View key={idx} style={{width: Dimensions.get('window').width, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                    <Image source={{uri}} style={{width: '90%', height: '70%', resizeMode: 'contain', borderRadius: RADIUS.md}} />
                    <Text style={{color: 'white', marginTop: 20, fontWeight: 'bold'}}>{idx + 1} / {viewerData.photos.length}</Text>
                </View>
              ))}
           </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const webStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  pageHeaderArea: { backgroundColor: '#ffffff', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  titleText: { fontSize: 22, fontWeight: '900', color: COLORS.secondary },
  
  inProgressBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5' },
  inProgressText: { fontSize: 10, fontWeight: '800', color: '#ea580c' },
  completedBadge: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  completedText: { color: COLORS.status.success },
  
  subBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  subTextInfo: { fontSize: 12, color: COLORS.text.muted, fontWeight: '600' },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.status.warning, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: COLORS.text.muted, fontWeight: '700' },
  
  finalizeBtn: { backgroundColor: COLORS.status.success, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', ...SHADOWS.medium },
  
  filterArea: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingHorizontal: 12, height: 48, gap: 8, ...SHADOWS.light },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text.main, fontWeight: '500' },
  
  dropdownSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 6, ...SHADOWS.light },
  dropdownText: { flex: 1, fontSize: 13, color: COLORS.text.muted, fontWeight: '600' },

  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.bento, padding: 16, marginBottom: 16, ...SHADOWS.light, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', gap: 16 },
  imageBox: { width: 64, height: 64, borderRadius: RADIUS.sm, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  cardCondition: { fontSize: 12, color: COLORS.text.muted, marginTop: 2 },
  categoryPill: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  categoryPillText: { fontSize: 9, fontWeight: '800', color: COLORS.text.muted },
  
  inputRowContainer: { marginTop: 16 },
  aktualLabel: { fontSize: 10, fontWeight: '800', color: COLORS.text.light, textTransform: 'uppercase', marginBottom: 6 },
  inputRowGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aktualInput: { flex: 1, height: 50, backgroundColor: COLORS.border, borderRadius: RADIUS.sm, fontSize: 20, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  readOnlyInput: { opacity: 0.6 },
  aktualBtnSave: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  
  actionRowContainer: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  cameraMiniCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  ambilFotoBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(79, 70, 229, 0.1)', gap: 6 },
  ambilFotoText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  lihatText: { fontSize: 13, color: COLORS.text.muted, fontWeight: '600' },
  pendingBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.status.warning, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }
});
