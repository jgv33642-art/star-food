import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bike, Loader2, DollarSign } from 'lucide-react';
import { api } from '../lib/api';

interface Courier {
  id: string;
  name: string;
  active: boolean;
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  onDispatch: (orderId: string, courierId: string | null, fee: number) => Promise<void>;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, onClose, orderId, customerName, onDispatch }) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  
  const [selectedCourier, setSelectedCourier] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCouriers();
    }
  }, [isOpen]);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await api.get<Courier[]>('/couriers');
      setCouriers(Array.isArray(res) ? res.filter(c => c.active) : []);
    } catch (error) {
      console.error('Erro ao buscar motoboys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    try {
      await onDispatch(orderId, selectedCourier || null, parseFloat(deliveryFee || '0'));
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bike className="w-5 h-5 text-indigo-500" /> Despachar Pedido
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{customerName}</p>
              </div>
              <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motoboy (Opcional)</label>
                    <select
                      value={selectedCourier}
                      onChange={(e) => setSelectedCourier(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="">Nenhum (Delivery Próprio/Outros)</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>{courier.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Taxa de Entrega a Repassar (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="Ex: 5.00"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3 pl-12 pr-4 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-3 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={dispatching}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                    >
                      {dispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bike className="w-5 h-5" />}
                      Despachar
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
