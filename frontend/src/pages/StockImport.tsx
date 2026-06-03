import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, Search, Plus, 
  Link2, X, ArrowRight, Loader2, Save, FileText, ChevronRight, CornerDownRight,
  QrCode, Keyboard, Camera, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Html5Qrcode } from 'html5-qrcode';

interface MatchedProduct {
  id: string;
  name: string;
  price: number;
  cost: number;
  stockQuantity: number;
  sku: string;
}

interface ParsedItem {
  supplierCode: string;
  ean: string;
  name: string;
  quantity: number;
  costPrice: number;
  conversionFactor: number;
  matchedProduct: MatchedProduct | null;
}

interface ParsedNfe {
  accessKey: string;
  supplierCnpj: string;
  supplierName: string;
  totalValue: number;
  items: ParsedItem[];
}

export const StockImport = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [parsedNfe, setParsedNfe] = useState<ParsedNfe | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Tab control: 'xml' | 'qrcode' | 'manual'
  const [activeTab, setActiveTab] = useState<'xml' | 'qrcode' | 'manual'>('xml');

  // QR Code Tab state
  const [qrcodeUrlInput, setQrcodeUrlInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual Receipt Tab state
  const [manualCnpj, setManualCnpj] = useState('');
  const [manualSupplierName, setManualSupplierName] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [draftItems, setDraftItems] = useState<ParsedItem[]>([]);
  
  // Manual Grid Inputs
  const [searchSkuOrName, setSearchSkuOrName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualTotalCost, setManualTotalCost] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal states for manual link
  const [linkingIndex, setLinkingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for quick create
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');
  const [newProdSku, setNewProdSku] = useState('');

  // Load database products & categories for matching
  const loadReferenceData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get<any[]>('/products'),
        api.get<any[]>('/categories')
      ]);
      setDbProducts(Array.isArray(productsRes) ? productsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
    } catch (err: any) {
      console.error('Erro ao carregar referências:', err);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  // Format CNPJ Input helper
  const handleCnpjChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 14);
    if (clean.length <= 2) {
      setManualCnpj(clean);
      return;
    }
    if (clean.length <= 5) {
      setManualCnpj(`${clean.substring(0, 2)}.${clean.substring(2)}`);
      return;
    }
    if (clean.length <= 8) {
      setManualCnpj(`${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5)}`);
      return;
    }
    if (clean.length <= 12) {
      setManualCnpj(`${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8)}`);
      return;
    }
    setManualCnpj(`${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12)}`);
  };

  // Autocomplete / Barcode scanner exact match check
  useEffect(() => {
    const query = searchSkuOrName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setSelectedProduct(null);
      return;
    }

    // Exact match for barcode/SKU
    const exact = dbProducts.find(p => p.sku && p.sku.toLowerCase() === query);
    if (exact) {
      setSelectedProduct(exact);
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      const filtered = dbProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      ).slice(0, 5);
      setSuggestions(filtered);
    }
  }, [searchSkuOrName, dbProducts]);

  // QR Code lifecycle & camera detection
  useEffect(() => {
    if (activeTab === 'qrcode') {
      Html5Qrcode.getCameras().then(devices => {
        setCameras(devices);
        if (devices.length > 0) {
          setSelectedCameraId(devices[0].id);
        }
      }).catch(err => {
        console.warn('Câmeras não encontradas ou bloqueadas:', err);
      });
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [activeTab]);

  const startScanner = async () => {
    setScannerError('');
    try {
      if (!selectedCameraId && cameras.length === 0) {
        throw new Error('Nenhuma câmera de vídeo disponível.');
      }
      
      await stopScanner();
      setScannerActive(true);

      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        selectedCameraId || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await stopScanner();
          handleQrCodeUrl(decodedText);
        },
        () => {
          // ignore scanner errors (fails to decode frame)
        }
      );
    } catch (err: any) {
      setScannerError(err.message || 'Erro ao inicializar câmera. Conceda permissão no navegador.');
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Erro ao fechar câmera:', err);
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  const handleQrCodeUrl = async (url: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setParsedNfe(null);

    try {
      const response = await api.post<ParsedNfe>('/stock/import-qrcode', { qrcodeUrl: url });
      
      const itemsWithFactor = response.items.map(item => ({
        ...item,
        conversionFactor: 1
      }));

      setParsedNfe({
        ...response,
        items: itemsWithFactor
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao processar cupom fiscal do QR Code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setParsedNfe(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const xmlText = event.target?.result as string;
      try {
        const response = await api.post<ParsedNfe>('/stock/import-xml', { xmlContent: xmlText });
        
        const itemsWithFactor = response.items.map(item => ({
          ...item,
          conversionFactor: 1
        }));
        
        setParsedNfe({
          ...response,
          items: itemsWithFactor
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao importar XML. Verifique o arquivo.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  // Add Manual Item to spreadsheet list
  const addManualItem = () => {
    if (!selectedProduct) {
      setError('Por favor, selecione um produto cadastrado.');
      return;
    }
    const qty = parseFloat(manualQuantity);
    const totalCost = parseFloat(manualTotalCost);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantidade inválida.');
      return;
    }
    if (isNaN(totalCost) || totalCost < 0) {
      setError('Custo total inválido.');
      return;
    }

    const newItem: ParsedItem = {
      supplierCode: selectedProduct.sku || '',
      ean: selectedProduct.sku || '',
      name: selectedProduct.name,
      quantity: qty,
      costPrice: totalCost / qty, // unit cost
      conversionFactor: 1,
      matchedProduct: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price || 0),
        cost: parseFloat(selectedProduct.cost || 0),
        stockQuantity: parseFloat(selectedProduct.stock_quantity || 0),
        sku: selectedProduct.sku || ''
      }
    };

    setDraftItems([...draftItems, newItem]);
    
    // Clear inputs
    setSearchSkuOrName('');
    setSelectedProduct(null);
    setManualQuantity('1');
    setManualTotalCost('');
    setError('');

    // Refocus search field
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const removeDraftItem = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  // Process manual receipt list into reconciliation flow
  const handleProcessManualReceipt = () => {
    if (draftItems.length === 0) return;

    setError('');
    setSuccess('');
    
    const calculatedTotal = draftItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);

    setParsedNfe({
      accessKey: '', // no access key for common manual receipt
      supplierCnpj: manualCnpj.replace(/\D/g, '') || '00000000000000',
      supplierName: manualSupplierName || 'Recibo Manual / Avulso',
      totalValue: calculatedTotal,
      items: draftItems
    });
  };

  const handleFactorChange = (index: number, val: string) => {
    if (!parsedNfe) return;
    const factor = parseFloat(val) || 1;
    
    const updatedItems = [...parsedNfe.items];
    updatedItems[index].conversionFactor = factor;
    
    setParsedNfe({
      ...parsedNfe,
      items: updatedItems
    });
  };

  const openLinkModal = (index: number) => {
    setLinkingIndex(index);
    setSearchQuery('');
  };

  const confirmLink = (prod: any) => {
    if (linkingIndex === null || !parsedNfe) return;

    const updatedItems = [...parsedNfe.items];
    updatedItems[linkingIndex].matchedProduct = {
      id: prod.id,
      name: prod.name,
      price: parseFloat(prod.price || 0),
      cost: parseFloat(prod.cost || 0),
      stockQuantity: parseFloat(prod.stock_quantity || 0),
      sku: prod.sku || ''
    };

    setParsedNfe({
      ...parsedNfe,
      items: updatedItems
    });
    setLinkingIndex(null);
  };

  const openCreateModal = (index: number) => {
    if (!parsedNfe) return;
    const item = parsedNfe.items[index];
    const finalCost = item.costPrice / item.conversionFactor;
    
    setCreatingIndex(index);
    setNewProdName(item.name);
    setNewProdPrice(String((finalCost * 1.5).toFixed(2))); // Sugere 50% margem
    setNewProdSku(item.ean || item.supplierCode || '');
    setNewProdCategoryId(categories[0]?.id || '');
  };

  const confirmCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingIndex === null || !parsedNfe) return;

    setSaving(true);
    try {
      const item = parsedNfe.items[creatingIndex];
      const finalCost = item.costPrice / item.conversionFactor;

      const payload = {
        name: newProdName,
        categoryId: newProdCategoryId || null,
        price: parseFloat(newProdPrice),
        cost: finalCost,
        active: true,
        sku: newProdSku.trim() || null,
      };

      const newProduct = await api.post<any>('/products', payload);
      await loadReferenceData();

      const updatedItems = [...parsedNfe.items];
      updatedItems[creatingIndex].matchedProduct = {
        id: newProduct.id,
        name: newProduct.name,
        price: parseFloat(newProduct.price || 0),
        cost: parseFloat(newProduct.cost || 0),
        stockQuantity: parseFloat(newProduct.stock_quantity || 0),
        sku: newProduct.sku || ''
      };

      setParsedNfe({
        ...parsedNfe,
        items: updatedItems
      });
      setCreatingIndex(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedNfe) return;

    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        accessKey: parsedNfe.accessKey || null,
        supplierCnpj: parsedNfe.supplierCnpj,
        supplierName: parsedNfe.supplierName,
        totalValue: parsedNfe.totalValue,
        items: parsedNfe.items.map(item => ({
          productId: item.matchedProduct?.id || null,
          supplierCode: item.supplierCode,
          ean: item.ean,
          name: item.name,
          quantity: item.quantity * item.conversionFactor,
          costPrice: item.costPrice / item.conversionFactor
        }))
      };

      await api.post('/stock/confirm-import', payload);
      setSuccess('Entrada de estoque realizada com sucesso! Os preços de custo médio e saldos físicos foram atualizados.');
      
      // Reset states
      setParsedNfe(null);
      setDraftItems([]);
      setManualCnpj('');
      setManualSupplierName('');
      loadReferenceData();
    } catch (err: any) {
      setError(err.message || 'Erro ao confirmar a entrada de estoque.');
    } finally {
      setSaving(false);
    }
  };

  const filteredDbProducts = dbProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout title="Importar Nota / Cupom de Estoque">
      <div className="space-y-6">
        
        {/* Style sheet for laser scan overlay animation */}
        <style>{`
          @keyframes scan-laser {
            0% { top: 10px; }
            50% { top: 240px; }
            100% { top: 10px; }
          }
        `}</style>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm text-center font-semibold">
            {success}
          </div>
        )}

        {/* Navigation Tabs (Only visible when not in reconciliation review screen) */}
        {!parsedNfe && (
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850 max-w-xl mx-auto shadow-inner">
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'xml' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> NF-e (XML)
            </button>
            
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'qrcode' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" /> Cupom (QR Code)
            </button>
            
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'manual' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" /> Recibo (Manual)
            </button>
          </div>
        )}

        {/* Input Zones */}
        {!parsedNfe && (
          <div className="space-y-6">
            
            {/* Tab 1: XML File Uploader */}
            {activeTab === 'xml' && (
              <div className="max-w-xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <UploadCloud className="w-16 h-16 text-indigo-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                  
                  <h2 className="text-xl font-bold text-white mb-2">Importação de XML de NF-e</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                    Arraste ou selecione o arquivo .xml da nota fiscal eletrônica de compra.
                  </p>

                  <label className="inline-flex bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                      </span>
                    ) : (
                      'Selecionar Arquivo XML'
                    )}
                    <input 
                      type="file" 
                      accept=".xml" 
                      disabled={loading} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: NFC-e QR Code Scanner (Camera or URL copy paste) */}
            {activeTab === 'qrcode' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-center space-y-6 relative overflow-hidden">
                {/* Laser scan animation overlay */}
                {scannerActive && (
                  <div 
                    className="absolute left-[5%] right-[5%] h-1 bg-red-500 rounded shadow-[0_0_8px_#ef4444]" 
                    style={{
                      animation: 'scan-laser 2s infinite ease-in-out'
                    }} 
                  />
                )}

                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-indigo-400" /> Leitor de NFC-e / SAT
                  </h3>
                  {scannerActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/15 animate-pulse">
                      Ao Vivo
                    </span>
                  )}
                </div>

                {/* Viewport element for html5-qrcode */}
                <div 
                  id="qr-reader" 
                  className="overflow-hidden rounded-2xl bg-black border border-slate-850 aspect-square flex items-center justify-center text-slate-500 text-sm font-semibold relative"
                >
                  {!scannerActive && (
                    <div className="space-y-2">
                      <QrCode className="w-12 h-12 text-slate-700 mx-auto opacity-50" />
                      <p>Câmera Inativa</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {!scannerActive ? (
                    <button
                      onClick={startScanner}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-5 h-5" /> Ativar Câmera
                    </button>
                  ) : (
                    <button
                      onClick={stopScanner}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Parar Câmera
                    </button>
                  )}
                </div>

                {cameras.length > 1 && (
                  <div className="text-left space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mudar Dispositivo de Câmera</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        if (scannerActive) startScanner(); // Restart using newly selected camera device
                      }}
                      className="w-full bg-slate-950 border border-slate-850 text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      {cameras.map((camera, i) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label || `Câmera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scannerError && (
                  <p className="text-xs text-red-400 font-semibold bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">
                    {scannerError}
                  </p>
                )}

                <div className="border-t border-slate-850 pt-5 space-y-4">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-left">
                    Ou Cole a URL da SEFAZ Manualmente
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://www.sefaz.sp.gov.br/nfce/consulta..."
                      value={qrcodeUrlInput}
                      onChange={(e) => setQrcodeUrlInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-700 font-mono"
                    />
                    <button
                      onClick={() => handleQrCodeUrl(qrcodeUrlInput)}
                      disabled={loading || !qrcodeUrlInput}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold px-6 rounded-xl transition-colors cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Processar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Fast keyboard/spreadsheet layout for standard receipts */}
            {activeTab === 'manual' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-indigo-400" /> Digitação Rápida de Recibo
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Usabilidade 100% via Teclado</span>
                </div>

                {/* Header info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">CNPJ do Fornecedor</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={manualCnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Razão Social / Nome Fantasia</label>
                    <input
                      type="text"
                      placeholder="Ex: Comercial de Alimentos LTDA"
                      value={manualSupplierName}
                      onChange={(e) => setManualSupplierName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Data da Compra</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                    />
                  </div>
                </div>

                {/* Quick input row */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    
                    {/* Product Autocomplete Search */}
                    <div className="md:col-span-6 relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Buscar Produto ou Bipar Código/EAN
                      </label>
                      <input
                        type="text"
                        ref={searchInputRef}
                        placeholder="Digite o nome ou bipe o código..."
                        value={searchSkuOrName}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          setSearchSkuOrName(e.target.value);
                          setShowSuggestions(true);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      
                      {/* Suggestions list */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-40 mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-850">
                          {suggestions.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setSearchSkuOrName(prod.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-900 text-white text-xs font-semibold flex justify-between items-center transition-colors cursor-pointer"
                            >
                              <span>{prod.name}</span>
                              <span className="text-slate-500 font-mono text-[10px]">{prod.sku || 'Sem SKU'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Badge */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qtd.</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-center font-bold"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custo Total R$</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={manualTotalCost}
                        placeholder="0.00"
                        onChange={(e) => setManualTotalCost(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addManualItem();
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <button
                        onClick={addManualItem}
                        type="button"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                  
                  {/* Active Selected Info Card */}
                  {selectedProduct && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 flex justify-between items-center text-xs">
                      <span className="text-indigo-300 font-bold">
                        Selecionado: {selectedProduct.name}
                      </span>
                      <span className="text-slate-500 font-mono">
                        Custo Atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(selectedProduct.cost || 0))} | SKU: {selectedProduct.sku || 'Sem SKU'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Draft list table */}
                <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-850">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Selecionado</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-24">Quantidade</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-36">Custo Total</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-32">Custo Unitário</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-20">Remover</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-semibold">
                            Nenhum produto digitado. Preencha os campos acima e aperte a tecla Enter para adicionar.
                          </td>
                        </tr>
                      ) : (
                        draftItems.map((item, index) => (
                          <tr key={index} className="border-b border-slate-850 hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4">
                              <p className="text-white font-bold text-sm">{item.name}</p>
                              <p className="text-slate-500 text-xs font-mono">SKU/EAN: {item.ean || 'Sem Código'}</p>
                            </td>
                            <td className="py-3 px-4 text-center text-white font-semibold text-sm">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-center text-emerald-400 font-extrabold text-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.costPrice)}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400 text-xs font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.costPrice)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => removeDraftItem(index)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleProcessManualReceipt}
                    disabled={draftItems.length === 0}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
                  >
                    Próximo: Reconciliar Itens <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Invoice Reconciliation & Review Section (Unified for XML, QR Code and Manual inputs) */}
        {parsedNfe && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-400" /> Origem da Entrada de Estoque
                </div>
                <p className="text-white font-mono text-sm tracking-wide bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 truncate max-w-sm">
                  {parsedNfe.accessKey ? `Chave: ${parsedNfe.accessKey}` : 'Entrada Manual de Recibo'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 max-w-2xl">
                <div>
                  <span className="block text-slate-500 text-xs font-medium mb-1">Fornecedor</span>
                  <span className="text-white font-bold text-sm block truncate">{parsedNfe.supplierName}</span>
                  <span className="text-slate-400 text-xs font-mono">
                    {parsedNfe.supplierCnpj ? parsedNfe.supplierCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : 'Não Informado'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-medium mb-1">Valor Total Nota</span>
                  <span className="text-emerald-400 font-black text-base">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedNfe.totalValue)}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                  <button 
                    onClick={() => {
                      setParsedNfe(null);
                      setDraftItems([]);
                    }}
                    className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm border border-slate-880 hover:bg-slate-800/50 transition-all cursor-pointer"
                  >
                    Descartar e Voltar
                  </button>
                </div>
              </div>
            </div>

            {/* Reconciliation Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-800 bg-slate-950/20">
                <h3 className="text-lg font-bold text-white">Conciliação de Itens</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Revise as quantidades e vincule produtos pendentes antes de registrar a entrada física.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800">
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Item do Cupom / Nota</th>
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Qtd. Documento</th>
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Fator Conversão</th>
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valores Unitários</th>
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status / Mapeamento Interno</th>
                      <th className="py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedNfe.items.map((item, idx) => {
                      const finalQty = item.quantity * item.conversionFactor;
                      const finalCost = item.costPrice / item.conversionFactor;

                      return (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/20 transition-all">
                          <td className="py-4 px-5">
                            <p className="text-white font-bold text-sm">{item.name}</p>
                            <p className="text-slate-500 text-xs font-mono mt-0.5">
                              Cód. Forn: #{item.supplierCode || 'N/A'} | EAN: {item.ean || 'Sem código'}
                            </p>
                          </td>
                          <td className="py-4 px-5 text-white font-semibold text-sm">
                            {item.quantity}
                          </td>
                          <td className="py-4 px-5">
                            <input 
                              type="number"
                              min="1"
                              value={item.conversionFactor}
                              onChange={(e) => handleFactorChange(idx, e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-center font-bold text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="py-4 px-5">
                            <div className="text-slate-400 text-xs">
                              Preço Compra: <span className="text-slate-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.costPrice)}</span>
                            </div>
                            <div className="text-indigo-400 font-bold text-xs mt-0.5">
                              Estoque: <span className="text-indigo-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalCost)}</span>
                              {item.conversionFactor > 1 && ` (x${finalQty} un)`}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            {item.matchedProduct ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado
                                </span>
                                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                                  <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                                  {item.matchedProduct.name} <span className="text-slate-500 font-mono text-[10px]">({item.matchedProduct.sku})</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Não Encontrado
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex justify-end gap-2">
                              {!item.matchedProduct ? (
                                <>
                                  <button
                                    onClick={() => openLinkModal(idx)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Link2 className="w-3.5 h-3.5" /> Vincular
                                  </button>
                                  <button
                                    onClick={() => openCreateModal(idx)}
                                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Novo
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    const updated = [...parsedNfe.items];
                                    updated[idx].matchedProduct = null;
                                    setParsedNfe({ ...parsedNfe, items: updated });
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1.5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  Desvincular
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirm Actions */}
              <div className="p-6 bg-slate-950/40 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Total de Itens: <strong className="text-white">{parsedNfe.items.length}</strong> | Itens Vinculados: <strong className="text-white">{parsedNfe.items.filter(i => i.matchedProduct).length}</strong>
                </span>

                <button
                  onClick={handleConfirmImport}
                  disabled={saving || parsedNfe.items.some(i => !i.matchedProduct)}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Confirmando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Confirmar Entrada no Estoque
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* MODAL DE VÍNCULO MANUAL */}
      <AnimatePresence>
        {linkingIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Vincular a Produto Interno</h3>
                <button onClick={() => setLinkingIndex(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar produto por nome ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {filteredDbProducts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhum produto cadastrado corresponde à busca.</div>
                  ) : (
                    filteredDbProducts.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => confirmLink(prod)}
                        className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 rounded-xl transition-all flex justify-between items-center group cursor-pointer"
                      >
                        <div>
                          <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">{prod.name}</p>
                          <p className="text-slate-400 text-xs font-mono mt-0.5">SKU/Código: {prod.sku || 'Sem SKU'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CADASTRO RÁPIDO DE PRODUTO */}
      <AnimatePresence>
        {creatingIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Cadastrar Produto Novo</h3>
                <button onClick={() => setCreatingIndex(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={confirmCreateProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Código / SKU</label>
                    <input
                      type="text"
                      required
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Preço de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                  <select
                    required
                    value={newProdCategoryId}
                    onChange={(e) => setNewProdCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-800 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCreatingIndex(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Salvar & Vincular
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
