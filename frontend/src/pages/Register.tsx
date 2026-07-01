import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Building2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export const Register = () => {
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !userName || !email || !password) return;

    setLoading(true);
    setError('');

    try {
      await register(companyName, userName, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative ">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-[100px]" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors z-10 font-medium">
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <User className="text-slate-900 dark:text-white w-8 h-8" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Criar Nova Conta
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
            Preencha os dados abaixo para cadastrar sua empresa no sistema.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Nome da empresa / lanchonete"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Seu Nome Completo"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="E-mail de Acesso"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                placeholder="Crie uma Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white font-bold rounded-xl py-4 shadow-lg shadow-orange-500/25 transition-all mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Confirmar Cadastro'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
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
