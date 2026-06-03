
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User, Bell, ChevronDown, Moon, Menu, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

export const Header = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const { user, logout } = useAuth();
  const { isOnline, queueLength, isSyncing, syncQueue } = useOfflineQueue();

  return (
    <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 w-full">
      <div className="flex items-center gap-4">
        <button onClick={onOpenMenu} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 items-center gap-2 cursor-pointer hover:border-slate-700 transition-colors">
          <span className="text-sm font-semibold text-white">Matriz - Centro</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Offline & Sync Indicator */}
        {!isOnline ? (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
            <WifiOff className="w-4 h-4" />
            <span>Sem Conexão</span>
          </div>
        ) : queueLength > 0 ? (
          <button 
            onClick={syncQueue}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 text-amber-500 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Pendente ({queueLength})</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
            <Wifi className="w-4 h-4" />
            <span>Online</span>
          </div>
        )}

        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Moon className="w-5 h-5" />
        </button>
        
        <div className="h-8 w-px bg-slate-800 mx-2"></div>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold uppercase shadow-sm">
            {user?.name?.charAt(0)}
          </div>
          
          {/* Simple Dropdown Mock */}
          <div className="hidden group-hover:block absolute top-16 right-8 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl py-2 z-50">
            <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
              <User className="w-4 h-4" /> Perfil
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configurações
            </button>
            <div className="h-px bg-slate-800 my-2"></div>
            <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
