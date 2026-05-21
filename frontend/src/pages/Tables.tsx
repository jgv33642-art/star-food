import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Users, Clock, Receipt, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type TableStatus = 'livre' | 'ocupada' | 'fechando';

interface Table {
  id: string;
  number: number;
  status: TableStatus;
  capacity: number;
  timeOpen?: string;
  total?: number;
  waiter?: string;
}

const INITIAL_TABLES: Table[] = [
  { id: '1', number: 1, status: 'ocupada', capacity: 4, timeOpen: '45 min', total: 125.50, waiter: 'Carlos' },
  { id: '2', number: 2, status: 'livre', capacity: 2 },
  { id: '3', number: 3, status: 'fechando', capacity: 4, timeOpen: '1h 20m', total: 280.00, waiter: 'Ana' },
  { id: '4', number: 4, status: 'livre', capacity: 6 },
  { id: '5', number: 5, status: 'ocupada', capacity: 2, timeOpen: '15 min', total: 45.00, waiter: 'Carlos' },
  { id: '6', number: 6, status: 'livre', capacity: 4 },
  { id: '7', number: 7, status: 'ocupada', capacity: 8, timeOpen: '2h 10m', total: 450.90, waiter: 'Roberto' },
  { id: '8', number: 8, status: 'livre', capacity: 2 },
  { id: '9', number: 9, status: 'livre', capacity: 4 },
  { id: '10', number: 10, status: 'fechando', capacity: 2, timeOpen: '55 min', total: 95.00, waiter: 'Ana' },
];

