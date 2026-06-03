import { useEffect } from 'react';

export function useStoreTheme(settings: any) {
  useEffect(() => {
    if (!settings) return;
    
    const root = document.documentElement;
    if (settings.primary_color) {
      root.style.setProperty('--color-brand-primary', settings.primary_color);
    }
    if (settings.secondary_color) {
      root.style.setProperty('--color-brand-secondary', settings.secondary_color);
    }
    
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }

    if (settings.store_name) {
      document.title = settings.store_name;
    }
  }, [settings]);
}
