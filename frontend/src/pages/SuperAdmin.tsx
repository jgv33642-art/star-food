import { useState, useEffect } from 'react';
import { DollarSign, Users, Building, Shield, Save, Key, CreditCard, Lock, ListChecks, Plus, Trash2, Activity, Server, Database, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PLANS = [
  { id: '1', name: 'Básico', price: 89.90, features: ['Frente de Caixa (PDV)', 'Controle de Estoque', 'Gestão de Mesas', 'Suporte Padrão'] },
  { id: '2', name: 'Pro', price: 149.90, features: ['Todas do Plano Básico', 'Loja Virtual (Delivery Próprio)', 'Integração iFood', 'Suporte Prioritário'] },
];

export const SuperAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'planos' | 'gateway' | 'teste' | 'monitor'>('overview');
  
  const [healthData, setHealthData] = useState<Record<string, unknown> | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(false);
    try {
      const API_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000/api' : '/api';
      const res = await fetch(`${API_URL}/health`);
      if (res.ok || res.status === 503) {
        const data = await res.json();
        setHealthData(data);
      } else {
        setHealthError(true);
      }
    } catch (e) {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTab === 'monitor') {
      fetchHealth(); // Fetch immediately when opening the tab
      interval = setInterval(fetchHealth, 10000); // 10 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const [gatewayKey, setGatewayKey] = useState('');
  
  const [plans, setPlans] = useState(INITIAL_PLANS);

  const tenants = [
    { id: 'T001', name: 'Lanchonete do Zé', plan: 'Pro', status: 'Ativo', mrr: 149.90 },
    { id: 'T002', name: 'Burger & Co', plan: 'Básico', status: 'Ativo', mrr: 89.90 },
    { id: 'T003', name: 'Pizzaria Bella', plan: 'Pro', status: 'Inadimplente', mrr: 149.90 },
  ];

  const totalMRR = tenants.reduce((acc, curr) => curr.status === 'Ativo' ? acc + curr.mrr : acc, 0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '336421') {
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
      setPassword('');
    }
  };

  const addFeature = (planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: [...p.features, 'Nova Funcionalidade'] } : p));
  };

  const updateFeature = (planId: string, idx: number, value: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const newF = [...p.features];
        newF[idx] = value;
        return { ...p, features: newF };
      }
      return p;
    }));
  };

  const removeFeature = (planId: string, idx: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const newF = [...p.features];
        newF.splice(idx, 1);
        return { ...p, features: newF };
      }
      return p;
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Acesso Restrito</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Área exclusiva do Proprietário SaaS.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha mestre..." 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-slate-900 dark:text-white text-xl tracking-widest rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500 outline-none"
            />
            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">
              Desbloquear Painel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-300 flex">
      {/* Sidebar Simples do Super Admin */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="text-slate-900 dark:text-white w-5 h-5" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-lg">SaaS Master</span>
        </div>
        
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Building className="w-5 h-5" /> Restaurantes
        </button>

        <button 
          onClick={() => setActiveTab('planos')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'planos' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <ListChecks className="w-5 h-5" /> Planos & Preços
        </button>
        
        <button 
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'gateway' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <CreditCard className="w-5 h-5" /> Gateway & Receitas
        </button>

        <button 
          onClick={() => setActiveTab('teste')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'teste' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Building className="w-5 h-5" /> Ambiente de Teste
        </button>

        <button 
          onClick={() => { setActiveTab('monitor'); fetchHealth(); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'monitor' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Activity className="w-5 h-5" /> Saúde (Monitor)
        </button>
      </div>

      {/* Área Principal */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
          {activeTab === 'overview' ? 'Gestão de Assinantes (Tenants)' : 
           activeTab === 'planos' ? 'Configuração de Planos SaaS' : 
           activeTab === 'teste' ? 'Laboratório de Testes' : 
           activeTab === 'monitor' ? 'Monitor de Sistema em Tempo Real' : 'Gateway de Assinaturas'}
        </h1>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-2 text-slate-600 dark:text-slate-400"><Users className="w-5 h-5"/> Clientes Ativos</div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">2</h3>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-2 text-slate-600 dark:text-slate-400"><DollarSign className="w-5 h-5"/> MRR (Mensalidade)</div>
                <h3 className="text-4xl font-black text-emerald-400">R$ {totalMRR.toFixed(2)}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden mt-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Restaurante</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Plano</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mensalidade</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">{t.name}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{t.plan}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">R$ {t.mrr.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          t.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'planos' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-3xl">
              Defina os 3 pacotes que você vai vender na Landing Page. Para cada pacote, você pode escolher o nome, o valor cobrado mensalmente e quais ferramentas o restaurante terá direito.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col">
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nome do Plano</label>
                    <input 
                      type="text" 
                      value={plan.name}
                      onChange={(e) => setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xl font-black rounded-xl py-2 px-4 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Preço Mensal (R$)</label>
                    <input 
                      type="number" 
                      value={plan.price}
                      onChange={(e) => setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, price: Number(e.target.value) } : p))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-400 text-2xl font-black rounded-xl py-2 px-4 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-3">Funcionalidades Liberadas</label>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {plan.features.map((feat, idx) => (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} key={idx} className="flex gap-2">
                            <input 
                              type="text" 
                              value={feat}
                              onChange={(e) => updateFeature(plan.id, idx, e.target.value)}
                              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <button onClick={() => removeFeature(plan.id, idx)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => addFeature(plan.id)} className="w-full mt-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Funcionalidade
                    </button>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                    <button className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-colors">
                      Salvar Plano
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'gateway' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Key className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Chaves do seu Banco (Stripe/Mercado Pago)</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Configure aqui a chave da sua conta bancária/gateway. É para esta conta que o valor das mensalidades de todos os restaurantes vai cair automaticamente.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Secret Key do Gateway</label>
                  <input 
                    type="password" 
                    value={gatewayKey}
                    onChange={(e) => setGatewayKey(e.target.value)}
                    placeholder="sk_live_123456789..." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-4 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Esta chave nunca será compartilhada com os clientes (tenants).</p>
                </div>
              </div>

              <div className="mt-8">
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  <Save className="w-5 h-5" /> Atualizar Configuração de Cobrança
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'teste' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <Building className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ambiente de Testes</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Utilize esta área para validar e testar as novas ferramentas, integrações e atualizações que você está desenvolvendo para os restaurantes antes de liberá-las.
              </p>
              
              <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center">
                <p className="text-slate-500 mb-4">Adicione aqui seus componentes de teste, painéis de debug ou botões para disparar eventos simulados.</p>
                <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 px-6 rounded-xl transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Adicionar Novo Teste
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'monitor' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400">Visão global dos servidores (API e Banco de Dados).</p>
              <button 
                onClick={fetchHealth} 
                disabled={healthLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Activity className={`w-5 h-5 ${healthLoading ? 'animate-spin' : ''}`} /> 
                {healthLoading ? 'Escaneando...' : 'Atualizar Manualmente'}
              </button>
            </div>

            {healthError && !healthData ? (
               <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500">
                 <AlertTriangle className="w-8 h-8 shrink-0" />
                 <div>
                   <h3 className="font-bold text-lg">Servidor Principal Offline!</h3>
                   <p className="text-sm">A API não respondeu ou caiu completamente (Erro 502/Connection Refused).</p>
                 </div>
               </div>
            ) : healthData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Uptime Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 mb-4 text-slate-600 dark:text-slate-400">
                    <Server className="w-6 h-6 text-blue-500"/> API Core
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {Math.floor(Number(healthData.uptime_seconds) / 3600)}h {Math.floor((Number(healthData.uptime_seconds) % 3600) / 60)}m
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-bold text-emerald-500">Online & Saudável</span>
                  </div>
                </div>

                {/* Database Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 mb-4 text-slate-600 dark:text-slate-400">
                    <Database className="w-6 h-6 text-amber-500"/> Supabase DB
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {(healthData.services as any)?.database?.latency ?? '-'} ms
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      {(healthData.services as any)?.database?.status === 'up' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_red]"></span>
                      )}
                    </span>
                    <span className={`text-sm font-bold ${(healthData.services as any)?.database?.status === 'up' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                      {(healthData.services as any)?.database?.status === 'up' ? 'Conexão Estável' : 'BANCO DE DADOS CAIU!'}
                    </span>
                  </div>
                </div>

                {/* Memory Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 mb-4 text-slate-600 dark:text-slate-400">
                    <Activity className="w-6 h-6 text-purple-500"/> Memória (RAM)
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {healthData.memory ? (Number((healthData.memory as any).heapUsed) / 1024 / 1024).toFixed(1) : '-'} MB
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (Number((healthData.memory as any)?.heapUsed) / Number((healthData.memory as any)?.heapTotal)) * 100 || 0)}%` }}></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-right">de {healthData.memory ? (Number((healthData.memory as any).heapTotal) / 1024 / 1024).toFixed(0) : '-'} MB (Heap)</p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 animate-pulse">
                Iniciando monitoramento dos serviços...
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
