import React, { createContext, useContext, useState, useEffect } from 'react';
import { printerService } from '../services/printerService';

interface PrinterContextType {
  isConnected: boolean;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  printPosReceipt: typeof printerService.printPosReceipt;
  printOrderToSectors: (order: any) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

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
        
        await fetch('http://localhost:3001/imprimir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          })
        });
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
