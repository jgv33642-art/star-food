import { useState } from 'react';

export const DeliveryPaymentTab = ({ initialSettings }: any) => {
  const [feeType, setFeeType] = useState(initialSettings?.fee_type || 'fixed');
  const [baseFee, setBaseFee] = useState(initialSettings?.base_delivery_fee || 0);
  const [feePerKm, setFeePerKm] = useState(initialSettings?.fee_per_km || 0);
  const [maxRadius, setMaxRadius] = useState(initialSettings?.max_delivery_radius_km || 10);
  
  const [acceptsPixOnline, setAcceptsPixOnline] = useState(initialSettings?.accepts_pix_online || false);
  const [acceptsCardDelivery, setAcceptsCardDelivery] = useState(initialSettings?.accepts_card_delivery ?? true);
  const [acceptsCash, setAcceptsCash] = useState(initialSettings?.accepts_cash ?? true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* LOGÍSTICA DE FRETE */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Regras de Entrega</h3>
        
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-3">Tipo de Cobrança do Frete</label>
          <select 
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3"
          >
            <option value="fixed">Taxa Fixa Padrão</option>
            <option value="distance">Cobrança Dinâmica (Valor por KM)</option>
            <option value="neighborhood">Tabela de Bairros Específica</option>
          </select>
        </div>

        {feeType === 'distance' && (
          <div className="grid grid-cols-2 gap-4 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Valor Base (R$)</label>
              <input 
                type="number" 
                step="0.50" 
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2" 
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Adicional por KM (R$)</label>
              <input 
                type="number" 
                step="0.50" 
                value={feePerKm}
                onChange={(e) => setFeePerKm(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2" 
              />
            </div>
          </div>
        )}

        {feeType === 'fixed' && (
          <div>
            <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Valor Fixo de Entrega (R$)</label>
            <input 
              type="number" 
              step="0.50" 
              value={baseFee}
              onChange={(e) => setBaseFee(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3" 
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Raio Máximo de Entrega (KM)</label>
          <input 
            type="number" 
            value={maxRadius}
            onChange={(e) => setMaxRadius(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3" 
          />
        </div>
      </div>

      {/* MÉTODOS DE PAGAMENTO */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Formas de Pagamento</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-slate-900 dark:text-white font-medium">Pix (Pelo Site / Automático)</span>
            <input 
              type="checkbox" 
              checked={acceptsPixOnline}
              onChange={(e) => setAcceptsPixOnline(e.target.checked)}
              className="w-5 h-5 accent-indigo-500" 
            />
          </label>
          
          <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-slate-900 dark:text-white font-medium">Máquina de Cartão na Entrega</span>
            <input 
              type="checkbox" 
              checked={acceptsCardDelivery}
              onChange={(e) => setAcceptsCardDelivery(e.target.checked)}
              className="w-5 h-5 accent-indigo-500" 
            />
          </label>
          
          <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <span className="text-slate-900 dark:text-white font-medium">Dinheiro (Pede troco no checkout)</span>
            <input 
              type="checkbox" 
              checked={acceptsCash}
              onChange={(e) => setAcceptsCash(e.target.checked)}
              className="w-5 h-5 accent-indigo-500" 
            />
          </label>
        </div>
      </div>
    </div>
  );
};
