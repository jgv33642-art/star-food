import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ShoppingCart, Download, Laptop, Smartphone, CheckCircle, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

initMercadoPago((import.meta as any).env.VITE_MERCADO_PAGO_PUBLIC_KEY || '', { locale: 'pt-BR' });

const PLAN_DETAILS: Record<string, { title: string, desc: string, priceMonthly: string, priceAnnual: string }> = {
  start: {
    title: 'Plano Start',
    desc: 'Atendimento de balcão e relatórios simplificados.',
    priceMonthly: '149,90',
    priceAnnual: '1.618,80',
  },
  basic: {
    title: 'Plano Básico',
    desc: 'Gestão completa com mesas, PDV e estoque.',
    priceMonthly: '299,90',
    priceAnnual: '3.238,92',
  },
  pro: {
    title: 'Plano Pro (SaaS)',
    desc: 'Acesso completo com Delivery White Label.',
    priceMonthly: '399,90',
    priceAnnual: '4.318,92',
  }
};

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(searchParams.get('status') === 'success');
  const [error, setError] = useState('');
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { register } = useAuth();

  const planKey = searchParams.get('plan') || 'basic';
  const billingCycle = searchParams.get('billing') || 'monthly';
  
  const planInfo = PLAN_DETAILS[planKey] || PLAN_DETAILS.basic;
  const isAnnual = billingCycle === 'annual';
  const finalPrice = isAnnual ? planInfo.priceAnnual : planInfo.priceMonthly;

  // Custom form submission not handled manually anymore; CardPayment handles it
  const onSubmitMP = async (formData: any) => {
    if (!companyName || !userName || !email || !password) {
      setError('Por favor, preencha os campos da conta acima primeiro.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // 1. Cria a conta no banco
      await register(companyName, password, planKey);
      
      // 2. Chama a rota de pagamento transparente
      const response = await api.post<any>('/payments/transparent', { 
        plan: planKey,
        token: formData.token,
        issuer_id: formData.issuer_id,
        payment_method_id: formData.payment_method_id,
        installments: formData.installments,
        payer: { ...formData.payer, email: email }
      });

      if (response.status === 'authorized' || response.status === 'approved' || response.status === 'preapproved') {
        setIsSuccess(true);
      } else {
        setError('O pagamento não foi aprovado pelo cartão. Verifique o saldo ou tente outro.');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Erro ao processar o pagamento e criar conta.';
      if (errorMessage.includes('users_email_key')) {
        errorMessage = 'Este e-mail já está cadastrado. Por favor, tente fazer login ou use outro e-mail.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initialization = {
    amount: parseFloat(finalPrice.replace('.', '').replace(',', '.')),
  };

  const handleInstallPWA = () => {
    // Lógica para chamar o prompt de instalação do PWA
    alert("O navegador solicitará a instalação do aplicativo no seu dispositivo.");
    navigate('/admin');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 mb-8 z-10">
          <CheckCircle className="w-12 h-12 text-slate-900 dark:text-white" />
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-slate-900 dark:text-white mb-4 z-10">
          Pagamento Aprovado!
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10 z-10 text-lg">
          Sua conta foi criada com sucesso. Para a melhor experiência, instale o aplicativo da sua lanchonete. <br/>
          <strong className="text-emerald-400">Ele atualiza automaticamente</strong> sem que você precise baixar novas versões!
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6 z-10 w-full max-w-2xl justify-center">
          <button onClick={handleInstallPWA} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-6 transition-all flex flex-col items-center gap-4 group">
            <Laptop className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold text-lg">Baixar para PC (Windows)</h3>
              <p className="text-xs text-slate-500 mt-1">Versão Desktop com KDS</p>
            </div>
            <span className="mt-4 bg-emerald-500 text-white text-sm font-bold py-2 px-6 rounded-full flex items-center gap-2">
              <Download className="w-4 h-4" /> Instalar
            </span>
          </button>

          <button onClick={handleInstallPWA} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-6 transition-all flex flex-col items-center gap-4 group">
            <Smartphone className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold text-lg">Baixar para Celular</h3>
              <p className="text-xs text-slate-500 mt-1">App do Garçom e Caixa</p>
            </div>
            <span className="mt-4 bg-emerald-500 text-white text-sm font-bold py-2 px-6 rounded-full flex items-center gap-2">
              <Download className="w-4 h-4" /> Instalar
            </span>
          </button>
        </motion.div>
        
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={() => navigate('/admin')} className="mt-12 text-slate-500 hover:text-slate-900 dark:text-white underline z-10">
          Acessar pelo navegador web por enquanto
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center p-4 relative ">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors z-10 font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row"
      >
        {/* Resumo do Pedido */}
        <div className="bg-slate-50 dark:bg-slate-950 p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
            <ShoppingCart className="text-slate-900 dark:text-white w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{planInfo.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{planInfo.desc}</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Cobrança {isAnnual ? 'Anual' : 'Mensal'}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Cancelamento Flexível
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Configuração Imediata
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-slate-900 dark:text-white mb-2">
              <span>Total {isAnnual ? 'Anual' : 'Mensal'}</span>
              <span className="font-bold">R$ {finalPrice}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-sm">
              <span>Setup Inicial</span>
              <span>Grátis</span>
            </div>
          </div>
        </div>

        {/* Formulário de Assinatura */}
        <div className="p-8 md:w-2/3">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Criar Conta e Assinar</h2>
          
          <div className="space-y-6 mt-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Nome do Restaurante</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Minha Lanchonete" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Seu Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="text" required value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="João Silva" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">E-mail de Acesso</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="admin@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="********" />
                </div>
              </div>
            </div>

            {/* Componente Invisível do Mercado Pago */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Dados de Pagamento</h3>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <CardPayment
                  initialization={initialization}
                  customization={{
                    visual: { style: { theme: 'default' } },
                    paymentMethods: { maxInstallments: 1 }
                  }}
                  onSubmit={onSubmitMP}
                />
              </div>
            </div>
            {loading && <div className="text-center text-indigo-500 font-bold mt-4 animate-pulse">Processando Assinatura... Aguarde.</div>}
            <p className="text-xs text-center text-slate-500 mt-4">Transação 100% segura. Cancele quando quiser.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
