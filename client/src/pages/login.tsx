import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Building } from "lucide-react";
import { GlobalConfiguration } from "@/types";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Buscar configurações globais para pegar o logo
  const { data: globalConfig } = useQuery<Partial<GlobalConfiguration>>({
    queryKey: ["/global-config/public"],
    queryFn: () => fetch("/api/global-config/public").then(res => res.json()),
  });

  // Aplicar cores globais quando as configurações carregarem
  useEffect(() => {
    if (globalConfig?.coresPrimaria && globalConfig?.coresSecundaria) {
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
      
      // Apply CSS custom properties
      const root = document.documentElement;
      const primaryHsl = hexToHsl(globalConfig.coresPrimaria!);
      const secondaryHsl = hexToHsl(globalConfig.coresSecundaria!);
      
      root.style.setProperty("--primary", primaryHsl);
      root.style.setProperty("--secondary", secondaryHsl);
      root.style.setProperty("--primary-foreground", "255 255 255"); // white text on primary
      
      // Garantir que o botão tenha contraste adequado
      root.style.setProperty("--button-primary", primaryHsl);
      root.style.setProperty("--button-primary-foreground", "255 255 255");
      
      // Aplicar título da aba globalmente
      if (globalConfig.nomeAbaNavegador) {
        document.title = globalConfig.nomeAbaNavegador;
      }
    }
  }, [globalConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
      // Aguardar um momento para garantir que o estado foi atualizado
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: "admin" | "client") => {
    const demoCredentials = {
      admin: { email: "admin@admin.com", password: "admin123" },
      client: { email: "cliente@empresa.com", password: "cliente123" }
    };

    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
    
    setIsLoading(true);
    try {
      await login(demoCredentials[role].email, demoCredentials[role].password);
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Credenciais de demonstração não configuradas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mx-auto mb-4">
              {globalConfig?.logo ? (
                <img 
                  src={globalConfig.logo} 
                  alt="Logo" 
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="text-primary-foreground text-xl" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-2">Faça login para continuar</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm">Lembrar-me</Label>
              </div>
              <Button variant="link" className="text-sm p-0">
                Esqueceu a senha?
              </Button>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
