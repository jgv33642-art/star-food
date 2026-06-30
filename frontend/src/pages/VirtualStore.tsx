import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Bike, Search, Plus, Minus, CreditCard, ChevronLeft, Sparkles, MessageCircle, Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { api } from '../lib/api';
import { usePWA } from '../hooks/usePWA';

interface DBProduct {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  category_id: string;
  active: boolean;
  image_url?: string;
}

interface DBCategory {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  categoryName: string;
  img: string;
  imageUrl?: string;
}

const getEmojiForProduct = (name: string, categoryName: string) => {
  const n = name.toLowerCase();
  const c = (categoryName || '').toLowerCase();
  if (n.includes('burger') || n.includes('hambúrguer') || n.includes('burguer') || n.includes('artesanal')) return '🍔';
  if (n.includes('bacon')) return '🥓';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('batata') || n.includes('frita') || n.includes('porção')) return '🍟';
  if (n.includes('coca') || n.includes('refrigerante') || n.includes('suco') || n.includes('bebida') || n.includes('água') || n.includes('cerveja') || n.includes('lata')) return '🥤';
  if (n.includes('pudim') || n.includes('sobremesa') || n.includes('bolo') || n.includes('doce') || n.includes('sorvete') || n.includes('chocolate')) return '🍮';
  if (c.includes('lanche') || c.includes('hambú')) return '🍔';
  if (c.includes('pizza')) return '🍕';
  if (c.includes('bebida')) return '🥤';
  if (c.includes('sobremesa') || c.includes('doce')) return '🍮';
  return '🍽️';
};

