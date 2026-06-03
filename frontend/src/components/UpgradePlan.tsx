import { useState } from 'react';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePlanProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: string;
}

export const UpgradePlan = ({ isOpen, onClose, requiredPlan }: UpgradePlanProps) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: requiredPlan })
      });

      const data = await response.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      alert('Não foi possível iniciar o pagamento no momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-8 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/20 blur-3xl rounded-full" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Recurso Premium</h2>
          <p className="text-slate-400 mb-8">
            Essa funcionalidade está disponível a partir do plano <span className="text-white font-bold capitalize">{requiredPlan}</span>. 
            Faça um upgrade agora para escalar ainda mais as suas vendas.
          </p>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Redirecionando...' : 'Fazer Upgrade Agora'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 hover:text-white font-medium mt-3"
          >
            Talvez mais tarde
          </button>
        </div>
      </div>
    </div>
  );
};
