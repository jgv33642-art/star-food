import { useState } from 'react';

// Using standard props for simplicity without needing to import Supabase for this dummy example.
export const AppearanceTab = ({ companyId, initialSettings }: any) => {
  const [primaryColor, setPrimaryColor] = useState(initialSettings?.primary_color || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(initialSettings?.secondary_color || '#f59e0b');
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Logic goes here
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulário de Configuração */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cor Principal (Botões e Destaques)</label>
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={primaryColor} 
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
              type="text" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cor Secundária</label>
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={secondaryColor} 
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-12 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
              type="text" 
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Logo do Estabelecimento</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleLogoUpload}
            disabled={isUploading}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
          />
        </div>
      </div>

      {/* Preview em Tempo Real simulando a tela de um Celular */}
      <div className="flex justify-center items-center bg-slate-950 p-8 rounded-3xl border border-slate-800">
        <div className="w-[320px] h-[600px] border-[8px] border-slate-900 rounded-[3rem] overflow-hidden relative bg-white">
          <div 
            className="w-full h-16 flex items-center justify-center shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo Preview" className="h-10 w-10 rounded-full" />
            ) : (
              <span className="text-white font-bold">Minha Loja</span>
            )}
          </div>
          <div className="p-4 space-y-4 mt-8">
            <div className="h-24 bg-slate-100 rounded-xl w-full border border-slate-200"></div>
            <div className="h-24 bg-slate-100 rounded-xl w-full border border-slate-200"></div>
          </div>
          <div className="absolute bottom-6 left-4 right-4">
            <button 
              className="w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg"
              style={{ backgroundColor: secondaryColor }}
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
