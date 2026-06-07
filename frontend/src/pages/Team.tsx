import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Hash, Trash2,
  Edit2, CheckCircle2, X, Loader2, ShieldCheck,
  Eye, EyeOff, RefreshCw, UserCheck, AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';

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
  if (r === 'admin' || r === 'manager') return 'Gerente / Dono';
  if (r === 'cashier') return 'Caixa / Operador';
  if (r === 'waiter') return 'Garçom / Lançador';
  return role;
};

const roleBadgeClass = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  if (r === 'cashier') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
};

const roleIcon = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return '👑';
  if (r === 'cashier') return '💳';
  return '🍽️';
};

/** PIN dots display component */
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

export const Team = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'cashier' | 'waiter'>('waiter');
  const [formPin, setFormPin] = useState('');
  const [formPinConfirm, setFormPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit PIN modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editPinConfirm, setEditPinConfirm] = useState('');
  const [editError, setEditError] = useState('');

  // PIN Keypad for creation (mobile-first)
  const [usePinpad, setUsePinpad] = useState(true);
  const pinpadRef = useRef<HTMLInputElement>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.get<StaffMember[]>('/users');
      // Filter only cashier/waiter (equipe operacional)
      setStaff(data.filter(u => ['cashier', 'waiter', 'manager', 'admin'].includes(u.role.toLowerCase())));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const resetCreateForm = () => {
    setFormName('');
    setFormRole('waiter');
    setFormPin('');
    setFormPinConfirm('');
    setFormError('');
    setShowPin(false);
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

  const handleToggleActive = async (member: StaffMember) => {
    setActionLoading(true);
    try {
      await api.put(`/users/${member.id}`, { active: !member.active });
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
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

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!/^\d{3,}$/.test(editPin)) {
      setEditError('O PIN deve conter apenas números e no mínimo 3 dígitos.');
      return;
    }
    if (editPin !== editPinConfirm) {
      setEditError('Os PINs não coincidem.');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/users/${editingId}/pin`, { pin: editPin });
      setEditingId(null);
      setEditPin('');
      setEditPinConfirm('');
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const operationalStaff = staff.filter(u => ['cashier', 'waiter'].includes(u.role.toLowerCase()));
  const managers = staff.filter(u => ['admin', 'manager'].includes(u.role.toLowerCase()));

  return (
    <Layout title="Gerenciamento de Equipe">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-400" /> Equipe Operacional
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Cadastre garçons e caixas com acesso via PIN numérico — sem necessidade de e-mail.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-5 h-5" /> Adicionar Funcionário
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-indigo-300">Como funciona o login por PIN?</span><br />
            Na tela de login, o funcionário seleciona o próprio nome na lista e digita o PIN numérico (mínimo 3 dígitos) no teclado virtual. O PIN é armazenado de forma segura com criptografia bcrypt — nunca em texto puro.
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Operational staff grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Garçons & Caixas (Login por PIN)</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{operationalStaff.length} funcionário(s) cadastrado(s)</p>
                </div>
              </div>

              {operationalStaff.length === 0 ? (
                <div className="text-center py-14 px-6">
                  <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold">Nenhum funcionário operacional cadastrado ainda.</p>
                  <p className="text-slate-500 text-sm mt-1">Adicione garçons e caixas com PIN de acesso rápido.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {operationalStaff.map(member => (
                    <motion.div
                      key={member.id}
                      layout
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black border ${
                          member.role.toLowerCase() === 'cashier'
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {roleIcon(member.role)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{member.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${roleBadgeClass(member.role)}`}>
                            {roleLabel(member.role)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* PIN indicator */}
                        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-850">
                          <Hash className="w-3 h-3" /> PIN ●●●
                        </div>

                        {/* Active toggle */}
                        <button
                          onClick={() => handleToggleActive(member)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            member.active
                              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-red-500/10 hover:text-red-400'
                              : 'bg-red-500/10 text-red-400 hover:bg-emerald-500/10 hover:text-emerald-500'
                          }`}
                        >
                          {member.active ? 'Ativo' : 'Inativo'}
                        </button>

                        {/* Edit PIN */}
                        <button
                          onClick={() => { setEditingId(member.id); setEditPin(''); setEditPinConfirm(''); setEditError(''); }}
                          className="p-2 text-slate-500 hover:text-indigo-400 bg-slate-950/60 border border-slate-850 rounded-xl transition-colors cursor-pointer"
                          title="Alterar PIN"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          disabled={actionLoading}
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-950/60 border border-slate-850 rounded-xl transition-colors cursor-pointer"
                          title="Desativar funcionário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Managers section (read-only) */}
            {managers.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-800 bg-slate-950/20">
                  <h3 className="text-base font-bold text-white">Gerentes (Login por E-mail + Senha)</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Para gerenciar gerentes, acesse Administração → Usuários</p>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {managers.map(m => (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg">👑</div>
                      <div>
                        <p className="text-white font-bold text-sm">{m.name}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                          {roleLabel(m.role)}
                        </span>
                      </div>
                      <span className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold ${m.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                        {m.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* === MODAL DE CADASTRO === */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Novo Funcionário</h3>
                    <p className="text-slate-400 text-xs">Acesso rápido via PIN numérico</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Função / Cargo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'cashier', label: 'Caixa / Operador', icon: '💳', color: 'emerald' },
                      { value: 'waiter', label: 'Garçom / Lançador', icon: '🍽️', color: 'amber' }
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormRole(opt.value as 'cashier' | 'waiter')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          formRole === opt.value
                            ? opt.color === 'emerald'
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className={`text-xs font-bold ${
                          formRole === opt.value
                            ? opt.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                            : 'text-slate-400'
                        }`}>{opt.label}</span>
                        {formRole === opt.value && (
                          <CheckCircle2 className={`w-4 h-4 ${opt.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PIN */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIN de Acesso</label>
                    <button
                      type="button"
                      onClick={() => setUsePinpad(p => !p)}
                      className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {usePinpad ? 'Digitar manualmente' : 'Usar teclado PIN'}
                    </button>
                  </div>

                  {usePinpad ? (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <p className="text-center text-xs text-slate-500 font-semibold">Criar PIN</p>
                      <PinDots length={6} filled={formPin.length} />

                      {formPin.length >= 3 && (
                        <>
                          <p className="text-center text-xs text-slate-500 font-semibold mt-2">Confirmar PIN</p>
                          <PinDots length={6} filled={formPinConfirm.length} />
                        </>
                      )}

                      {/* Numpad */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              if (!k) return;
                              const isConfirmPhase = formPin.length >= 3;
                              handlePinpadKey(k, isConfirmPhase);
                            }}
                            className={`h-14 rounded-xl font-bold text-lg transition-all cursor-pointer ${
                              !k ? 'invisible' :
                              k === 'del'
                                ? 'bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 active:scale-95'
                                : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-sm'
                            }`}
                          >
                            {k === 'del' ? '⌫' : k}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                          ref={pinpadRef}
                          type={showPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="\d*"
                          value={formPin}
                          onChange={e => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Mínimo 3 dígitos"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.4em] font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="\d*"
                        value={formPinConfirm}
                        onChange={e => setFormPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Confirmar PIN"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.4em] font-bold"
                      />
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MODAL ALTERAR PIN === */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-indigo-400" /> Alterar PIN
                </h3>
                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdatePin} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Novo PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    value={editPin}
                    onChange={e => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Mínimo 3 dígitos"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.4em] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmar PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    value={editPinConfirm}
                    onChange={e => setEditPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Repita o PIN"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.4em] font-bold"
                  />
                </div>
                {editError && (
                  <p className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    {editError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all cursor-pointer">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
