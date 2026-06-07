import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  User, 
  Server, 
  RefreshCw, 
  LogIn,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DiagData {
  backend: {
    status: string;
    port: string;
    nodeEnv: string;
  };
  database: {
    status: 'connected' | 'error' | 'checking';
    message: string;
  };
  companies: Array<{
    id: string;
    name: string;
    document?: string;
    phone?: string;
    email?: string;
    plan: string;
    active: boolean;
    created_at: string;
  }>;
}

export const DevPanel = () => {
  const [diag, setDiag] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingCompanyId, setUpdatingCompanyId] = useState<string | null>(null);
  const [dbUrl, setDbUrl] = useState('');
  const [savingDbUrl, setSavingDbUrl] = useState(false);

  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/dev'
    : '/api/dev';

  const fetchDiagnostics = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/diagnostics`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setDiag(data);
      setErrorMessage(null);
    } catch (err: any) {
      setDiag({
        backend: { status: 'offline', port: '3000', nodeEnv: 'development' },
        database: { status: 'error', message: 'Backend inacessível.' },
        companies: []
      });
      setErrorMessage('Servidor offline. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics(true);
    const interval = setInterval(() => fetchDiagnostics(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRepair = async () => {
    if (repairing) return;
    setRepairing(true);
    try {
      const res = await fetch(`${API_URL}/repair`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Banco de dados sincronizado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.error || 'Falha ao sincronizar banco de dados.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao tentar sincronizar.');
    } finally {
      setRepairing(false);
      fetchDiagnostics(false);
    }
  };

  const handleUpdateCompany = async (companyId: string, currentPlan: string, currentActive: boolean) => {
    setUpdatingCompanyId(companyId);
    try {
      const res = await fetch(`${API_URL}/update-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, plan: currentPlan, active: currentActive })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Dados atualizados com sucesso!');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchDiagnostics(false);
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar dados.');
      }
    } catch (err: any) {
      setErrorMessage('Erro ao comunicar com o servidor.');
    } finally {
      setUpdatingCompanyId(null);
    }
  };

  const handleSaveDbUrl = async () => {
    if (!dbUrl.trim()) return setErrorMessage('Insira uma conexão válida.');
    setSavingDbUrl(true);
    try {
      const res = await fetch(`${API_URL}/update-env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: dbUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Conexão atualizada com sucesso!');
        setDbUrl('');
        fetchDiagnostics(false);
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar conexão.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de rede.');
    } finally {
      setSavingDbUrl(false);
    }
  };

  const handleLoginAsTenant = (company: any) => {
    loginWithToken('dev-token-bypass', {
      id: `dev-user-${company.id}`,
      name: `Admin - ${company.name}`,
      email: company.email || 'admin@' + company.id + '.com',
      role: 'gerencia',
      companyId: company.id,
      plan: company.plan
    });
    navigate('/');
  };

  const handleLoginLocalTest = () => {
    loginWithToken('dev-token-local-test', {
      id: 'dev-user-local-test',
      name: 'Admin Local',
      email: 'test@local.dev',
      role: 'gerencia',
      companyId: 'local-test-company-id',
      plan: 'pro'
    });
    navigate('/');
  };

  const dbStatus = diag?.database.status || 'checking';
  const apiStatus = diag?.backend.status === 'offline' ? 'offline' : 'connected';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Settings className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-lg">Painel Administrativo</h1>
              <p className="text-xs text-slate-500 font-medium">Gestão de Clientes e Sistema</p>
            </div>
          </div>
          <Link to="/" className="text-slate-600 hover:text-indigo-600 flex items-center gap-2 transition-colors text-sm font-medium bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl">
            <LogOut className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-8">
        
        {/* Status Alerts */}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </motion.div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Banco de Dados</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {dbStatus === 'checking' ? 'Verificando...' : dbStatus === 'connected' ? 'Operacional' : 'Com falhas'}
                </h3>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Server className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Servidor API</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {apiStatus === 'connected' ? 'Online' : 'Offline'}
                </h3>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" /> Clientes Cadastrados
                </h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                  {diag?.companies.length || 0} Ativos
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Empresa</th>
                      <th className="py-4 px-6 text-center">Plano</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {diag?.companies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{company.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{company.email || 'Sem email'}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <select 
                            defaultValue={company.plan}
                            onChange={(e) => company.plan = e.target.value}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="basic">Básico</option>
                            <option value="gold">Ouro</option>
                            <option value="diamond">Diamante</option>
                            <option value="premium">Premium</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox"
                              defaultChecked={company.active}
                              onChange={(e) => company.active = e.target.checked}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleUpdateCompany(company.id, company.plan, company.active)}
                              disabled={updatingCompanyId === company.id}
                              className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => handleLoginAsTenant(company)}
                              className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Acessar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!diag?.companies?.length && !loading && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500">
                          Nenhuma empresa cadastrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-indigo-600" /> Configuração do Banco
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Conecte a um novo banco de dados (ex: Supabase, Neon) colando o link abaixo.
              </p>
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="postgres://..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={handleSaveDbUrl}
                disabled={savingDbUrl || apiStatus === 'offline'}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {savingDbUrl ? 'Salvando...' : 'Atualizar Conexão'}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" /> Sincronização
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Se as tabelas estiverem faltando, use o botão abaixo para recriá-las automaticamente.
              </p>
              <button
                onClick={handleRepair}
                disabled={repairing || apiStatus === 'offline'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {repairing ? 'Sincronizando...' : 'Sincronizar Banco de Dados'}
              </button>
              
              <button
                onClick={handleLoginLocalTest}
                className="w-full mt-4 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Entrar (Teste Local)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
