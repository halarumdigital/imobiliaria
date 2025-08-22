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
    queryKey: ["/global-config"],
    queryFn: () => fetch("/api/global-config", {
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
    
    // Convert hex to HSL for Tailwind CSS compatibility
    const hexToHsl = (hex: string) => {
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
    
    // Apply CSS custom properties to Tailwind variables
    const root = document.documentElement;
    root.style.setProperty("--primary", `hsl(${hexToHsl(newConfig.cores_primaria)})`);
    root.style.setProperty("--secondary", `hsl(${hexToHsl(newConfig.cores_secundaria)})`);
    root.style.setProperty("--background", `hsl(${hexToHsl(newConfig.cores_fundo)})`);
    root.style.setProperty("--sidebar-primary", `hsl(${hexToHsl(newConfig.cores_primaria)})`);
    root.style.setProperty("--sidebar-accent", `hsl(${hexToHsl(newConfig.cores_secundaria)})`);
    
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
