import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Users, Clock, Receipt, AlertCircle, Loader2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket';

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

interface ApiTable {
  id: string;
  number: number;
  status: string;
  capacity?: number;
  time_open?: string;
  total?: number;
  waiter?: string;
}

function mapApiTable(t: ApiTable): Table {
  let status: TableStatus = 'livre';
  const s = (t.status || '').toLowerCase();
  if (s === 'ocupada' || s === 'occupied') status = 'ocupada';
  else if (s === 'fechando' || s === 'closing') status = 'fechando';
  else status = 'livre';

  return {
    id: t.id,
    number: t.number,
    status,
    capacity: t.capacity ?? 4,
    timeOpen: t.time_open,
    total: t.total,
    waiter: t.waiter,
  };
}

export const Tables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingTable, setAddingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const isCaixaOrAdmin = user?.role === 'caixa' || user?.role === 'gerencia';

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<ApiTable[]>('/tables');
      const mapped = (Array.isArray(res) ? res : []).map(mapApiTable);
      setTables(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // WebSocket Integration
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('🔄 Socket event received: refreshing tables list');
      fetchTables();
    };

    socket.on('new_order', handleUpdate);
    socket.on('order_closed', handleUpdate);
    socket.on('order_status_changed', handleUpdate);

    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_closed', handleUpdate);
      socket.off('order_status_changed', handleUpdate);
    };
  }, [socket]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    setAddingTable(true);
    try {
      await api.post('/tables', { number: parseInt(newTableNumber, 10) });
      setShowAddModal(false);
      setNewTableNumber('');
      await fetchTables();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar mesa.');
    } finally {
      setAddingTable(false);
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: TableStatus) => {
    try {
      await api.put(`/tables/${tableId}`, { status: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      );
      setSelectedTable((prev) => prev && prev.id === tableId ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status da mesa.');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja remover esta mesa?')) return;
    try {
      await api.delete(`/tables/${tableId}`);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      setSelectedTable(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao remover mesa.');
    }
  };

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

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

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

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar Mesa
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-500">Carregando mesas...</p>
        </div>
      ) : (
        <>
          {/* Main View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {tables.map((table) => (
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 h-full">
                {tables.map((table) => (
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
        </>
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
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedTable.id, 'ocupada');
                          handleLancarPedido();
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Abrir Comanda
                      </button>
                      <button
                        onClick={() => setShowQrCode(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-800/20 flex items-center justify-center gap-2"
                      >
                        Gerar QR Code (Cardápio)
                      </button>
                      {isCaixaOrAdmin && (
                        <button
                          onClick={() => handleDeleteTable(selectedTable.id)}
                          className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 font-bold py-3 rounded-xl transition-all text-sm"
                        >
                          Remover Mesa
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Garçom Responsável</span>
                      <span className="text-white font-medium">{selectedTable.waiter || '—'}</span>
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
                      <button
                        onClick={() => handleUpdateStatus(selectedTable.id, 'fechando')}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                      >
                        Pedir Fechamento de Conta
                      </button>
                    )}
                    {selectedTable.status === 'fechando' && isCaixaOrAdmin && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTable.id, 'livre')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
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

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Adicionar Mesa</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddTable} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Número da Mesa</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="Ex: 11"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingTable}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {addingTable ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {addingTable ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrCode && selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center p-8 relative"
            >
              <button 
                onClick={() => setShowQrCode(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-black text-slate-900 mb-1">Mesa {selectedTable.number}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-wider">Escaneie para pedir</p>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG 
                  value={`${window.location.origin}/cardapio/${selectedTable.number}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button
                onClick={() => window.print()}
                className="mt-8 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Imprimir QR Code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};
