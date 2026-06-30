import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Minus, Search, Send, X, Trash2, ArrowLeft, Printer, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useSocket } from '../hooks/useSocket';
import { useStoreConfig } from '../hooks/useStoreConfig';
import { SelectComplementsModal } from '../components/SelectComplementsModal';

const getEmoji = (productName: string, categoryName: string) => {
  const name = productName.toLowerCase();
  const cat = categoryName.toLowerCase();
  if (name.includes('burg') || name.includes('bacon') || name.includes('sandu') || cat.includes('lanche')) return '🍔';
  if (name.includes('pizz') || cat.includes('pizza')) return '🍕';
  if (name.includes('frita') || name.includes('batata') || name.includes('porc')) return '🍟';
  if (name.includes('coca') || name.includes('suco') || name.includes('refrigerante') || name.includes('agua') || name.includes('refri') || cat.includes('bebida') || cat.includes('suco')) return '🥤';
  if (name.includes('pudim') || name.includes('bolo') || name.includes('sorvete') || name.includes('doce') || cat.includes('sobremesa') || cat.includes('doce')) return '🍮';
  return '🍽️';
};

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name?: string;
}

interface Table {
  id: string;
  number: number;
  status: 'free' | 'busy' | 'closing';
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  notes: string | null;
}

interface Order {
  id: string;
  table_id: string | null;
  table_number: number | null;
  status: string;
  items: OrderItem[];
}

