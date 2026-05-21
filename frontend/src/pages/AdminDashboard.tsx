
import { Layout } from '../components/Layout';
import { TrendingUp, DollarSign, Activity, Users, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

const dataFaturamento = [
  { name: 'Seg', atual: 4000, altura: 'h-[40%]' },
  { name: 'Ter', atual: 3000, altura: 'h-[30%]' },
  { name: 'Qua', atual: 8000, altura: 'h-[80%]' },
  { name: 'Qui', atual: 2780, altura: 'h-[27%]' },
  { name: 'Sex', atual: 5890, altura: 'h-[58%]' },
  { name: 'Sáb', atual: 9390, altura: 'h-[93%]' },
  { name: 'Dom', atual: 7490, altura: 'h-[74%]' },
];

const dataProdutos = [
  { name: 'X-Burger', vendas: 120, pct: 'w-[100%]' },
  { name: 'Pizza', vendas: 98, pct: 'w-[80%]' },
  { name: 'Refrigerante', vendas: 150, pct: 'w-[60%]' },
  { name: 'Fritas', vendas: 86, pct: 'w-[40%]' },
  { name: 'Cerveja', vendas: 110, pct: 'w-[30%]' },
];

const dataPagamento = [
  { name: 'PIX', value: '45%', color: 'bg-indigo-500' },
  { name: 'Cartão de Crédito', value: '30%', color: 'bg-emerald-500' },
  { name: 'Dinheiro', value: '15%', color: 'bg-amber-500' },
  { name: 'Débito', value: '10%', color: 'bg-purple-500' },
];

export const AdminDashboard = () => {
  return (
    <Layout title="Dashboard Gerencial">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Faturamento Hoje', value: 'R$ 4.250,00', icon: DollarSign, trend: '+12.5%', isUp: true, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { title: 'Faturamento Mensal', value: 'R$ 45.890,00', icon: Activity, trend: '+5.2%', isUp: true, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { title: 'Ticket Médio', value: 'R$ 38,50', icon: TrendingUp, trend: '-2.1%', isUp: false, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { title: 'Lucro Estimado (Mês)', value: 'R$ 18.200,00', icon: Users, trend: '+8.4%', isUp: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((card, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg} group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <button className="text-slate-500 hover:text-slate-300">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-slate-400 font-medium text-sm mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-white">{card.value}</h3>
            </div>
            <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${card.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {card.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{card.trend}</span>
              <span className="text-slate-500 font-normal ml-1">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart (CSS Mock) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Faturamento Diário</h3>
              <p className="text-sm text-slate-400">Acompanhamento dos últimos 7 dias</p>
            </div>
            <select className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none">
              <option>Esta semana</option>
              <option>Semana passada</option>
            </select>
          </div>
          
          <div className="h-[250px] w-full flex items-end justify-between gap-2 px-2">
            {dataFaturamento.map((dia, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded-md mb-2">
                  R$ {dia.atual}
                </div>
                <div className={`w-full max-w-[40px] ${dia.altura} bg-gradient-to-t from-indigo-600/50 to-indigo-500 rounded-t-lg group-hover:from-indigo-500 group-hover:to-indigo-400 transition-all`}></div>
                <span className="text-xs text-slate-500 font-medium mt-3">{dia.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods (CSS Mock) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Métodos de Pagamento</h3>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Pseudo-Pie Chart Visual */}
            <div className="w-40 h-40 rounded-full border-[16px] border-slate-800 relative mx-auto mb-8 shadow-inner flex items-center justify-center">
               <div className="text-center">
                 <span className="block text-2xl font-black text-white">45%</span>
                 <span className="text-xs text-slate-400 uppercase font-bold">PIX</span>
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
                    <span className="text-sm font-medium text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products (CSS Mock) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Produtos Mais Vendidos</h3>
          </div>
          
          <div className="space-y-6 mt-4">
            {dataProdutos.map((prod, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-white">{prod.name}</span>
                  <span className="text-sm font-bold text-slate-400">{prod.vendas} un.</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
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
