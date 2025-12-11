import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, AuthResponse } from "@/types";
import { apiPost, apiGet } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiGet("/auth/me");
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await apiPost("/auth/login", { email, password });
    localStorage.setItem("token", response.token);
    setUser(response.user);
    // Limpar cache de queries antigas após login
    queryClient.clear();
    // Forçar refetch das configurações globais após login
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/global-config/public"] });
      queryClient.refetchQueries({ queryKey: ["/global-config/public"] });
      // Disparar evento customizado para forçar refresh no ThemeProvider
      window.dispatchEvent(new CustomEvent('force-theme-refresh'));
    }, 100);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // Limpar cache de queries ao fazer logout
    queryClient.clear();
    // Forçar refetch das configurações globais para garantir tema atualizado
    queryClient.invalidateQueries({ queryKey: ["/global-config/public"] });
    // Disparar evento customizado para forçar refresh no ThemeProvider
    window.dispatchEvent(new CustomEvent('force-theme-refresh'));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
