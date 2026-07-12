import React, { createContext, useContext, useState, useEffect } from 'react';
import { printerService } from '../services/printerService';

interface PrinterContextType {
  isConnected: boolean;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  printPosReceipt: typeof printerService.printPosReceipt;
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

  return (
    <PrinterContext.Provider value={{
      isConnected,
      isSupported,
      connect,
      disconnect,
      printPosReceipt
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
