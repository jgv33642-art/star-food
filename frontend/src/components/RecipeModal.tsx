import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface ProductIngredient {
  id: string;
  ingredient_id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, productId, productName }) => {
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      fetchData();
    }
  }, [isOpen, productId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recipeRes, allIngredientsRes] = await Promise.all([
        api.get<ProductIngredient[]>(`/products/${productId}/ingredients`),
        api.get<Ingredient[]>('/ingredients'),
      ]);
      setIngredients(recipeRes);
      setAvailableIngredients(allIngredientsRes);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity) return;
    
    setAdding(true);
    try {
      await api.post(`/products/${productId}/ingredients`, {
        ingredientId: selectedIngredient,
        quantity: parseFloat(quantity)
      });
      setSelectedIngredient('');
      setQuantity('');
      await fetchData();
    } catch (error) {
      console.error('Erro ao adicionar ingrediente:', error);
      alert('Erro ao adicionar ingrediente');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ingredientId: string) => {
    if (!confirm('Remover este ingrediente?')) return;
    try {
      await api.delete(`/products/${productId}/ingredients/${ingredientId}`);
      await fetchData();
    } catch (error) {
      console.error('Erro ao remover ingrediente:', error);
      alert('Erro ao remover ingrediente');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ficha Técnica</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{productName}</p>
              </div>
              <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAdd} className="flex gap-4 mb-8">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ingrediente</label>
                  <select
                    value={selectedIngredient}
                    onChange={(e) => setSelectedIngredient(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {availableIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 1.5"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={adding}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-3 rounded-xl disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </form>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-4 text-slate-600 dark:text-slate-400 font-medium">Ingrediente</th>
                        <th className="p-4 text-slate-600 dark:text-slate-400 font-medium">Quantidade</th>
                        <th className="p-4 text-right text-slate-600 dark:text-slate-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-500">
                            Nenhum ingrediente adicionado à ficha técnica.
                          </td>
                        </tr>
                      ) : (
                        ingredients.map((item) => (
                          <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/20">
                            <td className="p-4 text-slate-900 dark:text-white">{item.name}</td>
                            <td className="p-4 text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleRemove(item.ingredient_id)}
                                className="text-slate-500 hover:text-red-400 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-2 px-6 rounded-xl transition-colors"
              >
                Concluído
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
