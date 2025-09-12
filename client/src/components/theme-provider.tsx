import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { GlobalConfiguration } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiGet } from "@/lib/api";

interface ThemeContextType {
  config: GlobalConfiguration | null;
  applyTheme: (config: GlobalConfiguration) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GlobalConfiguration | null>(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Log de montagem
  useEffect(() => {
    console.log('[ThemeProvider] Component mounted');
    return () => {
      console.log('[ThemeProvider] Component unmounted');
    };
  }, []);

  const { data: globalConfig } = useQuery({
    queryKey: ["/global-config/public", refreshKey],
    queryFn: async () => {
      console.log('[ThemeProvider] Fetching global config with refreshKey:', refreshKey);
      const response = await fetch("/api/global-config/public", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('[ThemeProvider] Global config fetched:', data);
      return data;
    },
    enabled: true, // Load theme for all users (public endpoint)
    staleTime: 0, // Always refetch to get latest colors
    gcTime: 0, // Don't cache this query
  });

  useEffect(() => {
    console.log('[ThemeProvider] globalConfig changed:', globalConfig);
    if (globalConfig && (globalConfig as GlobalConfiguration).id) {
      console.log('[ThemeProvider] Applying theme from globalConfig');
      applyTheme(globalConfig as GlobalConfiguration);
    } else if (globalConfig) {
      // Mesmo sem ID, tenta aplicar se tem dados
      console.log('[ThemeProvider] Applying theme from globalConfig (no ID but has data)');
      applyTheme(globalConfig as GlobalConfiguration);
    }
  }, [globalConfig]);

  // Forçar aplicação do tema quando a página é carregada/recarregada
  useEffect(() => {
    // Esperar um pouco para garantir que o DOM está totalmente carregado
    const timer = setTimeout(() => {
      if (globalConfig && (globalConfig as GlobalConfiguration).id) {
        console.log('Force applying theme on mount:', globalConfig);
        applyTheme(globalConfig as GlobalConfiguration);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [globalConfig]);

  // Listener para detectar mudanças de foco na janela e revalidar tema
  useEffect(() => {
    const handleFocus = () => {
      // Quando a janela ganha foco, force refresh com nova key
      setRefreshKey(Date.now());
    };

    const handleForceRefresh = () => {
      // Evento customizado para forçar refresh
      setRefreshKey(Date.now());
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('force-theme-refresh', handleForceRefresh);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('force-theme-refresh', handleForceRefresh);
    };
  }, []);

  // Listener para reagir a mudanças na DOM e garantir aplicação do tema
  useEffect(() => {
    if (!config) return;

    const observer = new MutationObserver(() => {
      // Verificar se as variáveis CSS ainda estão aplicadas
      const root = document.documentElement;
      const currentPrimary = getComputedStyle(root).getPropertyValue('--primary').trim();
      
      if (!currentPrimary && config) {
        console.log('Theme variables lost after DOM change, reapplying...');
        setTimeout(() => applyTheme(config), 50);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => observer.disconnect();
  }, [config]);

  const applyTheme = (newConfig: GlobalConfiguration) => {
    setConfig(newConfig);
    
    console.log('[applyTheme] Starting with config:', newConfig);
    
    // Convert hex to HSL for Tailwind CSS compatibility
    const hexToHsl = (hex: string) => {
      if (!hex || !hex.startsWith('#')) {
        console.warn('[applyTheme] Invalid hex color:', hex);
        return "203 89% 53%"; // fallback
      }
      
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    
    // Apply CSS custom properties
    const root = document.documentElement;
    
    // Tentar ambos os formatos de nome do campo
    const primaryColor = newConfig.coresPrimaria || newConfig.cores_primaria || "#3B82F6";
    const secondaryColor = newConfig.coresSecundaria || newConfig.cores_secundaria || "#6366F1";
    
    console.log('[applyTheme] Primary color hex:', primaryColor);
    console.log('[applyTheme] Secondary color hex:', secondaryColor);
    
    const primaryHsl = hexToHsl(primaryColor);
    const secondaryHsl = hexToHsl(secondaryColor);
    
    console.log('[applyTheme] Primary HSL:', primaryHsl);
    console.log('[applyTheme] Secondary HSL:', secondaryHsl);
    
    // Verificar valor atual antes de aplicar
    const currentPrimary = getComputedStyle(root).getPropertyValue('--primary').trim();
    console.log('[applyTheme] Current --primary before update:', currentPrimary);
    
    // Aplicar cores principais
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", "0 0% 100%");
    root.style.setProperty("--secondary", secondaryHsl);
    root.style.setProperty("--secondary-foreground", "0 0% 100%");
    
    // Forçar atualização de estilos inline para sobrescrever qualquer regra hardcoded
    const forceUpdateStyles = () => {
      // Atualizar variáveis CSS com !important usando setProperty
      root.style.setProperty("--primary", primaryHsl, "important");
      root.style.setProperty("--primary-foreground", "0 0% 100%", "important");
      root.style.setProperty("--secondary", secondaryHsl, "important");
      root.style.setProperty("--secondary-foreground", "0 0% 100%", "important");
      
      // Disparar evento de atualização de tema
      window.dispatchEvent(new CustomEvent('theme-updated', { 
        detail: { 
          primary: primaryHsl, 
          secondary: secondaryHsl 
        } 
      }));
    };
    
    // Aplicar atualização forçada
    forceUpdateStyles();
    
    // Aguardar um tick e forçar novamente para garantir aplicação
    setTimeout(() => {
      forceUpdateStyles();
      
      // Verificar se as variáveis foram aplicadas corretamente
      const computedPrimary = getComputedStyle(root).getPropertyValue('--primary').trim();
      console.log('[applyTheme] Computed --primary after delayed update:', computedPrimary);
      console.log('[applyTheme] Expected primary HSL:', primaryHsl);
      
      // Se não estão iguais, tentar aplicar novamente
      if (computedPrimary !== primaryHsl) {
        console.log('[applyTheme] ⚠️ CSS variables not applied correctly, forcing again...');
        setTimeout(() => {
          forceUpdateStyles();
          const recheck = getComputedStyle(root).getPropertyValue('--primary').trim();
          console.log('[applyTheme] After re-force, --primary is:', recheck);
        }, 100);
      } else {
        console.log('[applyTheme] ✅ CSS variables applied successfully');
      }
    }, 50);
    
    console.log('CSS variables set successfully with forced update');
    
    // Update document title
    const title = newConfig.nomeAbaNavegador || newConfig.nome_aba_navegador;
    if (title) {
      document.title = title;
    }
    
    // Update favicon if provided
    if (newConfig.favicon) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = newConfig.favicon;
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ config, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
