import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Search, Edit2, Trash2, Filter, X, Save, Image as ImageIcon, PackageOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PRODUCTS = [
  { id: 1, name: 'X-Burger Especial', category: 'Lanches', price: 25.90, stock: 50, status: 'Ativo' },
  { id: 2, name: 'Porção de Fritas', category: 'Porções', price: 18.50, stock: 999, status: 'Ativo' },
  { id: 3, name: 'Coca-Cola 2L', category: 'Bebidas', price: 12.00, stock: 24, status: 'Ativo' },
  { id: 4, name: 'Pizza Calabresa', category: 'Pizzas', price: 45.00, stock: 10, status: 'Ativo' },
  { id: 5, name: 'Sorvete de Baunilha', category: 'Sobremesas', price: 15.00, stock: 0, status: 'Inativo' },
];

export const Products = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Lanches');
  const [newPrice, setNewPrice] = useState('');
  const [newStatus, setNewStatus] = useState('Ativo');

  const filteredProducts = products.filter(prod => 
    prod.name.toLowerCase().includes(search.toLowerCase()) ||
    prod.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    const newProd = {
      id: products.length + 1,
      name: newName,
      category: newCategory,
      price: parseFloat(newPrice),
      stock: 0,
      status: newStatus
    };

    setProducts([...products, newProd]);
    setIsModalOpen(false);
    
    // Reset form
    setNewName('');
    setNewPrice('');
    setNewCategory('Lanches');
    setNewStatus('Ativo');
    alert("Produto cadastrado com sucesso!");
  };

  const handleDelete = (id: number) => {
    if(confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <Layout title="Cadastro de Produtos">
      <div className="space-y-6">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex w-full sm:w-auto gap-4">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar produto..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="bg-slate-950 border border-slate-800 text-slate-400 p-3 rounded-xl hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo Produto
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome do Produto</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr key={prod.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-white font-bold">{prod.name}</p>
                        <p className="text-slate-500 text-xs text-wrap max-w-xs">ID: #{prod.id}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">{prod.category}</span>
                      </td>
                      <td className="py-4 px-6 text-white font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${prod.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Ficha Técnica (Estoque)">
                            <PackageOpen className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(prod.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Novo Produto</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
                
                {/* Image Placeholder */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Foto</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Produto</label>
                    <input 
                      type="text" 
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Ex: X-Burger Especial"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Preço (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        placeholder="Ex: 25.90"
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
                      <select 
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="Lanches">Lanches</option>
                        <option value="Pizzas">Pizzas</option>
                        <option value="Porções">Porções</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Sobremesas">Sobremesas</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status Inicial</label>
                    <select 
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="Ativo">🟢 Ativo (Aparece no Cardápio)</option>
                      <option value="Inativo">🔴 Inativo (Oculto)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Salvar Produto
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
