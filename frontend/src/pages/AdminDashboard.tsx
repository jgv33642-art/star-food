import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { TrendingUp, DollarSign, Activity, Users, ArrowUpRight, MoreHorizontal, Loader2, Package } from 'lucide-react';
import { api } from '../lib/api';
import { useLowStock } from '../hooks/useLowStock';

const dataFaturamento = [
  { name: 'Seg', atual: 0, altura: 'h-[0%]' },
  { name: 'Ter', atual: 0, altura: 'h-[0%]' },
  { name: 'Qua', atual: 0, altura: 'h-[0%]' },
  { name: 'Qui', atual: 0, altura: 'h-[0%]' },
  { name: 'Sex', atual: 0, altura: 'h-[0%]' },
  { name: 'Sáb', atual: 0, altura: 'h-[0%]' },
  { name: 'Dom', atual: 0, altura: 'h-[0%]' },
];

const dataProdutos = [
  { name: 'Nenhum item vendido', vendas: 0, pct: 'w-[0%]' }
];

const dataPagamento = [
  { name: 'PIX', value: '0%', color: 'bg-indigo-500' },
  { name: 'Cartão de Crédito', value: '0%', color: 'bg-emerald-500' },
  { name: 'Dinheiro', value: '0%', color: 'bg-amber-500' },
  { name: 'Débito', value: '0%', color: 'bg-purple-500' },
];

interface DashboardStats {
  today_revenue?: number;
  month_revenue?: number;
  avg_ticket?: number;
  active_orders?: number;
  open_tables?: number;
  total_tables?: number;
}

function formatBRL(value: number | undefined): string {
  if (value === undefined || value === null) return '—';
  return `R$ ${Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { items: lowStockItems } = useLowStock();

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then((data) => setStats(data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: 'Faturamento Hoje',
      value: loading ? null : formatBRL(stats?.today_revenue),
      icon: DollarSign,
      trend: '+12.5%',
      isUp: true,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      title: 'Faturamento Mensal',
      value: loading ? null : formatBRL(stats?.month_revenue),
      icon: Activity,
      trend: '+5.2%',
      isUp: true,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Ticket Médio',
      value: loading ? null : formatBRL(stats?.avg_ticket),
      icon: TrendingUp,
      trend: '-2.1%',
      isUp: false,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Mesas Abertas',
      value: loading ? null : stats?.open_tables !== undefined ? `${stats.open_tables} / ${stats.total_tables ?? '?'}` : '—',
      icon: Users,
      trend: '+8.4%',
      isUp: true,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <Layout title="Dashboard Gerencial">

      {/* Critical Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400 shrink-0">
              <Package className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Alerta: Itens com Estoque Crítico!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Existem {lowStockItems.length} item(ns) com quantidade igual ou abaixo do estoque mínimo.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lowStockItems.slice(0, 5).map(item => (
                  <span key={item.id} className="bg-red-500/20 border border-red-500/30 text-white text-xs px-2.5 py-1 rounded-lg">
                    {item.name} ({item.stock_quantity}/{item.minimum_stock})
                  </span>
                ))}
                {lowStockItems.length > 5 && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-1 rounded-lg">
                    e mais {lowStockItems.length - 5}...
                  </span>
                )}
              </div>
            </div>
          </div>
          <a
            href="/admin/estoque"
            className="shrink-0 bg-red-500 hover:bg-red-600 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-red-500/25 transition-all text-center"
          >
            Gerenciar Estoque
          </a>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-300 dark:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg} group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <button className="text-slate-500 hover:text-slate-700 dark:text-slate-300">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-1">{card.title}</p>
              {card.value === null ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  <span className="text-slate-500 text-sm">Carregando...</span>
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</h3>
              )}
            </div>
            <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${card.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              <ArrowUpRight className="w-4 h-4" />
              <span>{card.trend}</span>
              <span className="text-slate-500 font-normal ml-1">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Chart (CSS Mock) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Faturamento Diário</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Acompanhamento dos últimos 7 dias</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none">
              <option>Esta semana</option>
              <option>Semana passada</option>
            </select>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="h-[250px] min-w-[350px] w-full flex items-end justify-between gap-2 px-2">
              {dataFaturamento.map((dia, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mb-2">
                    R$ {dia.atual}
                  </div>
                  <div className={`w-full max-w-[40px] ${dia.altura} bg-gradient-to-t from-indigo-600/50 to-indigo-500 rounded-t-lg group-hover:from-indigo-500 group-hover:to-indigo-400 transition-all`}></div>
                  <span className="text-xs text-slate-500 font-medium mt-3">{dia.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods (CSS Mock) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Métodos de Pagamento</h3>

          <div className="flex-1 flex flex-col justify-center">
            {/* Pseudo-Pie Chart Visual */}
            <div className="w-40 h-40 rounded-full border-[16px] border-slate-200 dark:border-slate-800 relative mx-auto mb-8 shadow-inner flex items-center justify-center">
              <div className="text-center">
                <span className="block text-2xl font-black text-slate-900 dark:text-white">45%</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">PIX</span>
              </div>
              {/* Decorative highlights */}
              <div className="absolute top-[-16px] right-[-16px] w-20 h-20 border-[16px] border-indigo-500 rounded-tr-full rounded-bl-full opacity-80 mix-blend-screen"></div>
              <div className="absolute bottom-[-16px] left-[-16px] w-16 h-16 border-[16px] border-emerald-500 rounded-bl-full rounded-tr-full opacity-80 mix-blend-screen"></div>
            </div>

            <div className="space-y-4">
              {dataPagamento.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products (CSS Mock) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Produtos Mais Vendidos</h3>
          </div>

          <div className="space-y-6 mt-4">
            {dataProdutos.map((prod, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{prod.name}</span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{prod.vendas} un.</span>
                </div>
                <div className="w-full h-3 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className={`h-full bg-emerald-500 rounded-full ${prod.pct}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};
