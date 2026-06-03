import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { AppearanceTab } from './AppearanceTab';
import { WorkingHoursTab } from './WorkingHoursTab';
import { DeliveryPaymentTab } from './DeliveryPaymentTab';

export const DeliverySettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const hasPremiumPlan = () => {
    if (!user?.plan) return false;
    const p = user.plan.toLowerCase();
    return p === 'annual' || p === 'pro' || p === 'premium';
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Connect to backend API: POST /api/settings/save
    setTimeout(() => setIsSaving(false), 1000);
  };

  if (!hasPremiumPlan()) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <h2 className="text-3xl font-black text-white mb-4">Recurso Premium</h2>
        <p className="text-slate-400 mb-8 text-lg">
          O Módulo de Site Delivery com White Label exclusivo e controle de taxas em tempo real
          está disponível apenas nos planos Anual ou Pro.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition-transform text-white font-bold py-4 px-8 rounded-2xl shadow-lg">
          Fazer Upgrade de Plano
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Delivery Próprio</h1>
          <p className="text-slate-400 mt-2">Customize o visual, os horários e as taxas do seu site.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 md:mt-0 bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* TABS HEADER */}
      <div className="flex overflow-x-auto gap-2 mb-8 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        <button 
          onClick={() => setActiveTab('appearance')}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
            ${activeTab === 'appearance' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Aparência do Site
        </button>
        <button 
          onClick={() => setActiveTab('hours')}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
            ${activeTab === 'hours' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Funcionamento
        </button>
        <button 
          onClick={() => setActiveTab('delivery')}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
            ${activeTab === 'delivery' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Entrega e Pagamento
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-slate-900/30 p-6 md:p-8 rounded-3xl border border-slate-800">
        {activeTab === 'appearance' && <AppearanceTab initialSettings={settings} companyId="company-id" />}
        {activeTab === 'hours' && <WorkingHoursTab initialSettings={settings} />}
        {activeTab === 'delivery' && <DeliveryPaymentTab initialSettings={settings} />}
      </div>
    </div>
  );
};
