import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Search, Edit2, Trash2, Filter, X, Save, Image as ImageIcon, PackageOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { RecipeModal } from '../components/RecipeModal';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  active: boolean;
  description?: string;
  cost?: number;
  minimum_stock?: number;
  sku?: string;
}

interface ProductDisplay {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  status: string;
  sku?: string;
}

export const Products = () => {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Recipe Modal State
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedProductRecipe, setSelectedProductRecipe] = useState<ProductDisplay | null>(null);

  // New/Edit Product Form State
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStatus, setNewStatus] = useState('Ativo');
  const [newSku, setNewSku] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<Category[]>('/categories'),
      ]);

      const cats: Category[] = Array.isArray(categoriesRes) ? categoriesRes : [];
      setCategories(cats);

      const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
      const mapped: ProductDisplay[] = (Array.isArray(productsRes) ? productsRes : []).map((p) => ({
        id: p.id,
        name: p.name,
        category: catMap[p.category_id] || 'Sem categoria',
        categoryId: p.category_id,
        price: Number(p.price),
        stock: p.stock_quantity,
        status: p.active ? 'Ativo' : 'Inativo',
        sku: p.sku || '',
      }));
      setProducts(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(search.toLowerCase()) ||
    prod.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setNewName('');
    setNewCategoryId(categories[0]?.id || '');
    setNewPrice('');
    setNewStatus('Ativo');
    setNewSku('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductDisplay) => {
    setEditingProduct(prod);
    setNewName(prod.name);
    setNewCategoryId(prod.categoryId);
    setNewPrice(String(prod.price));
    setNewStatus(prod.status);
    setNewSku(prod.sku || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    setSaving(true);
    try {
      const payload = {
        name: newName,
        categoryId: newCategoryId || null,
        price: parseFloat(newPrice),
        active: newStatus === 'Ativo',
        sku: newSku.trim() || null,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (prodId: string, currentStatus: string) => {
    const isActive = currentStatus === 'Ativo';
    const nextActive = !isActive;
    const nextStatusStr = nextActive ? 'Ativo' : 'Inativo';

    // Optimistic Update
    setProducts((prev) =>
      prev.map((p) => (p.id === prodId ? { ...p, status: nextStatusStr } : p))
    );

    try {
      await api.put(`/products/${prodId}`, { active: nextActive });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status do produto.');
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === prodId ? { ...p, status: currentStatus } : p))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir produto.');
    }
  };

  return (
    <Layout title="Cadastro de Produtos">
      <div className="space-y-6">

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex w-full sm:w-auto gap-4">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="bg-slate-950 border border-slate-800 text-slate-400 p-3 rounded-xl hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={openCreateModal}
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
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Código/SKU</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                      <p className="text-slate-500 mt-2">Carregando produtos...</p>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
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
                      <td className="py-4 px-6 font-mono text-xs text-slate-300">
                        {prod.sku || `SF-${prod.id.substring(0, 6).toUpperCase()}`}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">{prod.category}</span>
                      </td>
                      <td className="py-4 px-6 text-white font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleActive(prod.id, prod.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                              prod.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                            title={prod.status === 'Ativo' ? 'Clique para desativar' : 'Clique para ativar'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                prod.status === 'Ativo' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold ${prod.status === 'Ativo' ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {prod.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedProductRecipe(prod); setRecipeModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" 
                            title="Ficha Técnica (Estoque)">
                            <PackageOpen className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(prod)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
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

      {/* CREATE / EDIT MODAL */}
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
                <h3 className="text-xl font-bold text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
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
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: X-Burger Especial"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Código / SKU (Opcional)</label>
                    <input
                      type="text"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      placeholder="Ex: 7891234567890 (deixe em branco para autogerar)"
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
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Ex: 25.90"
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
                      <select
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      >
                        {categories.length === 0 && (
                          <option value="">Sem categorias</option>
                        )}
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status Inicial</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
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
                    disabled={saving}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Salvando...' : 'Salvar Produto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecipeModal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        productId={selectedProductRecipe?.id || ''}
        productName={selectedProductRecipe?.name || ''}
      />
    </Layout>
  );
};
