import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Modal, TextInput, ScrollView, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function InboundListScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { isAdmin, role } = useAuth();

  const canCreate = isAdmin || role === 'sku_manager';

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/inbound');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error fetching inbound sessions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const onRefresh = () => { setIsRefreshing(true); fetchSessions(); };

  const renderItem = ({ item }: any) => {
    const isCompleted = item.status === 'completed';
    const itemCount = item.items?.length || 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('InboundDetail', { sessionId: item.id, title: item.title })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="package-down" size={20} color="#10b981" />
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusActive]}>
              <Text style={[styles.statusText, isCompleted ? styles.statusTextCompleted : styles.statusTextActive]}>
                {isCompleted ? 'Selesai' : 'Berjalan'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title || 'Penerimaan Barang'}</Text>
        {item.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
        )}

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="package-variant-closed" size={13} color="#64748b" />
            <Text style={styles.metaText}>{itemCount} produk</Text>
          </View>
          {item.startedByName && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-outline" size={13} color="#64748b" />
              <Text style={styles.metaText}>{item.startedByName}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <MaterialCommunityIcons name="calendar-blank" size={13} color="#94a3b8" />
          <Text style={styles.cardDate}>
            {new Date(item.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Terima Barang</Text>
          <Text style={styles.headerSubtitle}>Daftar sesi penerimaan barang</Text>
        </View>
        {canCreate && (
          <TouchableOpacity style={styles.newBtn} onPress={() => setIsCreateOpen(true)}>
            <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
            <Text style={styles.newBtnText}>Baru</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#10b981" size="large" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="package-down" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Sesi</Text>
              <Text style={styles.emptyText}>Buat sesi penerimaan barang baru untuk mulai mencatat.</Text>
              {canCreate && (
                <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setIsCreateOpen(true)}>
                  <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                  <Text style={styles.emptyCreateBtnText}>Buat Sesi Baru</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <CreateInboundModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => { setIsCreateOpen(false); fetchSessions(); }}
      />
    </SafeAreaView>
  );
}

function CreateInboundModal({ visible, onClose, onCreated }: any) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startedByName, setStartedByName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) { setTitle(''); setNotes(''); setStartedByName(''); }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Validasi', 'Judul sesi harus diisi.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/inbound', { title: title.trim(), notes: notes.trim() || null, startedByName: startedByName.trim() || null });
      onCreated();
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal membuat sesi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modalStyles.container}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#334155" />
          </TouchableOpacity>
          <Text style={modalStyles.title}>Sesi Penerimaan Baru</Text>
          <TouchableOpacity
            style={[modalStyles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <Text style={modalStyles.saveBtnText}>Buat</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={modalStyles.body} contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View>
            <Text style={modalStyles.label}>Judul Sesi *</Text>
            <TextInput
              style={modalStyles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="contoh: Terima dari Supplier ABC - April 2026"
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>
          <View>
            <Text style={modalStyles.label}>Nama Penerima</Text>
            <TextInput
              style={modalStyles.input}
              value={startedByName}
              onChangeText={setStartedByName}
              placeholder="Nama staf penerima barang"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View>
            <Text style={modalStyles.label}>Catatan (Opsional)</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Tambahkan catatan..."
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  burgerBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 4 },
  newBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingVertical: 16, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconBox: { padding: 24, backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', paddingHorizontal: 40 },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, gap: 6 },
  emptyCreateBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#ffffff', marginBottom: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: { padding: 8, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12 },
  badgeContainer: { flexDirection: 'row', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusCompleted: { backgroundColor: 'rgba(16,185,129,0.1)' },
  statusActive: { backgroundColor: 'rgba(59,130,246,0.1)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusTextCompleted: { color: '#10b981' },
  statusTextActive: { color: '#3b82f6' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  cardNotes: { fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#64748b' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardDate: { fontSize: 11, color: '#94a3b8' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  body: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1e293b' },
});
