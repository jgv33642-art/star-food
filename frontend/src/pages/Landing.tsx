import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, ArrowRight, ShieldCheck, Zap, BarChart3, Lock, X } from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();
  const [showDevModal, setShowDevModal] = useState(false);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

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
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Utensils className="text-white w-6 h-6" />
          </div>
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/checkout"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Adquirir Meu Acesso <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 text-lg font-bold rounded-2xl transition-all flex items-center justify-center"
            >
              Já sou cliente
            </Link>
          </div>
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
