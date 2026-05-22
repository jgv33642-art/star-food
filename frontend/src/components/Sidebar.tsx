
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, DollarSign, 
  ShoppingCart, LayoutGrid, Receipt, 
  Package, Tags, Database, Coffee, 
  Users, Heart, Smartphone,
  ShieldCheck, Settings, UserCog, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuGroups = [
  {
    title: 'Gestão',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: TrendingUp, label: 'Relatórios', path: '/admin/relatorios' },
      { icon: DollarSign, label: 'Fluxo de Caixa', path: '/admin/financeiro' },
    ]
  },
  {
    title: 'Operação',
    items: [
      { icon: Smartphone, label: 'Novo Pedido', path: '/pedidos', roles: ['garcom', 'gerencia'] },
      { icon: ShoppingCart, label: 'PDV', path: '/pdv', roles: ['caixa', 'gerencia'] },
      { icon: LayoutGrid, label: 'Mesas', path: '/mesas', roles: ['garcom', 'caixa', 'gerencia'] },
      { icon: Receipt, label: 'Caixa', path: '/caixa', roles: ['caixa', 'gerencia'] },
      { icon: Package, label: 'Delivery/iFood', path: '/delivery', roles: ['caixa', 'gerencia'] },
    ]
  },
  {
    title: 'Controle',
    items: [
      { icon: Package, label: 'Produtos', path: '/admin/produtos' },
      { icon: Tags, label: 'Categorias', path: '/admin/categorias' },
      { icon: Database, label: 'Estoque', path: '/admin/estoque' },
      { icon: Coffee, label: 'Ingredientes', path: '/admin/ingredientes' },
    ]
  },
  {
    title: 'Clientes',
    items: [
      { icon: Users, label: 'CRM', path: '/admin/crm' },
      { icon: Heart, label: 'Fidelidade', path: '/admin/fidelidade' },
    ]
  },
  {
    title: 'Administração',
    items: [
      { icon: UserCog, label: 'Usuários', path: '/admin/usuarios' },
      { icon: ShieldCheck, label: 'Permissões', path: '/admin/permissoes' },
      { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
    ]
  }
];

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();

  return (
    <aside className={`w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto custom-scrollbar z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Star Food" className="w-10 h-10 object-contain rounded-xl" />
            <span className="text-xl font-bold text-white tracking-tight">Star Food</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-8">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                {group.title}
              </h4>
              <ul className="space-y-1">
                {group.items.map((item, i) => {
                  // Role restriction logic
                  const allowedRoles = (item as any).roles || ['gerencia'];
                  if (!allowedRoles.includes(user?.role)) return null;
                  
                  return (
                    <li key={i}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                            isActive 
                            ? 'bg-indigo-500/10 text-indigo-400' 
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
