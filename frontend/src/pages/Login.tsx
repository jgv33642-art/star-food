import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Utensils, Mail, Lock, ArrowLeft, Smartphone, Hash, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { api } from '../lib/api';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

const roleLabel = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return 'Gerente';
  if (r === 'cashier') return 'Caixa';
  return 'Garçom';
};

const roleIcon = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return '👑';
  if (r === 'cashier') return '💳';
  return '🍽️';
};

const roleColor = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return 'border-indigo-500/40 bg-indigo-500/10';
  if (r === 'cashier') return 'border-emerald-500/40 bg-emerald-500/10';
  return 'border-amber-500/40 bg-amber-500/10';
};

/** Animated PIN dots */
const PinDisplay = ({ pin, maxLen = 6 }: { pin: string; maxLen?: number }) => (
  <div className="flex gap-3 justify-center my-5">
    {Array.from({ length: maxLen }).map((_, i) => (
      <motion.div
        key={i}
        animate={{
          scale: i === pin.length - 1 ? [1, 1.3, 1] : 1,
          backgroundColor: i < pin.length ? '#6366f1' : 'transparent'
        }}
        transition={{ duration: 0.15 }}
        className={`w-5 h-5 rounded-full border-2 transition-colors ${
          i < pin.length ? 'border-indigo-500 shadow-lg shadow-indigo-500/40' : 'border-slate-600'
        }`}
      />
    ))}
  </div>
);

