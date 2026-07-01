import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

interface ComplementCategory {
  id: string;
  name: string;
}

interface ProductComplementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const ProductComplementsModal = ({ isOpen, onClose, productId, productName }: ProductComplementsModalProps) => {
  const [availableCategories, setAvailableCategories] = useState<ComplementCategory[]>([]);
  const [linkedCategories, setLinkedCategories] = useState<ComplementCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      fetchData();
    }
  }, [isOpen, productId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allCats, linked] = await Promise.all([
        api.get<ComplementCategory[]>('/complements'),
        api.get<ComplementCategory[]>(`/complements/product/${productId}`)
      ]);
      setAvailableCategories(allCats);
      setLinkedCategories(linked);
      if (allCats.length > 0) setSelectedCatId(allCats[0].id);
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedCatId) return;
    setLoading(true);
    try {
      await api.post(`/complements/product/${productId}/link`, { categoryId: selectedCatId });
      await fetchData();
    } catch (err: any) {
      setError('Erro ao vincular: ' + err.message);
      setLoading(false);
    }
  };

  const handleUnlink = async (catId: string) => {
    setLoading(true);
    try {
      await api.delete(`/complements/product/${productId}/link/${catId}`);
      await fetchData();
    } catch (err: any) {
      setError('Erro ao desvincular: ' + err.message);
      setLoading(false);
    }
  };

  const unlinkedOptions = availableCategories.filter(
    cat => !linkedCategories.find(lc => lc.id === cat.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  Adicionais do Produto
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{productName}</p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Vincular Novo Grupo</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    {unlinkedOptions.length === 0 && <option value="">Nenhum grupo disponível</option>}
                    {unlinkedOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleLink}
                    disabled={unlinkedOptions.length === 0 || loading}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Vincular
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Grupos Vinculados</h4>
                {loading && linkedCategories.length === 0 ? (
                  <div className="text-center py-4"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></div>
                ) : linkedCategories.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
                    <p className="text-sm">Nenhum adicional vinculado a este produto.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedCategories.map(cat => (
                      <div key={cat.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-900 dark:text-white font-medium">{cat.name}</span>
                        <button
                          onClick={() => handleUnlink(cat.id)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <button
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
