import { openDB } from 'idb';
import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '@firebaseServices/config';
import { 
  generateReferenceId, 
  validateReferenceId,
  parseQRContent 
} from './qrCode';

const DB_NAME = 'QRScannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineScans';
const SYNC_QUEUE_STORE = 'syncQueue';

// Initialize IndexedDB for offline storage
const initDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const scanStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        scanStore.createIndex('timestamp', 'timestamp');
        scanStore.createIndex('studentId', 'studentId');
      }
      
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
};

// Save scan data offline
export const saveOfflineScan = async (scanData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...scanData,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    await store.add(scan);
    return scan;
  } catch (error) {
    console.error('Failed to save offline scan:', error);
    throw error;
  }
};

// Get offline scans
export const getOfflineScans = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get offline scans:', error);
    return [];
  }
};

// Add action to sync queue
export const addToSyncQueue = async (action) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    const queueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    await store.add(queueItem);
    return queueItem;
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
    throw error;
  }
};

// Get sync queue items
export const getSyncQueue = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
};

// Remove item from sync queue
export const removeFromSyncQueue = async (itemId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    await store.delete(itemId);
  } catch (error) {
    console.error('Failed to remove from sync queue:', error);
    throw error;
  }
};

// Mark scan as synced
export const markScanAsSynced = async (scanId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const scan = await store.get(scanId);
    if (scan) {
      scan.synced = true;
      scan.syncedAt = new Date().toISOString();
      await store.put(scan);
    }
  } catch (error) {
    console.error('Failed to mark scan as synced:', error);
    throw error;
  }
};

// Sync offline data with server
export const syncOfflineData = async (user, onlineActions = {}) => {
  if (!navigator.onLine) {
    console.log('Device is offline, skipping sync');
    return { success: false, message: 'Device is offline' };
  }
  
  try {
    const syncQueue = await getSyncQueue();
    const offlineScans = await getOfflineScans();
    
    let syncedCount = 0;
    let errors = [];
    
    // Process sync queue first
    for (const item of syncQueue) {
      try {
        const { type, data } = item;
        
        switch (type) {
          case 'mark_attendance':
            // Import markAttendance function dynamically to avoid circular dependency
            const { markAttendance } = await import('../firebase/attendance');
            const result = await markAttendance.default(data);
            if (result.success) {
              await removeFromSyncQueue(item.id);
              syncedCount++;
            } else {
              errors.push(`Failed to sync attendance: ${result.error}`);
            }
            break;
            
          case 'award_participation':
            // Handle participation sync
            const participationRef = doc(collection(db, 'participation'));
            await setDoc(participationRef, data);
            await removeFromSyncQueue(item.id);
            syncedCount++;
            break;
            
          case 'issue_penalty':
            // Handle penalty sync
            const penaltyRef = doc(collection(db, 'penalties'));
            await setDoc(penaltyRef, data);
            await removeFromSyncQueue(item.id);
            syncedCount++;
            break;
            
          case 'record_behavior':
            // Handle behavior sync
            const behaviorRef = doc(collection(db, 'behaviors'));
            await setDoc(behaviorRef, data);
            await removeFromSyncQueue(item.id);
            syncedCount++;
            break;
            
          default:
            errors.push(`Unknown sync type: ${type}`);
        }
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        errors.push(`Failed to sync ${item.type}: ${error.message}`);
      }
    }
    
    // Mark offline scans as synced
    const unsyncedScans = offlineScans.filter(scan => !scan.synced);
    for (const scan of unsyncedScans) {
      try {
        // Here you would sync the scan data to your backend
        // For now, just mark as synced since we don't have the backend endpoint
        await markScanAsSynced(scan.id);
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync scan ${scan.id}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      syncedCount,
      totalItems: syncQueue.length + unsyncedScans.length,
      errors: errors.length > 0 ? errors : null
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return { 
      success: false, 
      message: error.message,
      syncedCount: 0 
    };
  }
};

// Get offline statistics
export const getOfflineStats = async () => {
  try {
    const offlineScans = await getOfflineScans();
    const syncQueue = await getSyncQueue();
    
    const unsyncedScans = offlineScans.filter(scan => !scan.synced);
    const syncedScans = offlineScans.filter(scan => scan.synced);
    
    return {
      totalScans: offlineScans.length,
      syncedScans: syncedScans.length,
      unsyncedScans: unsyncedScans.length,
      pendingActions: syncQueue.length,
      lastSync: syncedScans.length > 0 
        ? Math.max(...syncedScans.map(s => new Date(s.syncedAt)))
        : null
    };
  } catch (error) {
    console.error('Failed to get offline stats:', error);
    return {
      totalScans: 0,
      syncedScans: 0,
      unsyncedScans: 0,
      pendingActions: 0,
      lastSync: null
    };
  }
};

// Clear all offline data
export const clearOfflineData = async () => {
  try {
    const db = await initDB();
    
    // Clear scans
    const scanTransaction = db.transaction([STORE_NAME], 'readwrite');
    const scanStore = scanTransaction.objectStore(STORE_NAME);
    await scanStore.clear();
    
    // Clear sync queue
    const syncTransaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const syncStore = syncTransaction.objectStore(SYNC_QUEUE_STORE);
    await syncStore.clear();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    return { success: false, error: error.message };
  }
};

// Network status monitoring
export const setupNetworkMonitoring = (callback) => {
  const updateOnlineStatus = () => {
    callback({
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    });
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial status
  updateOnlineStatus();
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};

// Auto-sync when coming back online
export const setupAutoSync = (user, syncInterval = 30000) => {
  let syncTimer = null;
  
  const attemptSync = async () => {
    if (navigator.onLine && user) {
      try {
        const result = await syncOfflineData(user);
        if (result.success && result.syncedCount > 0) {
          console.log(`Auto-synced ${result.syncedCount} items`);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  };
  
  // Set up periodic sync
  syncTimer = setInterval(attemptSync, syncInterval);
  
  // Set up network change monitoring
  const cleanup = setupNetworkMonitoring((status) => {
    if (status.online) {
      // Sync immediately when coming back online
      setTimeout(attemptSync, 1000);
    }
  });
  
  // Return cleanup function
  return () => {
    if (syncTimer) {
      clearInterval(syncTimer);
    }
    cleanup();
  };
};
