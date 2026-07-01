import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Coffee, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  X, 
  Save,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_quantity: string | number;
  minimum_stock: string | number;
}

export const Ingredients = () => {
  const [search, setSearch] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

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
      setError('Erro ao buscar ingredientes: ' + (err.message || 'Erro de conexão'));
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
    if (!name.trim()) return;

    setError(null);
    setSuccess(null);
    setActionLoading(true);

    const qty = parseFloat(stockQuantity) || 0;
    const minStr = parseFloat(minimumStock) || 0;

    try {
      if (editingIngredient) {
        const updated = await api.put<Ingredient>(`/ingredients/${editingIngredient.id}`, { 
          name, unit, stockQuantity: qty, minimumStock: minStr 
        });
        setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
        setSuccess('Ingrediente atualizado com sucesso!');
      } else {
        const created = await api.post<Ingredient>('/ingredients', { 
          name, unit, stockQuantity: qty, minimumStock: minStr 
        });
        setIngredients(prev => [created, ...prev]);
        setSuccess('Ingrediente criado com sucesso!');
      }
      setShowAddModal(false);
    } catch (err: any) {
      setError('Erro ao salvar ingrediente: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este ingrediente? Fichas técnicas podem ser afetadas.')) return;
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      await api.delete(`/ingredients/${id}`);
      setIngredients(prev => prev.filter(i => i.id !== id));
      setSuccess('Ingrediente removido com sucesso!');
    } catch (err: any) {
      setError('Erro ao remover ingrediente: ' + (err.message || 'Erro de conexão'));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Gestão de Ingredientes">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => fetchIngredients()}
            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white rounded-xl transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Novo Ingrediente
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </motion.div>
      )}
      
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <RefreshCw className="w-5 h-5" /> {success}
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading && ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Carregando ingredientes...</p>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Coffee className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Nenhum ingrediente encontrado</p>
            <p className="text-sm">Clique em "Novo Ingrediente" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-xs tracking-wider text-slate-500 uppercase">
                  <th className="py-4 px-6 font-medium">Nome</th>
                  <th className="py-4 px-6 font-medium">Unidade</th>
                  <th className="py-4 px-6 font-medium text-right">Estoque Min.</th>
                  <th className="py-4 px-6 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredIngredients.map((item) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    key={item.id} 
                    className="hover:bg-slate-100 dark:bg-slate-800/20 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-base">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold uppercase">{item.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-600 dark:text-slate-400">
                      {item.minimum_stock} {item.unit}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-indigo-500" />
                  {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome do Ingrediente</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Queijo Cheddar"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidade</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="cx">Caixa (cx)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estoque Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};
