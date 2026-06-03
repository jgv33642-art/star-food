import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
  sku?: string;
}

let globalLowStockItems: LowStockProduct[] = [];
let listeners: Array<(items: LowStockProduct[]) => void> = [];

const setGlobalItems = (items: LowStockProduct[]) => {
  globalLowStockItems = items;
  listeners.forEach(listener => listener(items));
};

export const useLowStock = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<LowStockProduct[]>(globalLowStockItems);

  const fetchLowStock = useCallback(async () => {
    if (!user || user.role !== 'gerencia') return;
    try {
      const data = await api.get<LowStockProduct[]>('/reports/low-stock');
      setGlobalItems(data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  }, [user]);

  useEffect(() => {
    const handleUpdate = (newItems: LowStockProduct[]) => {
      setItems(newItems);
    };

    listeners.push(handleUpdate);

    if (listeners.length === 1 && user && user.role === 'gerencia') {
      fetchLowStock();
    }

    const interval = setInterval(() => {
      if (user && user.role === 'gerencia') {
        fetchLowStock();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      listeners = listeners.filter(l => l !== handleUpdate);
      clearInterval(interval);
    };
  }, [user, fetchLowStock]);

  return { items, refresh: fetchLowStock };
};
