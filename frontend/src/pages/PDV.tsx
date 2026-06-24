import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { 
  Search, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Banknote, 
  QrCode, 
  SplitSquareHorizontal, 
  Trash2, 
  ShoppingCart, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

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



export const PDV = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  
  // Zustand Store para Carrinho
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const total = getCartTotal();

  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'pix' | 'dinheiro'>('cartao');
  
  // States para Divisão e Pagamento Parcial
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [useTenPercent, setUseTenPercent] = useState(true);
  
  // Pagamentos Adicionados na Venda Atual
  const [partialPayments, setPartialPayments] = useState<{method: string, amount: number}[]>([]);
  const partialTotal = partialPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const [selectedPartialMethod, setSelectedPartialMethod] = useState<'cartao' | 'pix' | 'dinheiro'>('dinheiro');
  const [partialAmountInput, setPartialAmountInput] = useState('');

  const currentRemaining = Math.max(0, total - partialTotal);

  const handleAddPartialPayment = () => {
    const amount = parseFloat(partialAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > currentRemaining + 0.01) {
      alert('Valor excede o restante!');
      return;
    }
    setPartialPayments(prev => [...prev, { method: selectedPartialMethod, amount }]);
    setPartialAmountInput((Math.max(0, currentRemaining - amount)).toFixed(2));
  };

  // APIs state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // React Query para buscar dados com cache
  const { data: categories = ['Todos'], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.get<any[]>('/categories');
      return ['Todos', ...data.map(c => c.name)];
    }
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const [categoriesData, productsData] = await Promise.all([
        api.get<any[]>('/categories'),
        api.get<any[]>('/products'),
      ]);
      const catMap: Record<string, string> = {};
      categoriesData.forEach(c => { catMap[c.id] = c.name; });
      return productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        category: catMap[p.category_id] || 'Outros',
        img: getEmoji(p.name, catMap[p.category_id] || 'Outros'),
        active: p.active
      })).filter(p => p.active);
    }
  });

  const { data: cashier } = useQuery({
    queryKey: ['currentCashier'],
    queryFn: async () => {
      return await api.get<any>('/cashier/current');
    },
    retry: false
  });

  const loading = isLoadingCategories || isLoadingProducts;

  const handleCobrar = async () => {
    if (cart.length === 0) return;
    if (!cashier) {
      setError('O caixa está FECHADO. Por favor, abra o caixa na tela de "Caixa" antes de realizar vendas.');
      return;
    }

    // Se há pagamentos parciais, eles devem cobrir o total
    if (partialPayments.length > 0 && partialTotal < total - 0.01) {
      setError('O valor dos pagamentos parciais não cobre o total da venda.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Create Order
      const order = await api.post<any>('/orders', { tableId: null, waiterId: null });

      // 2. Add Items to Order
      for (const cartItem of cart) {
        await api.post(`/orders/${order.id}/items`, {
          productId: cartItem.item.id,
          quantity: cartItem.quantity,
          price: cartItem.item.price,
          notes: ''
        });
      }

      // 3. Close Order
      await api.put(`/orders/${order.id}/close`);

      // 4. Create Sale
      const payload = {
        orderId: order.id,
        cashRegisterId: cashier.id,
        totalAmount: total,
        discount: 0,
        finalAmount: total,
        payments: partialPayments.length > 0 
          ? partialPayments 
          : [{ method: paymentMethod, amount: total }],
        items: cart.map(cartItem => ({
          productId: cartItem.item.id,
          quantity: cartItem.quantity,
          price: cartItem.item.price
        }))
      };

      await api.post('/sales', payload);

      setSuccessMessage('Venda realizada com sucesso!');
      clearCart();
      setPartialPayments([]);
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowSplitModal(false);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao processar venda: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') searchInputRef.current?.blur();
        return;
      }

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
          if (cart.length > 0 && !submitting) handleCobrar();
          break;
        case 'Escape':
          e.preventDefault();
          clearCart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod, cashier, total, submitting]);

  const filteredItems = products.filter(item => {
    const matchesCat = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });



  return (
    <Layout title="Frente de Caixa (PDV)">
      
      {/* Toast Alert Banner for Errors or Success */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-bold font-mono">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-bold font-mono">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-500 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-sm font-bold font-mono">Carregando itens de PDV...</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Esquerda: Produtos */}
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <div className="relative mb-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Buscar produtos (Esc para sair)..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                {!cashier && (
                  <Link 
                    to="/cashier" 
                    className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs px-4 rounded-2xl flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                  >
                    Caixa Fechado (Abrir) <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              
              <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4">
              {products.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 gap-3">
                  <ShoppingCart className="w-12 h-12 opacity-25 text-indigo-400" />
                  <div>
                    <p className="font-bold text-slate-400">Nenhum produto cadastrado.</p>
                    <p className="text-xs text-slate-600 max-w-sm mt-1">
                      Você precisa cadastrar produtos e categorias no menu de Produtos para que apareçam aqui.
                    </p>
                  </div>
                  <Link 
                    to="/products" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/10 mt-2"
                  >
                    Ir para Cadastro de Produtos
                  </Link>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                  <p>Nenhum produto encontrado para esta busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center text-center group"
                    >
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                        {item.img}
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1 leading-tight">{item.name}</h4>
                      <p className="text-indigo-400 font-bold mt-auto">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Direita: Carrinho */}
          <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Pedido Atual</h3>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">Mesa Avulsa</span>
            </div>

            <div className="flex-1 p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum item adicionado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-slate-400 text-xs">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 rounded-lg border border-slate-800 p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="w-4 text-center text-sm font-bold text-white">{quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="w-16 text-right font-bold text-white text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * quantity)}
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-950/50 rounded-b-3xl border-t border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 font-medium">Total</span>
                <span className="text-3xl font-black text-indigo-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  onClick={() => setPaymentMethod('cartao')}
                  className={`rounded-xl py-3 flex flex-col items-center justify-center gap-1 transition-colors border ${paymentMethod === 'cartao' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-medium text-white">Cartão</span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded">[F2]</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`rounded-xl py-3 flex flex-col items-center justify-center gap-1 transition-colors border ${paymentMethod === 'pix' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                >
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-medium text-white">PIX</span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded">[F3]</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('dinheiro')}
                  className={`rounded-xl py-3 flex flex-col items-center justify-center gap-1 transition-colors border ${paymentMethod === 'dinheiro' ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                >
                  <Banknote className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-medium text-white">Dinheiro</span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded">[F4]</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => clearCart()} className="px-4 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-colors relative group">
                  <Trash2 className="w-5 h-5" />
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Esc</span>
                </button>
                <button onClick={() => setShowSplitModal(true)} disabled={cart.length === 0} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 rounded-xl transition-colors">
                  <SplitSquareHorizontal className="w-5 h-5" />
                </button>
                <button 
                  disabled={cart.length === 0 || submitting} 
                  onClick={handleCobrar}
                  className="flex-1 flex flex-col items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all leading-tight py-2 relative overflow-hidden"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Cobrar</span>
                      <span className="text-[10px] font-normal opacity-70">[Enter]</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Divisão de Conta Avançada */}
      <AnimatePresence>
        {showSplitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSplitModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Calculadora de Divisão
                </h3>
                <button onClick={() => setShowSplitModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Controls */}
                  <div className="flex-1 space-y-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Dividir a conta para quantas pessoas?</label>
                    <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
                      <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold text-white w-8 text-center">{splitCount}</span>
                      <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Taxa de Serviço (10%)</label>
                    <button 
                      onClick={() => setUseTenPercent(!useTenPercent)}
                      className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                        useTenPercent ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${useTenPercent ? 'text-indigo-400' : 'text-slate-600'}`} />
                      {useTenPercent ? 'Aplicando 10% do Garçom' : 'Sem Taxa de Serviço'}
                    </button>
                  </div>
                </div>

                {/* Calculation Display */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Subtotal dos itens</span>
                    <span className="text-white font-medium">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400">Taxa de Serviço {useTenPercent ? '(10%)' : '(0%)'}</span>
                    <span className="text-emerald-400 font-medium">+ R$ {(useTenPercent ? total * 0.1 : 0).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-800 w-full mb-4"></div>
                  
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-300 font-bold">Total a Pagar</span>
                    <span className="text-3xl font-black text-white">R$ {(total * (useTenPercent ? 1.1 : 1)).toFixed(2)}</span>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-indigo-400" />
                      <div>
                        <p className="text-indigo-400 font-bold">Valor por pessoa</p>
                        <p className="text-xs text-indigo-400/70">Dividido em {splitCount} partes iguais</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-indigo-400">
                      R$ {((total * (useTenPercent ? 1.1 : 1)) / splitCount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Multiple / Partial Payments Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 mx-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Pagamentos Múltiplos</h4>
                  <span className="text-xs text-slate-400">Restante: <span className="font-mono text-amber-500 font-bold">R$ {currentRemaining.toFixed(2)}</span></span>
                </div>
                
                {currentRemaining > 0 && (
                  <div className="flex gap-2 mb-4">
                    <select
                      value={selectedPartialMethod}
                      onChange={(e: any) => setSelectedPartialMethod(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500 w-32"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao">Cartão</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={partialAmountInput}
                      onChange={e => setPartialAmountInput(e.target.value)}
                      placeholder="Valor"
                      className="flex-1 bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleAddPartialPayment}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}

                {partialPayments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {partialPayments.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-300 font-bold uppercase">{p.method}</span>
                        <span className="text-emerald-400 font-mono font-bold">R$ {p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-3xl">
                <button 
                  onClick={handleCobrar}
                  disabled={submitting || (partialPayments.length > 0 && currentRemaining > 0.01)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-lg"
                >
                  {submitting ? 'Processando...' : 'Finalizar Venda'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
