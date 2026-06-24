import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export interface SelectedComplement {
  categoryId: string;
  categoryName: string;
  optionId: string;
  optionName: string;
  optionPrice: number;
}

interface SelectComplementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
  onConfirm: (complements: SelectedComplement[], additionalPrice: number) => void;
}

export const SelectComplementsModal = ({ isOpen, onClose, product, onConfirm }: SelectComplementsModalProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedComplement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setCategories([]);
      setSelectedOptions([]);
      fetchComplements();
    }
  }, [isOpen, product]);

  const fetchComplements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<any[]>(`/complements/product/${product.id}`);
      setCategories(data);
      // If no complements, auto-confirm
      if (data.length === 0) {
        onConfirm([], 0);
      }
    } catch (err: any) {
      setError('Erro ao carregar complementos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOption = (cat: any, opt: any) => {
    setSelectedOptions(prev => {
      const isSelected = prev.find(o => o.optionId === opt.id);
      
      // Remove if already selected
      if (isSelected) {
        return prev.filter(o => o.optionId !== opt.id);
      }

      // Check max_options constraint
      const catSelectedCount = prev.filter(o => o.categoryId === cat.id).length;
      if (cat.max_options > 0 && catSelectedCount >= cat.max_options) {
        // se max_options for 1, a gente só substitui
        if (cat.max_options === 1) {
          const withoutCat = prev.filter(o => o.categoryId !== cat.id);
          return [...withoutCat, {
            categoryId: cat.id,
            categoryName: cat.name,
            optionId: opt.id,
            optionName: opt.name,
            optionPrice: Number(opt.price)
          }];
        }
        return prev;
      }

      return [...prev, {
        categoryId: cat.id,
        categoryName: cat.name,
        optionId: opt.id,
        optionName: opt.name,
        optionPrice: Number(opt.price)
      }];
    });
  };

  const validationError = useMemo(() => {
    for (const cat of categories) {
      const count = selectedOptions.filter(o => o.categoryId === cat.id).length;
      if (cat.is_required && count < cat.min_options) {
        return `Escolha pelo menos ${cat.min_options} opção(ões) em "${cat.name}"`;
      }
    }
    return null;
  }, [categories, selectedOptions]);

  const handleConfirm = () => {
    if (validationError) return;
    const additionalPrice = selectedOptions.reduce((acc, curr) => acc + curr.optionPrice, 0);
    onConfirm(selectedOptions, additionalPrice);
  };

  if (categories.length === 0 && !loading && isOpen) {
    return null; // Will auto-confirm from useEffect
  }

  return (
    <AnimatePresence>
      {isOpen && categories.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 sticky top-0 z-10">
              <div>
                <h3 className="font-black text-white text-lg leading-tight">{product?.name}</h3>
                <p className="text-slate-400 text-sm font-medium">Personalize seu item</p>
              </div>
              <button onClick={onClose} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 p-5 space-y-6">
              {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}
              {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm">{error}</div>}

              {!loading && categories.map(cat => {
                const count = selectedOptions.filter(o => o.categoryId === cat.id).length;
                const isMet = !cat.is_required || count >= cat.min_options;
                
                return (
                  <div key={cat.id} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white text-base">{cat.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {cat.min_options === cat.max_options 
                            ? `Escolha ${cat.max_options}` 
                            : `Escolha de ${cat.min_options} a ${cat.max_options}`}
                        </p>
                      </div>
                      {cat.is_required && (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isMet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {isMet ? 'OK' : 'Obrigatório'}
                        </span>
                      )}
                    </div>
                    
                    <div className="divide-y divide-slate-800">
                      {cat.options.map((opt: any) => {
                        const isSelected = !!selectedOptions.find(o => o.optionId === opt.id);
                        const disabled = !isSelected && cat.max_options > 0 && count >= cat.max_options && cat.max_options > 1;

                        return (
                          <div 
                            key={opt.id} 
                            onClick={() => !disabled && handleToggleOption(cat, opt)}
                            className={`p-4 flex items-center justify-between transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-900/50'}`}
                          >
                            <div>
                              <p className="text-white font-medium text-sm">{opt.name}</p>
                              {Number(opt.price) > 0 && (
                                <p className="text-emerald-400 text-xs font-bold mt-0.5">+ R$ {Number(opt.price).toFixed(2)}</p>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'}`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 bg-slate-950 border-t border-slate-800 sticky bottom-0">
              {validationError && (
                <div className="mb-3 text-amber-500 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {validationError}
                </div>
              )}
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-slate-400 font-bold text-sm">Adicionais:</span>
                <span className="text-emerald-400 font-black text-lg">
                  + R$ {selectedOptions.reduce((acc, curr) => acc + curr.optionPrice, 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleConfirm}
                disabled={!!validationError}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-4 rounded-xl shadow-lg transition-all text-lg"
              >
                Confirmar Item
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
