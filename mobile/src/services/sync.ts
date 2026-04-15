import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const QUEUE_KEY = 'opname_sync_queue';
const LAST_SYNC_KEY = 'last_sync_timestamp';

export interface SyncItem {
  id: string; // Unique ID for the queue item
  sessionId: number;
  productId: number;
  actualStock: number;
  unitValues?: string; // JSON string of unit-specific counts
  timestamp: number;
}

class SyncService {
  private isSyncing = false;

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncAll();
      }
    });
  }

  async addUpdate(sessionId: number, productId: number, actualStock: number, unitValues?: string) {
    const queue = await this.getQueue();
    
    // Check if there's already an update for this product in this session, replace it
    const existingIndex = queue.findIndex(item => item.sessionId === sessionId && item.productId === productId);
    
    const newItem: SyncItem = {
      id: Math.random().toString(36).substring(7),
      sessionId,
      productId,
      actualStock,
      unitValues,
      timestamp: Date.now(),
    };

    if (existingIndex > -1) {
      queue[existingIndex] = newItem;
    } else {
      queue.push(newItem);
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Try to sync immediately if online
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      this.syncAll();
    }
  }

  async getQueue(): Promise<SyncItem[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getLastSync(): Promise<number | null> {
    const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return data ? parseInt(data) : null;
  }

  async syncAll() {
    if (this.isSyncing) return;
    
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    console.log(`Starting sync for ${queue.length} items...`);

    const remainingItems: SyncItem[] = [...queue];
    const itemsToProcess = [...queue];

    for (const item of itemsToProcess) {
      try {
        await api.post(`/sessions/${item.sessionId}/records`, {
          productId: item.productId,
          actualStock: item.actualStock,
          unitValues: item.unitValues,
        });
        
        // Remove from remaining items on success
        const idx = remainingItems.findIndex(ri => ri.id === item.id);
        if (idx > -1) remainingItems.splice(idx, 1);
        
      } catch (err) {
        console.error(`Failed to sync item ${item.id}:`, err);
        // On error, keep it in the queue for next attempt
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingItems));
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    
    this.isSyncing = false;
    console.log(`Sync finished. ${remainingItems.length} items remaining.`);
  }
}

export const syncService = new SyncService();
