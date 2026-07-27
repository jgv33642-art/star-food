import React, { createContext, useContext, useState, useEffect } from 'react';
import { printerService } from '../services/printerService';

export interface PrintJob {
  id: string;
  items: any[];
  ip: string;
  payload: any;
  timestamp: number;
}

interface PrinterContextType {
  isConnected: boolean;
  isSupported: boolean;
  printQueue: PrintJob[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  printPosReceipt: typeof printerService.printPosReceipt;
  printOrderToSectors: (order: any) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);

  // Load initial queue
  useEffect(() => {
    const saved = localStorage.getItem('starfood_print_queue');
    if (saved) {
      try {
        setPrintQueue(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save queue whenever it changes
  useEffect(() => {
    localStorage.setItem('starfood_print_queue', JSON.stringify(printQueue));
  }, [printQueue]);

  // Retry loop for failed print jobs
  useEffect(() => {
    const retryJobs = async () => {
      if (printQueue.length === 0) return;
      
      console.log(`Tentando reenviar ${printQueue.length} trabalhos de impressão pendentes...`);
      const newQueue = [...printQueue];
      
      for (let i = newQueue.length - 1; i >= 0; i--) {
        const job = newQueue[i];
        try {
          const res = await fetch('http://localhost:3001/imprimir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job.payload)
          });
          if (res.ok) {
            console.log(`Print job ${job.id} enviado com sucesso no retry!`);
            newQueue.splice(i, 1);
          }
        } catch (err) {
          // Still failed, leave in queue
        }
      }
      
      if (newQueue.length !== printQueue.length) {
        setPrintQueue(newQueue);
      }
    };

    const interval = setInterval(retryJobs, 10000);
    return () => clearInterval(interval);
  }, [printQueue]);

  useEffect(() => {
    if (!('serial' in navigator)) {
      setIsSupported(false);
    }
  }, []);

  const connect = async () => {
    const success = await printerService.connect();
    setIsConnected(success);
  };

  const disconnect = async () => {
    await printerService.disconnect();
    setIsConnected(false);
  };

  const printPosReceipt = async (...args: Parameters<typeof printerService.printPosReceipt>) => {
    if (!isConnected) {
      alert("Impressora não está conectada!");
      return;
    }
    await printerService.printPosReceipt(...args);
  };

  const printOrderToSectors = async (order: any) => {
    try {
      const configStr = localStorage.getItem('starfood_printer_config');
      if (!configStr) return; // No config, so auto-print is disabled on this machine
      const config = JSON.parse(configStr);
      
      const kitchenItems = order.items.filter((i: any) => i.printer_sector === 'kitchen');
      const barItems = order.items.filter((i: any) => i.printer_sector === 'bar');

      const sendToPrinter = async (items: any[], ip: string) => {
        if (!items.length || !ip) return;
        
        const payload = {
          estabelecimento: "STAR FOOD",
          mesa: order.table_number || order.table_id || "Avulsa",
          comanda: order.id.slice(0, 4),
          garcom: order.waiter_id ? "Garçom" : "Caixa",
          data_hora: new Date(order.opened_at).toLocaleString('pt-BR'),
          items: items.map((i: any) => ({
            qty: i.quantity,
            name: i.product_name,
            price: i.price,
            obs: i.notes || ''
          })),
          total: items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0),
          printer_type: config.printerType || 'network',
          printer_address: ip,
          usb_vendor_id: config.usbVendorId,
          usb_product_id: config.usbProductId
        };

        try {
          const res = await fetch('http://localhost:3001/imprimir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Servidor retornou erro');
        } catch (error) {
          console.error(`Falha ao imprimir. Adicionando à fila (IP: ${ip})...`, error);
          setPrintQueue(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            items,
            ip,
            payload,
            timestamp: Date.now()
          }]);
        }
      };

      // Print to Kitchen
      if (kitchenItems.length > 0 && config.printerKitchenIP) {
        await sendToPrinter(kitchenItems, config.printerKitchenIP);
      }

      // Print to Bar
      if (barItems.length > 0 && config.printerBarIP) {
        await sendToPrinter(barItems, config.printerBarIP);
      }

    } catch (err) {
      console.error('Erro ao imprimir nos setores:', err);
    }
  };

  return (
    <PrinterContext.Provider value={{
      isConnected,
      isSupported,
      printQueue,
      connect,
      disconnect,
      printPosReceipt,
      printOrderToSectors
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};
