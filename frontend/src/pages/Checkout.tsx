import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CreditCard, ShoppingCart, Download, Laptop, Smartphone, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Checkout = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula chamada para a API de pagamento
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      // Cria a conta master (Gerente) mas não redireciona imediatamente
      login('admin@meurestaurante.com', 'gerencia', 'Dono do Restaurante');
    }, 2000);
  };

  const handleInstallPWA = () => {
    // Lógica para chamar o prompt de instalação do PWA
    alert("O navegador solicitará a instalação do aplicativo no seu dispositivo.");
    navigate('/admin');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 mb-8 z-10">
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-white mb-4 z-10">
          Pagamento Aprovado!
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-400 max-w-xl mx-auto mb-10 z-10 text-lg">
          Sua conta foi criada com sucesso. Para a melhor experiência, instale o aplicativo da sua lanchonete. <br/>
          <strong className="text-emerald-400">Ele atualiza automaticamente</strong> sem que você precise baixar novas versões!
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6 z-10 w-full max-w-2xl justify-center">
          <button onClick={handleInstallPWA} className="flex-1 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 text-white rounded-2xl p-6 transition-all flex flex-col items-center gap-4 group">
            <Laptop className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold text-lg">Baixar para PC (Windows)</h3>
              <p className="text-xs text-slate-500 mt-1">Versão Desktop com KDS</p>
            </div>
            <span className="mt-4 bg-emerald-500 text-white text-sm font-bold py-2 px-6 rounded-full flex items-center gap-2">
              <Download className="w-4 h-4" /> Instalar
            </span>
          </button>

          <button onClick={handleInstallPWA} className="flex-1 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 text-white rounded-2xl p-6 transition-all flex flex-col items-center gap-4 group">
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
        
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={() => navigate('/admin')} className="mt-12 text-slate-500 hover:text-white underline z-10">
          Acessar pelo navegador web por enquanto
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 relative overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-10 font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row"
      >
        {/* Resumo do Pedido */}
        <div className="bg-slate-950 p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
            <ShoppingCart className="text-white w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Plano Pro (SaaS)</h2>
          <p className="text-slate-400 text-sm mb-6">Acesso completo ao sistema para a sua Lanchonete.</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Multi-usuários (Caixa, Garçom)
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Cardápio Digital QR Code
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Integração Delivery & PDV
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center text-white mb-2">
              <span>Mensalidade</span>
              <span className="font-bold">R$ 149,90</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-sm">
              <span>Setup Inicial</span>
              <span>Grátis</span>
            </div>
          </div>
        </div>

        {/* Formulário de Assinatura */}
        <div className="p-8 md:w-2/3">
          <h2 className="text-2xl font-black text-white mb-6">Criar Conta e Assinar</h2>
          
          <form onSubmit={handleSubscribe} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Restaurante</label>
                <input type="text" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Minha Lanchonete" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Seu E-mail Administrativo</label>
                <input type="email" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="admin@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Dados do Cartão</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0000 0000 0000 0000" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input type="text" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="MM/AA" />
                <input type="text" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="CVC" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 mt-4"
            >
              {loading ? (
                <span className="animate-pulse">Processando Assinatura...</span>
              ) : (
                <>Pagar e Acessar Sistema <ShieldCheck className="w-5 h-5" /></>
              )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-4">Transação 100% segura. Cancele quando quiser.</p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
