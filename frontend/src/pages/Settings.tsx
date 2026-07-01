import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Printer, CreditCard, Save, RefreshCw, CheckCircle2, Shield, AlertCircle, Terminal, Smartphone, MessageCircle, QrCode, Power, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStoreConfig } from '../hooks/useStoreConfig';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'operacao' | 'hardware' | 'pagamentos' | 'whatsapp'>('operacao');
  const { mode, updateMode } = useStoreConfig();
  
  // Payment States
  const [gateway, setGateway] = useState<'mercadopago' | 'stone' | 'pagseguro'>('mercadopago');
  const [accessToken, setAccessToken] = useState('');
  const [pixKey, setPixKey] = useState('');
  
  // Hardware & Printer Wizard States
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [printerType, setPrinterType] = useState<'network' | 'usb'>('network');
  const [usbVendorId, setUsbVendorId] = useState('0x04b8');
  const [usbProductId, setUsbProductId] = useState('0x0202');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [localAgentStatus, setLocalAgentStatus] = useState<'checking' | 'online' | 'offline'>('offline');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Load configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem('starfood_printer_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setPrinterType(config.printerType || 'network');
        setPrinterIP(config.printerIP || '192.168.1.100');
        setUsbVendorId(config.usbVendorId || '0x04b8');
        setUsbProductId(config.usbProductId || '0x0202');
      } catch (e) {
        console.error('Erro ao ler config da impressora:', e);
      }
    }
    checkAgentStatus();
  }, []);

  const checkAgentStatus = async () => {
    setLocalAgentStatus('checking');
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const response = await fetch('http://localhost:3001/status', { 
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(id);
      if (response.ok) {
        setLocalAgentStatus('online');
        setActiveStep(2); // Auto avança para o passo 2 se estiver online
      } else {
        setLocalAgentStatus('offline');
      }
    } catch (e) {
      setLocalAgentStatus('offline');
    }
  };

  const handleTestPrint = async () => {
    setTestStatus('testing');
    try {
      const payload = {
        estabelecimento: "Star Food - Teste",
        mesa: "TESTE",
        garcom: "Sistema",
        items: [
          { qty: 1, name: "Conexão de Impressora", price: 0.0, obs: "Teste de comunicação bem-sucedido!" }
        ],
        total: 0.0,
        printer_type: printerType,
        printer_address: printerIP,
        usb_vendor_id: usbVendorId,
        usb_product_id: usbProductId
      };

      const response = await fetch('http://localhost:3001/imprimir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.dry_run) {
          setTestStatus('error');
          alert('Agente local respondeu, mas a IMPRESSORA FÍSICA está offline. Verifique a conexão do cabo ou o IP!');
        } else {
          setTestStatus('success');
          // Salva no localStorage para uso do caixa e garçons
          localStorage.setItem('starfood_printer_config', JSON.stringify({
            printerType,
            printerIP,
            usbVendorId,
            usbProductId
          }));
        }
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      setTestStatus('error');
      alert('Falha ao enviar comando para o servidor local de impressão.');
    }
  };

  return (
    <Layout title="Configurações do Sistema">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Menu Lateral de Configurações */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('operacao')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'operacao' 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Store className="w-5 h-5" /> Modo de Operação
          </button>

          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'pagamentos' 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5" /> Integração de Pagamento
          </button>
          
          <button 
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'hardware' 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Printer className="w-5 h-5" /> Hardware & Impressoras
          </button>

          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'whatsapp' 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-5 h-5" /> Automação WhatsApp
          </button>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          
          {activeTab === 'operacao' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Store className="w-5 h-5 text-amber-500" /> Preferências de Operação
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Personalize como o sistema chama os atendimentos no salão (Mesa ou Comanda) em todos os dispositivos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <button
                  onClick={() => updateMode('mesa')}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    mode === 'mesa'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    mode === 'mesa' ? 'bg-amber-500/20 text-amber-400' : 'bg-white dark:bg-slate-900 text-slate-500'
                  }`}>
                    🪑
                  </div>
                  <div className="text-center">
                    <h3 className={`font-bold text-lg ${mode === 'mesa' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>Por Mesa</h3>
                    <p className="text-xs text-slate-500 mt-1">O sistema utilizará o termo "Mesa" para identificar clientes no salão.</p>
                  </div>
                </button>

                <button
                  onClick={() => updateMode('comanda')}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    mode === 'comanda'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    mode === 'comanda' ? 'bg-amber-500/20 text-amber-400' : 'bg-white dark:bg-slate-900 text-slate-500'
                  }`}>
                    🧾
                  </div>
                  <div className="text-center">
                    <h3 className={`font-bold text-lg ${mode === 'comanda' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>Por Comanda</h3>
                    <p className="text-xs text-slate-500 mt-1">O sistema utilizará o termo "Comanda" (ficha numerada) para identificar pedidos.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
          {activeTab === 'pagamentos' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-indigo-500" /> Gatway de Pagamento
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
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
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-8 h-8" />
                    <span className="font-bold capitalize text-sm">{g === 'mercadopago' ? 'Mercado Pago' : g}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Access Token (Produção)</label>
                  <input 
                    type="password" 
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="APP_USR-123456789..." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Necessário para gerar QR Code PIX dinâmico na tela do PDV.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Chave PIX Recebedora (Opcional)</label>
                  <input 
                    type="text" 
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CNPJ, E-mail ou Celular" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Terminal className="w-5 h-5 text-indigo-500" /> Assistente de Conexão de Impressora
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Siga o passo a passo para parear o sistema com a impressora térmica local (Rede ou USB).
                </p>
              </div>

              {/* Barra de Progresso do Wizard */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 gap-2 overflow-x-auto">
                <button 
                  onClick={() => setActiveStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    activeStep === 1 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">1</span>
                  Passo 1: Instalar Servidor
                </button>
                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800 min-w-[20px]" />
                <button 
                  onClick={() => setActiveStep(2)}
                  disabled={localAgentStatus !== 'online'}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeStep === 2 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">2</span>
                  Passo 2: Configurar
                </button>
                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800 min-w-[20px]" />
                <button 
                  onClick={() => setActiveStep(3)}
                  disabled={localAgentStatus !== 'online'}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeStep === 3 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">3</span>
                  Passo 3: Testar & Salvar
                </button>
              </div>

              {/* Conteúdo do Passo Ativo */}
              
              {/* PASSO 1: Instalação do Agente de Impressão */}
              {activeStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Status do Servidor de Impressão Local
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">O PWA precisa deste pequeno script rodando no computador do estabelecimento.</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          localAgentStatus === 'online' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : localAgentStatus === 'checking' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            localAgentStatus === 'online' ? 'bg-emerald-500' : localAgentStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                          }`} />
                          {localAgentStatus === 'online' ? 'Conectado' : localAgentStatus === 'checking' ? 'Buscando...' : 'Desconectado'}
                        </span>
                        
                        <button 
                          onClick={checkAgentStatus}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                          title="Atualizar Status"
                        >
                          <RefreshCw className={`w-4 h-4 ${localAgentStatus === 'checking' ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-sm leading-relaxed text-slate-350">
                        <span className="font-bold text-indigo-400 block mb-2">Instruções de Instalação:</span>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 text-xs">
                          <li>Abra a pasta <code className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono">print-server</code> na máquina do caixa/balcão.</li>
                          <li>Certifique-se de ter o Python instalado e execute <code className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono">pip install -r requirements.txt</code> no terminal.</li>
                          <li>Execute o servidor com o comando: <code className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono">python server.py</code>.</li>
                          <li>Assim que o servidor iniciar, o status acima mudará automaticamente para <strong className="text-emerald-400">Conectado</strong>.</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setActiveStep(2)}
                        disabled={localAgentStatus !== 'online'}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                      >
                        Próximo Passo: Configurar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASSO 2: Configuração da Impressora */}
              {activeStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">Especificações da Impressora</h3>
                      <p className="text-xs text-slate-500">Defina se sua impressora está conectada na rede local ou direto na porta USB.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Tipo de Conexão</label>
                        <select 
                          value={printerType}
                          onChange={(e) => setPrinterType(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                          <option value="network">Impressora de Rede (Ethernet/WiFi)</option>
                          <option value="usb">Impressora USB</option>
                        </select>
                      </div>

                      {printerType === 'network' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Endereço IP na Rede</label>
                          <input 
                            type="text" 
                            value={printerIP}
                            onChange={(e) => setPrinterIP(e.target.value)}
                            placeholder="Ex: 192.168.1.100" 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Vendor ID USB</label>
                            <input 
                              type="text" 
                              value={usbVendorId}
                              onChange={(e) => setUsbVendorId(e.target.value)}
                              placeholder="Ex: 0x04b8" 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Product ID USB</label>
                            <input 
                              type="text" 
                              value={usbProductId}
                              onChange={(e) => setUsbProductId(e.target.value)}
                              placeholder="Ex: 0x0202" 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-center font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setActiveStep(1)}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-350 font-bold py-2.5 px-6 rounded-xl text-sm"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setActiveStep(3)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 text-sm"
                      >
                        Próximo: Testar & Salvar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASSO 3: Teste e Salvamento */}
              {activeStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">Imprimir Cupom de Teste</h3>
                      <p className="text-xs text-slate-500">Faça um teste real de comunicação para verificar se o papel corta e a formatação está correta.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-850">
                      <button 
                        onClick={handleTestPrint}
                        disabled={testStatus === 'testing'}
                        className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        {testStatus === 'testing' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                        Disparar Impressão de Teste
                      </button>
                      
                      <div className="text-left">
                        {testStatus === 'success' && (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            Cupom enviado com sucesso! Configuração salva.
                          </div>
                        )}
                        {testStatus === 'error' && (
                          <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            Erro na comunicação. Verifique se o servidor está ativo.
                          </div>
                        )}
                        {testStatus === 'idle' && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Ao disparar, a impressora emitirá um comprovante fictício da Star Food.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl text-sm"
                      >
                        Voltar
                      </button>
                      
                      <button
                        onClick={() => {
                          alert('Configurações de impressão salvas localmente neste navegador!');
                          setActiveStep(2);
                        }}
                        disabled={testStatus !== 'success'}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-2.5 px-8 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10"
                      >
                        Finalizar e Salvar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'whatsapp' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-emerald-500" /> Automação de WhatsApp (Bot)
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Conecte o número do seu restaurante para disparar mensagens automáticas de status de pedido ("Em Preparo", "Saiu para Entrega").
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-48 h-48 bg-white rounded-2xl p-2 mb-4 flex items-center justify-center">
                    {/* Mock QR Code */}
                    <div className="w-full h-full border-4 border-slate-900 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                      <QrCode className="w-12 h-12 mb-2" />
                      <span className="text-xs font-bold uppercase">Aguardando Leitura</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Leia o QR Code</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para parear o Bot.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300">Status da Conexão</h4>
                      <p className="text-sm text-slate-500">API Z-API / Evolution</p>
                    </div>
                    <span className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Power className="w-3 h-3" /> Desconectado
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mensagem: Pedido Confirmado</label>
                    <textarea 
                      defaultValue="Olá! Recebemos seu pedido #{numero_pedido}. O tempo estimado é de 40 min."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mensagem: Saiu para Entrega</label>
                    <textarea 
                      defaultValue="Seu pedido saiu para entrega! O motoboy já está a caminho do endereço: {endereco}."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
