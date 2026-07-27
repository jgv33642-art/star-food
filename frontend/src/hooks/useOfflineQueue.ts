import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DB_NAME = 'star-food-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      },
    });
  }
  return dbPromise;
}

export interface OfflineAction {
  id?: number;
  type: 'create_order' | 'add_items';
  payload: any;
  timestamp: number;
}

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { user } = useAuth();
  
  const isPro = user?.plan === 'pro' || user?.plan === 'premium' || user?.plan === 'annual';

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update queue count
  const updateQueueLength = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count('queue');
      setQueueLength(count);
    } catch (err) {
      console.error('Error counting offline queue:', err);
    }
  }, []);

  useEffect(() => {
    updateQueueLength();
  }, [updateQueueLength]);

  // Cache functions
  const setCache = async (key: string, data: any) => {
    try {
      const db = await getDB();
      await db.put('cache', data, key);
    } catch (err) {
      console.error(`Error caching ${key}:`, err);
    }
  };

  const getCache = async <T>(key: string): Promise<T | null> => {
    try {
      const db = await getDB();
      return (await db.get('cache', key)) || null;
    } catch (err) {
      console.error(`Error reading cached ${key}:`, err);
      return null;
    }
  };

  const syncCacheDown = useCallback(async (companyId: string) => {
    if (!isOnline || !isPro) return;
    try {
      const [categories, products, tables] = await Promise.all([
        api.get(`/categories?company_id=${companyId}`),
        api.get(`/products?company_id=${companyId}`),
        api.get(`/tables?company_id=${companyId}`)
      ]);
      await setCache('categories', categories);
      await setCache('products', products);
      await setCache('tables', tables);
      console.log('[OFFLINE] Menu and Tables cached successfully for offline use.');
    } catch (e) {
      console.error('[OFFLINE] Failed to cache menu:', e);
    }
  }, [isOnline, isPro]);

  // Add action to offline queue
  const queueAction = async (type: OfflineAction['type'], payload: any) => {
    try {
      const db = await getDB();
      await db.add('queue', {
        type,
        payload,
        timestamp: Date.now(),
      });
      await updateQueueLength();
    } catch (err) {
      console.error('Error queueing offline action:', err);
    }
  };

  // Sync offline queue to backend
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      const db = await getDB();
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const actions: OfflineAction[] = await store.getAll();

      if (actions.length === 0) {
        tx.commit();
        return;
      }

      setIsSyncing(true);
      console.log(`[OFFLINE] Syncing ${actions.length} offline actions...`);

      // Maps temporary/table order mapping to track created order UUIDs
      const localToRemoteOrderIds: Record<string, string> = {};

      for (const action of actions) {
        try {
          if (action.type === 'create_order') {
            const { tempOrderId, tableId, waiterId, tableNumber } = action.payload;

            // 1. Create order
            const remoteOrder: any = await api.post('/orders', {
              tableId,
              waiterId,
            });

            // 2. Set table busy
            await api.put(`/tables/${tableId}`, {
              status: 'busy',
              number: tableNumber,
            });

            localToRemoteOrderIds[tempOrderId] = remoteOrder.id;
          } else if (action.type === 'add_items') {
            const { orderId, items } = action.payload;

            // Resolve order ID (could be remote UUID or mapped from tempOrderId)
            const actualOrderId = localToRemoteOrderIds[orderId] || orderId;

            for (const item of items) {
              await api.post(`/orders/${actualOrderId}/items`, {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || '',
              });
            }
          }

          // Delete completed action from store
          if (action.id !== undefined) {
            await store.delete(action.id);
          }
        } catch (itemErr: any) {
          console.error(`[OFFLINE] Error syncing action ${action.id}:`, itemErr);
          // Keep in queue or break loop to retry later
          break;
        }
      }

      await tx.done;
      await updateQueueLength();
    } catch (err) {
      console.error('[OFFLINE] Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updateQueueLength]);

  // Auto sync when back online
  useEffect(() => {
    if (isOnline && queueLength > 0) {
      syncQueue();
    }
  }, [isOnline, queueLength, syncQueue]);

  return {
    isOnline,
    queueLength,
    isSyncing,
    queueAction,
    syncQueue,
    syncCacheDown,
    setCache,
    getCache,
  };
};
