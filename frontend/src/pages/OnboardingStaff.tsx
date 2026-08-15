import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Trash2,
  CheckCircle2, X, Loader2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

const roleLabel = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'gerencia') return 'Gerente / Dono';
  if (r === 'cashier' || r === 'caixa') return 'Caixa / Operador';
  if (r === 'waiter' || r === 'garcom') return 'Garçom / Lançador';
  return role;
};

const roleBadgeClass = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'gerencia') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  if (r === 'cashier' || r === 'caixa') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
};

const roleIcon = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'gerencia') return '👑';
  if (r === 'cashier' || r === 'caixa') return '💳';
  return '🍽️';
};

const PinDots = ({ length, filled }: { length: number; filled: number }) => (
  <div className="flex gap-3 justify-center my-4">
    {Array.from({ length }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ scale: i < filled ? 1.2 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`w-4 h-4 rounded-full border-2 transition-all ${
          i < filled
            ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/40'
            : 'bg-transparent border-slate-600'
        }`}
      />
    ))}
  </div>
);

export const OnboardingStaff = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'cashier' | 'waiter'>('manager');
  const [formPin, setFormPin] = useState('');
  const [formPinConfirm, setFormPinConfirm] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.get<StaffMember[]>('/users');
      // Todos da empresa que o admin acabou de criar
      setStaff(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const resetCreateForm = () => {
    setFormName('');
    setFormRole('manager');
    setFormPin('');
    setFormPinConfirm('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handlePinpadKey = (key: string, isConfirm = false) => {
    if (key === 'del') {
      if (isConfirm) setFormPinConfirm(p => p.slice(0, -1));
      else setFormPin(p => p.slice(0, -1));
    } else {
      if (isConfirm) setFormPinConfirm(p => (p.length < 6 ? p + key : p));
      else setFormPin(p => (p.length < 6 ? p + key : p));
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError('Nome deve ter ao menos 2 caracteres.');
      return;
    }
    if (!/^\d{3,}$/.test(formPin)) {
      setFormError('O PIN deve conter apenas números e no mínimo 3 dígitos.');
      return;
    }
    if (formPin !== formPinConfirm) {
      setFormError('Os PINs não coincidem. Confirme corretamente.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/users/staff', {
        name: formName.trim(),
        role: formRole,
        pin: formPin
      });
      setIsCreateOpen(false);
      resetCreateForm();
      await fetchStaff();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar funcionário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Deseja desativar o acesso deste funcionário?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/${id}`);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = () => {
    // Validar se há ao menos um usuário com PIN (email === null indica que é um usuário PIN ou apenas que ele tem um PIN)
    // O backend cria usuários via `/users/staff` com email null.
    const hasPinUser = staff.some(s => s.email === null || s.email === undefined || s.email === '');
    
    if (!hasPinUser) {
      alert('Por favor, cadastre ao menos um Gerente ou Funcionário com PIN para poder acessar o sistema via PIN.');
      return;
    }
    // Limpa o slug para forçar o usuário a fazer o login do Estabelecimento primeiro (email e senha)
    localStorage.removeItem('@Lanchonete:companySlug');
    // Sucesso! Logout e joga para a tela de login
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-10 relative overflow-hidden mt-10 z-10">
        
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex justify-center items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" /> Cadastre sua Equipe
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-lg mx-auto">
            Para acessar o PDV e os painéis, você precisa de um acesso rápido. Cadastre seu Gerente (ou você mesmo) e outros funcionários com um <strong>PIN numérico</strong>.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start mb-8 text-amber-600 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Atenção:</strong> Cadastre pelo menos 1 Gerente com PIN para conseguir fazer login e usar o sistema.
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 min-h-[200px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Equipe com PIN de Acesso</h3>
            <button
              onClick={handleOpenCreate}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : staff.filter(s => !s.email).length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 font-medium">Nenhum funcionário com PIN cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.filter(s => !s.email).map(member => (
                <div key={member.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{roleIcon(member.role)}</div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                      <p className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${roleBadgeClass(member.role)}`}>{roleLabel(member.role)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteStaff(member.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center border-t border-slate-200 dark:border-slate-800/50 pt-8">
          <button 
            onClick={handleFinish}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black py-4 px-12 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex justify-center items-center gap-3 text-lg cursor-pointer"
          >
            <CheckCircle2 className="w-6 h-6" />
            Concluir e Ir para Login
          </button>
        </div>

      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-500" /> Novo Acesso com PIN
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-white cursor-pointer"><X className="w-6 h-6"/></button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nome Completo</label>
                  <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" placeholder="João da Silva" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Função</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'manager', label: 'Gerente', icon: '👑', color: 'indigo' },
                      { value: 'cashier', label: 'Caixa', icon: '💳', color: 'emerald' },
                      { value: 'waiter', label: 'Garçom', icon: '🍽️', color: 'amber' }
                    ].map(opt => (
                      <button type="button" key={opt.value} onClick={() => setFormRole(opt.value as any)} className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer ${formRole === opt.value ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                        <span className="text-xl">{opt.icon}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 text-center">Definir PIN Numérico</label>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <p className="text-center text-xs text-slate-500 font-bold">Criar PIN</p>
                    <PinDots length={6} filled={formPin.length} />
                    {formPin.length >= 3 && (
                      <>
                        <p className="text-center text-xs text-slate-500 font-bold mt-2">Confirmar PIN</p>
                        <PinDots length={6} filled={formPinConfirm.length} />
                      </>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                        <button type="button" key={i} onClick={() => { if(k) handlePinpadKey(k, formPin.length >= 3); }} className={`h-12 rounded-xl font-bold text-lg cursor-pointer ${!k ? 'invisible' : k==='del' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                          {k === 'del' ? '⌫' : k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {formError && <div className="text-red-500 text-sm font-bold bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{formError}</div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-3 rounded-xl cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer">
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <UserPlus className="w-5 h-5"/>} Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
