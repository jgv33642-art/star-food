import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, Lock, X, Smartphone, Check } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const Landing = () => {
  const navigate = useNavigate();
  const [showDevModal, setShowDevModal] = useState(false);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { isInstallable, installApp } = usePWA();

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (password === '336421') {
        setStep(2);
        setPassword('');
        setError(false);
      } else {
        setError(true);
      }
    } else {
      if (password === '1402') {
        setShowDevModal(false);
        navigate('/dev');
      } else {
        setError(true);
      }
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Star Food" className="w-12 h-12 object-contain rounded-2xl" />
          <span className="text-2xl font-bold tracking-tight">Star Food</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
            Já tenho conta
          </Link>
          <button 
            onClick={() => { setShowDevModal(true); setStep(1); setPassword(''); setError(false); }}
            className="text-slate-700 hover:text-slate-300 transition-colors p-1"
            title="Painel Admin"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
            Gestão inteligente para <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              bares e lanchonetes
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            Um sistema profissional com acessos separados para Garçom, Caixa e Gerência. 
            Controle pedidos, pagamentos e faturamento em tempo real.
          </p>

          {/* Pricing Section */}
          <div className="max-w-5xl mx-auto mb-16 text-left">
            <div className="flex justify-center mb-10">
              <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl inline-flex relative">
                <button 
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${!isAnnual ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Faturamento Mensal
                </button>
                <button 
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${isAnnual ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Faturamento Anual <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full ml-1 absolute -top-2 -right-4 animate-bounce">Economize 10%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Plano Start */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col relative">
                <h3 className="text-2xl font-bold mb-2 text-center">Plano Start</h3>
                <p className="text-slate-400 mb-6 text-center">Para quem está literalmente começando.</p>
                <div className="mb-8 text-center">
                  <span className="text-5xl font-black">R$ {isAnnual ? '1.618,80' : '149,90'}</span>
                  <span className="text-slate-400">{isAnnual ? '/ano' : '/mês'}</span>
                  {isAnnual && <div className="text-sm text-slate-500 mt-2">Equivalente a R$ 134,90 por mês</div>}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Atendimento de Balcão e Retirada</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>1 Usuário (Logado por vez)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Relatórios Simplificados</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Suporte via Ticket/Bot</span>
                  </li>
                </ul>
                
                <Link 
                  to={`/checkout?plan=start&billing=${isAnnual ? 'annual' : 'monthly'}`}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-lg font-bold rounded-2xl transition-all flex items-center justify-center text-center"
                >
                  Assinar Plano Start
                </Link>
              </div>

              {/* Plano Básico */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col relative">
                <h3 className="text-2xl font-bold mb-2 text-center">Plano Básico</h3>
                <p className="text-slate-400 mb-6 text-center">Gestão completa para operação local.</p>
                <div className="mb-8 text-center">
                  <span className="text-5xl font-black">R$ {isAnnual ? '3.238,92' : '299,90'}</span>
                  <span className="text-slate-400">{isAnnual ? '/ano' : '/mês'}</span>
                  {isAnnual && <div className="text-sm text-slate-500 mt-2">Equivalente a R$ 269,90 por mês</div>}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Atendimento de Mesas e Comandas</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Controle de Estoque e Compras</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Relatórios Avançados (DRE/Lucro)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
                    <span>Suporte em Horário Comercial</span>
                  </li>
                </ul>
                
                <Link 
                  to={`/checkout?plan=basic&billing=${isAnnual ? 'annual' : 'monthly'}`}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-lg font-bold rounded-2xl transition-all flex items-center justify-center text-center"
                >
                  Assinar Plano Básico
                </Link>
              </div>

              {/* Plano Pro */}
              <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-indigo-500/50 rounded-3xl p-8 flex flex-col relative transform lg:-translate-y-4 shadow-2xl shadow-indigo-500/10 mt-8 lg:mt-0">
                <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Mais Popular
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white text-center">Plano Pro</h3>
                <p className="text-indigo-200 mb-6 text-center">O carro-chefe para quem quer Delivery.</p>
                <div className="mb-8 text-center">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">R$ {isAnnual ? '4.318,92' : '399,90'}</span>
                  <span className="text-slate-400">{isAnnual ? '/ano' : '/mês'}</span>
                  {isAnnual && <div className="text-sm text-slate-500 mt-2">Equivalente a R$ 359,90 por mês</div>}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-slate-200">
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> 
                    <span>Tudo do Básico</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-200">
                    <Check className="w-5 h-5 text-amber-400 flex-shrink-0" /> 
                    <span className="font-bold text-amber-400">Site de Delivery Exclusivo (White Label)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-200">
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> 
                    <span>Gestor de Pedidos em Tempo Real</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-200">
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> 
                    <span>Suporte Prioritário 24/7</span>
                  </li>
                </ul>
                
                <Link 
                  to={`/checkout?plan=pro&billing=${isAnnual ? 'annual' : 'monthly'}`}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] flex items-center justify-center text-center"
                >
                  Assinar Plano Pro
                </Link>
              </div>
            </div>
          </div>

          {isInstallable && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={installApp}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl text-base font-bold transition-all hover:scale-105"
              >
                <Smartphone className="w-5 h-5 animate-pulse text-indigo-300" />
                Instalar Aplicativo Star Food
              </button>
            </div>
          )}
        </motion.div>

        {/* Features Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Atendimento Ágil</h3>
            <p className="text-slate-400 leading-relaxed">
              Interface passo a passo para o garçom lançar pedidos na mesa em segundos, direto para a cozinha.
            </p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fechamento Seguro</h3>
            <p className="text-slate-400 leading-relaxed">
              Controle de caixa organizado com métodos de pagamento em PIX, Cartão ou Dinheiro.
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl">
            <div className="w-14 h-14 bg-purple-500/20 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Métricas Reais</h3>
            <p className="text-slate-400 leading-relaxed">
              Painel gerencial com gráficos de faturamento, controle de equipe e histórico de vendas completo.
            </p>
          </div>
        </motion.div>


      </main>



      {/* Dev Auth Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl">
            <button onClick={() => setShowDevModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-widest text-center">
                {step === 1 ? 'ACESSO RESTRITO' : 'VERIFICAÇÃO SECUNDÁRIA'}
              </h3>
            </div>
            
            <form onSubmit={handleDevSubmit}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className={`w-full bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-800'} text-white rounded-xl px-4 py-3 mb-4 text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-indigo-500 transition-colors`}
                placeholder="******"
                autoFocus
              />
              <button 
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors tracking-widest"
              >
                VERIFICAR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
