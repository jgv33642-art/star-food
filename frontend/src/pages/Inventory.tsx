import { useState } from 'react';
import { Layout } from '../components/Layout';
import { PackageOpen, AlertTriangle, Plus, Search } from 'lucide-react';

const INVENTORY = [
  { id: 1, name: 'Pão de Hambúrguer', unit: 'un', current: 150, min: 50, status: 'ok' },
  { id: 2, name: 'Carne Bovina 150g', unit: 'un', current: 40, min: 100, status: 'low' },
  { id: 3, name: 'Mussarela Fatiada', unit: 'kg', current: 2.5, min: 5, status: 'low' },
  { id: 4, name: 'Bacon em Cubos', unit: 'kg', current: 10, min: 3, status: 'ok' },
  { id: 5, name: 'Tomate', unit: 'kg', current: 0.5, min: 2, status: 'critical' },
];

export const Inventory = () => {
  const [search, setSearch] = useState('');

  return (
    <Layout title="Controle de Estoque">
      <div className="space-y-6">

        {/* Warning Banner */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="text-red-500 font-bold">Atenção ao Estoque!</h4>
            <p className="text-red-400/80 text-sm mt-1">Existem 2 itens abaixo do nível mínimo recomendado e 1 item em estado crítico.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar ingrediente ou insumo..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Entrada de Estoque
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {INVENTORY.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                item.status === 'ok' ? 'bg-emerald-500' :
                item.status === 'low' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                  <p className="text-slate-500 text-sm">Estoque Mínimo: {item.min} {item.unit}</p>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <PackageOpen className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="flex items-end gap-2 mb-6">
                <span className={`text-4xl font-black ${
                  item.status === 'ok' ? 'text-emerald-500' :
                  item.status === 'low' ? 'text-amber-500' : 'text-red-500'
                }`}>{item.current}</span>
                <span className="text-slate-400 text-lg mb-1">{item.unit}</span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    item.status === 'ok' ? 'bg-emerald-500' :
                    item.status === 'low' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (item.current / item.min) * 50)}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-slate-500 font-medium uppercase tracking-wider">{item.status === 'ok' ? 'Nível Seguro' : item.status === 'low' ? 'Baixo' : 'Crítico'}</p>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
};
