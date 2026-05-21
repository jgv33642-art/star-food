import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ShoppingBag, CheckCircle, XCircle, Clock, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type OrderStatus = 'pendente' | 'preparando' | 'saiu' | 'entregue' | 'cancelado';

interface IFoodOrder {
  id: string;
  customer: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: OrderStatus;
  time: string;
  address: string;
}

const MOCK_ORDERS: IFoodOrder[] = [
  {
    id: 'IF-7489',
    customer: 'Nessa Freitas',
    items: [{ name: 'X-Burger Especial', quantity: 2 }, { name: 'Coca-Cola 2L', quantity: 1 }],
    total: 63.80,
    status: 'preparando',
    time: 'Há 12 min',
    address: 'Rua das Flores, 123'
  },
  {
    id: 'IF-7490',
    customer: 'João Silva',
    items: [{ name: 'Pizza Calabresa', quantity: 1 }],
    total: 45.00,
    status: 'saiu',
    time: 'Há 35 min',
    address: 'Av. Paulista, 1000'
  }
];

export const Delivery = () => {
  const [orders, setOrders] = useState<IFoodOrder[]>(MOCK_ORDERS);
  const [isReceiving, setIsReceiving] = useState(true);

  // Simula chegada de um novo pedido do iFood
  useEffect(() => {
    if (!isReceiving) return;
    const timer = setInterval(() => {
      const newOrder: IFoodOrder = {
        id: `IF-${Math.floor(Math.random() * 10000)}`,
        customer: 'Cliente Novo (iFood)',
        items: [{ name: 'Porção de Fritas', quantity: 1 }, { name: 'Cerveja', quantity: 2 }],
        total: 48.50,
        status: 'pendente',
        time: 'Agora mesmo',
        address: 'Integração Automática'
      };
      setOrders(prev => [newOrder, ...prev]);
      
      // Toca um som (simulado visualmente no alerta, mas aqui apenas atualiza estado)
    }, 15000); // 15 segundos para fins de demonstração
    return () => clearInterval(timer);
  }, [isReceiving]);

  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const pendingCount = orders.filter(o => o.status === 'pendente').length;

  return (
    <Layout title="Integração Delivery & iFood">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
            <ShoppingBag className="w-5 h-5" /> iFood Conectado
          </div>
          <button 
            onClick={() => setIsReceiving(!isReceiving)}
            className={`px-4 py-2 rounded-xl font-medium border transition-colors ${
              isReceiving ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isReceiving ? 'Pausar Recebimento' : 'Retomar Recebimento'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
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
                    <span className="font-bold text-amber-500">{order.id}</span>
                    <span className="text-xs text-amber-500/70">{order.time}</span>
                  </div>
                  <p className="font-bold text-white text-lg mb-1">{order.customer}</p>
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
                    <span className="font-bold text-slate-300">{order.id}</span>
                  </div>
                  <p className="font-bold text-white mb-2">{order.customer}</p>
                  <button onClick={() => updateStatus(order.id, 'saiu')} className="w-full mt-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
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
                    <span className="font-bold text-slate-400">{order.id}</span>
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
    </Layout>
  );
};
