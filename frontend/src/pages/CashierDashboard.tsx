import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Search, Receipt, CreditCard, Banknote, QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data
const MOCK_ORDERS = [
  { comanda: '4501', mesa: '12', total: 145.50, status: 'aberta', items: [
    { name: '2x X-Burger Especial', price: 51.80 },
    { name: '1x Porção de Fritas', price: 18.50 },
    { name: '1x Pizza Calabresa', price: 45.00 },
    { name: '1x Cerveja Artesanal', price: 15.00 },
    { name: '1x Cerveja Artesanal', price: 15.00 },
  ] },
  { comanda: '4502', mesa: '04', total: 85.00, status: 'aberta', items: [
    { name: '1x Pizza Calabresa', price: 45.00 },
    { name: '2x Cerveja Artesanal', price: 30.00 },
    { name: '1x Suco Natural', price: 10.00 },
  ] },
];

export const CashierDashboard = () => {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<typeof MOCK_ORDERS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'dinheiro' | 'pix' | null>(null);

  const filteredOrders = orders.filter(order => 
    order.comanda.includes(search) || order.mesa.includes(search)
  );

  const handleSelectOrder = (order: typeof MOCK_ORDERS[0]) => {
    setSelectedOrder(order);
    setStep(2);
  };

  const handlePayment = () => {
    if (!selectedOrder || !paymentMethod) return;
    
    // Simulate API call
    setTimeout(() => {
      alert(`Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)} recebido com sucesso via ${paymentMethod.toUpperCase()}!`);
      setOrders(orders.filter(o => o.comanda !== selectedOrder.comanda));
      setSelectedOrder(null);
      setPaymentMethod(null);
      setStep(1);
    }, 500);
  };

  const prevStep = () => {
    setStep(1);
    setPaymentMethod(null);
    setSelectedOrder(null);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <Layout title="Fechamento de Caixa">
      
      {/* Progress Tabs */}
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step >= 1 ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500'}`}>
            <Search className="w-5 h-5" />
            <span className="font-medium hidden sm:block">1. Selecionar Comanda</span>
          </div>
          <div className={`w-8 h-px ${step >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
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
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Comandas em Aberto</h3>
                <p className="text-slate-400">Selecione a comanda do cliente para realizar o fechamento.</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar por número da comanda ou mesa..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma comanda aberta encontrada.</p>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div 
                      key={order.comanda}
                      onClick={() => handleSelectOrder(order)}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 rounded-2xl p-6 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-800 px-3 py-1 rounded-lg">
                          <span className="text-xs text-slate-400 block">Comanda</span>
                          <span className="text-white font-bold text-lg">#{order.comanda}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Mesa</span>
                          <span className="text-white font-bold text-lg">{order.mesa}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total</span>
                        <span className="text-amber-500 font-bold text-xl group-hover:scale-110 transition-transform">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Pagamento */}
          {step === 2 && selectedOrder && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Resumo da Comanda */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                  <button onClick={prevStep} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-white">Resumo da Comanda</h3>
                    <p className="text-slate-400 text-sm">Comanda #{selectedOrder.comanda} • Mesa {selectedOrder.mesa}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                  <span className="text-slate-400">Total a pagar</span>
                  <span className="text-4xl font-black text-amber-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6">Forma de Pagamento</h3>
                
                <div className="grid grid-cols-1 gap-4 mb-8 flex-1">
                  <button
                    onClick={() => setPaymentMethod('cartao')}
                    className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                      paymentMethod === 'cartao' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <CreditCard className={`w-8 h-8 ${paymentMethod === 'cartao' ? 'text-amber-500' : 'text-slate-500'}`} />
                    <div className="text-left">
                      <span className="block font-bold text-lg text-white">Cartão de Crédito/Débito</span>
                      <span className="text-sm opacity-80">Maquininha</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                      paymentMethod === 'pix' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <QrCode className={`w-8 h-8 ${paymentMethod === 'pix' ? 'text-amber-500' : 'text-slate-500'}`} />
                    <div className="text-left">
                      <span className="block font-bold text-lg text-white">PIX</span>
                      <span className="text-sm opacity-80">QR Code</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${
                      paymentMethod === 'dinheiro' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <Banknote className={`w-8 h-8 ${paymentMethod === 'dinheiro' ? 'text-amber-500' : 'text-slate-500'}`} />
                    <div className="text-left">
                      <span className="block font-bold text-lg text-white">Dinheiro</span>
                      <span className="text-sm opacity-80">Espécie</span>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={!paymentMethod}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl py-5 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" /> Finalizar Pagamento
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
