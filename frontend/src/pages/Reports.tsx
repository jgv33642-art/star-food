import { Layout } from '../components/Layout';
import { BarChart3, PieChart, FileText, Download } from 'lucide-react';

export const Reports = () => {
  return (
    <Layout title="Relatórios e Análises">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Vendas por Período</h3>
          <p className="text-slate-400 text-sm mb-6">Analise o volume de vendas filtrado por dias, semanas ou meses para entender os picos de movimento.</p>
          <button className="w-full bg-slate-950 border border-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-colors">
            <FileText className="w-4 h-4" /> Gerar Relatório
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer group">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PieChart className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Produtos mais Vendidos</h3>
          <p className="text-slate-400 text-sm mb-6">Descubra quais itens do cardápio geram mais lucro e quais estão com baixa saída na sua loja.</p>
          <button className="w-full bg-slate-950 border border-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
            <FileText className="w-4 h-4" /> Gerar Relatório
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-amber-500/50 transition-colors cursor-pointer group">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Download className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Exportação Contábil</h3>
          <p className="text-slate-400 text-sm mb-6">Exporte todos os dados de fluxo de caixa em formato Excel ou CSV para enviar para a sua contabilidade.</p>
          <button className="w-full bg-slate-950 border border-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:border-amber-500 transition-colors">
            <Download className="w-4 h-4" /> Baixar Planilha
          </button>
        </div>

      </div>
    </Layout>
  );
};
