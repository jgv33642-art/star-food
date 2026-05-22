import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Terminal, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  Code, 
  User, 
  Server, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Play, 
  Save,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'skip';
  statement?: string;
  message: string;
}

interface DiagData {
  backend: {
    status: string;
    port: string;
    nodeEnv: string;
  };
  database: {
    status: 'connected' | 'error' | 'checking';
    message: string;
    tables: Record<string, boolean>;
    views: Record<string, boolean>;
    routines: Record<string, boolean>;
    triggers: Record<string, boolean>;
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
  const [repairLogs, setRepairLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingCompanyId, setUpdatingCompanyId] = useState<string | null>(null);
  const [dbUrl, setDbUrl] = useState('');
  const [savingDbUrl, setSavingDbUrl] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/dev'
    : '/api/dev';

  const fetchDiagnostics = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/diagnostics`);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const data: DiagData = await res.json();
      setDiag(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      // Fallback object to show backend is offline
      setDiag({
        backend: { status: 'offline', port: '3000', nodeEnv: 'development' },
        database: {
          status: 'error',
          message: 'Backend está offline ou inacessível. O banco não pôde ser verificado.',
          tables: {},
          views: {},
          routines: {},
          triggers: {}
        },
        companies: []
      });
      setErrorMessage('Servidor Backend Offline. Certifique-se de rodar "npm run dev" no diretório raiz do projeto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics(true);
    const interval = setInterval(() => {
      fetchDiagnostics(false);
    }, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of logs when repairLogs updates
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [repairLogs]);

  const handleRepair = async () => {
    if (repairing) return;
    setRepairing(true);
    setRepairLogs([{ type: 'info', message: 'Conectando ao endpoint de auto-reparo...' }]);
    
    try {
      const res = await fetch(`${API_URL}/repair`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.logs) {
        setRepairLogs(data.logs);
      } else {
        setRepairLogs(prev => [
          ...prev, 
          { type: 'error', message: 'Processo retornado sem logs detalhados.' }
        ]);
      }
      if (res.ok && data.success) {
        setSuccessMessage('Banco de dados reparado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.error || 'Falha ao reparar banco de dados.');
      }
    } catch (err: any) {
      setRepairLogs(prev => [
        ...prev, 
        { type: 'error', message: `Erro na requisição: ${err.message}` }
      ]);
      setErrorMessage('Erro de conexão ao tentar reparar o banco de dados.');
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: companyId,
          plan: currentPlan,
          active: currentActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Empresa atualizada com sucesso!');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchDiagnostics(false);
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar dados da empresa.');
      }
    } catch (err: any) {
      setErrorMessage('Erro ao comunicar com o servidor.');
    } finally {
      setUpdatingCompanyId(null);
    }
  };

  const handleSaveDbUrl = async () => {
    if (!dbUrl.trim()) {
      setErrorMessage('Por favor, insira uma string de conexão válida.');
      return;
    }
    setSavingDbUrl(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/update-env`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ databaseUrl: dbUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'DATABASE_URL atualizada com sucesso!');
        setDbUrl(''); // clear on success
        fetchDiagnostics(false);
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar DATABASE_URL.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao tentar salvar a DATABASE_URL.');
    } finally {
      setSavingDbUrl(false);
    }
  };

  // Compute table statistics
  const expectedTables = [
    'companies', 'roles', 'users', 'categories', 'products', 
    'ingredients', 'product_ingredients', 'tables', 'customers', 
    'orders', 'order_items', 'cash_registers', 'sales', 
    'sale_items', 'payments', 'stock_movements'
  ];
  
  const existingTablesCount = diag ? expectedTables.filter(t => diag.database.tables[t]).length : 0;
  const dbStatus = diag ? diag.database.status : 'checking';
  const apiStatus = diag ? (diag.backend.status === 'offline' ? 'offline' : 'connected') : 'checking';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Terminal className="text-indigo-400 w-6 h-6 animate-pulse" />
            <div>
              <h1 className="text-white font-bold tracking-widest text-lg flex items-center gap-2">
                PAINEL_DEV_L9 <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">FUNCIONAL</span>
              </h1>
              <p className="text-[10px] text-slate-500">ADMINISTRAÇÃO REAL DE INFRAESTRUTURA & MULTITENANCY</p>
            </div>
          </div>
          <Link to="/" className="text-slate-500 hover:text-red-400 flex items-center gap-2 transition-colors text-sm font-bold border border-slate-800 hover:border-red-500/30 px-3 py-1.5 rounded-xl bg-slate-950">
            <LogOut className="w-4 h-4" /> VOLTAR AO SISTEMA
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-8">
        
        {/* Status Alerts */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-white text-sm">Alerta do Sistema</h4>
              <p className="text-xs mt-1">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-white text-sm">Sucesso</h4>
              <p className="text-xs mt-1">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Diagnostic Status Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Banco de Dados */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              {dbStatus === 'checking' && <div className="animate-pulse w-3 h-3 rounded-full bg-amber-500" />}
              {dbStatus === 'connected' && <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />}
              {dbStatus === 'error' && <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-ping" />}
            </div>
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-widest">Banco de Dados</p>
            <h3 className="text-xl font-bold text-white">
              {dbStatus === 'checking' ? 'Aguardando...' : dbStatus === 'connected' ? 'Conectado' : 'Erro de Conexão'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 truncate font-mono bg-slate-950 p-2 rounded border border-slate-800/80">
              {diag ? diag.database.message : 'Verificando conexão...'}
            </p>
          </div>

          {/* Card 2: Backend API */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-sky-400" />
              </div>
              {apiStatus === 'checking' && <div className="animate-pulse w-3 h-3 rounded-full bg-amber-500" />}
              {apiStatus === 'connected' && <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />}
              {apiStatus === 'offline' && <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />}
            </div>
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-widest">Servidor Backend</p>
            <h3 className="text-xl font-bold text-white">
              {apiStatus === 'connected' ? 'Online' : 'Offline'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Porta: <span className="text-sky-400">{diag?.backend.port || '3000'}</span> | Ambiente: <span className="text-amber-500">{diag?.backend.nodeEnv || 'development'}</span>
            </p>
          </div>

          {/* Card 3: Integridade do Schema */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              {diag && (
                <div className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${existingTablesCount === expectedTables.length ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'}`}>
                  {existingTablesCount} / {expectedTables.length} Tabelas
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-widest">Integridade Física</p>
            <h3 className="text-xl font-bold text-white">
              {diag ? (existingTablesCount === expectedTables.length ? 'Esquema Íntegro' : 'Esquema Incompleto') : 'Carregando...'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Verificação direta via catálogo PostgreSQL.
            </p>
          </div>
        </div>

        {/* DB Connection Config Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-white flex items-center gap-2 text-sm mb-3">
            <Database className="w-4 h-4 text-indigo-400" /> ATUALIZAR STRING DE CONEXÃO POSTGRESQL (DATABASE_URL)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Insira abaixo a URL de conexão do seu banco de dados PostgreSQL (como Supabase, Neon ou local). O sistema atualizará automaticamente o arquivo <code className="text-indigo-400">.env</code> e reconectará a API sem precisar reiniciar o processo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="postgres://usuario:senha@host:porta/banco"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 text-xs rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-slate-700"
            />
            <button
              onClick={handleSaveDbUrl}
              disabled={savingDbUrl || apiStatus === 'offline'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
            >
              {savingDbUrl ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Salvar e Conectar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Diagnostics Checklist (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Code className="w-4 h-4 text-indigo-400" /> ESTRUTURA DO BD
                </h3>
                <button 
                  onClick={() => fetchDiagnostics(true)}
                  className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                  title="Atualizar diagnóstico"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-800/50 font-mono text-xs">
                {loading && !diag ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <span>Analisando tabelas...</span>
                  </div>
                ) : diag ? (
                  <>
                    <div className="pb-3">
                      <span className="text-slate-500 uppercase tracking-widest text-[10px] block mb-2 font-bold">TABELAS ESSENCIAIS</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {expectedTables.map(t => {
                          const exists = diag.database.tables[t];
                          return (
                            <div key={t} className="flex items-center justify-between py-1 bg-slate-950/40 px-2.5 rounded border border-slate-800/40">
                              <span className="text-slate-300 truncate max-w-[200px]">{t}</span>
                              {exists ? (
                                <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OK</span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1 font-bold animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> Faltando</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="py-3">
                      <span className="text-slate-500 uppercase tracking-widest text-[10px] block mb-2 font-bold">VIEWS (RELATÓRIOS)</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {['daily_revenue', 'best_selling_products'].map(v => {
                          const exists = diag.database.views[v];
                          return (
                            <div key={v} className="flex items-center justify-between py-1 bg-slate-950/40 px-2.5 rounded border border-slate-800/40">
                              <span className="text-slate-400">{v}</span>
                              {exists ? (
                                <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OK</span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1 font-bold animate-pulse"><AlertTriangle className="w-3.5 h-3.5" /> Faltando</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3">
                      <span className="text-slate-500 uppercase tracking-widest text-[10px] block mb-2 font-bold">TRIGGERS & PROCEDURES</span>
                      <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                        <div className="flex items-center justify-between py-1 bg-slate-950/40 px-2.5 rounded border border-slate-800/40">
                          <span className="text-slate-400">fn: decrease_stock</span>
                          {diag.database.routines['decrease_stock'] ? (
                            <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OK</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Faltando</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-1 bg-slate-950/40 px-2.5 rounded border border-slate-800/40">
                          <span className="text-slate-400">trg: trigger_decrease_stock</span>
                          {diag.database.triggers['trigger_decrease_stock'] ? (
                            <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OK</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Faltando</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-8">Nenhum dado de diagnóstico.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Subscribers Table & Auto-Repair Terminal (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Subscribers panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[280px]">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-indigo-400" /> EMPRESAS ASSINANTES (TENANTS REAL)
                </h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {diag?.companies.length || 0} Ativas
                </span>
              </div>
              <div className="overflow-auto flex-1">
                {loading && !diag ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" /> Carregando assinantes...
                  </div>
                ) : diag?.companies && diag.companies.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] tracking-wider text-slate-500 uppercase">
                        <th className="py-3 px-6">Empresa</th>
                        <th className="py-3 px-6">Contato / Email</th>
                        <th className="py-3 px-6 text-center">Plano</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {diag.companies.map((company) => (
                        <tr key={company.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="font-bold text-white">{company.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{company.id}</div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="text-slate-300">{company.email || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{company.phone || company.document || ''}</div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <select 
                              defaultValue={company.plan}
                              onChange={(e) => {
                                company.plan = e.target.value;
                              }}
                              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="basic">Básico (Basic)</option>
                              <option value="gold">Ouro (Gold)</option>
                              <option value="diamond">Diamante (Diamond)</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input 
                                type="checkbox"
                                defaultChecked={company.active}
                                onChange={(e) => {
                                  company.active = e.target.checked;
                                }}
                                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                              />
                              <span className={company.active ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                {company.active ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => handleUpdateCompany(company.id, company.plan, company.active)}
                              disabled={updatingCompanyId === company.id}
                              className="text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500 px-3 py-1 rounded bg-indigo-500/5 hover:bg-indigo-500/10 transition-all font-bold flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                            >
                              {updatingCompanyId === company.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              Salvar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8 gap-2">
                    <AlertCircle className="w-8 h-8 text-amber-500/60" />
                    <p className="text-sm font-bold text-slate-400">Nenhum assinante no banco de dados.</p>
                    <p className="text-xs text-slate-600 text-center max-w-md px-4">
                      A tabela 'companies' está vazia ou não existe. Use o Auto-Reparo abaixo para restaurar a estrutura padrão.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Repair system & console */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[320px]">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" /> CONSOLE DE AUTO-REPARO DO BACKEND
                </h3>
                <button
                  onClick={handleRepair}
                  disabled={repairing || apiStatus === 'offline'}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs py-1.5 px-4 rounded-xl flex items-center gap-2 transition-all hover:scale-102 shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {repairing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Reparando...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Executar Auto-Reparo
                    </>
                  )}
                </button>
              </div>

              {/* Real-time styled terminal log */}
              <div className="flex-1 bg-black p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text selection:bg-slate-800">
                {repairLogs.length === 0 ? (
                  <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2">
                    <HelpCircle className="w-8 h-8 text-slate-800" />
                    <span>Aguardando execução... Clique em "Executar Auto-Reparo" para iniciar.</span>
                    <span className="text-[10px] text-slate-700 max-w-sm text-center">
                      Este sistema executa as definições estruturais do database.sql no banco PostgreSQL real, ignorando erros de tabela já existente.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {repairLogs.map((log, idx) => {
                      let color = 'text-sky-400';
                      let prefix = '[INFO]';
                      if (log.type === 'success') {
                        color = 'text-emerald-400';
                        prefix = '[SUCESSO]';
                      } else if (log.type === 'error') {
                        color = 'text-red-400';
                        prefix = '[ERRO]';
                      } else if (log.type === 'skip') {
                        color = 'text-amber-500';
                        prefix = '[IGNORADO]';
                      }

                      return (
                        <div key={idx} className="border-b border-slate-900/35 pb-1">
                          <span className={`font-bold ${color} mr-2`}>{prefix}</span>
                          {log.statement && (
                            <span className="text-indigo-400 font-bold block md:inline md:mr-2">
                              {log.statement}
                            </span>
                          )}
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      );
                    })}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
