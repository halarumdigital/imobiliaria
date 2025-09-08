import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import Configurations from "@/pages/admin/configurations";
import EvolutionApiSettings from "@/pages/admin/evolution-api";
import AiSettings from "@/pages/admin/ai-settings";
import Companies from "@/pages/admin/companies";

// Client pages
import ClientDashboard from "@/pages/client/dashboard";
import Profile from "@/pages/client/profile";
import WhatsApp from "@/pages/client/whatsapp";
import AiAgents from "@/pages/client/ai-agents";
import TestAI from "@/pages/client/test-ai";
import Conversations from "@/pages/client/conversations";
import WhatsAppDisparo from "@/pages/client/whatsapp-disparo";
import WhatsAppListaTransmissao from "@/pages/client/whatsapp-lista-transmissao";
import WhatsAppProxy from "@/pages/client/whatsapp-proxy";

interface ProtectedRouteProps {
  component: React.ComponentType;
  requiredRole?: 'admin' | 'client';
  title: string;
  subtitle?: string;
}

function ProtectedRoute({ component: Component, requiredRole, title, subtitle }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Redirect to={user.role === 'admin' ? '/admin' : '/client'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 px-6 py-6">
          <Component />
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Default redirect */}
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">Carregando...</div>
        ) : user ? (
          <Redirect to={user.role === 'admin' ? '/admin' : '/client'} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute 
          component={AdminDashboard}
          requiredRole="admin"
          title="Dashboard"
          subtitle="Visão geral do sistema"
        />
      </Route>
      <Route path="/admin/configurations">
        <ProtectedRoute 
          component={Configurations}
          requiredRole="admin"
          title="Configurações"
          subtitle="Configurações globais do sistema"
        />
      </Route>
      <Route path="/admin/evolution-api">
        <ProtectedRoute 
          component={EvolutionApiSettings}
          requiredRole="admin"
          title="Evolution API"
          subtitle="Configurações da Evolution API"
        />
      </Route>
      <Route path="/admin/ai-settings">
        <ProtectedRoute 
          component={AiSettings}
          requiredRole="admin"
          title="IA Global"
          subtitle="Configurações globais de IA"
        />
      </Route>
      <Route path="/admin/companies">
        <ProtectedRoute 
          component={Companies}
          requiredRole="admin"
          title="Empresas"
          subtitle="Gerenciamento de empresas"
        />
      </Route>

      {/* Client routes */}
      <Route path="/client">
        <ProtectedRoute 
          component={ClientDashboard}
          requiredRole="client"
          title="Dashboard"
          subtitle="Sua área de trabalho"
        />
      </Route>
      <Route path="/client/profile">
        <ProtectedRoute 
          component={Profile}
          requiredRole="client"
          title="Perfil"
          subtitle="Informações da empresa"
        />
      </Route>
      <Route path="/client/whatsapp">
        <ProtectedRoute 
          component={WhatsApp}
          requiredRole="client"
          title="WhatsApp"
          subtitle="Gerenciar instâncias"
        />
      </Route>
      <Route path="/client/ai-agents">
        <ProtectedRoute 
          component={AiAgents}
          requiredRole="client"
          title="Agentes IA"
          subtitle="Agentes de IA personalizados"
        />
      </Route>
      <Route path="/client/test-ai">
        <ProtectedRoute 
          component={TestAI}
          requiredRole="client"
          title="Teste de IA"
          subtitle="Teste seus agentes de IA"
        />
      </Route>
      <Route path="/client/conversations">
        <ProtectedRoute 
          component={Conversations}
          requiredRole="client"
          title="Conversas"
          subtitle="Histórico de conversas"
        />
      </Route>
      <Route path="/client/whatsapp/disparo">
        <ProtectedRoute 
          component={WhatsAppDisparo}
          requiredRole="client"
          title="Disparo WhatsApp"
          subtitle="Configurar e enviar mensagens em massa"
        />
      </Route>
      <Route path="/client/whatsapp/lista-transmissao">
        <ProtectedRoute 
          component={WhatsAppListaTransmissao}
          requiredRole="client"
          title="Lista de transmissão"
          subtitle="Gerenciar listas de contatos para disparo"
        />
      </Route>
      <Route path="/client/whatsapp/proxy">
        <ProtectedRoute 
          component={WhatsAppProxy}
          requiredRole="client"
          title="Proxies WebShare"
          subtitle="Visualizar proxies disponíveis"
        />
      </Route>

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
