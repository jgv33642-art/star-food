import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Plus, Minus, Send, ChefHat } from 'lucide-react';

const CATEGORIES = ['Destaques', 'Lanches', 'Pizzas', 'Bebidas', 'Sobremesas'];

const MENU_ITEMS = [
  { id: 1, name: 'X-Burger Especial', description: 'Hambúrguer artesanal 150g, queijo cheddar, alface, tomate e molho especial.', price: 25.90, category: 'Lanches', img: '🍔' },
  { id: 2, name: 'X-Bacon', description: 'Hambúrguer 150g, muito bacon crocante e queijo prato.', price: 28.50, category: 'Lanches', img: '🥓' },
  { id: 3, name: 'Pizza Calabresa', description: 'Molho de tomate, mussarela, calabresa fatiada e cebola.', price: 45.00, category: 'Pizzas', img: '🍕' },
  { id: 4, name: 'Batata Frita c/ Cheddar', description: 'Porção grande de fritas com cheddar derretido e bacon.', price: 22.50, category: 'Destaques', img: '🍟' },
  { id: 5, name: 'Coca-Cola 350ml', description: 'Lata bem gelada.', price: 6.00, category: 'Bebidas', img: '🥤' },
  { id: 6, name: 'Pudim de Leite', description: 'Pudim caseiro com calda de caramelo.', price: 10.00, category: 'Sobremesas', img: '🍮' },
];

export const DigitalMenu = () => {
  const { mesaId } = useParams<{ mesaId: string }>();
  const [activeCategory, setActiveCategory] = useState('Destaques');
  const [cart, setCart] = useState<{item: typeof MENU_ITEMS[0], quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'browsing' | 'sending' | 'success'>('browsing');

  const filteredItems = MENU_ITEMS.filter(item => 
    activeCategory === 'Destaques' ? item.category === 'Destaques' : item.category === activeCategory
  );

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => {
      const exists = prev.find(i => i.item.id === item.id);
      if (exists) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(i => {
        if (i.item.id === id) {
          const newQ = i.quantity + delta;
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      }).filter(i => i.quantity > 0);
      
      if (newCart.length === 0) setIsCartOpen(false);
      return newCart;
    });
  };

  const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSendOrder = () => {
    setOrderStatus('sending');
    setTimeout(() => {
      setOrderStatus('success');
      setCart([]);
    }, 2000);
  };

  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <ChefHat className="w-12 h-12" />
        </motion.div>
        <h1 className="text-3xl font-black mb-4">Pedido Recebido!</h1>
        <p className="text-slate-400 mb-8">
          A cozinha já está preparando o seu pedido. Em breve será entregue na sua mesa ({mesaId}).
        </p>
        <button 
          onClick={() => setOrderStatus('browsing')}
          className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-700 transition-colors"
        >
          Fazer Novo Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans relative overflow-x-hidden">
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-black text-lg leading-tight">Cardápio Digital</h1>
            <p className="text-xs text-slate-500 font-medium">Mesa {mesaId}</p>
          </div>
        </div>
      </header>

      {/* Categorias (Navegação Horizontal) */}
      <div className="px-4 py-4 overflow-x-auto flex gap-3 custom-scrollbar sticky top-[73px] bg-slate-50/90 backdrop-blur-sm z-30 shadow-sm border-b border-slate-200">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all ${
              activeCategory === cat 
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
              : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Produtos */}
      <div className="p-4 space-y-4">
        {filteredItems.map(item => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center text-5xl shrink-0">
              {item.img}
            </div>
            <div className="flex flex-col flex-1 justify-center">
              <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-black text-amber-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                </span>
                
                {/* Verifica se já tem no carrinho */}
                {cart.find(i => i.item.id === item.id) ? (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-amber-500 shadow-sm"><Minus className="w-3 h-3" /></button>
                    <span className="font-bold text-sm w-4 text-center">{cart.find(i => i.item.id === item.id)?.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-amber-500 rounded-full text-white shadow-sm"><Plus className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Botão Flutuante do Carrinho */}
      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-40"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-slate-900 text-white rounded-full p-4 flex items-center justify-between shadow-xl shadow-slate-900/30"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center relative">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                    {totalItems}
                  </span>
                </div>
                <span className="font-medium text-sm">Ver Pedido</span>
              </div>
              <span className="font-black text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Carrinho */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-center p-3">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
              
              <div className="px-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Seu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500">
                  <ChevronLeft className="w-5 h-5 -rotate-90" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.map(({ item, quantity }) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl">
                      {item.img}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="font-black text-amber-500 text-sm mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-full p-1">
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-slate-700 shadow-sm"><Plus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-slate-700 shadow-sm"><Minus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 rounded-t-3xl border-t border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-slate-500">Total a Pagar</span>
                  <span className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                  </span>
                </div>
                <button 
                  onClick={handleSendOrder}
                  disabled={orderStatus === 'sending'}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  {orderStatus === 'sending' ? (
                    'Enviando...'
                  ) : (
                    <>Enviar para a Cozinha <Send className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
