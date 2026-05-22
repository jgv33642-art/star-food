import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  PackageOpen, 
  AlertTriangle, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_quantity: string | number;
  minimum_stock: string | number;
  created_at: string;
  updated_at: string;
}

export const Inventory = () => {
  const [search, setSearch] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [selectedRefillId, setSelectedRefillId] = useState('');
  const [refillQuantity, setRefillQuantity] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('un');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minimumStock, setMinimumStock] = useState('');

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Ingredient[]>('/ingredients');
      setIngredients(data);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao buscar estoque: ' + (err.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setUnit('un');
    setStockQuantity('0');
    setMinimumStock('0');
    setEditingIngredient(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: Ingredient) => {
    setEditingIngredient(item);
    setName(item.name);
    setUnit(item.unit);
    setStockQuantity(parseFloat(item.stock_quantity.toString()).toString());
    setMinimumStock(parseFloat(item.minimum_stock.toString()).toString());
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    const qty = parseFloat(stockQuantity);
    const minStr = parseFloat(minimumStock);

    if (isNaN(qty) || isNaN(minStr)) {
      setError('Informe valores numéricos válidos para estoque e nível mínimo');
      setActionLoading(false);
      return;
    }

    try {
      if (editingIngredient) {
        // Update
        const updated = await api.put<Ingredient>(`/ingredients/${editingIngredient.id}`, {
          name,
          unit,
          stockQuantity: qty,
          minimumStock: minStr
        });
        setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
        setSuccess('Ingrediente atualizado com sucesso!');
      } else {
        // Create
        const created = await api.post<Ingredient>('/ingredients', {
          name,
          unit,
          stockQuantity: qty,
          minimumStock: minStr
        });
        setIngredients(prev => [created, ...prev]);
        setSuccess('Ingrediente cadastrado com sucesso!');
      }
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar ingrediente: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este ingrediente do estoque?')) return;
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      await api.delete(`/ingredients/${id}`);
      setIngredients(prev => prev.filter(i => i.id !== id));
      setSuccess('Ingrediente removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao remover ingrediente: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const qtyToAdd = parseFloat(refillQuantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      setError('Informe uma quantidade de entrada válida e maior que zero');
      return;
    }

    const item = ingredients.find(i => i.id === selectedRefillId);
    if (!item) {
      setError('Selecione um ingrediente válido');
      return;
    }

    setActionLoading(true);
    const newQty = parseFloat(item.stock_quantity.toString()) + qtyToAdd;

    try {
      const updated = await api.put<Ingredient>(`/ingredients/${item.id}`, {
        stockQuantity: newQty
      });
      setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSuccess(`Entrada de ${qtyToAdd} ${item.unit} em "${item.name}" registrada!`);
      setShowRefillModal(false);
      setRefillQuantity('');
      setSelectedRefillId('');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao registrar entrada de estoque: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatus = (item: Ingredient) => {
    const qty = parseFloat(item.stock_quantity.toString());
    const min = parseFloat(item.minimum_stock.toString());
    if (qty <= 0) return 'critical';
    if (qty < min) return 'low';
    return 'ok';
  };

  const filteredIngredients = ingredients.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = ingredients.filter(i => getStatus(i) === 'low').length;
  const criticalStockCount = ingredients.filter(i => getStatus(i) === 'critical').length;

  return (
    <Layout title="Controle de Estoque">
      <div className="space-y-6">

        {/* Warning Banner */}
        <AnimatePresence>
          {(lowStockCount > 0 || criticalStockCount > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
            >
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-amber-500 font-bold">Atenção ao Estoque!</h4>
                <p className="text-amber-400/80 text-sm mt-1">
                  Existem {lowStockCount} itens abaixo do nível mínimo recomendado e {criticalStockCount} itens esgotados (críticos).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar ingrediente..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button 
              onClick={() => {
                if (ingredients.length === 0) return;
                setSelectedRefillId(ingredients[0].id);
                setRefillQuantity('');
                setShowRefillModal(true);
              }}
              disabled={ingredients.length === 0}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-750"
            >
              <Plus className="w-5 h-5 text-indigo-400" /> Entrada rápida
            </button>
            <button 
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Cadastrar Item
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-sm font-bold font-mono">Carregando lista de estoque...</span>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
            <p className="font-bold text-slate-400">Nenhum insumo no estoque.</p>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
              Cadastre novos ingredientes como pão, carne, molhos para controlar os níveis do estoque.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIngredients.map(item => {
              const status = getStatus(item);
              const qty = parseFloat(item.stock_quantity.toString());
              const min = parseFloat(item.minimum_stock.toString());
              
              // Progress percentage
              const percent = min > 0 ? Math.min(100, (qty / min) * 50) : 100;

              return (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    status === 'ok' ? 'bg-emerald-500' :
                    status === 'low' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{item.name}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Estoque Mínimo: {min} {item.unit}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-850 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-slate-950 hover:bg-red-500/10 rounded-lg border border-slate-850 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end gap-2 mb-6">
                    <span className={`text-4xl font-black font-mono ${
                      status === 'ok' ? 'text-emerald-500' :
                      status === 'low' ? 'text-amber-500' : 'text-red-500'
                    }`}>{qty}</span>
                    <span className="text-slate-400 text-lg mb-1">{item.unit}</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        status === 'ok' ? 'bg-emerald-500' :
                        status === 'low' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {status === 'ok' ? 'Nível Seguro' : status === 'low' ? 'Baixo' : 'Crítico'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL: ADICIONAR / EDITAR INGREDIENTE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-indigo-400" /> 
                  {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nome do Insumo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carne Bovina 155g, Pão Brioche"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unidade</label>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilo (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Min. Recomendado</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 50"
                      value={minimumStock}
                      onChange={e => setMinimumStock(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estoque Inicial Atual</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 120"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Salvar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ENTRADA DE ESTOQUE (REFILL) */}
      <AnimatePresence>
        {showRefillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRefillModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" /> Registrar Entrada de Estoque
                </h3>
                <button onClick={() => setShowRefillModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRefill} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Insumo / Ingrediente</label>
                  <select
                    value={selectedRefillId}
                    onChange={e => setSelectedRefillId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Atual: {parseFloat(i.stock_quantity.toString())} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quantidade a Adicionar</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 50"
                      value={refillQuantity}
                      onChange={e => setRefillQuantity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold uppercase">
                      {ingredients.find(i => i.id === selectedRefillId)?.unit || ''}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRefillModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      'Confirmar Entrada'
                    )}
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