export const WaiterDashboard = () => {
  const { user } = useAuth();
  const { queueAction, setCache, getCache } = useOfflineQueue();
  const socket = useSocket();
  const { label, labelPlural } = useStoreConfig();

  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Context (Selected table/order)
  const [activeContext, setActiveContext] = useState<{ table: Table, order: Order | null } | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [fastNumber, setFastNumber] = useState('');
  
  // Launch state (new items being added in this session)
  const [pendingItems, setPendingItems] = useState<{ 
    cartId: string, 
    product: Product, 
    quantity: number, 
    price: number,
    complements?: any[] 
  }[]>([]);
  const [productForComplements, setProductForComplements] = useState<Product | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [categories, setCategories] = useState<string[]>(['Todos', 'Bebidas', 'Drinks', 'Porções', 'Lanches', 'Combos', 'Sobremesas', 'Adicionais']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Load all master data and open orders
  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      let tablesData: Table[] = [];
      let productsData: any[] = [];
      let ordersData: Order[] = [];
      let categoriesData: any[] = [];

      if (navigator.onLine) {
        [tablesData, productsData, ordersData, categoriesData] = await Promise.all([
          api.get<Table[]>('/tables'),
          api.get<any[]>('/products'),
          api.get<Order[]>('/orders'),
          api.get<any[]>('/categories')
        ]);

        await setCache('tables', tablesData);
        await setCache('products', productsData);
        await setCache('orders', ordersData);
        await setCache('categories', categoriesData);
      } else {
        tablesData = await getCache<Table[]>('tables') || [];
        productsData = await getCache<any[]>('products') || [];
        ordersData = await getCache<Order[]>('orders') || [];
        categoriesData = await getCache<any[]>('categories') || [];
      }

      setTables(Array.isArray(tablesData) ? tablesData : []);
      
      const catsList = Array.isArray(categoriesData) ? categoriesData : [];
      const catMap: Record<string, string> = {};
      catsList.forEach((c: any) => {
        catMap[c.id] = c.name;
      });

      const defaultCats = ["Bebidas", "Drinks", "Porções", "Lanches", "Combos", "Sobremesas", "Adicionais"];
      const fetchedCats = catsList.map((c: any) => c.name);
      const uniqueCats = Array.from(new Set([...defaultCats, ...fetchedCats]));
      setCategories(['Todos', ...uniqueCats]);
      
      const mappedProds: Product[] = (Array.isArray(productsData) ? productsData : [])
        .filter(p => p.active !== false)
        .map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category_id: p.category_id,
          category_name: catMap[p.category_id] || 'Outros'
        }));
      setProducts(mappedProds);

      const openOrders = (Array.isArray(ordersData) ? ordersData : []).filter(o => o.status === 'open');
      setOrders(openOrders);

      // Refresh selected table/order context if open
      if (activeContext) {
        const currentTable = (tablesData || []).find(t => t.id === activeContext.table.id);
        const currentOrder = openOrders.find(o => o.table_id === activeContext.table.id);
        if (currentTable) {
          setActiveContext({
            table: currentTable,
            order: currentOrder || null
          });
        }
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados do Garçom: ' + (err.message || 'Erro desconhecido'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial Load and Polling
  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchData(false);
      }
    }, 5000); // 5 seconds polling

    return () => clearInterval(interval);
  }, []);

  // WebSocket Integration
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      if (navigator.onLine) {
        console.log('🔄 Socket event received: refreshing waiter data');
        fetchData(false);
      }
    };

    socket.on('order_item_added', handleUpdate);
    socket.on('order_status_changed', handleUpdate);
    socket.on('order_closed', handleUpdate);

    return () => {
      socket.off('order_item_added', handleUpdate);
      socket.off('order_status_changed', handleUpdate);
      socket.off('order_closed', handleUpdate);
    };
  }, [socket]);

  const filteredMenu = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addPendingItem = (product: Product) => {
    setProductForComplements(product);
  };

  const handleConfirmComplements = (complements: any[], additionalPrice: number) => {
    if (!productForComplements) return;
    const finalPrice = productForComplements.price + additionalPrice;
    const cartId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    setPendingItems(prev => {
      // Check if there is an exact same item already (same product, same complements)
      // This is a bit complex for JSON equality, so for simplicity we just add as new line or group by strict equality of the complements array if we stringify.
      const compStr = JSON.stringify(complements);
      const existing = prev.find(o => o.product.id === productForComplements.id && JSON.stringify(o.complements || []) === compStr);
      
      if (existing) {
        return prev.map(o => o.cartId === existing.cartId ? { ...o, quantity: o.quantity + 1 } : o);
      }
      return [...prev, { cartId, product: productForComplements, quantity: 1, price: finalPrice, complements }];
    });
    setProductForComplements(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setPendingItems(prev => prev.map(o => {
      if (o.cartId === cartId) {
        const next = o.quantity + delta;
        return next > 0 ? { ...o, quantity: next } : o;
      }
      return o;
    }));
  };

  const removePendingItem = (cartId: string) => {
    setPendingItems(prev => prev.filter(o => o.cartId !== cartId));
  };

  const pendingTotal = pendingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currentOrderTotal = activeContext?.order?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const tableTotal = currentOrderTotal + pendingTotal;

  const handleSelectTable = (table: Table) => {
    const activeOrder = orders.find(o => o.table_id === table.id) || null;
    setActiveContext({ table, order: activeOrder });
    setPendingItems([]);
  };

  const handleOpenNewComanda = async () => {
    if (!activeContext || activeContext.order) return;
    setLoading(true);
    try {
      if (navigator.onLine) {
        const newOrder = await api.post<Order>('/orders', {
          tableId: activeContext.table.id,
          waiterId: user?.id
        });
        await api.put(`/tables/${activeContext.table.id}`, {
          status: 'busy',
          number: activeContext.table.number
        });
        
        await fetchData(false);
        setActiveContext(prev => prev ? { ...prev, order: newOrder } : null);
        setIsMenuOpen(true);
      } else {
        const tempOrderId = 'temp-' + Date.now();
        const newOrder: Order = {
          id: tempOrderId,
          table_id: activeContext.table.id,
          table_number: activeContext.table.number,
          status: 'open',
          items: []
        };

        await queueAction('create_order', {
          tempOrderId,
          tableId: activeContext.table.id,
          waiterId: user?.id,
          tableNumber: activeContext.table.number
        });

        const updatedTables = tables.map(t => t.id === activeContext.table.id ? { ...t, status: 'busy' as const } : t);
        setTables(updatedTables);
        setOrders(prev => [...prev, newOrder]);
        setActiveContext({
          table: { ...activeContext.table, status: 'busy' },
          order: newOrder
        });
        setIsMenuOpen(true);

        await setCache('tables', updatedTables);
        await setCache('orders', [...orders, newOrder]);
      }
    } catch (err: any) {
      alert('Erro ao abrir comanda: ' + (err.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  };

  const handleFastOpen = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(fastNumber, 10);
    if (isNaN(num) || num <= 0) return;
    
    setLoading(true);
    try {
      // 1. Encontrar ou criar mesa/comanda
      let targetTable = tables.find(t => t.number === num);
      if (!targetTable) {
        if (navigator.onLine) {
          targetTable = await api.post<Table>('/tables', { number: num, status: 'busy' });
        } else {
          throw new Error(`Você está offline. Não é possível criar uma nova ${label} no momento.`);
        }
      }
      
      // 2. Encontrar pedido aberto ou abrir novo
      let targetOrder = orders.find(o => o.table_id === targetTable!.id && o.status === 'open');
      if (!targetOrder) {
        if (navigator.onLine) {
          targetOrder = await api.post<Order>('/orders', {
            tableId: targetTable.id,
            waiterId: user?.id
          });
          await api.put(`/tables/${targetTable.id}`, {
            status: 'busy',
            number: targetTable.number
          });
        } else {
          const tempOrderId = 'temp-' + Date.now();
          targetOrder = {
            id: tempOrderId,
            table_id: targetTable.id,
            table_number: targetTable.number,
            status: 'open',
            items: []
          };
          await queueAction('create_order', {
            tempOrderId,
            tableId: targetTable.id,
            waiterId: user?.id,
            tableNumber: targetTable.number
          });
        }
      }
      
      if (navigator.onLine) {
        await fetchData(false);
      }
      
      setActiveContext({ table: targetTable, order: targetOrder });
      setPendingItems([]);
      setFastNumber('');
      setIsMenuOpen(true); // Joga direto na aba de produtos!
    } catch (err: any) {
      setError('Erro no Lançamento Rápido: ' + (err.message || 'Falha de conexão'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrintModal = () => {
    if (pendingItems.length === 0) return;
    setIsPrintModalOpen(true);
  };

  const confirmAndPrint = async () => {
    if (!activeContext || !activeContext.order) return;
    setIsPrinting(true);
    try {
      const orderId = activeContext.order.id;
      const orderItemsToQueue = pendingItems.map(item => ({
        productId: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        notes: '',
        complements: item.complements
      }));

      if (navigator.onLine) {
        for (const item of orderItemsToQueue) {
          await api.post(`/orders/${orderId}/items`, {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: '',
            complements: item.complements
          });
        }
        await fetchData(false);
      } else {
        await queueAction('add_items', {
          orderId,
          items: orderItemsToQueue
        });

        const updatedOrders = orders.map(o => {
          if (o.id === orderId) {
            const existingItems = o.items || [];
            const newItems: OrderItem[] = orderItemsToQueue.map(item => ({
              product_id: item.productId,
              product_name: item.product_name,
              quantity: item.quantity,
              price: item.price,
              notes: '',
              complements: item.complements
            }));
            return {
              ...o,
              items: [...existingItems, ...newItems]
            };
          }
          return o;
        });

        setOrders(updatedOrders);
        await setCache('orders', updatedOrders);

        alert('Modo Offline: Pedido salvo localmente e será enviado quando restabelecer conexão!');
      }

      setPendingItems([]);
      setIsPrintModalOpen(false);
      setActiveContext(null);
    } catch (err: any) {
      alert('Erro ao lançar itens: ' + (err.message || 'Erro de conexão'));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Layout title="Lançamento Garçom">
      <div className="max-w-2xl mx-auto pb-24">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-bold underline">Fechar</button>
          </div>
        )}

        {loading && !activeContext ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-bold font-mono">Carregando {labelPlural.toLowerCase()} e pedidos...</span>
          </div>
        ) : !activeContext ? (
          /* LISTA DE MESAS */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* HEADER FAST OPEN */}
            <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl">
              <h2 className="text-white font-black text-xl mb-4 text-center sm:text-left">
                Lançamento Rápido
              </h2>
              <form onSubmit={handleFastOpen} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-lg">
                    #
                  </span>
                  <input
                    type="number"
                    placeholder={`Número da ${label}...`}
                    value={fastNumber}
                    onChange={e => setFastNumber(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-2xl py-4 pl-10 pr-4 font-black text-xl focus:ring-4 focus:ring-indigo-400 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!fastNumber}
                  className="bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 font-black py-4 px-8 rounded-2xl transition-all whitespace-nowrap text-lg shadow-lg cursor-pointer"
                >
                  OK / Abrir
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">{label} Ativa</h3>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder={`Buscar ${label.toLowerCase()} por número...`} 
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables
                  .filter(t => !tableSearch || String(t.number).includes(tableSearch))
                  .map(t => {
                    const activeOrder = orders.find(o => o.table_id === t.id);
                    const statusColor = t.status === 'busy' ? 'border-red-500 bg-red-500/5' : 
                                      t.status === 'closing' ? 'border-amber-500 bg-amber-500/5' : 
                                      'border-slate-800 bg-slate-950 hover:border-emerald-500';
                    return (
                      <button 
                        key={t.id} 
                        onClick={() => handleSelectTable(t)}
                        className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer ${statusColor}`}
                      >
                        <div>
                          <p className="text-white font-black text-xl">{label} {t.number}</p>
                          {activeOrder && (
                            <p className="text-slate-400 text-xs mt-1 font-mono">Cmd: #{activeOrder.id.slice(0, 4)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${t.status === 'busy' ? 'bg-red-500' : t.status === 'closing' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                            {t.status === 'busy' ? 'Ocupada' : t.status === 'closing' ? 'Fechando' : 'Livre'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        ) : (
          /* DETALHES DA MESA SELECIONADA */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header da Comanda */}
            <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-2xl font-black text-white">{label} {activeContext.table.number}</h3>
                <p className="text-amber-500 font-bold text-sm">
                  {activeContext.order ? `Pedido Ativo: #${activeContext.order.id.slice(0, 8)}` : 'Sem pedido aberto'}
                </p>
              </div>
              <button onClick={() => setActiveContext(null)} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Se a comanda não está aberta, mostra botão para abrir */}
              {!activeContext.order ? (
                <div className="text-center py-12 space-y-4">
                  <p className="text-slate-400">Esta {label.toLowerCase()} está livre no momento. Abra para começar a lançar pedidos.</p>
                  <button 
                    onClick={handleOpenNewComanda}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-lg py-4 px-8 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all active:scale-98 cursor-pointer"
                  >
                    Abrir {label}
                  </button>
                </div>
              ) : (
                <>
                  {/* Produtos já lançados */}
                  {activeContext.order.items.length > 0 && (
                    <div className="mb-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                      <h4 className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Itens Lançados</h4>
                      <div className="space-y-2">
                        {activeContext.order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-400">
                            <span>{it.quantity}x {it.product_name}</span>
                            <span className="font-mono">R$ {(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lançamento de Novos Itens */}
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">Lançar Novos Itens</h4>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="w-full bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 hover:bg-indigo-500/20 hover:border-indigo-500 text-indigo-400 font-bold rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all mb-6"
                  >
                    <Plus className="w-8 h-8" />
                    <span>Adicionar Produto</span>
                  </button>

                  <div className="space-y-4 mb-6">
                    {pendingItems.map(o => (
                      <div key={o.cartId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 gap-4">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{o.product.name}</h4>
                          <p className="text-amber-500 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.price * o.quantity)}</p>
                          {o.complements && o.complements.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {o.complements.map((c, i) => (
                                <span key={i} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                  {c.optionName} {c.optionPrice > 0 && `(+R$ ${c.optionPrice.toFixed(2)})`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1 border border-slate-700">
                            <button onClick={() => updateQuantity(o.cartId, -1)} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold text-white w-6 text-center">{o.quantity}</span>
                            <button onClick={() => updateQuantity(o.cartId, 1)} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removePendingItem(o.cartId)} className="p-3 text-slate-500 hover:text-red-400 bg-slate-900 rounded-xl transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pendingItems.length > 0 && (
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400">Total a Enviar</span>
                        <span className="text-3xl font-black text-amber-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingTotal)}</span>
                      </div>
                      <button 
                        onClick={handleOpenPrintModal}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-lg rounded-2xl py-4 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" /> Enviar para Cozinha/Bar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
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
                    placeholder="Buscar produto..." 
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg"
                  />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Sidebar and Main Layout */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Category Sidebar (Scroll X on Mobile, Scroll Y on Desktop) */}
                <div className="w-full md:w-[250px] bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col overflow-x-auto md:overflow-y-auto p-4 gap-2 md:gap-3 custom-scrollbar shrink-0">
                  <div className="hidden md:block mb-2 px-2">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Categorias</h4>
                  </div>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0 md:text-left cursor-pointer whitespace-nowrap md:whitespace-normal ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 md:scale-[1.02]'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product List */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {products.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 gap-3">
                    <p className="font-bold text-slate-400">Nenhum produto cadastrado.</p>
                    <p className="text-xs text-slate-600 max-w-sm mt-1">
                      Acesse a tela de Produtos para cadastrar itens no cardápio.
                    </p>
                  </div>
                ) : filteredMenu.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Nenhum produto encontrado nesta categoria.</div>
                ) : (
                  filteredMenu.map(item => {
                    const emoji = getEmoji(item.name, item.category_name || 'Outros');
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-850 hover:border-indigo-500/50 rounded-2xl transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-inner select-none">
                            {emoji}
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-base leading-tight">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-amber-500 font-bold text-sm">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                              </span>
                              {item.category_name && (
                                <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-slate-800">
                                  {item.category_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => addPendingItem(item)}
                          className="bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-white p-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* RODAPÉ DO CARDÁPIO: CONTA DA MESA E ITENS PENDENTES */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Conta da Mesa</span>
                  <span className="text-emerald-400 font-black text-2xl">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tableTotal)}
                  </span>
                </div>
                {pendingItems.length > 0 && (
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm sm:text-base rounded-2xl px-6 py-3 transition-all flex flex-col items-center shadow-lg shadow-indigo-500/20"
                  >
                    <span>Revisar Envio</span>
                    <span className="text-[10px] font-normal opacity-80">{pendingItems.reduce((acc, curr) => acc + curr.quantity, 0)} itens (+ R$ {pendingTotal.toFixed(2)})</span>
                  </button>
                )}
              </div>
                </div>
              </div>
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
                  <h3 className="text-xl font-bold text-white">Confirmar Pedido</h3>
                  <p className="text-slate-400 text-sm">{label} {activeContext?.table.number} • Pedido #{activeContext?.order?.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => !isPrinting && setIsPrintModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900 flex flex-col gap-6">
                <p className="text-slate-300 text-sm">Confirmar e enviar os itens selecionados para a produção?</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  {pendingItems.map(o => (
                    <div key={o.product.id} className="flex justify-between text-sm text-slate-400">
                      <span>{o.quantity}x {o.product.name}</span>
                      <span>R$ {(o.product.price * o.quantity).toFixed(2)}</span>
                    </div>
                  ))}
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
                    <>Enviando...</>
                  ) : (
                    <><Printer className="w-5 h-5" /> Imprimir e Lançar</>
                  )}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SelectComplementsModal
        isOpen={!!productForComplements}
        onClose={() => setProductForComplements(null)}
        product={productForComplements}
        onConfirm={handleConfirmComplements}
      />
    </Layout>
  );
};