export const VirtualStore = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { isInstallable, installApp } = usePWA();
  const [company, setCompany] = useState<{ name: string; phone?: string } | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  
  // Checkout & Cart States
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'success' | 'loading' | 'error'>('loading');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'dinheiro' | 'pix' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Loads menu data dynamically
  const loadMenuData = async (showLoading = false) => {
    if (showLoading) setCheckoutStep('loading');
    try {
      if (!tenantId) {
        throw new Error('Empresa inválida ou não especificada.');
      }

      const menuData = await api.get<{
        company: { id: string; name: string; phone?: string };
        categories: DBCategory[];
        products: DBProduct[];
      }>(`/public/menu/${tenantId}`);

      setCompany(menuData.company);
      
      const cats = menuData.categories || [];

      const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
      const mapped: MenuItem[] = (menuData.products || [])
        .filter(p => p.active)
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          category_id: p.category_id,
          categoryName: catMap[p.category_id] || '',
          img: getEmojiForProduct(p.name, catMap[p.category_id] || ''),
          imageUrl: p.image_url || undefined
        }));
      setProducts(mapped);

      if (checkoutStep === 'loading') {
        setCheckoutStep('cart');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Falha ao carregar loja virtual.');
      setCheckoutStep('error');
    }
  };

  // Setup Initial load and Polling (Updates products, stock and prices in background every 10s)
  useEffect(() => {
    loadMenuData(true);

    const interval = setInterval(() => {
      loadMenuData(false);
    }, 10000); // 10s auto update

    return () => clearInterval(interval);
  }, [tenantId]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.item.id === item.id);
      if (exists) return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(i => i.item.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
      if (newCart.length === 0) setIsCartOpen(false);
      return newCart;
    });
  };

  const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // IA de Upsell: Verifica se comprou lanche/combo mas não tem bebida
  const hasLanche = cart.some(c => c.item.categoryName.toLowerCase().includes('lanche') || c.item.categoryName.toLowerCase().includes('combo') || c.item.name.toLowerCase().includes('burger'));
  const hasBebida = cart.some(c => c.item.categoryName.toLowerCase().includes('bebida') || c.item.name.toLowerCase().includes('coca') || c.item.name.toLowerCase().includes('suco'));
  const showUpsell = hasLanche && !hasBebida;
  
  // Recomenda bebida (primeiro produto da categoria Bebida)
  const recommendedItem = products.find(p => p.categoryName.toLowerCase().includes('bebida') || p.name.toLowerCase().includes('coca'));

  const handleFinish = async () => {
    if (!tenantId || cart.length === 0) return;
    
    // Set view to success immediately or handle backend response
    try {
      const orderItems = cart.map(c => ({
        productId: c.item.id,
        quantity: c.quantity,
        price: c.item.price,
        notes: `Delivery - Nome: ${customerName} | Contato: ${customerPhone}`
      }));

      await api.post(`/public/order/${tenantId}`, {
        items: orderItems,
        customerName,
        customerPhone,
        deliveryAddress: address
      });

      setCheckoutStep('success');
      setTimeout(() => {
        setCart([]);
        setIsCartOpen(false);
        setCheckoutStep('cart');
        setCustomerName('');
        setCustomerPhone('');
        setAddress('');
        setPaymentMethod(null);
      }, 5000);
    } catch (err: any) {
      alert('Erro ao enviar o seu pedido: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const filteredProducts = products.filter(prod =>
    prod.name.toLowerCase().includes(search.toLowerCase()) ||
    prod.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  if (checkoutStep === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg font-mono">Carregando loja virtual...</h3>
        <p className="text-xs text-slate-500 mt-2">Atualizando cardápio e preços em tempo real</p>
      </div>
    );
  }

  if (checkoutStep === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black mb-2">Loja Indisponível</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-8">
          {errorMessage || 'Não foi possível encontrar as configurações da loja virtual especificada.'}
        </p>
        <button 
          onClick={() => loadMenuData(true)}
          className="bg-red-500 text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header Branco e Clean */}
      <header className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
              ⭐
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight">{company?.name || 'Star Food'}</h1>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1 text-amber-500"><Bike className="w-3 h-3" /> 30-45 min</span>
                <span>•</span>
                <span>Entrega R$ 5,00</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={installApp}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-md shadow-red-500/20 animate-pulse"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Instalar App
              </button>
            )}
            <div className="bg-red-500/10 text-red-600 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Online
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar no cardápio..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-100 text-slate-700 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-500 transition-shadow border-none"
          />
        </div>
      </header>

      {/* Categorias e Produtos */}
      <main className="p-4 space-y-8">
        <section>
          <h2 className="font-black text-xl mb-4 text-slate-800">Cardápio Delivery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                Nenhum produto correspondente disponível.
              </div>
            ) : (
              filteredProducts.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]" 
                  onClick={() => addToCart(item)}
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <span className="font-black text-emerald-600 mt-3 block">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                    </span>
                  </div>
                  <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center text-5xl shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.img
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && checkoutStep !== 'success' && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-4 right-4 z-40 md:max-w-md md:mx-auto">
            <button 
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="w-full bg-red-500 text-white rounded-full p-4 flex items-center justify-between shadow-xl shadow-red-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </div>
                <span className="font-bold">Ver Sacola</span>
              </div>
              <span className="font-black text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart & Checkout Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (checkoutStep !== 'success') setIsCartOpen(false); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-w-lg md:mx-auto">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
                    <button onClick={() => setCheckoutStep(checkoutStep === 'payment' ? 'address' : 'cart')} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h2 className="text-xl font-black text-slate-800">
                    {checkoutStep === 'cart' ? 'Sua Sacola' : checkoutStep === 'address' ? 'Dados para Entrega' : checkoutStep === 'payment' ? 'Forma de Pagamento' : 'Sucesso'}
                  </h2>
                </div>
                {checkoutStep !== 'success' && (
                  <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="text-slate-400 font-bold text-sm">Fechar</button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === 'cart' && (
                  <div className="space-y-6">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{item.name}</h4>
                          <p className="font-black text-emerald-600 mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-600"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold w-4 text-center">{quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-red-500"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Bloco de IA Upsell */}
                    {showUpsell && recommendedItem && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20 rounded-2xl p-4 flex gap-4 items-center shadow-lg shadow-amber-500/5">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-amber-600 text-sm mb-1 flex items-center gap-1">IA Sugere</h4>
                          <p className="text-slate-700 text-sm font-medium line-clamp-2">Quem compra lanche também leva uma bebida. Adicionar <b>{recommendedItem.name}</b>?</p>
                          <p className="font-black text-amber-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recommendedItem.price)}</p>
                        </div>
                        <button onClick={() => addToCart(recommendedItem)} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all shadow-md">
                          <Plus className="w-6 h-6" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {checkoutStep === 'address' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seu Nome</label>
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder="Digite seu nome completo" 
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seu WhatsApp / Telefone</label>
                        <input 
                          type="tel" 
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="(99) 99999-9999" 
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço de Entrega</label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                          <MapPin className="text-red-500 w-5 h-5 shrink-0" />
                          <input 
                            type="text" 
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Rua, Número, Bairro, Cidade" 
                            className="w-full bg-transparent outline-none font-medium text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setPaymentMethod('cartao')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'cartao' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" /> Pagar com Cartão pelo App
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('pix')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'pix' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-[#32BCA3]"><path d="M12.015 2.115l9.88 5.705-9.88 5.71-9.88-5.71 9.88-5.705zM2.135 16.185l9.88 5.7 9.88-5.7v-4.9l-9.88 5.705-9.88-5.705v4.9z"/></svg>
                      Pagar com PIX
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'dinheiro' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <ShoppingBag className="w-6 h-6 text-slate-400" /> Pagar na Entrega (Dinheiro)
                    </button>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/40">
                      <Bike className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Pedido Confirmado!</h2>
                    <p className="text-slate-500 mb-8">A lanchonete já recebeu seu pedido e ele será preparado em breve.</p>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 w-full text-left">
                      <div className="bg-emerald-500 text-white p-2 rounded-full"><MessageCircle className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-bold text-emerald-700 text-sm">Notificações por WhatsApp</h4>
                        <p className="text-emerald-600/80 text-xs">Você receberá atualizações em {company?.phone || 'seu celular'}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {checkoutStep !== 'success' && (
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4 text-sm font-medium text-slate-500">
                    <span>Taxa de Entrega</span>
                    <span>R$ 5,00</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-800">Total a Pagar</span>
                    <span className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total + 5)}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (checkoutStep === 'cart') setCheckoutStep('address');
                      else if (checkoutStep === 'address') setCheckoutStep('payment');
                      else handleFinish();
                    }}
                    disabled={
                      (checkoutStep === 'address' && (address.length < 5 || customerName.length < 2 || customerPhone.length < 8)) ||
                      (checkoutStep === 'payment' && !paymentMethod)
                    }
                    className="w-full bg-red-500 disabled:bg-red-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {checkoutStep === 'cart' ? 'Continuar' : checkoutStep === 'address' ? 'Ir para Pagamento' : 'Finalizar Pedido'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
