import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Printer, CreditCard, Save, RefreshCw, CheckCircle2, Shield, AlertCircle, Terminal, Smartphone, MessageCircle, QrCode, Power } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'pagamentos' | 'whatsapp'>('whatsapp');
  
  // Payment States
  const [gateway, setGateway] = useState<'mercadopago' | 'stone' | 'pagseguro'>('mercadopago');
  const [accessToken, setAccessToken] = useState('');
  const [pixKey, setPixKey] = useState('');
  
  // Hardware States
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [printerType, setPrinterType] = useState('bematech');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  const handleTestPrint = () => {
    setTestStatus('testing');
    setTimeout(() => setTestStatus('success'), 2000);
  };

  return (
    <Layout title="Configurações do Sistema">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Menu Lateral de Configurações */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'pagamentos' 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5" /> Integração de Pagamento
          </button>
          
          <button 
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'hardware' 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Printer className="w-5 h-5" /> Hardware & Impressoras
          </button>

          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'whatsapp' 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-5 h-5" /> Automação WhatsApp
          </button>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          
          {activeTab === 'pagamentos' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-indigo-500" /> Gatway de Pagamento
                </h2>
                <p className="text-slate-400 text-sm">
                  Conecte sua conta bancária para gerar PIX Dinâmico e integrar direto com Smart POS (maquininhas).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['mercadopago', 'stone', 'pagseguro'] as const).map(g => (
                  <button 
                    key={g} onClick={() => setGateway(g)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      gateway === g 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-8 h-8" />
                    <span className="font-bold capitalize text-sm">{g === 'mercadopago' ? 'Mercado Pago' : g}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Access Token (Produção)</label>
                  <input 
                    type="password" 
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="APP_USR-123456789..." 
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Necessário para gerar QR Code PIX dinâmico na tela do PDV.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Chave PIX Recebedora (Opcional)</label>
                  <input 
                    type="text" 
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CNPJ, E-mail ou Celular" 
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors flex items-center gap-2">
                  <Save className="w-5 h-5" /> Salvar Credenciais
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'hardware' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                  <Terminal className="w-5 h-5 text-indigo-500" /> Impressoras Térmicas (Rede/USB)
                </h2>
                <p className="text-slate-400 text-sm">
                  Configure as impressoras para a Cozinha e para o Caixa (emissão de comprovante não fiscal).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Printer className="w-5 h-5 text-slate-400" /> Impressora da Cozinha (KDS Backup)
                  </h3>
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-1 rounded-full">Ativo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Marca / Protocolo</label>
                    <select 
                      value={printerType}
                      onChange={(e) => setPrinterType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="bematech">Bematech / Elgin (ESC/POS)</option>
                      <option value="epson">Epson (TM-T20)</option>
                      <option value="daruma">Daruma</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Endereço IP (Rede Local)</label>
                    <input 
                      type="text" 
                      value={printerIP}
                      onChange={(e) => setPrinterIP(e.target.value)}
                      placeholder="Ex: 192.168.1.100" 
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl">
                  <button 
                    onClick={handleTestPrint}
                    disabled={testStatus === 'testing'}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {testStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Imprimir Teste
                  </button>
                  
                  {testStatus === 'success' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Ping e impressão enviados com sucesso!
                    </motion.div>
                  )}
                  {testStatus === 'idle' && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> Certifique-se de estar na mesma rede Wi-Fi.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors flex items-center gap-2">
                  <Save className="w-5 h-5" /> Salvar Configurações
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'whatsapp' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-emerald-500" /> Automação de WhatsApp (Bot)
                </h2>
                <p className="text-slate-400 text-sm">
                  Conecte o número do seu restaurante para disparar mensagens automáticas de status de pedido ("Em Preparo", "Saiu para Entrega").
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-48 h-48 bg-white rounded-2xl p-2 mb-4 flex items-center justify-center">
                    {/* Mock QR Code */}
                    <div className="w-full h-full border-4 border-slate-900 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <QrCode className="w-12 h-12 mb-2" />
                      <span className="text-xs font-bold uppercase">Aguardando Leitura</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2">Leia o QR Code</h3>
                  <p className="text-sm text-slate-400">Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para parear o Bot.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-300">Status da Conexão</h4>
                      <p className="text-sm text-slate-500">API Z-API / Evolution</p>
                    </div>
                    <span className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Power className="w-3 h-3" /> Desconectado
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem: Pedido Confirmado</label>
                    <textarea 
                      defaultValue="Olá! Recebemos seu pedido #{numero_pedido}. O tempo estimado é de 40 min."
                      className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem: Saiu para Entrega</label>
                    <textarea 
                      defaultValue="Seu pedido saiu para entrega! O motoboy já está a caminho do endereço: {endereco}."
                      className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2">
                  <Save className="w-5 h-5" /> Salvar Mensagens
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </Layout>
  );
};
