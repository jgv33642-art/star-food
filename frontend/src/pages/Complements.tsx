import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Search, RefreshCw, Edit3, Trash2, X, AlertTriangle, Layers, PlusCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface ComplementOption {
  id: string;
  name: string;
  price: number;
}

interface ComplementCategory {
  id: string;
  name: string;
  is_required: boolean;
  min_options: number;
  max_options: number;
  options?: ComplementOption[];
}

export const Complements = () => {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<ComplementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal Category
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<ComplementCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catRequired, setCatRequired] = useState(false);
  const [catMin, setCatMin] = useState(0);
  const [catMax, setCatMax] = useState(1);

  // Modal Option
  const [showOptModal, setShowOptModal] = useState(false);
  const [activeCatForOpt, setActiveCatForOpt] = useState<string | null>(null);
  const [editingOpt, setEditingOpt] = useState<ComplementOption | null>(null);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('0');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ComplementCategory[]>('/complements');
      setCategories(data);
    } catch (err: any) {
      setError('Erro ao buscar complementos: ' + (err.message || 'Erro'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Category Actions ---
  const handleOpenAddCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatRequired(false);
    setCatMin(0);
    setCatMax(1);
    setShowCatModal(true);
  };

  const handleOpenEditCat = (cat: ComplementCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatRequired(cat.is_required);
    setCatMin(cat.min_options);
    setCatMax(cat.max_options);
    setShowCatModal(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setActionLoading(true);
    try {
      const payload = { name: catName, isRequired: catRequired, minOptions: catMin, maxOptions: catMax };
      if (editingCat) {
        await api.put(`/complements/${editingCat.id}`, payload);
        setSuccess('Grupo atualizado com sucesso!');
      } else {
        await api.post('/complements', payload);
        setSuccess('Grupo criado com sucesso!');
      }
      setShowCatModal(false);
      fetchData();
    } catch (err: any) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Remover este grupo e todas as suas opções?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/complements/${id}`);
      setSuccess('Grupo removido!');
      fetchData();
    } catch (err: any) {
      setError('Erro: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Option Actions ---
  const handleOpenAddOpt = (catId: string) => {
    setActiveCatForOpt(catId);
    setEditingOpt(null);
    setOptName('');
    setOptPrice('0');
    setShowOptModal(true);
  };

  const handleOpenEditOpt = (catId: string, opt: ComplementOption) => {
    setActiveCatForOpt(catId);
    setEditingOpt(opt);
    setOptName(opt.name);
    setOptPrice(opt.price.toString());
    setShowOptModal(true);
  };

  const handleSaveOpt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName.trim() || !activeCatForOpt) return;
    setActionLoading(true);
    try {
      const payload = { name: optName, price: parseFloat(optPrice.replace(',','.')) || 0 };
      if (editingOpt) {
        await api.put(`/complements/options/${editingOpt.id}`, payload);
        setSuccess('Opção atualizada!');
      } else {
        await api.post(`/complements/${activeCatForOpt}/options`, payload);
        setSuccess('Opção adicionada!');
      }
      setShowOptModal(false);
      fetchData();
    } catch (err: any) {
      setError('Erro ao salvar opção: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOpt = async (optId: string) => {
    if (!confirm('Remover opção?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/complements/options/${optId}`);
      setSuccess('Opção removida!');
      fetchData();
    } catch (err: any) {
      setError('Erro: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Adicionais e Complementos">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={fetchData} className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAddCat} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl">
            <Plus className="w-5 h-5" /> Novo Grupo
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2"><Check className="w-5 h-5" /> {success}</div>}

      <div className="space-y-6">
        {loading && categories.length === 0 ? (
          <div className="flex justify-center py-20 text-indigo-500"><RefreshCw className="w-8 h-8 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum grupo de complemento encontrado.</p>
          </div>
        ) : (
          filtered.map(cat => (
            <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {cat.is_required ? <span className="text-amber-400 font-bold mr-2">Obrigatório</span> : <span className="text-emerald-400 font-bold mr-2">Opcional</span>}
                    Min: {cat.min_options} | Máx: {cat.max_options}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenAddOpt(cat.id)} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg" title="Adicionar Opção">
                    <PlusCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleOpenEditCat(cat)} className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="p-2 text-slate-400 hover:text-red-400 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                {(!cat.options || cat.options.length === 0) ? (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhuma opção cadastrada neste grupo.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cat.options.map(opt => (
                      <div key={opt.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center group">
                        <div>
                          <p className="text-white font-bold text-sm">{opt.name}</p>
                          <p className="text-emerald-400 text-xs font-bold mt-0.5">
                            {Number(opt.price) > 0 ? `+ R$ ${Number(opt.price).toFixed(2)}` : 'Grátis'}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEditOpt(cat.id, opt)} className="p-1.5 text-slate-400 hover:text-indigo-400"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteOpt(opt.id)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL GRUPO */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white">{editingCat ? 'Editar Grupo' : 'Novo Grupo de Adicionais'}</h3>
                <button onClick={() => setShowCatModal(false)} className="text-slate-500"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveCat} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nome do Grupo</label>
                  <input type="text" required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex: Escolha o ponto da carne" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="req" checked={catRequired} onChange={e => setCatRequired(e.target.checked)} className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-indigo-500" />
                  <label htmlFor="req" className="text-sm font-bold text-white">É obrigatório escolher?</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Mínimo de Opções</label>
                    <input type="number" min="0" value={catMin} onChange={e => setCatMin(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Máximo de Opções</label>
                    <input type="number" min="1" value={catMax} onChange={e => setCatMax(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL OPÇÃO */}
      <AnimatePresence>
        {showOptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white">{editingOpt ? 'Editar Opção' : 'Nova Opção'}</h3>
                <button onClick={() => setShowOptModal(false)} className="text-slate-500"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveOpt} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nome da Opção</label>
                  <input type="text" required value={optName} onChange={e => setOptName(e.target.value)} placeholder="Ex: Cheddar" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Preço Adicional (R$)</label>
                  <input type="number" step="0.01" min="0" required value={optPrice} onChange={e => setOptPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowOptModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
