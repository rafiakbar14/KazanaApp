import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert,
  TextInput, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InboundDetailScreen({ route, navigation }: any) {
  const { sessionId, title } = route.params;
  const { isAdmin, role } = useAuth();
  const canModify = isAdmin || role === 'sku_manager';

  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<number | null>(null);
  const [offlinePhotos, setOfflinePhotos] = useState<Record<number, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalUpload, setTotalUpload] = useState(0);

  const OFFLINE_PHOTOS_KEY = `inbound_offline_photos_${sessionId}`;

  const loadOfflinePhotos = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(OFFLINE_PHOTOS_KEY);
      if (saved) setOfflinePhotos(JSON.parse(saved));
    } catch {}
  }, [OFFLINE_PHOTOS_KEY]);

  useEffect(() => { loadOfflinePhotos(); }, [loadOfflinePhotos]);

  const saveOfflinePhoto = async (itemId: number, uri: string) => {
    const updated = { ...offlinePhotos };
    if (!updated[itemId]) updated[itemId] = [];
    updated[itemId].push(uri);
    setOfflinePhotos(updated);
    await AsyncStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(updated));
  };

  const removeOfflinePhoto = async (itemId: number, index: number) => {
    const updated = { ...offlinePhotos };
    if (updated[itemId]) {
      updated[itemId].splice(index, 1);
      if (updated[itemId].length === 0) delete updated[itemId];
      setOfflinePhotos(updated);
      await AsyncStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(updated));
    }
  };

  const clearOfflinePhotos = async () => {
    setOfflinePhotos({});
    await AsyncStorage.removeItem(OFFLINE_PHOTOS_KEY);
  };

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get(`/inbound/${sessionId}`);
      setSession(res.data);
    } catch (err) {
      Alert.alert('Error', 'Gagal memuat detail sesi');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const isCompleted = session?.status === 'completed';

  const stats = useMemo(() => {
    if (!session?.items) return { total: 0, totalQty: 0 };
    return {
      total: session.items.length,
      totalQty: session.items.reduce((sum: number, i: any) => sum + (i.quantityReceived || 0), 0),
    };
  }, [session]);

  const handleRemoveItem = (itemId: number) => {
    Alert.alert('Hapus Item', 'Yakin ingin menghapus item ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/inbound/${sessionId}/items/${itemId}`);
            fetchSession();
          } catch {
            Alert.alert('Gagal', 'Tidak dapat menghapus item.');
          }
        }
      }
    ]);
  };

  const handleTakePhoto = async (itemId: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Butuh akses kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.6 });
    if (!result.canceled && result.assets[0].uri) {
      await saveOfflinePhoto(itemId, result.assets[0].uri);
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'Finalisasi Penerimaan',
      `Sesi ini memiliki ${stats.total} produk dengan total ${stats.totalQty} unit. Yakin ingin menyelesaikan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Finalisasi',
          onPress: async () => {
            setIsCompleting(true);
            try {
              // Upload offline photos first
              const allUploads: {itemId: number, uri: string}[] = [];
              Object.keys(offlinePhotos).forEach(itemIdStr => {
                const itemId = Number(itemIdStr);
                offlinePhotos[itemId].forEach(uri => {
                  allUploads.push({ itemId, uri });
                });
              });
              
              setTotalUpload(allUploads.length);
              setUploadProgress(0);

              for (let i = 0; i < allUploads.length; i++) {
                const { itemId, uri } = allUploads[i];
                const fileType = uri.split('.').pop() || 'jpg';
                const formData = new FormData();
                // @ts-ignore
                formData.append('photo', { uri, name: `photo.${fileType}`, type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}` });
                await api.post(`/inbound/${sessionId}/items/${itemId}/photos`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                setUploadProgress(i + 1);
              }

              await clearOfflinePhotos();

              await api.post(`/inbound/${sessionId}/complete`);
              Alert.alert('Berhasil', 'Penerimaan barang telah difinalisasi.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat upload foto atau finalisasi.');
            } finally {
              setIsCompleting(false);
              setUploadProgress(0);
              setTotalUpload(0);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIconBox}>
          <MaterialCommunityIcons name="cube-outline" size={22} color="#10b981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product?.name}</Text>
          <View style={styles.skuRow}>
            <Text style={styles.itemSku}>{item.product?.sku}</Text>
          </View>
        </View>
        {canModify && !isCompleted && (
          <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.itemBody}>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyLabel}>Jumlah Diterima</Text>
          <Text style={styles.qtyValue}>{item.quantityReceived}</Text>
          <Text style={styles.qtyUnit}>{item.product?.units?.[0]?.unitName || 'Pcs'}</Text>
        </View>
        {item.notes && (
          <View style={styles.itemNotesBox}>
            <MaterialCommunityIcons name="note-text-outline" size={13} color="#64748b" />
            <Text style={styles.itemNotes}>{item.notes}</Text>
          </View>
        )}
      </View>

      {/* Photo strip */}
      {(item.photos?.length > 0 || (offlinePhotos[item.id] && offlinePhotos[item.id].length > 0) || (canModify && !isCompleted)) && (
        <View style={styles.photoStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 }}>
              {item.photos?.map((p: any) => (
                <View key={p.id} style={styles.photoThumb}>
                  <MaterialCommunityIcons name="image" size={24} color="#10b981" />
                </View>
              ))}
              {offlinePhotos[item.id]?.map((uri, idx) => (
                <View key={`offline_${idx}`} style={[styles.photoThumb, { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' }]}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="#f59e0b" />
                  {canModify && !isCompleted && (
                    <TouchableOpacity 
                      style={styles.removePhotoBtn} 
                      onPress={() => removeOfflinePhoto(item.id, idx)}
                    >
                      <MaterialCommunityIcons name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {canModify && !isCompleted && (
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={() => handleTakePhoto(item.id)}
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#334155" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Selesai</Text>
              </View>
            )}
          </View>
          {session?.startedByName && (
            <Text style={styles.headerSub}>Penerima: {session.startedByName}</Text>
          )}
        </View>
        {canModify && !isCompleted && (
          <TouchableOpacity
            style={[styles.completeBtn, isCompleting && { opacity: 0.8, backgroundColor: '#f59e0b' }]}
            onPress={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                {totalUpload > 0 && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{uploadProgress}/{totalUpload}</Text>}
              </View>
            ) : (
              <MaterialCommunityIcons name="check-all" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="package-variant-closed" size={14} color="#10b981" />
          <Text style={styles.statChipText}>{stats.total} produk</Text>
        </View>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="counter" size={14} color="#10b981" />
          <Text style={styles.statChipText}>{stats.totalQty} total unit</Text>
        </View>
        {canModify && !isCompleted && (
          <TouchableOpacity
            style={styles.addItemBtn}
            onPress={() => setIsAddOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={14} color="#ffffff" />
            <Text style={styles.addItemBtnText}>Tambah Produk</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Item list */}
      <FlatList
        data={session?.items || []}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={48} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
            <Text style={styles.emptyText}>Tap "+ Tambah Produk" untuk menambahkan barang.</Text>
          </View>
        }
      />

      {/* Add Item Modal */}
      <AddItemModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdded={() => { setIsAddOpen(false); fetchSession(); }}
        sessionId={sessionId}
      />
    </SafeAreaView>
  );
}

// ─── Add Item Modal ─────────────────────────────────────────────────────────────

function AddItemModal({ visible, onClose, onAdded, sessionId }: any) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) { setSearch(''); setSelected(null); setQuantity('1'); setNotes(''); setProducts([]); }
  }, [visible]);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return; }
    setIsSearching(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(q)}`);
      setProducts((res.data || []).slice(0, 10));
    } catch { setProducts([]); }
    finally { setIsSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 400);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  const handleAdd = async () => {
    if (!selected) { Alert.alert('Pilih produk dulu'); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { Alert.alert('Jumlah harus lebih dari 0'); return; }
    setIsSaving(true);
    try {
      await api.post(`/inbound/${sessionId}/items`, {
        productId: selected.id,
        quantityReceived: qty,
        notes: notes.trim() || null,
      });
      onAdded();
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Tidak dapat menambahkan produk.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={addStyles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={addStyles.header}>
            <TouchableOpacity onPress={onClose} style={addStyles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#334155" />
            </TouchableOpacity>
            <Text style={addStyles.title}>Tambah Barang Diterima</Text>
            <TouchableOpacity
              style={[addStyles.saveBtn, (!selected || isSaving) && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!selected || isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={addStyles.saveBtnText}>Tambah</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={addStyles.body} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            {/* Search */}
            <View>
              <Text style={addStyles.label}>Cari Produk (SKU / Nama)</Text>
              <View style={addStyles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={18} color="#94a3b8" />
                <TextInput
                  style={addStyles.searchInput}
                  value={search}
                  onChangeText={t => { setSearch(t); setSelected(null); }}
                  placeholder="Ketik untuk mencari..."
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                {isSearching && <ActivityIndicator size="small" color="#10b981" style={{ transform: [{ scale: 0.7 }] }} />}
              </View>

              {/* Search results */}
              {products.length > 0 && !selected && (
                <View style={addStyles.resultList}>
                  {products.map((p: any) => (
                    <TouchableOpacity key={p.id} style={addStyles.resultItem} onPress={() => { setSelected(p); setSearch(p.name); }}>
                      <View style={{ flex: 1 }}>
                        <Text style={addStyles.resultName}>{p.name}</Text>
                        <Text style={addStyles.resultSku}>{p.sku}</Text>
                      </View>
                      <View style={addStyles.stockBadge}>
                        <Text style={addStyles.stockText}>Stok: {p.currentStock}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Selected product chip */}
              {selected && (
                <View style={addStyles.selectedChip}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  <Text style={addStyles.selectedName} numberOfLines={1}>{selected.name}</Text>
                  <TouchableOpacity onPress={() => { setSelected(null); setSearch(''); }}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quantity */}
            <View>
              <Text style={addStyles.label}>Jumlah Diterima</Text>
              <TextInput
                style={addStyles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Notes */}
            <View>
              <Text style={addStyles.label}>Catatan (Opsional)</Text>
              <TextInput
                style={[addStyles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Kondisi barang, dll..."
                placeholderTextColor="#94a3b8"
                multiline
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', flexShrink: 1 },
  completedBadge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  completedText: { fontSize: 10, fontWeight: '700', color: '#10b981' },
  headerSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  completeBtn: { padding: 10, backgroundColor: '#10b981', borderRadius: 12 },
  statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8, flexWrap: 'wrap' },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  statChipText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 4, marginLeft: 'auto' },
  addItemBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  listContainer: { paddingVertical: 12, paddingHorizontal: 14, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  emptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  itemCard: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14, overflow: 'hidden' },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  itemIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.08)', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  skuRow: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginTop: 3 },
  itemSku: { fontSize: 10, fontWeight: '600', color: '#475569' },
  removeBtn: { padding: 6, borderRadius: 8 },
  itemBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.06)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 8 },
  qtyLabel: { fontSize: 12, color: '#64748b', flex: 1 },
  qtyValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  qtyUnit: { fontSize: 12, color: '#94a3b8' },
  itemNotesBox: { flexDirection: 'row', gap: 6, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8 },
  itemNotes: { fontSize: 12, color: '#64748b', flex: 1, fontStyle: 'italic' },
  photoStrip: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  photoThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 56, height: 56, borderRadius: 10, borderWidth: 2, borderColor: '#d1fae5', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.04)' },
  removePhotoBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, zIndex: 10 },
});

const addStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { color: '#ffffff', fontWeight: '700' },
  body: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 12, height: 48, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  resultList: { marginTop: 6, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  resultName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  resultSku: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  stockBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(16,185,129,0.08)', padding: 10, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#d1fae5' },
  selectedName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1e293b' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1e293b' },
});
