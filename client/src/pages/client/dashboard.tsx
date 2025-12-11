import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { ClientStats, WhatsappInstance, AiAgent } from "@/types";
import { MessageSquare, Bot, MessageCircle, Circle } from "lucide-react";

export default function ClientDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<ClientStats>({
    queryKey: ["/client/stats"],
  });

  const { data: instances = [] } = useQuery<WhatsappInstance[]>({
    queryKey: ["/whatsapp-instances"],
  });

  const { data: agents = [] } = useQuery<AiAgent[]>({
    queryKey: ["/ai-agents"],
  });

  if (statsLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageSquare className="text-primary text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Instâncias Ativas</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeInstances || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary/10">
                <Bot className="text-secondary text-xl" />
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
              <div className="p-3 rounded-full bg-primary/10">
                <MessageCircle className="text-primary text-xl" />
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
        {/* WhatsApp Instances */}
        <Card>
          <CardHeader>
            <CardTitle>Suas Instâncias WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instances.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma instância encontrada</p>
              </div>
            ) : (
              instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Circle className={`w-2 h-2 rounded-full ${
                      instance.status === 'connected' ? 'theme-success' : 'theme-error'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{instance.name}</p>
                      <p className="text-xs text-muted-foreground">{instance.phone || "Sem telefone"}</p>
                    </div>
                  </div>
                  <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                    {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Agentes IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum agente encontrado</p>
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Bot className="text-secondary text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.modelo}</p>
                    </div>
                  </div>
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
