import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Layout } from '../../../components/Layout';
import { Settings, Percent, Save, Smartphone, Power, Plus, Trash2 } from 'lucide-react';
import api from '../../../services/api';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  active: boolean;
}

export const DeliverySettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings state
  const [whatsapp, setWhatsapp] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [fee, setFee] = useState('5.00');
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState('');

  const hasPremiumPlan = () => {
    if (!user?.plan) return false;
    const p = user.plan.toLowerCase();
    return p === 'annual' || p === 'pro' || p === 'premium';
  };

  useEffect(() => {
    if (hasPremiumPlan()) {
      fetchSettings();
      fetchCoupons();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/company/delivery-settings');
      setWhatsapp(data.whatsapp_number || '');
      setIsOpen(data.is_delivery_open ?? true);
      setFee(data.delivery_fee || '5.00');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/company/coupons');
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/company/delivery-settings', {
        whatsapp_number: whatsapp,
        is_delivery_open: isOpen,
        delivery_fee: parseFloat(fee)
      });
      alert('Configurações salvas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    }
    setIsSaving(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/company/coupons', {
        code: newCouponCode,
        discount_type: newCouponType,
        discount_value: parseFloat(newCouponValue)
      });
      setNewCouponCode('');
      setNewCouponValue('');
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar cupom');
    }
  };

  const toggleCoupon = async (id: string) => {
    try {
      await api.patch(`/company/coupons/${id}/toggle`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  if (!hasPremiumPlan()) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <h2 className="text-3xl font-black text-white mb-4">Recurso Premium</h2>
        <p className="text-slate-400 mb-8 text-lg">
          O Módulo Premium (Integração WhatsApp, Cupons e Horários) está disponível apenas no Plano Pro.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition-transform text-white font-bold py-4 px-8 rounded-2xl shadow-lg">
          Fazer Upgrade
        </button>
      </div>
    );
  }

  return (
    <Layout title="Configurações do Delivery">
      <div className="p-4 md:p-8 max-w-7xl mx-auto text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Delivery PRO</h1>
            <p className="text-slate-400 mt-2">Gerencie cupons, whatsapp e status da loja.</p>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="flex overflow-x-auto gap-2 mb-8 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" /> Configurações Gerais
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === 'coupons' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Percent className="w-5 h-5" /> Cupons de Desconto
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="bg-slate-900/30 p-6 md:p-8 rounded-3xl border border-slate-800">
          
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Power className={`w-8 h-8 ${isOpen ? 'text-green-500' : 'text-red-500'}`} />
                    <div>
                      <h3 className="text-xl font-bold">Status da Loja (Delivery)</h3>
                      <p className="text-slate-400 text-sm">Se fechado, os clientes não poderão fazer pedidos.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-400"/> WhatsApp para Pedidos</h3>
                  <p className="text-sm text-slate-400 mb-4">Número que receberá a mensagem com o pedido (apenas números com DDD).</p>
                  <input
                    type="text"
                    placeholder="Ex: 11999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-bold mb-4">Taxa de Entrega Padrão</h3>
                  <p className="text-sm text-slate-400 mb-4">Valor cobrado nas entregas feitas pelo site.</p>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-5 h-5" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8">
                <h3 className="text-xl font-bold mb-4">Criar Novo Cupom</h3>
                <form onSubmit={handleCreateCoupon} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm text-slate-400 mb-2">Código do Cupom</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: BEMVINDO10"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold uppercase tracking-wider focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-sm text-slate-400 mb-2">Tipo de Desconto</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="PERCENTAGE">Porcentagem (%)</option>
                      <option value="FIXED">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-sm text-slate-400 mb-2">Valor</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="Ex: 10"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button type="submit" className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Adicionar
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-4 font-medium">Código</th>
                      <th className="pb-4 font-medium">Desconto</th>
                      <th className="pb-4 font-medium text-center">Status</th>
                      <th className="pb-4 font-medium text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id} className="border-b border-slate-800/50">
                        <td className="py-4 font-bold tracking-wider text-purple-400">{coupon.code}</td>
                        <td className="py-4 font-medium">
                          {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `R$ ${parseFloat(coupon.discount_value.toString()).toFixed(2)}`}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {coupon.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => toggleCoupon(coupon.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${coupon.active ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'}`}
                          >
                            {coupon.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">Nenhum cupom criado ainda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};
