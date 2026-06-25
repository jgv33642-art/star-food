import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(swRegistration) {
      if (swRegistration) {
        // Tenta checar updates de hora em hora
        setInterval(() => {
          swRegistration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Se tem atualização pronta, atualiza e recarrega na hora (Forçado)
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      setIsInstallable(false);
    } else if (ios) {
      // On iOS, if not installed, show custom install prompt
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isIOS) {
      alert("Para instalar no iPhone/iPad: Toque no botão 'Compartilhar' (o ícone com uma seta para cima) na barra do Safari, e depois escolha 'Adicionar à Tela de Início'.");
      return false;
    }
    if (!deferredPrompt) {
      console.warn('Nenhum prompt de instalação disponível.');
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { isInstallable, isInstalled, installApp, isIOS };
};
