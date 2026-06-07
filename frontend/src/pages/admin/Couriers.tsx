import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  active: boolean;
}

export const Couriers = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle: '', active: true });

  const fetchData = async () => {
    try {
      const res = await api.get<Courier[]>('/couriers');
      setCouriers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCourier(null);
    setFormData({ name: '', phone: '', vehicle: '', active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      phone: courier.phone || '',
      vehicle: courier.vehicle || '',
      active: courier.active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setSaving(true);
    try {
      if (editingCourier) {
        await api.put(`/couriers/${editingCourier.id}`, formData);
      } else {
        await api.post('/couriers', formData);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este motoboy?')) return;
    try {
      await api.delete(`/couriers/${id}`);
      setCouriers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setCouriers(prev => prev.map(c => c.id === id ? { ...c, active: nextStatus } : c));
    try {
      await api.put(`/couriers/${id}`, { active: nextStatus });
    } catch (err) {
      setCouriers(prev => prev.map(c => c.id === id ? { ...c, active: currentStatus } : c));
    }
  };

  return (
    <Layout title="Gestão de Motoboys">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="text-slate-400 text-sm">
            Total de {couriers.length} motoboy(s)
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo Motoboy
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Nome</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Telefone</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Veículo / Placa</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    </td>
                  </tr>
                ) : couriers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Nenhum motoboy cadastrado.</td>
                  </tr>
                ) : (
                  couriers.map((courier) => (
                    <tr key={courier.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-6 font-medium text-white">{courier.name}</td>
                      <td className="py-4 px-6 text-slate-300">{courier.phone || '-'}</td>
                      <td className="py-4 px-6 text-slate-300">{courier.vehicle || '-'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleActive(courier.id, courier.active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${courier.active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${courier.active ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => openEditModal(courier)} className="p-2 text-slate-400 hover:text-indigo-400">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(courier.id)} className="p-2 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-slate-800 flex justify-between">
                  <h3 className="text-xl font-bold text-white">{editingCourier ? 'Editar Motoboy' : 'Novo Motoboy'}</h3>
                  <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nome</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Telefone / WhatsApp</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Veículo / Placa</label>
                    <input type="text" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3" />
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-indigo-500 text-white py-3 rounded-xl flex justify-center items-center gap-2">
                      {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                      Salvar
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
