import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ShoppingBag, CheckCircle, XCircle, Clock, Bike, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { DispatchModal } from '../components/DispatchModal';

type OrderStatus = 'pendente' | 'preparando' | 'saiu' | 'entregue' | 'cancelado';

interface DeliveryOrder {
  id: string;
  customer: string;
  phone: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: OrderStatus;
  time: string;
  address: string;
}

export const Delivery = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(true);

  // Dispatch Modal state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<{ id: string; customer: string } | null>(null);

  // Map database status to frontend delivery status
  const mapDbStatusToDelivery = (dbStatus: string): OrderStatus => {
    const s = dbStatus.toLowerCase();
    if (s === 'open') return 'pendente';
    if (s === 'preparando' || s === 'saiu' || s === 'entregue' || s === 'cancelado') {
      return s as OrderStatus;
    }
    return 'pendente';
  };

  const fetchDeliveryOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const allOrders = await api.get<any[]>('/orders');
      
      // Filter out orders that have a table (we only want delivery/balcão orders)
      const deliveryOnly = allOrders.filter(o => !o.table_id);
      
      const mapped: DeliveryOrder[] = deliveryOnly.map(o => {
        const total = (o.items || []).reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
        
        // Formulate a relative timestamp
        const timeDiff = Date.now() - new Date(o.opened_at).getTime();
        const mins = Math.floor(timeDiff / 60000);
        const timeStr = mins < 1 ? 'Agora mesmo' : `Há ${mins} min`;

        return {
          id: o.id,
          customer: o.customer_name || 'Cliente da Loja Virtual',
          phone: o.customer_phone || '',
          items: (o.items || []).map((it: any) => ({
            name: it.product_name,
            quantity: Number(it.quantity)
          })),
          total,
          status: mapDbStatusToDelivery(o.status),
          time: timeStr,
          address: o.delivery_address || 'Retirada no Balcão'
        };
      });

      setOrders(mapped);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar pedidos delivery: ' + (err.message || 'Erro de conexão'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial Load and Polling (Updates the delivery page silently every 5s)
  useEffect(() => {
    fetchDeliveryOrders(true);

    let interval: ReturnType<typeof setInterval>;
    if (isReceiving) {
      interval = setInterval(() => {
        fetchDeliveryOrders(false);
      }, 5000); // 5 seconds polling
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isReceiving]);

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      // Update local state directly for fast visual response
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert('Erro ao atualizar status do pedido: ' + (err.message || 'Erro de conexão'));
    }
  };

  const handleDispatch = async (orderId: string, courierId: string | null, fee: number) => {
    try {
      if (courierId || fee > 0) {
        await api.put(`/orders/${orderId}/courier`, { courierId, deliveryFee: fee });
      }
      await updateStatus(orderId, 'saiu');
    } catch (error) {
      alert('Erro ao despachar pedido');
      throw error;
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pendente').length;

  return (
    <Layout title="Integração Delivery & Loja Virtual">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
            <ShoppingBag className="w-5 h-5" /> Loja Virtual Integrada
          </div>
          <button 
            onClick={() => setIsReceiving(!isReceiving)}
            className={`px-4 py-2 rounded-xl font-medium border transition-all ${
              isReceiving ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isReceiving ? 'Pausar Atualização Automática' : 'Retomar Atualização Automática'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="text-sm font-bold font-mono">Buscando pedidos delivery...</span>
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Coluna: Pendentes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pendentes
              </h3>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {pendingCount} novo(s)
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              <AnimatePresence>
                {orders.filter(o => o.status === 'pendente').map(order => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-amber-500 font-mono text-xs">#{order.id.slice(0, 4)}</span>
                      <span className="text-xs text-amber-500/70">{order.time}</span>
                    </div>
                    <p className="font-bold text-white text-lg mb-1">{order.customer}</p>
                    {order.phone && <p className="text-xs text-slate-500 font-mono mb-2">{order.phone}</p>}
                    <ul className="text-sm text-slate-400 mb-4 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.quantity}x {item.name}</li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center border-t border-amber-500/20 pt-3">
                      <span className="font-black text-amber-400">R$ {order.total.toFixed(2)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(order.id, 'cancelado')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-950 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => updateStatus(order.id, 'preparando')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-bold">
                          <CheckCircle className="w-4 h-4" /> Aceitar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Coluna: Preparando */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" /> Na Cozinha
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              <AnimatePresence>
                {orders.filter(o => o.status === 'preparando').map(order => (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-950 border border-indigo-500/30 p-4 rounded-2xl relative"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-300 font-mono text-xs">#{order.id.slice(0, 4)}</span>
                    </div>
                    <p className="font-bold text-white mb-2">{order.customer}</p>
                    <button onClick={() => {
                        setSelectedOrderToDispatch({ id: order.id, customer: order.customer });
                        setDispatchModalOpen(true);
                      }} className="w-full mt-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                      <Bike className="w-4 h-4" /> Despachar
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Coluna: Saiu para Entrega */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-500" /> Em Rota
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              <AnimatePresence>
                {orders.filter(o => o.status === 'saiu').map(order => (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-950 border border-emerald-500/30 p-4 rounded-2xl relative opacity-70"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-400 font-mono text-xs">#{order.id.slice(0, 4)}</span>
                    </div>
                    <p className="font-medium text-white text-sm mb-1">{order.customer}</p>
                    <p className="text-xs text-slate-500 mb-3">{order.address}</p>
                    <button onClick={() => updateStatus(order.id, 'entregue')} className="w-full py-1.5 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                      Marcar Entregue
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      )}

      {selectedOrderToDispatch && (
        <DispatchModal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          orderId={selectedOrderToDispatch.id}
          customerName={selectedOrderToDispatch.customer}
          onDispatch={handleDispatch}
        />
      )}
    </Layout>
  );
};
