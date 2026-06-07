import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Award, Users, Search, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  loyalty_points: number;
  created_at: string;
}

export const Loyalty = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <Layout title="Fidelidade & CRM">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Programa de Fidelidade</h2>
            <p className="text-slate-400 text-sm">Acompanhe a pontuação dos seus clientes (1 Ponto = R$ 1,00)</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
          <p>Carregando clientes...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="p-4 text-sm font-semibold text-slate-400">Cliente</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">WhatsApp</th>
                  <th className="p-4 text-sm font-semibold text-slate-400">Cadastrado em</th>
                  <th className="p-4 text-sm font-semibold text-amber-500 text-right">Pontos Acumulados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                          {customer.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span className="font-medium text-white">{customer.name || 'Cliente Sem Nome'}</span>
                        {index < 3 && search === '' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider">
                            Top {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{customer.phone}</td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xl font-black text-amber-500">
                        {customer.loyalty_points}
                      </span>
                      <span className="text-sm text-amber-500/50 ml-1">pts</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};
