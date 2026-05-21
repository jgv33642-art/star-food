import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Minus, Search, Send, X, Trash2, ArrowLeft, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_ITEMS = [
  { id: 1, name: 'X-Burger Especial', price: 25.90, category: 'Lanches' },
  { id: 2, name: 'Porção de Fritas', price: 18.50, category: 'Porções' },
  { id: 3, name: 'Coca-Cola 2L', price: 12.00, category: 'Bebidas' },
  { id: 4, name: 'Suco Natural', price: 8.00, category: 'Bebidas' },
  { id: 5, name: 'Cerveja Artesanal', price: 15.00, category: 'Bebidas' },
  { id: 6, name: 'Pizza Calabresa', price: 45.00, category: 'Pizzas' },
];

const ACTIVE_TABLES = [
  { mesa: '12', comanda: '4501' },
  { mesa: '04', comanda: '4502' },
  { mesa: '08', comanda: '4503' },
  { mesa: '15', comanda: '4504' },
];

interface OrderItem {
  item: typeof MENU_ITEMS[0];
  quantity: number;
}

export const WaiterDashboard = () => {
  const [activeContext, setActiveContext] = useState<{ mesa: string, comanda: string } | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  
  const [newTable, setNewTable] = useState('');
  const [newComanda, setNewComanda] = useState('');
  
  const [order, setOrder] = useState<OrderItem[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const kitchenItems = order.filter(o => o.item.category !== 'Bebidas');
  const barItems = order.filter(o => o.item.category === 'Bebidas');

  const filteredMenu = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const addItem = (item: typeof MENU_ITEMS[0]) => {
    setOrder(prev => {
      const existing = prev.find(o => o.item.id === item.id);
      if (existing) {
        return prev.map(o => o.item.id === item.id ? { ...o, quantity: o.quantity + 1 } : o);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setOrder(prev => prev.map(o => {
      if (o.item.id === id) {
        const next = o.quantity + delta;
        return next > 0 ? { ...o, quantity: next } : o;
      }
      return o;
    }));
  };

  const removeItem = (id: number) => {
    setOrder(prev => prev.filter(o => o.item.id !== id));
  };

  const total = order.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);

  const handleOpenComanda = (mesa: string, comanda: string) => {
    if (!mesa || !comanda) return;
    setActiveContext({ mesa, comanda });
    setOrder([]); // mock: load existing items here in a real app
  };

  const handleOpenPrintModal = () => {
    if (order.length === 0) return;
    setIsPrintModalOpen(true);
  };

  const confirmAndPrint = () => {
    setIsPrinting(true);
    // Simula o tempo de impressão na cozinha e no bar
    setTimeout(() => {
      setOrder([]);
      setActiveContext(null);
      setNewTable('');
      setNewComanda('');
      setTableSearch('');
      setIsPrintModalOpen(false);
      setIsPrinting(false);
    }, 1500);
  };

  return (
    <Layout title="Lançamento Rápido">
      <div className="max-w-2xl mx-auto pb-24">
        
        {!activeContext ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Procurar Comanda Aberta</h3>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Mesa ou comanda... (ex: 12)" 
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-lg"
                />
              </div>

              {tableSearch && (
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVE_TABLES.filter(t => t.mesa.includes(tableSearch) || t.comanda.includes(tableSearch)).map(t => (
                    <button 
                      key={t.comanda} 
                      onClick={() => handleOpenComanda(t.mesa, t.comanda)}
                      className="p-4 rounded-2xl border border-slate-700 bg-slate-950 hover:border-amber-500 hover:bg-amber-500/10 transition-all text-left"
                    >
                      <p className="text-white font-bold text-lg">Mesa {t.mesa}</p>
                      <p className="text-slate-400 text-sm">Cmd: {t.comanda}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">OU ABRIR NOVA</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Número da Mesa</label>
                <input 
                  type="number" 
                  value={newTable}
                  onChange={e => setNewTable(e.target.value)}
                  placeholder="Ex: 22"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-lg rounded-2xl px-4 py-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Número da Comanda</label>
                <input 
                  type="text" 
                  value={newComanda}
                  onChange={e => setNewComanda(e.target.value)}
                  placeholder="Ex: 5001"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-lg rounded-2xl px-4 py-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => handleOpenComanda(newTable, newComanda)}
                disabled={!newTable || !newComanda}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-2xl py-4 transition-all"
              >
                Abrir Nova Comanda
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header da Comanda */}
            <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-2xl font-black text-white">Mesa {activeContext.mesa}</h3>
                <p className="text-amber-500 font-bold text-sm">Comanda #{activeContext.comanda}</p>
              </div>
              <button onClick={() => setActiveContext(null)} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Area de Pedidos */}
            <div className="p-6">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="w-full bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 hover:bg-indigo-500/20 hover:border-indigo-500 text-indigo-400 font-bold rounded-2xl py-6 flex flex-col items-center justify-center gap-2 transition-all mb-8"
              >
                <Plus className="w-8 h-8" />
                <span>Adicionar Produto</span>
              </button>

              <div className="space-y-4 mb-6">
                {order.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">Nenhum item adicionado ainda.</p>
                ) : (
                  order.map(o => (
                    <div key={o.item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 gap-4">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{o.item.name}</h4>
                        <p className="text-amber-500 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.item.price * o.quantity)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1 border border-slate-700">
                          <button onClick={() => updateQuantity(o.item.id, -1)} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold text-white w-6 text-center">{o.quantity}</span>
                          <button onClick={() => updateQuantity(o.item.id, 1)} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"><Plus className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => removeItem(o.item.id)} className="p-3 text-slate-500 hover:text-red-400 bg-slate-900 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Fixo */}
            {order.length > 0 && (
              <div className="bg-slate-950 p-6 border-t border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400">Total a Enviar</span>
                  <span className="text-3xl font-black text-amber-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                </div>
                <button 
                  onClick={handleOpenPrintModal}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl py-4 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-6 h-6" /> Lançar Pedido
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* MODAL CARDÁPIO */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950 sm:p-6 lg:p-12 lg:bg-slate-950/80 lg:backdrop-blur-sm"
          >
            <div className="flex-1 bg-slate-900 sm:rounded-3xl border-slate-800 sm:border flex flex-col overflow-hidden max-w-2xl mx-auto w-full shadow-2xl">
              
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Buscar produto por nome..." 
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg"
                  />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {filteredMenu.map(item => {
                  const qty = order.find(o => o.item.id === item.id)?.quantity || 0;
                  return (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-2xl transition-all">
                      <div>
                        <h4 className="text-white font-bold text-lg">{item.name}</h4>
                        <p className="text-amber-500 font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                      </div>
                      
                      {qty > 0 ? (
                        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors"><Minus className="w-5 h-5" /></button>
                          <span className="font-bold text-indigo-400 w-6 text-center">{qty}</span>
                          <button onClick={() => addItem(item)} className="p-2 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addItem(item)}
                          className="bg-slate-800 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {order.length > 0 && (
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-lg rounded-2xl py-4 transition-all"
                  >
                    Ver Pedido ({order.reduce((acc, curr) => acc + curr.quantity, 0)} itens)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE IMPRESSÃO (SEPARAÇÃO COZINHA/BAR) */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Confirmar Impressão</h3>
                  <p className="text-slate-400 text-sm">Mesa {activeContext?.mesa} • Comanda #{activeContext?.comanda}</p>
                </div>
                <button onClick={() => !isPrinting && setIsPrintModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TICKET COZINHA */}
                <div className="bg-amber-50 rounded-lg p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDgsMCA0LDgiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4=')] bg-repeat-x"></div>
                  <div className="text-center border-b border-dashed border-slate-400 pb-3 pt-2 mb-3">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-lg">Cozinha</h4>
                    <p className="text-xs text-slate-600 font-mono">MESA {activeContext?.mesa}</p>
                  </div>
                  <ul className="space-y-2 font-mono text-sm text-slate-800 min-h-[150px]">
                    {kitchenItems.length === 0 ? (
                      <li className="text-center text-slate-400 py-4 italic">Nenhum item</li>
                    ) : (
                      kitchenItems.map(o => (
                        <li key={o.item.id} className="flex justify-between border-b border-slate-200/50 pb-1">
                          <span>{o.quantity}x {o.item.name}</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="absolute bottom-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCw4IDgsOCA0LDAiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4=')] bg-repeat-x"></div>
                </div>

                {/* TICKET BAR */}
                <div className="bg-sky-50 rounded-lg p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDgsMCA0LDgiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4=')] bg-repeat-x"></div>
                  <div className="text-center border-b border-dashed border-slate-400 pb-3 pt-2 mb-3">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-lg">Bar</h4>
                    <p className="text-xs text-slate-600 font-mono">MESA {activeContext?.mesa}</p>
                  </div>
                  <ul className="space-y-2 font-mono text-sm text-slate-800 min-h-[150px]">
                    {barItems.length === 0 ? (
                      <li className="text-center text-slate-400 py-4 italic">Nenhum item</li>
                    ) : (
                      barItems.map(o => (
                        <li key={o.item.id} className="flex justify-between border-b border-slate-200/50 pb-1">
                          <span>{o.quantity}x {o.item.name}</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="absolute bottom-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCw4IDgsOCA0LDAiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4=')] bg-repeat-x"></div>
                </div>

              </div>

              <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-4">
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  disabled={isPrinting}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium py-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAndPrint}
                  disabled={isPrinting}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-80 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isPrinting ? (
                    <>Imprimindo...</>
                  ) : (
                    <><Printer className="w-5 h-5" /> Imprimir e Lançar</>
                  )}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};
