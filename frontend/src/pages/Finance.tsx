import { useState } from 'react';
import { Layout } from '../components/Layout';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Search, Download, PieChart, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TRANSACTIONS = [
  { id: 'TRX-001', date: 'Hoje, 14:30', description: 'Venda PDV - Mesa 12', type: 'in', amount: 145.50, method: 'PIX' },
  { id: 'TRX-002', date: 'Hoje, 13:15', description: 'Venda PDV - Mesa 04', type: 'in', amount: 85.00, method: 'Cartão de Crédito' },
  { id: 'TRX-003', date: 'Hoje, 10:00', description: 'Pagamento Fornecedor (Bebidas)', type: 'out', amount: 450.00, method: 'Transferência' },
  { id: 'TRX-004', date: 'Ontem, 22:10', description: 'Venda PDV - Delivery', type: 'in', amount: 110.00, method: 'PIX' },
  { id: 'TRX-005', date: 'Ontem, 18:30', description: 'Conta de Luz', type: 'out', amount: 320.00, method: 'Boleto' },
];

export const Finance = () => {
  const [search, setSearch] = useState('');

  return (
    <Layout title="Fluxo de Caixa">
      <div className="space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <span className="text-emerald-500 text-sm font-bold flex items-center"><ArrowUpRight className="w-4 h-4 mr-1"/> +15%</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Entradas (Mês)</p>
            <h3 className="text-3xl font-black text-white mt-1">R$ 45.230,00</h3>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-red-500 text-sm font-bold flex items-center"><ArrowDownRight className="w-4 h-4 mr-1"/> -2%</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Saídas (Mês)</p>
            <h3 className="text-3xl font-black text-white mt-1">R$ 12.450,00</h3>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg shadow-indigo-500/25">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-indigo-100 text-sm font-medium">Saldo Atual</p>
            <h3 className="text-3xl font-black text-white mt-1">R$ 32.780,00</h3>
          </motion.div>
        </div>

        {/* Dashboards Avançados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* DRE Simplificado */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> DRE Simplificado (Mês)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">1. Receita Bruta</span>
                <span className="font-bold text-white">R$ 45.230,00</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">2. Custos Variáveis (CMV)</span>
                <span className="font-bold text-red-400">- R$ 12.450,00</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">3. Despesas Fixas (Aluguel, Luz)</span>
                <span className="font-bold text-red-400">- R$ 6.200,00</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">4. Taxas (Cartão/iFood)</span>
                <span className="font-bold text-orange-400">- R$ 1.850,00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-white">LUCRO LÍQUIDO</span>
                <span className="text-2xl font-black text-emerald-500">R$ 24.730,00</span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Canais de Venda */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-500" /> Vendas por Canal</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-300">Loja Virtual (Próprio)</span>
                    <span className="font-bold text-white">45%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-300">iFood</span>
                    <span className="font-bold text-white">35%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-300">Salão / Mesas</span>
                    <span className="font-bold text-white">20%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mapa de Calor Mock */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500" /> Horários de Pico</h3>
              <div className="flex items-end justify-between h-32 gap-2 mt-6">
                {[15, 30, 20, 60, 100, 80, 40].map((h, i) => (
                  <div key={i} className="w-full bg-slate-800 rounded-t-lg relative group">
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: `${h}%` }} 
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className={`absolute bottom-0 w-full rounded-t-lg ${h > 70 ? 'bg-emerald-500' : h > 40 ? 'bg-amber-500' : 'bg-slate-600'}`} 
                    />
                    <div className="absolute -bottom-6 w-full text-center text-xs text-slate-500">{16 + i}h</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-white">Histórico de Transações</h3>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar transação..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <button className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Método</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((trx) => (
                  <tr key={trx.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-400">{trx.id}</td>
                    <td className="py-4 px-6 text-sm text-white">{trx.date}</td>
                    <td className="py-4 px-6 text-sm font-medium text-white">{trx.description}</td>
                    <td className="py-4 px-6 text-sm text-slate-400">
                      <span className="bg-slate-800 px-3 py-1 rounded-lg text-xs">{trx.method}</span>
                    </td>
                    <td className={`py-4 px-6 text-sm font-bold text-right ${trx.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trx.type === 'in' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};
