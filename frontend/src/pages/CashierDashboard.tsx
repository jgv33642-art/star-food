import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Search, 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  Lock, 
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { usePrinter } from '../context/PrinterContext';

interface OrderItem {
  id: string;
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
  waiter_id: string | null;
  status: string;
  opened_at: string;
  items: OrderItem[];
}

interface CashRegister {
  id: string;
  status: 'open' | 'closed';
  opening_balance: string;
  closing_balance: string | null;
  opened_at: string;
  opened_by: string;
}

export const CashierDashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { printOrderToSectors } = usePrinter();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'dinheiro' | 'pix' | null>(null);
  
  // Cashier Register State
  const [cashier, setCashier] = useState<CashRegister | null>(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fetchCashierAndOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // 1. Fetch current cashier status
      let activeRegister: CashRegister | null = null;
      try {
        activeRegister = await api.get<CashRegister>('/cashier/current');
        setCashier(activeRegister);
      } catch (cErr) {
        setCashier(null);
      }

      // 2. Fetch open orders
      const allOrders = await api.get<Order[]>('/orders');
      const openOrders = allOrders.filter(o => o.status === 'open');
      setOrders(openOrders);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados do Caixa: ' + (err.message || 'Erro desconhecido'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierAndOrders(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('⚡ Socket event received: refreshing cashier orders list');
      fetchCashierAndOrders(false);
    };

    const handleNewOrder = async (data: any) => {
      handleUpdate();
      try {
        const orderDetail = await api.get<Order>(`/orders/${data.id}`);
        if (orderDetail) {
          printOrderToSectors(orderDetail);
        }
      } catch (err) {
        console.error('Erro ao buscar pedido para auto-impressão', err);
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_changed', handleUpdate);
    socket.on('order_payment_partial', handleUpdate);
    socket.on('order_closed', handleUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_changed', handleUpdate);
      socket.off('order_payment_partial', handleUpdate);
      socket.off('order_closed', handleUpdate);
    };
  }, [socket]);

  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      setError('Por favor, informe um valor de abertura válido (mínimo R$ 0,00)');
      setActionLoading(false);
      return;
    }

    try {
      const newRegister = await api.post<CashRegister>('/cashier/open', { openingBalance: balance });
      setCashier(newRegister);
      setSuccess('Caixa aberto com sucesso!');
      setOpeningBalance('');
      // Reload orders
      const allOrders = await api.get<Order[]>('/orders');
      setOrders(allOrders.filter(o => o.status === 'open'));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao abrir caixa: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashier) return;

    setError(null);
    setSuccess(null);
    setActionLoading(true);

    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || balance < 0) {
      setError('Por favor, informe um valor de fechamento válido');
      setActionLoading(false);
      return;
    }

    try {
      await api.post('/cashier/close', { id: cashier.id, closingBalance: balance });
      setCashier(null);
      setSuccess('Caixa fechado com sucesso!');
      setClosingBalance('');
      setShowCloseModal(false);
      setOrders([]);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao fechar caixa: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((acc, item) => acc + (parseFloat(item.price.toString()) * item.quantity), 0);
  };

  const handleSelectOrder = (order: Order) => {
    navigate(`/caixa/pagamento/${order.id}`);
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentMethod || !cashier) return;
    
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    const totalAmount = calculateOrderTotal(selectedOrder);

    try {
      // 1. Close the order in backend
      await api.put(`/orders/${selectedOrder.id}/close`);

      // 2. Create the sale
      await api.post('/sales', {
        orderId: selectedOrder.id,
        cashRegisterId: cashier.id,
        totalAmount,
        discount: 0,
        finalAmount: totalAmount,
        paymentMethod,
        items: selectedOrder.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      setSuccess(`Comanda #${selectedOrder.id.slice(0, 4)} finalizada com sucesso via ${paymentMethod.toUpperCase()}!`);
      
      // Update local state
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setPaymentMethod(null);
      setStep(1);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao finalizar pagamento: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se estiver em input, ignora atalhos globais, exceto ESC
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }

      if (step === 2 && selectedOrder) {
        switch (e.key) {
          case 'F2':
            e.preventDefault();
            setPaymentMethod('cartao');
            break;
          case 'F3':
            e.preventDefault();
            setPaymentMethod('pix');
            break;
          case 'F4':
            e.preventDefault();
            setPaymentMethod('dinheiro');
            break;
          case 'Enter':
            e.preventDefault();
            if (paymentMethod && !actionLoading) handlePayment();
            break;
          case 'Escape':
            e.preventDefault();
            prevStep();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedOrder, paymentMethod, actionLoading]);

  const prevStep = () => {
    setStep(1);
    setPaymentMethod(null);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const term = search.toLowerCase();
    const matchesId = order.id.toLowerCase().includes(term);
    const matchesTable = order.table_number?.toString().includes(term);
    const matchesItem = order.items.some(i => i.product_name.toLowerCase().includes(term));
    return matchesId || matchesTable || matchesItem;
  });

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <Layout title="Fechamento de Caixa">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-slate-900 dark:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-slate-900 dark:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-bold font-mono">Carregando dados do caixa...</span>
          </div>
        ) : !cashier ? (
          /* CAIXA FECHADO: Tela de abertura */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
              <Lock className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Caixa Fechado</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-xs">
              Para começar a vender no PDV ou finalizar comandas, abra o caixa informando o fundo de reserva (troco inicial).
            </p>

            <form onSubmit={handleOpenCashier} className="w-full space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Saldo de Abertura (Troco)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono font-bold text-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-lg rounded-xl py-3.5 shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-5 h-5" /> Abrir Caixa
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* CAIXA ABERTO: Dashboard */
          <div className="space-y-6">
            
            {/* Cashier Status Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-white font-bold text-lg">Caixa Aberto</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Ativo</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Aberto em {new Date(cashier.opened_at).toLocaleString('pt-BR')} • Fundo Inicial: R$ {parseFloat(cashier.opening_balance).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold py-2.5 px-6 rounded-xl flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Fechar Caixa
              </button>
            </div>

            {/* Progress Tabs */}
            <div className="flex items-center justify-center my-6">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step >= 1 ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500'}`}>
                  <Search className="w-5 h-5" />
                  <span className="font-medium hidden sm:block">1. Selecionar Comanda</span>
                </div>
                <div className={`w-8 h-px ${step >= 2 ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step >= 2 ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500'}`}>
                  <Receipt className="w-5 h-5" />
                  <span className="font-medium hidden sm:block">2. Pagamento</span>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: Selecionar Comanda */}
                {step === 1 && (
                  <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Comandas em Aberto</h3>
                      <p className="text-slate-600 dark:text-slate-400">Selecione a comanda ou mesa em aberto para fechar o pagamento.</p>
                    </div>

                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Buscar por ID, número da mesa ou nome do produto..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredOrders.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-500">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-500" />
                          <p className="font-medium">Nenhuma comanda aberta encontrada.</p>
                        </div>
                      ) : (
                        filteredOrders.map(order => {
                          const totalAmount = calculateOrderTotal(order);
                          return (
                            <div 
                              key={order.id}
                              onClick={() => handleSelectOrder(order)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 rounded-2xl p-6 cursor-pointer transition-all group"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 block">Comanda</span>
                                  <span className="text-slate-900 dark:text-white font-bold text-sm">#{order.id.slice(0, 4)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 block">Origem</span>
                                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                                    {order.table_number ? `Mesa ${order.table_number}` : 'Avulsa/PDV'}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1 mb-4 text-xs text-slate-600 dark:text-slate-400 max-h-16 overflow-hidden">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <p key={idx} className="truncate">{item.quantity}x {item.product_name}</p>
                                ))}
                                {order.items.length > 2 && <p className="opacity-50">+{order.items.length - 2} outros itens...</p>}
                              </div>
                              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Total</span>
                                <span className="text-amber-500 font-bold text-lg group-hover:scale-105 transition-transform font-mono">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Pagamento */}
                {step === 2 && selectedOrder && (
                  <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Resumo da Comanda */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <button onClick={prevStep} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-900 dark:text-white transition-colors relative group">
                          <ArrowLeft className="w-5 h-5" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Esc</span>
                        </button>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resumo da Comanda</h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Comanda #{selectedOrder.id.slice(0, 4)} • {selectedOrder.table_number ? `Mesa ${selectedOrder.table_number}` : 'Avulsa/PDV'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.product_name}</span>
                            <span className="text-slate-900 dark:text-white font-medium font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.price.toString()) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                        <span className="text-slate-600 dark:text-slate-400">Total a pagar</span>
                        <span className="text-4xl font-black text-amber-500 font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(selectedOrder))}
                        </span>
                      </div>
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Forma de Pagamento</h3>
                      
                      <div className="grid grid-cols-1 gap-4 mb-8 flex-1">
                        <button
                          onClick={() => setPaymentMethod('cartao')}
                          className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                            paymentMethod === 'cartao' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-600 hover:bg-slate-100 dark:bg-slate-800/50'
                          }`}
                        >
                          <CreditCard className={`w-8 h-8 ${paymentMethod === 'cartao' ? 'text-amber-500' : 'text-slate-500'}`} />
                          <div className="text-left flex-1">
                            <span className="block font-bold text-lg text-slate-900 dark:text-white">Cartão de Crédito/Débito</span>
                            <span className="text-sm opacity-80">Maquininha</span>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono">[F2]</span>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('pix')}
                          className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                            paymentMethod === 'pix' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-600 hover:bg-slate-100 dark:bg-slate-800/50'
                          }`}
                        >
                          <QrCode className={`w-8 h-8 ${paymentMethod === 'pix' ? 'text-amber-500' : 'text-slate-500'}`} />
                          <div className="text-left flex-1">
                            <span className="block font-bold text-lg text-slate-900 dark:text-white">PIX</span>
                            <span className="text-sm opacity-80">QR Code</span>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono">[F3]</span>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('dinheiro')}
                          className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                            paymentMethod === 'dinheiro' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-600 hover:bg-slate-100 dark:bg-slate-800/50'
                          }`}
                        >
                          <Banknote className={`w-8 h-8 ${paymentMethod === 'dinheiro' ? 'text-amber-500' : 'text-slate-500'}`} />
                          <div className="text-left flex-1">
                            <span className="block font-bold text-lg text-slate-900 dark:text-white">Dinheiro</span>
                            <span className="text-sm opacity-80">Espécie</span>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono">[F4]</span>
                        </button>
                      </div>

                      <button 
                        onClick={handlePayment}
                        disabled={!paymentMethod || actionLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white font-bold text-lg rounded-2xl py-5 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 flex-col"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> Finalizar Pagamento</div>
                            <span className="text-[10px] font-normal opacity-70 mt-1 font-mono">[Enter]</span>
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: FECHAMENTO DE CAIXA */}
      <AnimatePresence>
        {showCloseModal && cashier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCloseModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-500" /> Fechamento do Caixa
                </h3>
                <button onClick={() => setShowCloseModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Fundo de abertura:</span>
                  <span className="text-slate-900 dark:text-white font-mono">R$ {parseFloat(cashier.opening_balance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Horário abertura:</span>
                  <span className="text-slate-900 dark:text-white">{new Date(cashier.opened_at).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>

              <form onSubmit={handleCloseCashier} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Saldo de Fechamento (Total em Dinheiro + Troco)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={closingBalance}
                      onChange={e => setClosingBalance(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      'Confirmar Fechamento'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
