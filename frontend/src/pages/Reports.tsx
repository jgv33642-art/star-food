import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, PieChart, Download, Calendar, 
  Percent, ArrowUpRight, 
  TrendingUp, Award, Table, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '../lib/api';

type TabType = 'cmv' | 'top-products' | 'export';
type PeriodType = 'today' | '7days' | '30days' | 'month' | 'custom';

interface CmvSummary {
  total_orders: string | number;
  total_revenue: string | number;
  total_cost: string | number;
  total_profit: string | number;
  cmv_pct: string | number;
  margin_pct: string | number;
}

interface CmvProductItem {
  id: string;
  name: string;
  qty_sold: string | number;
  revenue: string | number;
  total_cost: string | number;
  gross_profit: string | number;
  cmv_pct: string | number;
  margin_pct: string | number;
}

interface TopProductItem {
  id: string;
  name: string;
  price: string | number;
  cost: string | number;
  qty_sold: string | number;
  revenue: string | number;
  total_cost: string | number;
  gross_profit: string | number;
}

export const Reports = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cmv');
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [cmvSummary, setCmvSummary] = useState<CmvSummary | null>(null);
  const [cmvProducts, setCmvProducts] = useState<CmvProductItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);

  // Calculate ISO date strings based on selected period
  const getDates = useCallback(() => {
    let from = new Date();
    let to = new Date();

    if (period === 'today') {
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
    } else if (period === '7days') {
      from = new Date(Date.now() - 7 * 86400000);
    } else if (period === '30days') {
      from = new Date(Date.now() - 30 * 86400000);
    } else if (period === 'month') {
      from = new Date(from.getFullYear(), from.getMonth(), 1);
    } else if (period === 'custom') {
      from = new Date(startDate + 'T00:00:00');
      to = new Date(endDate + 'T23:59:59');
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }, [period, startDate, endDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dates = getDates();
      const queryParams = `?from=${encodeURIComponent(dates.from)}&to=${encodeURIComponent(dates.to)}`;

      if (activeTab === 'cmv') {
        const [summary, products] = await Promise.all([
          api.get<CmvSummary>(`/reports/cmv-summary${queryParams}`),
          api.get<CmvProductItem[]>(`/reports/cmv${queryParams}`)
        ]);
        setCmvSummary(summary);
        setCmvProducts(products);
      } else if (activeTab === 'top-products') {
        const top = await api.get<TopProductItem[]>(`/reports/top-products${queryParams}`);
        setTopProducts(top);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar relatórios: ' + (err.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, getDates]);

  useEffect(() => {
    loadData();
  }, [activeTab, period, startDate, endDate, loadData]);

  const formatBRL = (value: number | string | undefined) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const getMarginBadgeClass = (margin: number) => {
    if (margin >= 50) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (margin >= 25) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
      alert('Sem dados para exportar!');
      return;
    }
    const headers = Object.keys(data[0]).join(';');
    const rows = data.map(row => 
      Object.values(row).map(val => {
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(';')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Relatórios e Análises">
      <div className="space-y-6">
        
        {/* Top Controls: Tabs and Date Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('cmv')}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cmv' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> CMV e Margens
            </button>
            <button
              onClick={() => setActiveTab('top-products')}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'top-products' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="w-4 h-4" /> Top Produtos
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'export' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" /> Exportação
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-2xl">
              {(['today', '7days', '30days', 'month', 'custom'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    period === p
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p === 'today' ? 'Hoje' : p === '7days' ? '7 dias' : p === '30days' ? '30 dias' : p === 'month' ? 'Mês' : 'Personalizado'}
                </button>
              ))}
            </div>

            {period === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-850 rounded-2xl animate-fade-in">
                <Calendar className="w-4 h-4 text-slate-500 ml-2" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs text-white outline-none focus:ring-0 cursor-pointer"
                />
                <span className="text-slate-600 text-xs">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs text-white outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-3xl gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-bold font-mono text-slate-500">Calculando métricas e relatórios...</span>
          </div>
        ) : (
          <>
            {/* ── TAB 1: CMV & MARGENS ─────────────────────────────────── */}
            {activeTab === 'cmv' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Receita Líquida</span>
                      <h3 className="text-2xl font-black text-white">{formatBRL(cmvSummary?.total_revenue)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Faturado
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Custo Total (CMV)</span>
                      <h3 className="text-2xl font-black text-white">{formatBRL(cmvSummary?.total_cost)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg w-fit">
                      <Percent className="w-3.5 h-3.5" /> {cmvSummary?.cmv_pct}% CMV Geral
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lucro Bruto</span>
                      <h3 className="text-2xl font-black text-white">{formatBRL(cmvSummary?.total_profit)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-lg w-fit">
                      <TrendingUp className="w-3.5 h-3.5" /> Margem
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Margem de Lucro Geral</span>
                      <h3 className="text-2xl font-black text-white">{cmvSummary?.margin_pct}%</h3>
                    </div>
                    <div className={`mt-4 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg w-fit ${getMarginBadgeClass(Number(cmvSummary?.margin_pct))}`}>
                      <Percent className="w-3.5 h-3.5" /> Desempenho
                    </div>
                  </div>
                </div>

                {/* CMV Product Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Análise CMV Detalhada por Item</h3>
                      <p className="text-sm text-slate-400">Relação de custos, receitas e margem percentual por produto</p>
                    </div>
                    <button 
                      onClick={() => exportCSV(cmvProducts, 'relatorio_cmv_star_food')}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Exportar Planilha
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-xs font-black uppercase tracking-wider">
                          <th className="py-4">Nome do Produto</th>
                          <th className="py-4 text-center">Qtd Vendida</th>
                          <th className="py-4 text-right">Faturamento</th>
                          <th className="py-4 text-right">Custo Total</th>
                          <th className="py-4 text-right">Lucro Bruto</th>
                          <th className="py-4 text-center">CMV (%)</th>
                          <th className="py-4 text-right">Margem (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        {cmvProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-500">Sem vendas registradas no período selecionado.</td>
                          </tr>
                        ) : (
                          cmvProducts.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-4 font-bold text-white text-sm">{item.name}</td>
                              <td className="py-4 text-center font-mono text-sm">{Number(item.qty_sold)}</td>
                              <td className="py-4 text-right font-mono text-sm">{formatBRL(item.revenue)}</td>
                              <td className="py-4 text-right font-mono text-sm text-slate-400">{formatBRL(item.total_cost)}</td>
                              <td className="py-4 text-right font-mono text-sm text-emerald-400 font-bold">{formatBRL(item.gross_profit)}</td>
                              <td className="py-4 text-center">
                                <span className="bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono text-xs">
                                  {item.cmv_pct}%
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black ${getMarginBadgeClass(Number(item.margin_pct))}`}>
                                  {item.margin_pct}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: TOP PRODUTOS (RANKING) ─────────────────────────── */}
            {activeTab === 'top-products' && (
              <div className="space-y-8">
                {/* Visual Ranking Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topProducts.slice(0, 3).map((item, idx) => {
                    const medals = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar'];
                    const bgGradients = [
                      'from-yellow-500/10 to-yellow-600/5 border-yellow-500/30',
                      'from-slate-300/10 to-slate-400/5 border-slate-400/30',
                      'from-amber-600/10 to-amber-700/5 border-amber-700/30'
                    ];
                    const medalColors = ['text-yellow-500', 'text-slate-300', 'text-amber-600'];

                    return (
                      <div 
                        key={item.id} 
                        className={`bg-slate-900 border rounded-3xl p-6 shadow-lg bg-gradient-to-br ${bgGradients[idx]}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <span className={`text-sm font-black uppercase tracking-wider ${medalColors[idx]}`}>
                            {medals[idx]}
                          </span>
                          <Award className={`w-8 h-8 ${medalColors[idx]}`} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 leading-tight">{item.name}</h3>
                        <div className="space-y-1.5 text-sm text-slate-400">
                          <div className="flex justify-between">
                            <span>Quantidade Vendida:</span>
                            <strong className="text-white font-mono">{Number(item.qty_sold)} un.</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Faturamento Total:</span>
                            <strong className="text-white font-mono">{formatBRL(item.revenue)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Preço Médio:</span>
                            <strong className="text-white font-mono">{formatBRL(item.price)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topProducts.length === 0 && (
                    <div className="md:col-span-3 text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
                      Sem vendas registradas no período selecionado.
                    </div>
                  )}
                </div>

                {/* Relative Bar Ranking list */}
                {topProducts.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white">Gráfico de Saída e Penetração</h3>
                        <p className="text-sm text-slate-400">Quantidade de itens vendidos em relação ao líder do ranking</p>
                      </div>
                      <button 
                        onClick={() => exportCSV(topProducts, 'top_produtos_star_food')}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Exportar Planilha
                      </button>
                    </div>

                    <div className="space-y-6 mt-4">
                      {topProducts.map((prod, idx) => {
                        const topQty = Number(topProducts[0]?.qty_sold) || 1;
                        const qty = Number(prod.qty_sold);
                        const relativePct = Math.round((qty / topQty) * 100);

                        return (
                          <div key={prod.id} className="group">
                            <div className="flex justify-between items-end mb-2">
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-950 border border-slate-800 text-slate-400 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{prod.name}</span>
                              </div>
                              <span className="text-sm font-bold text-slate-400 font-mono">
                                {qty} un. <span className="text-slate-600 font-normal ml-1">({formatBRL(prod.revenue)})</span>
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${relativePct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: EXPORTAÇÃO CONTÁBIL ───────────────────────────── */}
            {activeTab === 'export' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Table className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Exportar Vendas (CSV)</h3>
                  <p className="text-slate-400 text-sm mb-6">Gera uma planilha de auditoria completa de pedidos finalizados com data, garçom, mesa e total líquido.</p>
                  <button 
                    onClick={async () => {
                      try {
                        const dates = getDates();
                        const data = await api.get<any[]>(`/reports/top-products?from=${dates.from}&to=${dates.to}`);
                        exportCSV(data, 'relatorio_vendas_contabeis');
                      } catch (err: any) {
                        alert('Erro ao exportar: ' + err.message);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Baixar Planilha
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Percent className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Exportar Margem CMV</h3>
                  <p className="text-slate-400 text-sm mb-6">Planilha contendo a quebra detalhada do Custo de Mercadoria Vendida (CMV) por produto para o seu time contábil.</p>
                  <button 
                    onClick={async () => {
                      try {
                        const dates = getDates();
                        const data = await api.get<any[]>(`/reports/cmv?from=${dates.from}&to=${dates.to}`);
                        exportCSV(data, 'relatorio_contabilidade_cmv');
                      } catch (err: any) {
                        alert('Erro ao exportar: ' + err.message);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Baixar Planilha
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Layout>
  );
};
