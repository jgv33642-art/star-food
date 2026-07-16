import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Users, Search, Loader2, MessageCircle, Filter, Send } from 'lucide-react';
import { api } from '../../lib/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  loyalty_points: number;
  created_at: string;
}

export const CRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'top' | 'novos'>('todos');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res as unknown as Customer[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSendCampaign = () => {
    alert('Funcionalidade de disparo em massa pelo WhatsApp em desenvolvimento! Em breve você poderá criar campanhas e promoções automáticas.');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=Olá! Tudo bem? Temos uma oferta especial da nossa lanchonete para você!`, '_blank');
  };

  let filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  if (filter === 'top') {
    filtered = filtered.sort((a, b) => b.loyalty_points - a.loyalty_points).slice(0, 10);
  } else if (filter === 'novos') {
    filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  }

  return (
    <Layout title="CRM & Marketing">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Users className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestão de Clientes (CRM)</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Gerencie o relacionamento, envie campanhas e retenha mais clientes.</p>
          </div>
        </div>

        <button 
          onClick={handleSendCampaign}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Send className="w-5 h-5" />
          Nova Campanha WhatsApp
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <button 
            onClick={() => setFilter('todos')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${filter === 'todos' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Filter className="w-4 h-4" /> Todos
          </button>
          <button 
            onClick={() => setFilter('top')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${filter === 'top' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            ⭐ Top 10 VIPs
          </button>
          <button 
            onClick={() => setFilter('novos')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${filter === 'novos' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            🌱 Mais Recentes
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <p>Carregando base de clientes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((customer) => (
            <div key={customer.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-500 transition-all flex flex-col group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20 text-lg group-hover:scale-110 transition-transform">
                  {customer.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{customer.name || 'Cliente'}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Membro desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 flex justify-between items-center mb-4">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pontos / LTV</span>
                <span className="font-black text-amber-500">{customer.loyalty_points} <span className="text-[10px] text-slate-400">pts</span></span>
              </div>

              <button 
                onClick={() => handleWhatsApp(customer.phone)}
                className="mt-auto w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white py-2.5 rounded-xl font-bold transition-all text-sm border border-emerald-500/20 hover:border-emerald-500"
              >
                <MessageCircle className="w-4 h-4" />
                Conversar
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
               <Users className="w-12 h-12 mb-3 opacity-20" />
               <p>Nenhum cliente encontrado com este filtro.</p>
             </div>
          )}
        </div>
      )}
    </Layout>
  );
};
