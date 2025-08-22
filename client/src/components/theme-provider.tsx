import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { GlobalConfiguration } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface ThemeContextType {
  config: GlobalConfiguration | null;
  applyTheme: (config: GlobalConfiguration) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GlobalConfiguration | null>(null);

  const { data: globalConfig } = useQuery({
    queryKey: ["/global-config/public"],
    queryFn: () => fetch("/api/global-config/public", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }).then(res => res.json()),
    enabled: !!localStorage.getItem("token"), // Load theme for authenticated users
  });

  useEffect(() => {
    if (globalConfig && (globalConfig as GlobalConfiguration).id) {
      applyTheme(globalConfig as GlobalConfiguration);
    }
  }, [globalConfig]);

  const applyTheme = (newConfig: GlobalConfiguration) => {
    setConfig(newConfig);
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty("--color-primary", newConfig.cores_primaria);
    root.style.setProperty("--color-secondary", newConfig.cores_secundaria);
    root.style.setProperty("--color-background", newConfig.cores_fundo);
    
    // Update document title
    document.title = newConfig.nome_aba_navegador;
    
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
