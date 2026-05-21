import React, { useState } from 'react';
import { useAuth, Role } from '../context/AuthContext';
import { Utensils, Mail, Lock, User, CheckCircle2, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('garcom');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    // Simulate registration then auto-login
    login(email, role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[100px]" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-10 font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <User className="text-white w-8 h-8" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-white mb-2">
            Criar Nova Conta
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Preencha os dados abaixo para cadastrar um novo usuário no sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2 mt-2">Qual será o seu acesso?</label>
              <div className="grid grid-cols-3 gap-2">
                {(['garcom', 'caixa', 'gerencia'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all flex flex-col items-center gap-1 ${
                      role === r 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {r === 'garcom' && <Utensils className="w-4 h-4" />}
                    {r === 'caixa' && <CheckCircle2 className="w-4 h-4" />}
                    {r === 'gerencia' && <Shield className="w-4 h-4" />}
                    <span className="capitalize">{r === 'garcom' ? 'Garçom' : r === 'caixa' ? 'Caixa' : 'Gerência'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-4">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Email corporativo ou nome de usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                placeholder="Crie uma Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl py-4 shadow-lg shadow-orange-500/25 transition-all mt-4"
            >
              Confirmar Cadastro
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Já tem uma conta?
              <Link to="/login" className="ml-2 text-amber-500 hover:text-amber-400 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
