import { Layout } from '../../components/Layout';
import { ShieldCheck, Check, Minus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const permissionsData = [
  { module: 'Dashboard & Relatórios', gerencia: true, caixa: false, garcom: false },
  { module: 'Gestão Financeira', gerencia: true, caixa: false, garcom: false },
  { module: 'Cadastro de Produtos', gerencia: true, caixa: true, garcom: false },
  { module: 'Frente de Caixa (PDV)', gerencia: true, caixa: true, garcom: false },
  { module: 'Abertura/Fechamento de Caixa', gerencia: true, caixa: true, garcom: false },
  { module: 'Gestão de Mesas', gerencia: true, caixa: true, garcom: true },
  { module: 'Lançar Pedidos', gerencia: true, caixa: true, garcom: true },
  { module: 'Gestão de Delivery', gerencia: true, caixa: true, garcom: false },
  { module: 'Gestão de Equipe', gerencia: true, caixa: false, garcom: false },
  { module: 'Configurações do Sistema', gerencia: true, caixa: false, garcom: false },
  { module: 'Cancelar/Estornar Vendas', gerencia: true, caixa: false, garcom: false },
];

export const Permissions = () => {
  return (
    <Layout title="Controle de Permissões">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Matriz de Acessos</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Visualize o que cada cargo pode fazer no sistema.</p>
          </div>
        </div>
        
        <Link 
          to="/admin/equipe"
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-2.5 px-5 rounded-xl transition-all"
        >
          Gerenciar Equipe
        </Link>
      </div>

      <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex gap-3 text-sky-600 dark:text-sky-400 text-sm">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p>
          <strong>Segurança em Primeiro Lugar:</strong> Neste sistema, as permissões são rigidamente atreladas aos cargos (Gerência, Caixa e Garçom) para evitar brechas de segurança ou configurações acidentais. Se um funcionário precisa de mais acesso, altere o cargo dele na aba de <Link to="/admin/equipe" className="underline font-bold">Equipe</Link>.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 w-1/3">Módulo / Função</th>
                <th className="p-4 text-sm font-bold text-rose-500 text-center">Gerência</th>
                <th className="p-4 text-sm font-bold text-indigo-500 text-center">Caixa</th>
                <th className="p-4 text-sm font-bold text-emerald-500 text-center">Garçom</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {permissionsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 text-slate-900 dark:text-white font-medium">{row.module}</td>
                  <td className="p-4 text-center">
                    {row.gerencia ? (
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500 border border-rose-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.caixa ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-500 border border-indigo-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.garcom ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
