
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, DollarSign, 
  ShoppingCart, LayoutGrid, Receipt, 
  Package, Tags, Database, Coffee, 
  Users, Heart, Smartphone,
  ShieldCheck, Settings, UserCog, X, FileText, Lock, Bike, Moon, Sun, Share2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { useLowStock } from '../hooks/useLowStock';
import { UpgradePlan } from './UpgradePlan';
import { useState } from 'react';

const menuGroups = [
  {
    title: 'Gestão',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', minPlan: 'basic' },
      { icon: TrendingUp, label: 'Relatórios', path: '/admin/relatorios', minPlan: 'basic' },
      { icon: DollarSign, label: 'Fluxo de Caixa', path: '/admin/financeiro', minPlan: 'basic' },
    ]
  },
  {
    title: 'Operação',
    items: [
      { icon: Smartphone, label: 'Novo Pedido', path: '/pedidos', roles: ['garcom', 'gerencia'], minPlan: 'basic' },
      { icon: ShoppingCart, label: 'PDV', path: '/pdv', roles: ['caixa', 'gerencia'] },
      { icon: LayoutGrid, label: 'Mesas', path: '/mesas', roles: ['garcom', 'caixa', 'gerencia'], minPlan: 'basic' },
      { icon: Receipt, label: 'Caixa', path: '/caixa', roles: ['caixa', 'gerencia'] },
      { icon: Package, label: 'Delivery/iFood', path: '/delivery', roles: ['caixa', 'gerencia'], minPlan: 'basic' },
    ]
  },
  {
    title: 'Controle',
    items: [
      { icon: Package, label: 'Produtos', path: '/admin/produtos', roles: ['gerencia', 'caixa'] },
      { icon: Tags, label: 'Categorias', path: '/admin/categorias', roles: ['gerencia', 'caixa'] },
      { icon: Database, label: 'Complementos', path: '/admin/complementos', roles: ['gerencia', 'caixa'] },
      { icon: Database, label: 'Estoque', path: '/admin/estoque', minPlan: 'basic' },
      { icon: FileText, label: 'Importar XML', path: '/admin/estoque/importar', minPlan: 'basic' },
      { icon: Coffee, label: 'Ingredientes', path: '/admin/ingredientes', minPlan: 'basic' },
    ]
  },
  {
    title: 'Clientes',
    items: [
      { icon: Users, label: 'CRM', path: '/admin/crm', minPlan: 'basic' },
      { icon: Heart, label: 'Fidelidade', path: '/admin/fidelidade', minPlan: 'basic' },
    ]
  },
  {
    title: 'Administração',
    items: [
      { icon: Users, label: 'Equipe / PIN', path: '/admin/equipe', minPlan: 'basic' },
      { icon: UserCog, label: 'Usuários', path: '/admin/usuarios', minPlan: 'basic' },
      { icon: Bike, label: 'Motoboys', path: '/admin/motoboys', minPlan: 'basic' },
      { icon: ShieldCheck, label: 'Permissões', path: '/admin/permissoes', minPlan: 'basic' },
      { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
      { icon: Smartphone, label: 'Site Delivery', path: '/admin/delivery-settings', minPlan: 'pro' },
    ]
  }
];

const hasPlanAccess = (userPlan: string | undefined, minPlan: string | undefined) => {
  if (!minPlan) return true;
  const plan = (userPlan || 'start').toLowerCase();
  
  if (minPlan === 'pro') return plan === 'pro' || plan === 'annual';
  if (minPlan === 'basic') return plan === 'basic' || plan === 'pro' || plan === 'annual';
  return true;
};

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const { items: lowStockItems } = useLowStock();
  const lowStockCount = lowStockItems.length;
  const { theme, toggleTheme } = useTheme();
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [requiredPlanForModal, setRequiredPlanForModal] = useState('basic');

  const handleBlockedClick = (e: React.MouseEvent, minPlan: string) => {
    e.preventDefault();
    setRequiredPlanForModal(minPlan);
    setUpgradeModalOpen(true);
  };

  const handleCopyDeliveryLink = () => {
    if (!user?.companyId) return;
    const url = `${window.location.origin}/delivery/${user.companyId}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado com sucesso!\n\n${url}\n\nCole na bio do Instagram ou envie aos clientes no WhatsApp.`);
  };

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

                  // Plan restriction logic
                  const hasAccess = hasPlanAccess(user?.plan, (item as any).minPlan);
                  
                  return (
                    <li key={i}>
                      {hasAccess ? (
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
                          <span className="flex-1">{item.label}</span>
                          {item.label === 'Estoque' && lowStockCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              {lowStockCount}
                            </span>
                          )}
                        </NavLink>
                      ) : (
                        <div 
                          onClick={(e) => handleBlockedClick(e, (item as any).minPlan)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-900/50 hover:text-slate-400 cursor-pointer transition-all"
                        >
                          <item.icon className="w-5 h-5 opacity-50" />
                          <span className="flex-1 opacity-50">{item.label}</span>
                          <Lock className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all text-sm group"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" /> : <Moon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          
          <button
            onClick={handleCopyDeliveryLink}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-600/20 text-sm group"
          >
            <Share2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            Copiar Link Delivery
          </button>

          {isInstallable && (
            <button
              onClick={installApp}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-600/20 text-sm group"
            >
              <Smartphone className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
              Instalar Aplicativo
            </button>
          )}
        </div>
      </div>

      <UpgradePlan 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        requiredPlan={requiredPlanForModal} 
      />
    </aside>
  );
};