export const Login = () => {
  // Tab: 'email' | 'pin'
  const [mode, setMode] = useState<'email' | 'pin'>('email');

  // Email/Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // PIN mode
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinShaking, setPinShaking] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWA();

  // Load staff list when switching to PIN mode
  useEffect(() => {
    if (mode === 'pin') {
      loadStaff();
    }
  }, [mode]);

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      let data: StaffMember[] = [];

      // Strategy 1: if the user is already authenticated (e.g. manager switching account),
      // use the secure authenticated endpoint — companyId comes from the token, not from client.
      const token = localStorage.getItem('@Lanchonete:token');
      if (token) {
        try {
          data = await api.get<StaffMember[]>('/auth/staff');
          setStaffList(Array.isArray(data) ? data : []);
          return;
        } catch {
          // Token may be expired — fall through to slug strategy
        }
      }

      // Strategy 2: resolve company by slug (human-readable name) stored locally.
      // The client NEVER sends a raw UUID — only the company's public slug.
      const savedUser = localStorage.getItem('@Lanchonete:user');
      let companySlug = '';
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Build slug from stored company name if available, otherwise skip
          companySlug = (parsed.companyName || parsed.company || '').toLowerCase().replace(/\s+/g, '-');
        } catch {}
      }

      if (!companySlug) {
        // No slug available — cannot load staff without first doing an email login
        setStaffList([]);
        return;
      }

      data = await api.get<StaffMember[]>(`/auth/staff/public/${encodeURIComponent(companySlug)}`);
      setStaffList(Array.isArray(data) ? data : []);
    } catch {
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN numpad key press
  const handlePinKey = (key: string) => {
    if (key === 'del') {
      setPin(p => p.slice(0, -1));
      setPinError('');
    } else if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      // Auto-submit when user reaches 4+ digits and presses further (optional UX)
    }
  };

  // Submit PIN login
  const handlePinLogin = async () => {
    if (!selectedStaff || pin.length < 3) return;
    setPinError('');
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: any }>('/auth/login-pin', {
        userId: selectedStaff.id,
        pin
      });

      // Map role and persist
      const role = res.user.role?.toLowerCase();
      const mappedRole =
        role === 'admin' || role === 'manager' ? 'gerencia' :
        role === 'cashier' ? 'caixa' : 'garcom';

      loginWithToken(res.token, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: mappedRole as any,
        companyId: res.user.companyId || res.user.company_id || '',
      });

      navigate('/');
    } catch (err: any) {
      // Wrong PIN — shake animation
      setPinError(err.message || 'PIN incorreto.');
      setPinShaking(true);
      setPin('');
      setTimeout(() => setPinShaking(false), 600);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit PIN when length >= 4 (configurable; remove if unwanted)
  useEffect(() => {
    if (pin.length >= 4 && selectedStaff) {
      const timer = setTimeout(() => {
        handlePinLogin();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-x-hidden">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[100px]" />
      <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px]" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-10 font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Utensils className="text-white w-8 h-8" />
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl mb-4 shadow-lg">
          <button
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'email'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" /> E-mail / Senha
          </button>
          <button
            onClick={() => { setMode('pin'); setError(''); setSelectedStaff(null); setPin(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              mode === 'pin'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" /> Login por PIN
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ===== E-MAIL MODE ===== */}
          {mode === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-center text-white mb-1">Bem-vindo de volta</h2>
                <p className="text-slate-400 text-center text-sm mb-7">Login do Gerente / Administrador</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="E-mail corporativo"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold text-lg rounded-xl py-4 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando...</>
                    ) : 'Entrar no Sistema'}
                  </button>
                </form>

                <div className="mt-7 text-center">
                  <p className="text-slate-400 text-sm">
                    Não tem conta?{' '}
                    <Link to="/register" className="ml-1 text-amber-500 hover:text-amber-400 font-medium transition-colors">
                      Criar conta
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== PIN MODE ===== */}
          {mode === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <AnimatePresence mode="wait">

                {/* Step 1: Select Staff Member */}
                {!selectedStaff && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-bold text-center text-white mb-1">Quem está entrando?</h2>
                    <p className="text-slate-400 text-center text-sm mb-6">Selecione seu nome para continuar</p>

                    {staffLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                    ) : staffList.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">Nenhum funcionário cadastrado.</p>
                        <p className="text-xs mt-1">Use o login por e-mail acima ou peça ao gerente para cadastrar a equipe.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {staffList.map(member => (
                          <motion.button
                            key={member.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedStaff(member); setPin(''); setPinError(''); }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01] cursor-pointer ${roleColor(member.role)}`}
                          >
                            <span className="text-2xl">{roleIcon(member.role)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm truncate">{member.name}</p>
                              <p className="text-slate-400 text-xs">{roleLabel(member.role)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Enter PIN */}
                {selectedStaff && (
                  <motion.div
                    key="pinentry"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="p-6"
                  >
                    {/* Back + selected user display */}
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        onClick={() => { setSelectedStaff(null); setPin(''); setPinError(''); }}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center text-xl ${roleColor(selectedStaff.role)}`}>
                        {roleIcon(selectedStaff.role)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{selectedStaff.name}</p>
                        <p className="text-slate-400 text-xs">{roleLabel(selectedStaff.role)}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedStaff(null); setPin(''); setPinError(''); }}
                        className="ml-auto text-slate-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-center text-white font-bold text-lg">Digite seu PIN</h3>

                    {/* PIN Dots with shake animation */}
                    <motion.div
                      animate={pinShaking ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <PinDisplay pin={pin} maxLen={6} />
                    </motion.div>

                    {pinError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-red-400 text-xs font-bold mb-4"
                      >
                        {pinError}
                      </motion.p>
                    )}

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-3">
                      {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => k && handlePinKey(k)}
                          disabled={loading}
                          className={`h-16 rounded-2xl font-bold text-2xl transition-all active:scale-95 cursor-pointer ${
                            !k ? 'invisible' :
                            k === 'del'
                              ? 'bg-slate-800/80 text-slate-400 hover:bg-red-500/10 hover:text-red-400'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-white shadow-sm active:shadow-none border border-slate-700/50'
                          }`}
                        >
                          {k === 'del' ? '⌫' : k}
                        </button>
                      ))}
                    </div>

                    {/* Manual confirm button (fallback if auto-submit disabled) */}
                    {pin.length >= 3 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handlePinLogin}
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60 text-white font-bold text-lg rounded-2xl py-4 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
                          : 'Entrar'
                        }
                      </motion.button>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto">
          <button
            onClick={installApp}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900/90 border border-slate-800 text-white rounded-full text-sm font-bold shadow-2xl hover:bg-slate-800 hover:border-slate-700 transition-all hover:scale-105 active:scale-95 group"
          >
            <Smartphone className="w-4 h-4 text-amber-500 animate-bounce group-hover:scale-110 transition-transform" />
            <span>Instalar Aplicativo (PWA)</span>
          </button>
        </div>
      )}
    </div>
  );
};
