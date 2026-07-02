import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Plus, Minus, MapPin, Bike, CreditCard, ChevronLeft, Sparkles, Loader2, AlertCircle, Smartphone } from 'lucide-react';
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

interface CartItem {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  notes?: string;
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
  const { slug } = useParams<{ slug: string }>();
  const { isInstallable, installApp } = usePWA();
  const [company, setCompany] = useState<{ name: string; phone?: string; whatsapp_number?: string; is_delivery_open?: boolean; delivery_fee?: string; theme_color?: string; logo_url?: string } | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  
  // Checkout & Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'success' | 'tracking' | 'loading' | 'error'>('loading');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'dinheiro' | 'pix' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; type: string; value: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Tracking
  const [trackingCode, setTrackingCode] = useState('');
  const [orderStatus, setOrderStatus] = useState('open');

  // Product Modal States
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productNotes, setProductNotes] = useState('');

  // Loads menu data dynamically
  const loadMenuData = async (showLoading = false) => {
    if (showLoading) setCheckoutStep('loading');
    try {
      if (!slug) {
        throw new Error('Empresa inválida ou não especificada.');
      }

      const menuData = await api.get<{
        company: { id: string; name: string; phone?: string; theme_color?: string; logo_url?: string };
        categories: DBCategory[];
        products: DBProduct[];
      }>(`/public/menu/${slug}`);

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
          categoryName: catMap[p.category_id] || 'Outros',
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

  useEffect(() => {
    loadMenuData(true);
    const interval = setInterval(() => {
      loadMenuData(false);
    }, 10000); 
    return () => clearInterval(interval);
  }, [tenantId]);

  useEffect(() => {
    if (checkoutStep === 'tracking' && trackingCode) {
      const interval = setInterval(async () => {
        try {
          const data: any = await api.get(`/public/order-status/${tenantId}/${trackingCode}`);
          setOrderStatus(data.status);
        } catch (e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [checkoutStep, trackingCode, tenantId]);

  // Derived Data
  const filteredProducts = useMemo(() => {
    return products.filter(prod =>
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.categoryName.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const groupedProducts = useMemo(() => {
    return products.reduce((acc, prod) => {
      if (!acc[prod.categoryName]) acc[prod.categoryName] = [];
      acc[prod.categoryName].push(prod);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [products]);

  const categoriesList = useMemo(() => Object.keys(groupedProducts).sort(), [groupedProducts]);

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
      if (newCart.length === 0) setIsCartOpen(false);
      return newCart;
    });
  };

  const deliveryFee = Number(company?.delivery_fee ?? 5);
  const subtotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'PERCENTAGE' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value)
    : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const hasLanche = cart.some(c => c.item.categoryName.toLowerCase().includes('lanche') || c.item.categoryName.toLowerCase().includes('combo') || c.item.name.toLowerCase().includes('burger'));
  const hasBebida = cart.some(c => c.item.categoryName.toLowerCase().includes('bebida') || c.item.name.toLowerCase().includes('coca') || c.item.name.toLowerCase().includes('suco'));
  const showUpsell = hasLanche && !hasBebida;
  const recommendedItem = products.find(p => p.categoryName.toLowerCase().includes('bebida') || p.name.toLowerCase().includes('coca'));

  const handleApplyCoupon = async () => {
    try {
      setCouponError('');
      const data: any = await api.post(`/public/coupon/${tenantId}`, { code: couponCode });
      setAppliedCoupon({ code: data.code, type: data.discount_type, value: Number(data.discount_value) });
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Cupom inválido');
      setAppliedCoupon(null);
    }
  };

  const handleFinish = async () => {
    if (!tenantId || cart.length === 0) return;
    
    try {
      const orderItems = cart.map(c => ({
        productId: c.item.id,
        quantity: c.quantity,
        price: c.item.price,
        notes: `Delivery - Nome: ${customerName} | Contato: ${customerPhone}${c.notes ? ` | Obs: ${c.notes}` : ''}`
      }));

      const orderData: any = await api.post(`/public/order/${tenantId}`, {
        items: orderItems,
        customerName,
        customerPhone,
        deliveryAddress: address
      });

      setTrackingCode(orderData.tracking_code);
      setOrderStatus('open');
      setCheckoutStep('tracking');

      if (company?.whatsapp_number) {
        let msg = `*NOVO PEDIDO* (Rastreio: ${orderData.tracking_code})\n\n`;
        cart.forEach(c => {
          msg += `${c.quantity}x ${c.item.name} (R$ ${c.item.price.toFixed(2)})\n`;
          if (c.notes) msg += `  *Obs: ${c.notes}*\n`;
        });
        msg += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}`;
        if (appliedCoupon) msg += `\n*Desconto:* -R$ ${discount.toFixed(2)}`;
        msg += `\n*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}`;
        msg += `\n*Total Pago:* R$ ${total.toFixed(2)}`;
        msg += `\n*Pagamento:* ${paymentMethod === 'cartao' ? 'Cartão' : paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}`;
        msg += `\n\n*Cliente:* ${customerName}\n*Endereço:* ${address}`;
        
        const wpUrl = `https://api.whatsapp.com/send?phone=${company.whatsapp_number.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
        window.open(wpUrl, '_blank');
      }

      setTimeout(() => {
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode('');
        setCustomerName('');
        setCustomerPhone('');
        setAddress('');
        setPaymentMethod(null);
      }, 1000);
    } catch (err: any) {
      alert('Erro ao enviar o seu pedido: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (checkoutStep === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg font-mono">Carregando loja virtual...</h3>
        <p className="text-xs text-slate-500 mt-2">Atualizando cardápio e preços em tempo real</p>
      </div>
    );
  }

  if (checkoutStep === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black mb-2">Loja Indisponível</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-8">
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

  if (company && company.is_delivery_open === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black mb-2">Loja Fechada</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-8">
          No momento não estamos aceitando pedidos. Por favor, retorne durante nosso horário de funcionamento.
        </p>
      </div>
    );
  }

  const ProductCardComponent = ({ item }: { item: MenuItem }) => (
    <div 
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]" 
      onClick={() => setSelectedProduct(item)}
    >
      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800">{item.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
        <span className="font-black text-emerald-600 mt-auto pt-2 block">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
        </span>
      </div>
      <div className="w-28 h-28 bg-slate-50 rounded-xl flex items-center justify-center text-5xl shrink-0 overflow-hidden border border-slate-100">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          item.img
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header Premium (Capa + Logo) */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100">
        <div className="h-32 relative w-full overflow-hidden" style={{ backgroundColor: company?.theme_color || '#dc2626' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        
        <div className="px-4 pb-4 relative mt-[-2.5rem]">
          <div className="flex justify-between items-start">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg border-2 border-white flex items-center justify-center text-4xl overflow-hidden relative z-10">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                '⭐'
              )}
            </div>
            
            <div className="mt-12 flex items-center gap-2">
              {isInstallable && (
                <button
                  onClick={installApp}
                  className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" /> App
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-2">
            <h1 className="font-black text-2xl text-slate-800 leading-tight">{company?.name || 'Star Food'}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1.5">
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <Bike className="w-3 h-3" /> 30-45 min
              </span>
              <span>•</span>
              <span className="font-bold">Entrega R$ 5,00</span>
            </div>
          </div>

          {/* Busca */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar em todo o cardápio..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 text-slate-700 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-500 border-none font-medium placeholder-slate-400 transition-shadow"
            />
          </div>
        </div>

        {/* Categorias Navegação (Scroll Horizontal) */}
        {!search && categoriesList.length > 0 && (
          <div className="flex overflow-x-auto gap-2 px-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .flex.overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {categoriesList.map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  const element = document.getElementById(`category-${cat}`);
                  if (element) {
                    const headerOffset = 250;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
                className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Categorias e Produtos */}
      <main className="p-4 space-y-8 max-w-4xl mx-auto">
        {search ? (
          <section>
            <h2 className="font-black text-xl mb-4 text-slate-800">Resultados da Busca</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium">
                  Nenhum produto encontrado para "{search}".
                </div>
              ) : (
                filteredProducts.map(item => <ProductCardComponent key={item.id} item={item} />)
              )}
            </div>
          </section>
        ) : (
          categoriesList.map(cat => (
            <section key={cat} id={`category-${cat}`}>
              <h2 className="font-black text-xl mb-4 text-slate-800">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedProducts[cat].map(item => <ProductCardComponent key={item.id} item={item} />)}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full bg-slate-50 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-w-xl md:mx-auto overflow-hidden">
              
              <div className="relative w-full h-56 bg-slate-100 flex justify-center items-center text-8xl shrink-0">
                 {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                 ) : (
                    selectedProduct.img
                 )}
                 <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg text-slate-700 hover:bg-white transition-colors">
                   <ChevronLeft className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{selectedProduct.name}</h2>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{selectedProduct.description}</p>
                  <p className="text-xl font-black text-emerald-600 mt-4">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.price)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <h3 className="font-bold text-slate-800">Alguma observação?</h3>
                    <span className="text-xs font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md">Opcional</span>
                  </div>
                  <textarea 
                    value={productNotes}
                    onChange={e => setProductNotes(e.target.value)}
                    placeholder="Ex: Tirar cebola, maionese à parte..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none h-20 transition-shadow"
                  />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-3 border border-slate-200">
                  <button onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-600 active:bg-slate-200 rounded-full transition-colors"><Minus className="w-5 h-5" /></button>
                  <span className="font-bold w-6 text-center text-slate-800">{productQuantity}</span>
                  <button onClick={() => setProductQuantity(productQuantity + 1)} className="w-8 h-8 flex items-center justify-center text-red-500 active:bg-red-50 rounded-full transition-colors"><Plus className="w-5 h-5" /></button>
                </div>

                <button 
                  onClick={() => {
                    const cartItemId = Math.random().toString(36).substring(2, 9);
                    setCart(prev => [...prev, { item: selectedProduct, quantity: productQuantity, notes: productNotes, cartItemId }]);
                    setSelectedProduct(null);
                    setProductQuantity(1);
                    setProductNotes('');
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-between px-6 shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                >
                  <span>Adicionar</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.price * productQuantity)}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && checkoutStep !== 'success' && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-4 right-4 z-40 md:max-w-md md:mx-auto">
            <button 
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="w-full bg-red-500 text-white rounded-full p-4 flex items-center justify-between shadow-xl shadow-red-500/30 transition-transform active:scale-[0.98]"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (checkoutStep !== 'success') setIsCartOpen(false); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-w-lg md:mx-auto">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {checkoutStep !== 'cart' && checkoutStep !== 'success' && checkoutStep !== 'tracking' && (
                    <button onClick={() => setCheckoutStep(checkoutStep === 'payment' ? 'address' : 'cart')} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-slate-700">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h2 className="text-xl font-black text-slate-800">
                    {checkoutStep === 'cart' ? 'Sua Sacola' : checkoutStep === 'address' ? 'Dados para Entrega' : checkoutStep === 'payment' ? 'Forma de Pagamento' : checkoutStep === 'tracking' ? 'Status' : 'Pedido Realizado'}
                  </h2>
                </div>
                {checkoutStep !== 'success' && checkoutStep !== 'tracking' && (
                  <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors">Fechar</button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === 'cart' && (
                  <div className="space-y-6">
                    {cart.map(({ cartItemId, item, quantity, notes }) => (
                      <div key={cartItemId} className="flex items-start gap-4 border-b border-slate-100 pb-6 last:border-0">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{item.name}</h4>
                          {notes && (
                            <p className="text-sm text-slate-500 mt-1 italic line-clamp-2">"Obs: {notes}"</p>
                          )}
                          <p className="font-black text-emerald-600 mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * quantity)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 flex items-center justify-center text-3xl">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : item.img}
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-1">
                            <button onClick={() => updateQuantity(cartItemId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-600 active:bg-slate-200 rounded-full"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold w-4 text-center text-sm">{quantity}</span>
                            <button onClick={() => updateQuantity(cartItemId, 1)} className="w-6 h-6 flex items-center justify-center text-red-500 active:bg-red-50 rounded-full"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Bloco de IA Upsell */}
                    {showUpsell && recommendedItem && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20 rounded-2xl p-4 flex gap-4 items-center shadow-lg shadow-amber-500/5 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setSelectedProduct(recommendedItem)}>
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-amber-600 text-sm mb-1 flex items-center gap-1">Combinar com Bebida</h4>
                          <p className="text-slate-700 text-sm font-medium line-clamp-2">Adicionar <b>{recommendedItem.name}</b>?</p>
                          <p className="font-black text-amber-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recommendedItem.price)}</p>
                        </div>
                        <button className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all shadow-md">
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
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seu WhatsApp / Telefone</label>
                        <input 
                          type="tel" 
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="(99) 99999-9999" 
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço de Entrega</label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-red-500 transition-shadow">
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
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Possui um cupom?</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Ex: BEMVINDO10" 
                          disabled={!!appliedCoupon}
                          className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-red-500 uppercase font-bold"
                        />
                        {!appliedCoupon ? (
                          <button onClick={handleApplyCoupon} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 rounded-xl font-bold hover:bg-slate-700">Aplicar</button>
                        ) : (
                          <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold hover:bg-red-200">Remover</button>
                        )}
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                      {appliedCoupon && <p className="text-green-600 text-xs mt-2 font-bold flex items-center gap-1">Cupom aplicado com sucesso!</p>}
                    </div>

                    <h3 className="font-black text-slate-800 mb-2">Forma de Pagamento</h3>
                    <button 
                      onClick={() => setPaymentMethod('cartao')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'cartao' ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" /> Pagar com Cartão pelo App
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('pix')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'pix' ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-[#32BCA3]"><path d="M12.015 2.115l9.88 5.705-9.88 5.71-9.88-5.71 9.88-5.705zM2.135 16.185l9.88 5.7 9.88-5.7v-4.9l-9.88 5.705-9.88-5.705v4.9z"/></svg>
                      Pagar com PIX
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`w-full border-2 p-4 rounded-2xl font-bold flex items-center gap-3 transition-colors ${
                        paymentMethod === 'dinheiro' ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-red-500'
                      }`}
                    >
                      <ShoppingBag className="w-6 h-6 text-slate-600 dark:text-slate-400" /> Pagar na Entrega (Dinheiro)
                    </button>
                  </div>
                )}

                {checkoutStep === 'tracking' && (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Acompanhe seu Pedido</h2>
                    <p className="text-slate-500 mb-8 max-w-xs text-sm">Seu código: <strong className="text-slate-800">{trackingCode}</strong></p>
                    
                    <div className="w-full space-y-4 mb-8">
                      <div className={`p-4 rounded-xl border flex items-center gap-3 ${orderStatus === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 dark:text-slate-400'}`}>
                         <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 dark:text-white shrink-0">1</div>
                         <div className="text-left"><p className="font-bold">Aguardando Confirmação</p></div>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-center gap-3 ${orderStatus === 'preparing' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 dark:text-slate-400'}`}>
                         <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 dark:text-white shrink-0">2</div>
                         <div className="text-left"><p className="font-bold">Preparando</p></div>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-center gap-3 ${orderStatus === 'ready' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 dark:text-slate-400'}`}>
                         <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-slate-900 dark:text-white shrink-0">3</div>
                         <div className="text-left"><p className="font-bold">Saiu para Entrega / Pronto</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/40">
                      <Bike className="w-10 h-10 text-slate-900 dark:text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Pedido Recebido!</h2>
                    <p className="text-slate-500 mb-8 max-w-xs">A lanchonete já recebeu seu pedido e ele começará a ser preparado em breve.</p>
                  </div>
                )}
              </div>

              {checkoutStep !== 'success' && checkoutStep !== 'tracking' && (
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  {appliedCoupon && (
                    <div className="flex justify-between items-center mb-2 text-sm font-medium text-green-600">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4 text-sm font-medium text-slate-500">
                    <span>Taxa de Entrega</span>
                    <span>{deliveryFee === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-800">Total a Pagar</span>
                    <span className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
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
                    className="w-full bg-red-500 disabled:bg-red-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {checkoutStep === 'cart' ? 'Confirmar Pedido' : checkoutStep === 'address' ? 'Ir para Pagamento' : 'Finalizar Compra'}
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
