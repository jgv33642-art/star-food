import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

type OperatingMode = 'mesa' | 'comanda';

interface StoreConfig {
  mode: OperatingMode;
}

export function useStoreConfig() {
  const { user } = useAuth();
  
  // Create a key bound to the company to avoid conflicts if same browser used for different companies
  const configKey = user?.companySlug ? `@Lanchonete:config_${user.companySlug}` : null;

  const [mode, setMode] = useState<OperatingMode>('mesa');

  useEffect(() => {
    if (configKey) {
      const stored = localStorage.getItem(configKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StoreConfig;
          if (parsed.mode === 'mesa' || parsed.mode === 'comanda') {
            setMode(parsed.mode);
          }
        } catch (e) {
          console.error('Failed to parse store config');
        }
      }
    }
  }, [configKey]);

  const updateMode = (newMode: OperatingMode) => {
    setMode(newMode);
    if (configKey) {
      localStorage.setItem(configKey, JSON.stringify({ mode: newMode }));
    }
  };

  // Helper strings to use in the UI dynamically
  const label = mode === 'mesa' ? 'Mesa' : 'Comanda';
  const labelPlural = mode === 'mesa' ? 'Mesas' : 'Comandas';
  const labelMin = mode === 'mesa' ? 'mesa' : 'comanda';

  return {
    mode,
    updateMode,
    label,
    labelPlural,
    labelMin
  };
}
