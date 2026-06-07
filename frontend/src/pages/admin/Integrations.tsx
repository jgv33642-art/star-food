import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { MessageCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export const Integrations = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Simulate connection process
    setTimeout(() => {
      setWhatsappConnected(true);
      setLoading(false);
    }, 2000);
  };

  return (
    <Layout title="Integrações">
      <div className="max-w-4xl space-y-6">
        
        {/* WhatsApp Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${whatsappConnected ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                <MessageCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">WhatsApp Automático</h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Envie notificações automáticas para seus clientes quando o pedido sair para entrega ou quando a mesa for atualizada.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">Status:</span>
                  {whatsappConnected ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-4 h-4" /> Conectado
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      Desconectado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {whatsappConnected ? (
                <button 
                  onClick={() => setWhatsappConnected(false)}
                  className="px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                >
                  Desconectar
                </button>
              ) : (
                <button 
                  onClick={handleConnect}
                  disabled={loading}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  Conectar WhatsApp
                </button>
              )}
            </div>
          </div>
          
          {whatsappConnected && (
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h4 className="font-bold text-white mb-4">Gatilhos Ativos:</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-green-500 focus:ring-green-500 bg-slate-900 border-slate-600" />
                  <span className="text-slate-300">Avisar cliente quando pedido delivery mudar para "Saiu para Entrega"</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-green-500 focus:ring-green-500 bg-slate-900 border-slate-600" />
                  <span className="text-slate-300">Avisar cliente (QR Code) sobre status do pedido na mesa</span>
                </label>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};
