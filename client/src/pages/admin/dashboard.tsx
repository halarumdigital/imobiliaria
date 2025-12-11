import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { AdminStats } from "@/types";
import { Building, MessageSquare, Bot, MessageCircle, Circle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/admin/stats"],
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Building className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Empresas Ativas</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeCompanies || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <MessageSquare className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Instâncias WhatsApp</p>
                <p className="text-2xl font-bold text-foreground">{stats?.whatsappInstances || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Bot className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Agentes IA</p>
                <p className="text-2xl font-bold text-foreground">{stats?.aiAgents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <MessageCircle className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Conversas Hoje</p>
                <p className="text-2xl font-bold text-foreground">{stats?.todayConversations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Evolution API</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Circle className="w-2 h-2 fill-current mr-1" />
                Conectado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">OpenAI API</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Circle className="w-2 h-2 fill-current mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Banco de Dados</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Circle className="w-2 h-2 fill-current mr-1" />
                MySQL Online
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Sistema iniciado com sucesso</p>
                <p className="text-xs text-muted-foreground">há 2 minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Configurações carregadas</p>
                <p className="text-xs text-muted-foreground">há 5 minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">Banco de dados conectado</p>
                <p className="text-xs text-muted-foreground">há 12 minutos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
