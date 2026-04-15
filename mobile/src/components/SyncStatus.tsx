import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { syncService } from '../services/sync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function SyncStatus() {
  const [queueCount, setQueueCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const updateStatus = async () => {
    const queue = await syncService.getQueue();
    const ls = await syncService.getLastSync();
    setQueueCount(queue.length);
    if (ls) {
      setLastSync(new Date(ls).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 3000); // Poll every 3 seconds

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncService.syncAll();
    await updateStatus();
    setIsSyncing(false);
  };

  if (queueCount === 0 && lastSync === null) return null;

  return (
    <View style={[styles.container, isOnline ? styles.bgOnline : styles.bgOffline]}>
      <View style={styles.leftContainer}>
        <View style={[styles.indicator, isOnline ? styles.indicatorOnline : styles.indicatorOffline]} />
        <View>
          <Text style={styles.primaryText}>
            {queueCount > 0 ? `${queueCount} data menunggu kirim` : 'Semua data tersinkron'}
          </Text>
          {lastSync && (
            <Text style={styles.secondaryText}>Terakhir: {lastSync}</Text>
          )}
        </View>
      </View>

      {queueCount > 0 && isOnline && (
        <TouchableOpacity 
          onPress={handleSyncNow} 
          disabled={isSyncing}
          style={styles.syncBtn}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#3b82f6" style={{ transform: [{ scale: 0.6 }] }} />
          ) : (
            <MaterialCommunityIcons name="sync" size={12} color="#3b82f6" />
          )}
          <Text style={styles.syncText}>Sync Now</Text>
        </TouchableOpacity>
      )}

      {!isOnline && (
        <View style={styles.offlineContainer}>
          <MaterialCommunityIcons name="wifi-off" size={12} color="#f59e0b" />
          <Text style={styles.offlineText}>Mode Offline</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bgOnline: { backgroundColor: '#f8fafc' },
  bgOffline: { backgroundColor: '#fffbeb' },
  leftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  indicatorOnline: { backgroundColor: '#10b981' },
  indicatorOffline: { backgroundColor: '#ef4444' },
  primaryText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  secondaryText: { fontSize: 9, color: '#64748b' },
  syncBtn: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center' },
  syncText: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6', marginLeft: 4 },
  offlineContainer: { flexDirection: 'row', alignItems: 'center' },
  offlineText: { fontSize: 10, fontWeight: 'bold', color: '#d97706', marginLeft: 4 }
});
