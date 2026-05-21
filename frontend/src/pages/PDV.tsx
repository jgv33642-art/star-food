import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Search, Plus, Minus, X, CreditCard, Banknote, QrCode, SplitSquareHorizontal, Trash2, ShoppingCart, Users, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Todos', 'Lanches', 'Pizzas', 'Porções', 'Bebidas', 'Sobremesas'];

const MENU_ITEMS = [
  { id: 1, name: 'X-Burger Especial', price: 25.90, category: 'Lanches', img: '🍔' },
  { id: 2, name: 'X-Bacon', price: 28.50, category: 'Lanches', img: '🥓' },
  { id: 3, name: 'Pizza Calabresa', price: 45.00, category: 'Pizzas', img: '🍕' },
  { id: 4, name: 'Pizza Margherita', price: 42.00, category: 'Pizzas', img: '🍕' },
  { id: 5, name: 'Porção de Fritas', price: 18.50, category: 'Porções', img: '🍟' },
  { id: 6, name: 'Coca-Cola 2L', price: 12.00, category: 'Bebidas', img: '🥤' },
  { id: 7, name: 'Cerveja Artesanal', price: 15.00, category: 'Bebidas', img: '🍺' },
  { id: 8, name: 'Pudim', price: 10.00, category: 'Sobremesas', img: '🍮' },
];

export const PDV = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{item: typeof MENU_ITEMS[0], quantity: number}[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'pix' | 'dinheiro'>('cartao');
  
  // States para Divisão de Conta
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [useTenPercent, setUseTenPercent] = useState(true);

  // Adicionando Atalhos de Teclado
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se estiver digitando no input de busca, ignore os atalhos (exceto Esc para sair do input)
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
          if (cart.length > 0) alert(`Cobrando R$ ${total.toFixed(2)} no método: ${paymentMethod}`);
          break;
        case 'Escape':
          e.preventDefault();
          setCart([]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod]);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCat = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => {
      const exists = prev.find(i => i.item.id === item.id);
      if (exists) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

  return (
    <Layout title="Frente de Caixa (PDV)">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Esquerda: Produtos */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800">
            <div className="relative mb-4">
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
            
            <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-2">
              {CATEGORIES.map(cat => (
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

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
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
          </div>
        </div>

        {/* Direita: Carrinho */}
        <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Pedido Atual</h3>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">Mesa Avulsa</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
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
              <button onClick={() => setCart([])} className="px-4 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-colors relative group">
                <Trash2 className="w-5 h-5" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Esc</span>
              </button>
              <button onClick={() => setShowSplitModal(true)} disabled={cart.length === 0} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 rounded-xl transition-colors">
                <SplitSquareHorizontal className="w-5 h-5" />
              </button>
              <button 
                disabled={cart.length === 0} 
                onClick={() => {
                  if (cart.length > 0) alert(`Cobrando R$ ${total.toFixed(2)} no método: ${paymentMethod}`);
                }}
                className="flex-1 flex flex-col items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all leading-tight py-2"
              >
                <span>Cobrar</span>
                <span className="text-[10px] font-normal opacity-70">[Enter]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-3xl">
                <button 
                  onClick={() => setShowSplitModal(false)}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Concluir Divisão e Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