export const Tables = () => {
  const [tables] = useState<Table[]>(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isCaixaOrAdmin = user?.role === 'caixa' || user?.role === 'gerencia';

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'livre': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
      case 'ocupada': return 'bg-red-500/10 border-red-500/30 text-red-500';
      case 'fechando': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
    }
  };

  const getStatusBgColor = (status: TableStatus) => {
    switch (status) {
      case 'livre': return 'bg-emerald-500';
      case 'ocupada': return 'bg-red-500';
      case 'fechando': return 'bg-amber-500';
    }
  };

  const handleLancarPedido = () => {
    navigate('/pedidos');
  };

  return (
    <Layout title="Gestão de Mesas">
      
      {/* Legend & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'map' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Planta
            </button>
          </div>
          
          <div className="hidden md:flex gap-4 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-slate-300">Livre</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-slate-300">Ocupada</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-sm font-medium text-slate-300">Fechando</span>
          </div>
        </div>
        
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          + Adicionar Mesa
        </button>
      </div>

      </div>

      {/* Main View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {tables.map(table => (
            <div 
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`relative bg-slate-900 border-2 rounded-3xl p-6 cursor-pointer transition-all hover:scale-105 ${getStatusColor(table.status).split(' ')[1]}`}
            >
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${getStatusBgColor(table.status)} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
              
              <div className="text-center mb-4">
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Mesa</span>
                <h3 className="text-5xl font-black text-white mt-1">{table.number}</h3>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>Capacidade</span>
                  </div>
                  <span className="font-medium text-white">{table.capacity}</span>
                </div>
                
                {table.status !== 'livre' && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Tempo</span>
                      </div>
                      <span className="font-medium text-white">{table.timeOpen}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Receipt className="w-4 h-4" />
                        <span>Total</span>
                      </div>
                      <span className={`font-bold ${getStatusColor(table.status).split(' ')[2]}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(table.total || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-full h-[600px] bg-slate-900/50 border border-slate-800 rounded-3xl p-8 overflow-hidden shadow-inner">
          <div className="absolute top-8 left-8 text-slate-500 font-black text-2xl uppercase tracking-[0.5em] opacity-10">Entrada</div>
          <div className="absolute top-8 right-8 text-slate-500 font-black text-2xl uppercase tracking-[0.5em] opacity-10">Caixa</div>
          <div className="absolute bottom-8 right-8 text-slate-500 font-black text-2xl uppercase tracking-[0.5em] opacity-10">Cozinha</div>
          
          <div className="grid grid-cols-5 gap-8 h-full">
            {tables.map(table => (
              <div 
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`relative group flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                  table.capacity > 4 ? 'col-span-2' : 'col-span-1'
                }`}
              >
                {/* Table shape */}
                <div className={`absolute w-full h-24 rounded-full border-4 flex items-center justify-center ${
                  table.status === 'livre' ? 'border-emerald-500/50 bg-emerald-500/10' :
                  table.status === 'ocupada' ? 'border-red-500/50 bg-red-500/10' :
                  'border-amber-500/50 bg-amber-500/10'
                }`}>
                  <span className={`text-2xl font-black ${
                    table.status === 'livre' ? 'text-emerald-500' :
                    table.status === 'ocupada' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>{table.number}</span>
                </div>
                {/* Chairs mock */}
                <div className="absolute top-0 -translate-y-full w-8 h-2 bg-slate-700 rounded-full mt-6"></div>
                <div className="absolute bottom-0 translate-y-full w-8 h-2 bg-slate-700 rounded-full mb-6"></div>
                {table.capacity >= 4 && (
                  <>
                    <div className="absolute left-0 -translate-x-full w-2 h-8 bg-slate-700 rounded-full ml-6"></div>
                    <div className="absolute right-0 translate-x-full w-2 h-8 bg-slate-700 rounded-full mr-6"></div>
                  </>
                )}
                
                {/* Status tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs px-3 py-1 rounded shadow-xl transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {table.status.toUpperCase()} {table.total ? `(R$ ${table.total.toFixed(2)})` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal - Table Details */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className={`p-6 border-b flex justify-between items-center ${
                selectedTable.status === 'livre' ? 'border-emerald-500/20 bg-emerald-500/5' :
                selectedTable.status === 'ocupada' ? 'border-red-500/20 bg-red-500/5' :
                'border-amber-500/20 bg-amber-500/5'
              }`}>
                <div>
                  <h3 className="text-2xl font-black text-white">Mesa {selectedTable.number}</h3>
                  <p className={`text-sm font-bold uppercase tracking-wider ${
                    selectedTable.status === 'livre' ? 'text-emerald-500' :
                    selectedTable.status === 'ocupada' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>
                    {selectedTable.status}
                  </p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors">
                  &times;
                </button>
              </div>

              <div className="p-8">
                {selectedTable.status === 'livre' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-slate-300 font-medium mb-8">Esta mesa está limpa e pronta para uso.</p>
                    <div className="flex flex-col gap-4">
                      <button onClick={handleLancarPedido} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                        Abrir Comanda
                      </button>
                      <button onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/cardapio/' + selectedTable.number)}`, '_blank')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-800/20 flex items-center justify-center gap-2">
                        Gerar QR Code (Cardápio)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Garçom Responsável</span>
                      <span className="text-white font-medium">{selectedTable.waiter}</span>
                    </div>
                    
                    <div className="flex gap-4">
                      <button onClick={handleLancarPedido} className="flex-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 font-bold py-3 rounded-xl transition-all">
                        Ver Pedido
                      </button>
                      <button onClick={handleLancarPedido} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">
                        Adicionar Item
                      </button>
                    </div>

                    {selectedTable.status === 'ocupada' && (
                      <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                        Pedir Fechamento de Conta
                      </button>
                    )}
                    {selectedTable.status === 'fechando' && isCaixaOrAdmin && (
                      <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                        Liberar Mesa (Pagamento Recebido)
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        const msg = `Olá! O seu pedido da mesa ${selectedTable.number} teve uma atualização!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }} 
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      Avisar Cliente no WhatsApp
                    </button>

                    {isCaixaOrAdmin && (
                      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-4 mt-6">
                        <button className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4" /> Cancelar Pedido
                        </button>
                        <button className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                          Transferir Mesa
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </Layout>
  );
};
