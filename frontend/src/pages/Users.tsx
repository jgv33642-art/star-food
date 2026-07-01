import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, UserPlus, Shield, 
  Trash2, Mail, Lock, User, 
  Sparkles, CreditCard, AlertTriangle, ShieldCheck, 
  RefreshCw, Edit2, UserCheck, X
} from 'lucide-react';
import { api } from '../lib/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: string;
  created_at: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  plan: 'basic' | 'pro';
  extra_cashiers: number;
  extra_managers: number;
  extra_waiters: number;
  usage: {
    managers: number;
    cashiers: number;
    waiters: number;
  };
  limits: {
    managers: number | null;
    cashiers: number | null;
    waiters: number | null;
  };
}

export const Users = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [, setError] = useState('');
  
  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'cashier' | 'waiter'>('waiter');
  
  // Simulated payment modal
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    type: 'upgrade' | 'seat';
    role?: 'manager' | 'cashier' | 'waiter';
    price: number;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const fetchCompanyAndUsers = async () => {
    try {
      const companyData = await api.get<CompanyInfo>('/companies/my');
      setCompany(companyData);

      const usersList = await api.get<UserItem[]>('/users');
      setUsers(usersList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao carregar colaboradores e dados do plano.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyAndUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('waiter');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    // Map backend role to form role selector
    const r = user.role.toLowerCase();
    if (r === 'admin' || r === 'manager') setFormRole('manager');
    else if (r === 'cashier') setFormRole('cashier');
    else setFormRole('waiter');
    setIsModalOpen(true);
  };

  // Check if target role limit is reached (frontend preview)
  const isLimitReached = (role: 'manager' | 'cashier' | 'waiter'): boolean => {
    if (!company || company.plan === 'pro') return false;
    
    const count = company.usage[role === 'manager' ? 'managers' : role === 'cashier' ? 'cashiers' : 'waiters'];
    const limit = company.limits[role === 'manager' ? 'managers' : role === 'cashier' ? 'cashiers' : 'waiters'] || 0;
    
    // If editing a user and their role is not changing, we don't block them
    if (editingUser) {
      const origRole = editingUser.role.toLowerCase();
      const isOrigManager = (origRole === 'admin' || origRole === 'manager') && role === 'manager';
      const isOrigCashier = origRole === 'cashier' && role === 'cashier';
      const isOrigWaiter = origRole === 'waiter' && role === 'waiter';
      if (isOrigManager || isOrigCashier || isOrigWaiter) {
        return false;
      }
    }
    
    return count >= limit;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached(formRole)) {
      alert('Limite de acessos para este cargo atingido! Faça upgrade para o Pro ou compre mais vagas.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      if (editingUser) {
        // Edit User
        await api.put(`/users/${editingUser.id}`, {
          name: formName,
          email: formEmail,
          role: formRole,
          password: formPassword || undefined
        });
      } else {
        // Create User
        await api.post('/users', {
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole
        });
      }
      setIsModalOpen(false);
      await fetchCompanyAndUsers();
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar colaborador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Deseja desativar o acesso deste colaborador?')) return;

    setActionLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      await fetchCompanyAndUsers();
    } catch (err: any) {
      alert(err.message || 'Falha ao desativar colaborador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserItem) => {
    setActionLoading(true);
    try {
      await api.put(`/users/${user.id}`, {
        active: !user.active
      });
      await fetchCompanyAndUsers();
    } catch (err: any) {
      alert(err.message || 'Falha ao alterar status.');
    } finally {
      setActionLoading(false);
    }
  };

  // simulated payment flow
  const handleOpenPayment = (type: 'upgrade' | 'seat', role?: 'manager' | 'cashier' | 'waiter') => {
    let price = 0;
    if (type === 'upgrade') price = 149.90;
    else {
      if (role === 'manager') price = 14.90;
      else if (role === 'cashier') price = 9.90;
      else price = 4.90;
    }
    setPaymentModal({ isOpen: true, type, role, price });
    setPixCopied(false);
  };

  const handleConfirmSimulatedPayment = async () => {
    if (!paymentModal || !company) return;
    setActionLoading(true);

    try {
      if (paymentModal.type === 'upgrade') {
        // Call backend upgrade
        await api.post('/companies/upgrade', { plan: 'pro' });
      } else if (paymentModal.type === 'seat' && paymentModal.role) {
        // Call backend purchase seat
        await api.post('/companies/purchase-seats', { role: paymentModal.role, quantity: 1 });
      }
      setPaymentModal(null);
      await fetchCompanyAndUsers();
      alert('Pagamento processado com sucesso! Acessos atualizados.');
    } catch (err: any) {
      alert(err.message || 'Erro ao processar alteração.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatRole = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin' || r === 'manager') return 'Dono / Gerente';
    if (r === 'cashier') return 'Caixa';
    if (r === 'waiter') return 'Garçom';
    return role;
  };

  return (
    <Layout title="Gestão de Colaboradores">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <span className="text-slate-600 dark:text-slate-400 font-bold">Carregando dados da equipe...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Sessão de Assinatura & Limites do Plano */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  company?.plan === 'pro' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-slate-900 dark:text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Plano {company?.plan === 'pro' ? 'Secondary (PRO)' : 'Primary (Básico)'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">Limite de Acessos Simultâneos</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Seus acessos de login para funcionários estão limitados conforme o plano ativo do restaurante.
                </p>
              </div>

              {company?.plan === 'basic' ? (
                <button
                  onClick={() => handleOpenPayment('upgrade')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-slate-900 dark:text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  Upgrade para Plano Pro (Ilimitado)
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                  Plano Completo Liberado
                </div>
              )}
            </div>

            {/* Gauges / Consumo de Vagas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              {/* Gerencia */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Dono & Gerentes</span>
                    <Shield className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    {company?.usage.managers} / {company?.plan === 'pro' ? '∞' : company?.limits.managers}
                  </h4>
                  <div className="w-full bg-white dark:bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200 dark:border-slate-800">
                    <div 
                      className={`h-full bg-indigo-500 transition-all duration-500`}
                      style={{ 
                        width: company?.plan === 'pro' ? '100%' : `${Math.min(100, ((company?.usage.managers || 0) / (company?.limits.managers || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                {company?.plan === 'basic' && (
                  <button 
                    onClick={() => handleOpenPayment('seat', 'manager')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-black mt-4 flex items-center gap-1.5 transition-colors self-start"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Adquirir Vaga Extra (R$ 14,90/mês)
                  </button>
                )}
              </div>

              {/* Caixa */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Caixas</span>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    {company?.usage.cashiers} / {company?.plan === 'pro' ? '∞' : company?.limits.cashiers}
                  </h4>
                  <div className="w-full bg-white dark:bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200 dark:border-slate-800">
                    <div 
                      className={`h-full bg-emerald-500 transition-all duration-500`}
                      style={{ 
                        width: company?.plan === 'pro' ? '100%' : `${Math.min(100, ((company?.usage.cashiers || 0) / (company?.limits.cashiers || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                {company?.plan === 'basic' && (
                  <button 
                    onClick={() => handleOpenPayment('seat', 'cashier')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-black mt-4 flex items-center gap-1.5 transition-colors self-start"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Adquirir Vaga Extra (R$ 9,90/mês)
                  </button>
                )}
              </div>

              {/* Garcom */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Garçons</span>
                    <UsersIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    {company?.usage.waiters} / {company?.plan === 'pro' ? '∞' : company?.limits.waiters}
                  </h4>
                  <div className="w-full bg-white dark:bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200 dark:border-slate-800">
                    <div 
                      className={`h-full bg-amber-500 transition-all duration-500`}
                      style={{ 
                        width: company?.plan === 'pro' ? '100%' : `${Math.min(100, ((company?.usage.waiters || 0) / (company?.limits.waiters || 4)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                {company?.plan === 'basic' && (
                  <button 
                    onClick={() => handleOpenPayment('seat', 'waiter')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-black mt-4 flex items-center gap-1.5 transition-colors self-start"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Adquirir Vaga Extra (R$ 4,90/mês)
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Listagem de Colaboradores */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Funcionários Cadastrados</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Gerencie quem tem login e permissão de uso no sistema.</p>
              </div>
              
              <button
                onClick={handleOpenCreateModal}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm transition-all hover:scale-[1.02]"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Colaborador
              </button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <UsersIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="font-bold text-slate-600 dark:text-slate-400">Nenhum funcionário cadastrado</h4>
                <p className="text-slate-500 text-xs mt-1">Adicione o primeiro garçom, caixa ou gerente acima.</p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Colaborador</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">E-mail</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Cargo</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-850 hover:bg-white dark:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold uppercase text-xs">
                            {u.name.substring(0, 2)}
                          </div>
                          {u.name}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-sm">{u.email}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'manager'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                            : u.role.toLowerCase() === 'cashier'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                          }`}>
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              u.active 
                              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-red-500/10 hover:text-red-500' 
                              : 'bg-red-500/10 text-red-500 hover:bg-emerald-500/10 hover:text-emerald-500'
                            }`}
                            title={u.active ? 'Clique para desativar' : 'Clique para ativar'}
                          >
                            {u.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
                            title="Editar colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-500 hover:text-red-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
                            title="Excluir/Desativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Criação / Edição de Colaborador */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-6 right-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingUser ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Cadastre credenciais e cargos de trabalho.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                          type="text"
                          required
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">E-mail de Login</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                          type="email"
                          required
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          placeholder="Ex: joao@restaurante.com"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {editingUser ? 'Senha (Deixe em branco para manter)' : 'Senha de Acesso'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                          type="password"
                          required={!editingUser}
                          value={formPassword}
                          onChange={e => setFormPassword(e.target.value)}
                          placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Cargo / Funções</label>
                      <select 
                        value={formRole}
                        onChange={e => setFormRole(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="waiter">Garçom</option>
                        <option value="cashier">Caixa (PDV)</option>
                        <option value="manager">Dono / Gerente</option>
                      </select>
                    </div>

                    {/* Exibe aviso se ultrapassou o limite do plano */}
                    {isLimitReached(formRole) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3 text-xs flex gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Limite do Cargo Atingido</span>
                          Você já está usando todas as vagas permitidas de {formRole === 'waiter' ? 'Garçom' : formRole === 'cashier' ? 'Caixa' : 'Gerente'} do plano Básico.
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-4 border-t border-slate-850 mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="bg-slate-50 dark:bg-slate-950 hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading || isLimitReached(formRole)}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                      >
                        {actionLoading ? 'Processando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal de Simulação de Pagamento (QR Code PIX) */}
          <AnimatePresence>
            {paymentModal?.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl relative"
                >
                  <button 
                    onClick={() => setPaymentModal(null)}
                    className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Simulação de Pagamento</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mb-6 px-4">
                    {paymentModal.type === 'upgrade' 
                      ? 'Upgrade para o Plano PRO com acessos ilimitados por R$ 149,90/mês' 
                      : `Adquirir vaga adicional para ${
                          paymentModal.role === 'manager' ? 'Dono/Gerente (R$ 14,90/mês)' : paymentModal.role === 'cashier' ? 'Caixa (R$ 9,90/mês)' : 'Garçom (R$ 4,90/mês)'
                        }`
                    }
                  </p>

                  {/* Fictional PIX QR Code */}
                  <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto mb-4 flex items-center justify-center border border-slate-200 shadow-inner">
                    <div className="w-full h-full border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-900">
                      <div className="grid grid-cols-5 gap-1.5 w-28 h-28 opacity-80">
                        {Array.from({ length: 25 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-full h-full ${
                              idx % 2 === 0 || idx % 3 === 0 ? 'bg-slate-50 dark:bg-slate-950' : 'bg-transparent'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-500 mt-2 tracking-widest">QR Code PIX</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPixCopied(true);
                      navigator.clipboard.writeText('00020101021226830014br.gov.bcb.pix2561pix-fake-star-food-mrr-payment-simulation-code-key-fake540510.005802BR5915StarFoodSaaSPay6009SaoPaulo62070503***6304CA12');
                      setTimeout(() => setPixCopied(false), 2500);
                    }}
                    className={`text-xs font-bold px-4 py-2 rounded-full border transition-all mb-6 ${
                      pixCopied 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:text-white'
                    }`}
                  >
                    {pixCopied ? 'Copiado!' : 'Copiar Código Copia e Cola'}
                  </button>

                  <div className="space-y-3 pt-4 border-t border-slate-850">
                    <button
                      onClick={handleConfirmSimulatedPayment}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                    >
                      Confirmar Pagamento Simulado
                    </button>
                    <button
                      onClick={() => setPaymentModal(null)}
                      className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </Layout>
  );
};
