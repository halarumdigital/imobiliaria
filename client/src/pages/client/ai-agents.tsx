import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { AiAgent, WhatsappInstance } from "@/types";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Bot, Plus, Edit, Trash2, FileText, Upload, TestTube2, Send, BarChart3, MessageCircle, User, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Component for Agent Usage History
function AgentUsageHistory() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiLogs, setShowApiLogs] = useState(false);
  
  const { data: usageStats = [], refetch } = useQuery({
    queryKey: ["/api/agents/usage-stats"],
    select: (data: any[]) => data.sort((a, b) => b.messageCount - a.messageCount)
  });

  const { data: apiLogs = [], refetch: refetchApiLogs } = useQuery({
    queryKey: ["/api/api-call-logs"],
    queryFn: () => apiGet("/api-call-logs?limit=50"),
    enabled: showApiLogs
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/agents/usage-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/api-call-logs"] });
      await refetch();
      if (showApiLogs) {
        await refetchApiLogs();
      }
      toast({
        title: "Estatísticas atualizadas",
        description: "Os dados foram recarregados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as estatísticas",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">📊 Estatísticas de Uso dos Agentes</h3>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Veja qual agente (principal ou secundário) foi usado em cada conversa
        </p>
        
        {usageStats.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {usageStats.map((stat: any, index: number) => (
              <Card key={stat.agentId} className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.agentType === 'secondary' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {stat.agentType === 'secondary' ? 
                      <Bot className="text-blue-600 dark:text-blue-400" /> : 
                      <Bot className="text-purple-600 dark:text-purple-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {stat.agentName}
                      {stat.agentType === 'secondary' && (
                        <Badge variant="outline" className="text-xs">
                          Secundário
                        </Badge>
                      )}
                    </h4>
                    {stat.specialization && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        📋 {stat.specialization}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      Mensagens
                    </span>
                    <span className="font-medium">{stat.messageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Conversas
                    </span>
                    <span className="font-medium">{stat.conversationCount}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">🤖 Histórico de Acionamentos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Lista de quando e qual agente foi acionado
        </p>
        
        {/* Lista simples de acionamentos */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {usageStats.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum acionamento encontrado</p>
            </div>
          ) : (
            usageStats.map((stat: any) => (
              <Card key={stat.agentId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stat.agentType === 'secondary' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      <Bot className={`w-4 h-4 ${
                        stat.agentType === 'secondary' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{stat.agentName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={stat.agentType === 'secondary' ? "default" : "secondary"} className={`text-xs ${
                          stat.agentType === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {stat.agentType === 'secondary' ? 'Secundário' : 'Principal'}
                        </Badge>
                        {stat.specialization && (
                          <span className="text-xs text-muted-foreground">• {stat.specialization}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{stat.messageCount} acionamentos</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.lastUsed ? format(new Date(stat.lastUsed), "dd/MM HH:mm", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* API Call Logs Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">🔌 Histórico de Chamadas API</h3>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  await apiPost("/test-api-log", {});
                  toast({
                    title: "Log de teste criado",
                    description: "Um log de API de exemplo foi adicionado",
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/api-call-logs"] });
                  refetchApiLogs();
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: "Não foi possível criar o log de teste",
                    variant: "destructive",
                  });
                }
              }}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              🧪 Teste
            </Button>
            <Button 
              onClick={() => {
                setShowApiLogs(!showApiLogs);
                if (!showApiLogs) {
                  queryClient.invalidateQueries({ queryKey: ["/api/api-call-logs"] });
                }
              }}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              {showApiLogs ? 'Ocultar' : 'Mostrar'} Logs de API
            </Button>
          </div>
        </div>
        
        {showApiLogs && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Histórico completo de todas as chamadas para APIs externas (VistaHost, etc.)
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {apiLogs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto text-muted-foreground mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    🔌
                  </div>
                  <p className="text-muted-foreground">Nenhuma chamada de API encontrada</p>
                </div>
              ) : (
                apiLogs.map((log: any) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.responseStatus.startsWith('2') ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          <span className={`text-xs font-bold ${
                            log.responseStatus.startsWith('2') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {log.responseStatus.startsWith('2') ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{log.apiType}</p>
                            <Badge variant="outline" className="text-xs">
                              {log.responseStatus}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.executionTime}ms
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {log.endpoint}
                          </p>
                          {log.userPhone && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              📱 {log.userPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <p>{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p>{format(new Date(log.createdAt), "HH:mm:ss", { locale: ptBR })}</p>
                      </div>
                    </div>
                    
                    {/* Request/Response Details - Collapsible */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Ver detalhes da requisição/resposta
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xs font-medium mb-1">Dados da Requisição:</p>
                          <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
                            {JSON.stringify(log.requestData, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Resposta da API:</p>
                          <pre className="text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
                            {JSON.stringify(log.responseData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AiAgents() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [viewMode, setViewMode] = useState<"all" | "main" | "secondary">("all");
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    prompt: "",
    temperatura: "0.7",
    trainingFiles: [] as string[],
    agentType: "main" as "main" | "secondary",
    parentAgentId: "",
    specialization: "",
    delegationKeywords: [] as string[],
  });

  // Chat test modal state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{message: string, response: string, timestamp: string}[]>([]);
  const [testingAgent, setTestingAgent] = useState<AiAgent | null>(null);

  // Link form state
  const [linkFormData, setLinkFormData] = useState({
    instanceId: "",
    agentId: "",
  });
  const [showLinkForm, setShowLinkForm] = useState(false);

  const { data: agents = [], isLoading } = useQuery<AiAgent[]>({
    queryKey: ["/api/ai-agents"],
  });

  const { data: mainAgents = [] } = useQuery<AiAgent[]>({
    queryKey: ["/api/ai-agents/main"],
  });

  const { data: instances = [] } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
  });

  // Filter instances that can be linked (have evolutionInstanceId, regardless of cached status)
  const connectedInstances = instances.filter(instance => {
    return instance.evolutionInstanceId; // Any instance with evolutionInstanceId can be linked
  });
  
  const mainAgentsForLinking = agents.filter(agent => 
    agent.agentType === "main" || !agent.agentType
  );

  // Buscar configurações globais de IA do administrador
  const { data: aiConfig } = useQuery({
    queryKey: ["/api/ai-config/public"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/ai-agents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
      resetForm();
      setActiveTab("list");
      toast({
        title: "Sucesso",
        description: "Agente criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar agente",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/ai-agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
      resetForm();
      setActiveTab("list");
      toast({
        title: "Sucesso",
        description: "Agente atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar agente",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/ai-agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
      toast({
        title: "Sucesso",
        description: "Agente excluído com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir agente",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/ai-agents/${id}/test`),
    onSuccess: (data) => {
      toast({
        title: data.success ? "Sucesso" : "Erro no teste",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao testar agente",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => 
      apiPost(`/ai-agents/${id}/chat`, { message }),
    onSuccess: (data, variables) => {
      const newEntry = {
        message: variables.message,
        response: data.response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory(prev => [...prev, newEntry]);
      setChatMessage("");
      toast({
        title: "Resposta gerada",
        description: "O agente respondeu com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar resposta",
        variant: "destructive",
      });
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ instanceId, agentId }: { instanceId: string; agentId: string }) => 
      apiPost(`/whatsapp-instances/${instanceId}/link-agent`, { agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
      setLinkFormData({ instanceId: "", agentId: "" });
      setShowLinkForm(false);
      toast({
        title: "Sucesso",
        description: "Agente vinculado à instância com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao vincular agente",
        variant: "destructive",
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (instanceId: string) => 
      apiPost(`/whatsapp-instances/${instanceId}/unlink-agent`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
      toast({
        title: "Sucesso", 
        description: "Vinculação removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover vinculação",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      prompt: "",
      temperatura: "0.7",
      trainingFiles: [],
      agentType: "main",
      parentAgentId: "",
      specialization: "",
      delegationKeywords: [],
    });
    setEditingAgent(null);
  };

  const openTestModal = (agent: AiAgent) => {
    setTestingAgent(agent);
    setChatHistory([]);
    setChatMessage("");
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !testingAgent) return;
    
    chatMutation.mutate({
      id: testingAgent.id,
      message: chatMessage,
    });
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkFormData.instanceId || !linkFormData.agentId) {
      toast({
        title: "Erro",
        description: "Selecione uma instância e um agente",
        variant: "destructive",
      });
      return;
    }

    linkMutation.mutate({
      instanceId: linkFormData.instanceId,
      agentId: linkFormData.agentId,
    });
  };

  const handleUnlink = (instanceId: string, instanceName: string) => {
    if (confirm(`Tem certeza que deseja remover a vinculação da instância "${instanceName}"?`)) {
      unlinkMutation.mutate(instanceId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação para agentes secundários
    if (formData.agentType === "secondary") {
      if (!formData.parentAgentId) {
        toast({
          title: "Erro",
          description: "Agentes secundários devem ter um agente principal responsável",
          variant: "destructive",
        });
        return;
      }
      if (!formData.specialization.trim()) {
        toast({
          title: "Erro", 
          description: "Agentes secundários devem ter uma especialização definida",
          variant: "destructive",
        });
        return;
      }
      if (formData.delegationKeywords.length === 0) {
        toast({
          title: "Erro",
          description: "Agentes secundários devem ter pelo menos uma palavra-chave de ativação",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Adicionar configurações globais de IA automaticamente
    const dataWithAiConfig = {
      ...formData,
      modelo: (aiConfig as any)?.modelo || "gpt-4o",
      numeroTokens: (aiConfig as any)?.numeroTokens || 1000,
    };
    
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: dataWithAiConfig });
    } else {
      createMutation.mutate(dataWithAiConfig);
    }
  };

  const handleEdit = (agent: AiAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      prompt: agent.prompt,
      temperatura: agent.temperatura.toString(),
      trainingFiles: agent.trainingFiles || [],
      agentType: (agent.agentType || "main") as "main" | "secondary",
      parentAgentId: agent.parentAgentId || "",
      specialization: agent.specialization || "",
      delegationKeywords: agent.delegationKeywords || [],
    });
    setActiveTab("create");
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este agente?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = async () => {
    try {
      const response = await apiPost("/objects/upload", {});
      return {
        method: 'PUT' as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Erro ao obter URL de upload:", error);
      throw error;
    }
  };

  const handleFileComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      setFormData(prev => ({
        ...prev,
        trainingFiles: [...prev.trainingFiles, uploadURL]
      }));
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Agentes de IA</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie agentes de IA personalizados
          </p>
        </div>
        <Button onClick={() => { resetForm(); setActiveTab("create"); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agente
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="list">Lista de Agentes</TabsTrigger>
            <TabsTrigger value="create">
              {editingAgent ? "Editar Agente" : "Criar Agente"}
            </TabsTrigger>
            <TabsTrigger value="link">Vincular à Instância</TabsTrigger>
            <TabsTrigger value="usage">Histórico de Uso</TabsTrigger>
          </TabsList>

          {/* Agents List Tab */}
          <TabsContent value="list">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Lista de Agentes</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus agentes principais e especializados
                </p>
              </div>
              <Select value={viewMode} onValueChange={(value: "all" | "main" | "secondary") => setViewMode(value)}>
                <SelectTrigger className="w-48" data-testid="filter-agents">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🔍 Todos os Agentes</SelectItem>
                  <SelectItem value="main">🤖 Agentes Principais</SelectItem>
                  <SelectItem value="secondary">🔧 Agentes Secundários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum agente encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents
                  .filter(agent => {
                    if (viewMode === "all") return true;
                    if (viewMode === "main") return agent.agentType === "main" || !agent.agentType;
                    if (viewMode === "secondary") return agent.agentType === "secondary";
                    return true;
                  })
                  .map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {agent.name}
                            {agent.agentType === "secondary" && (
                              <Badge variant="outline" className="text-xs">
                                Secundário
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{agent.modelo}</p>
                          {agent.agentType === "secondary" && agent.specialization && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              📋 {agent.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {agent.prompt.length > 100 
                        ? `${agent.prompt.substring(0, 100)}...`
                        : agent.prompt
                      }
                    </p>

                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>Temp: {agent.temperatura}</span>
                      <span>Tokens: {agent.numeroTokens}</span>
                    </div>

                    {/* Training Files */}
                    {agent.trainingFiles && agent.trainingFiles.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 dark:text-green-300">
                          {agent.trainingFiles.length} PDF{agent.trainingFiles.length > 1 ? 's' : ''} carregado{agent.trainingFiles.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Delegation Keywords for Secondary Agents */}
                    {agent.agentType === "secondary" && agent.delegationKeywords && agent.delegationKeywords.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Palavras-chave:</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.delegationKeywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                              {keyword}
                            </Badge>
                          ))}
                          {agent.delegationKeywords.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              +{agent.delegationKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agent)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(agent.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(agent.id)}
                        disabled={testMutation.isPending}
                      >
                        <TestTube2 className="w-3 h-3 mr-1" />
                        {testMutation.isPending ? "Testando..." : "Testar"}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTestModal(agent)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Chat com {agent.name}</DialogTitle>
                            <DialogDescription>
                              Teste o agente enviando mensagens e veja as respostas baseadas no prompt e PDFs carregados.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="flex-1 overflow-y-auto space-y-4 py-4">
                            {chatHistory.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">
                                Inicie uma conversa com o agente...
                              </div>
                            ) : (
                              chatHistory.map((entry, index) => (
                                <div key={index} className="space-y-3">
                                  <div className="flex justify-end">
                                    <div className="max-w-[80%] bg-primary text-primary-foreground p-3 rounded-lg">
                                      <p className="text-sm">{entry.message}</p>
                                      <span className="text-xs opacity-70">{entry.timestamp}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-start">
                                    <div className="max-w-[80%] bg-muted p-3 rounded-lg">
                                      <p className="text-sm">{entry.response}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t">
                            <Input
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Digite sua mensagem..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              disabled={chatMutation.isPending}
                            />
                            <Button 
                              onClick={handleSendMessage}
                              disabled={!chatMessage.trim() || chatMutation.isPending}
                            >
                              <Send className="w-4 h-4" />
                              {chatMutation.isPending ? "Enviando..." : "Enviar"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Agent Tab */}
          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nome do Agente</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Assistente de Vendas"
                  required
                />
              </div>

              <div>
                <Label htmlFor="temperatura">Temperatura</Label>
                <Input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperatura}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperatura: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Modelo: {(aiConfig as any)?.modelo || "gpt-4o"} | Tokens: {(aiConfig as any)?.numeroTokens || 1000}
                </p>
              </div>

              {/* Agent Type Selection */}
              <div>
                <Label htmlFor="agentType">Tipo de Agente</Label>
                <Select 
                  value={formData.agentType} 
                  onValueChange={(value: "main" | "secondary") => {
                    setFormData(prev => ({ 
                      ...prev, 
                      agentType: value,
                      parentAgentId: value === "main" ? "" : prev.parentAgentId,
                      specialization: value === "main" ? "" : prev.specialization,
                      delegationKeywords: value === "main" ? prev.delegationKeywords : []
                    }));
                  }}
                >
                  <SelectTrigger data-testid="select-agent-type">
                    <SelectValue placeholder="Selecione o tipo de agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">🤖 Agente Principal</SelectItem>
                    <SelectItem value="secondary">🔧 Agente Secundário (Especializado)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.agentType === "main" 
                    ? "Agente principal que pode delegar tarefas para agentes especializados" 
                    : "Agente especializado que é chamado pelo agente principal"
                  }
                </p>
              </div>

              {/* Parent Agent Selection (only for secondary agents) */}
              {formData.agentType === "secondary" && (
                <div>
                  <Label htmlFor="parentAgentId">Agente Principal Responsável *</Label>
                  <Select 
                    value={formData.parentAgentId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parentAgentId: value }))}
                  >
                    <SelectTrigger data-testid="select-parent-agent">
                      <SelectValue placeholder="Selecione o agente principal" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          🤖 {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O agente principal que irá delegar tarefas para este agente especializado
                  </p>
                </div>
              )}

              {/* Specialization (only for secondary agents) */}
              {formData.agentType === "secondary" && (
                <div>
                  <Label htmlFor="specialization">Especialização do Agente *</Label>
                  <Input
                    id="specialization"
                    data-testid="input-specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Ex: Suporte Técnico, Vendas, Atendimento Médico..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Descreva a área de especialização deste agente
                  </p>
                </div>
              )}

              {/* Delegation Keywords (only for secondary agents) */}
              {formData.agentType === "secondary" && (
                <div>
                  <Label htmlFor="delegationKeywords">Palavras-chave para Ativação *</Label>
                  <div className="space-y-3">
                    {/* Input para adicionar nova palavra-chave */}
                    <div className="flex gap-2">
                      <Input
                        id="newKeyword"
                        data-testid="input-new-keyword"
                        placeholder="Digite uma palavra-chave e pressione Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const keyword = input.value.trim();
                            if (keyword && !formData.delegationKeywords.includes(keyword)) {
                              setFormData(prev => ({ 
                                ...prev, 
                                delegationKeywords: [...prev.delegationKeywords, keyword]
                              }));
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.getElementById('newKeyword') as HTMLInputElement;
                          const keyword = input?.value.trim();
                          if (keyword && !formData.delegationKeywords.includes(keyword)) {
                            setFormData(prev => ({ 
                              ...prev, 
                              delegationKeywords: [...prev.delegationKeywords, keyword]
                            }));
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Lista de palavras-chave atuais */}
                    {formData.delegationKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.delegationKeywords.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  delegationKeywords: prev.delegationKeywords.filter((_, i) => i !== index)
                                }));
                              }}
                              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Textarea alternativo para colar múltiplas palavras */}
                    <details className="cursor-pointer">
                      <summary className="text-sm text-muted-foreground hover:text-foreground">
                        📋 Ou cole múltiplas palavras separadas por vírgula
                      </summary>
                      <Textarea
                        className="mt-2"
                        rows={2}
                        placeholder="suporte, ajuda, problema, erro, bug, técnico, instalação"
                        onBlur={(e) => {
                          const text = e.target.value.trim();
                          if (text) {
                            const newKeywords = text
                              .split(/[,\n]/)
                              .map(k => k.trim())
                              .filter(k => k.length > 0 && !formData.delegationKeywords.includes(k));
                            
                            if (newKeywords.length > 0) {
                              setFormData(prev => ({ 
                                ...prev, 
                                delegationKeywords: [...prev.delegationKeywords, ...newKeywords]
                              }));
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                    </details>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Palavras-chave separadas por vírgula que ativarão este agente especializado
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="prompt">Prompt do Agente</Label>
                <Textarea
                  id="prompt"
                  rows={6}
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Descreva como o agente deve se comportar, suas especialidades e instruções específicas..."
                  required
                />
              </div>

              <div>
                <Label>Upload de PDF para Treinamento</Label>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleFileUpload}
                  onComplete={handleFileComplete}
                  buttonClassName="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25 mt-2"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload de arquivos PDF</span>
                    <span className="text-xs text-muted-foreground">PDF até 10MB cada</span>
                  </div>
                </ObjectUploader>
                
                {formData.trainingFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {formData.trainingFiles.length} arquivo{formData.trainingFiles.length > 1 ? 's' : ''} carregado{formData.trainingFiles.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {formData.trainingFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <FileText className="w-4 h-4" />
                          <span>Documento {index + 1} - Pronto para treinamento</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAgent 
                    ? (updateMutation.isPending ? "Atualizando..." : "Atualizar Agente")
                    : (createMutation.isPending ? "Criando..." : "Criar Agente")
                  }
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Link Agents Tab */}
          <TabsContent value="link">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Vinculações de Agentes</h3>
                  <p className="text-sm text-muted-foreground">
                    Vincule agentes IA às suas instâncias WhatsApp conectadas
                  </p>
                </div>
                <Button 
                  onClick={() => setShowLinkForm(true)}
                  data-testid="button-create-link"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Vinculação
                </Button>
              </div>

              {/* Link Form */}
              {showLinkForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nova Vinculação</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Selecione uma instância conectada e um agente principal
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="instanceId">Instância WhatsApp</Label>
                        <Select
                          value={linkFormData.instanceId}
                          onValueChange={(value) => setLinkFormData(prev => ({ ...prev, instanceId: value }))}
                        >
                          <SelectTrigger data-testid="select-instance">
                            <SelectValue placeholder="Selecione uma instância conectada" />
                          </SelectTrigger>
                          <SelectContent>
                            {connectedInstances.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Nenhuma instância conectada encontrada
                              </div>
                            ) : (
                              connectedInstances
                                .filter(instance => !instance.aiAgentId) // Only show instances without agents
                                .map((instance) => (
                                  <SelectItem key={instance.id} value={instance.id}>
                                    📱 {instance.name} - {instance.phone || "Sem telefone"}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas instâncias conectadas e sem agente vinculado
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="agentId">Agente Principal</Label>
                        <Select
                          value={linkFormData.agentId}
                          onValueChange={(value) => setLinkFormData(prev => ({ ...prev, agentId: value }))}
                        >
                          <SelectTrigger data-testid="select-agent">
                            <SelectValue placeholder="Selecione um agente principal" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainAgentsForLinking.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Nenhum agente principal encontrado
                              </div>
                            ) : (
                              mainAgentsForLinking.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  🤖 {agent.name} - {agent.modelo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas agentes do tipo "Principal" podem ser vinculados
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowLinkForm(false);
                            setLinkFormData({ instanceId: "", agentId: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={linkMutation.isPending || !linkFormData.instanceId || !linkFormData.agentId}
                          data-testid="button-save-link"
                        >
                          {linkMutation.isPending ? "Vinculando..." : "Criar Vinculação"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Vinculações Ativas</h4>
                <div className="space-y-2">
                  {instances.filter(i => i.aiAgentId).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma vinculação ativa</p>
                  ) : (
                    instances.filter(i => i.aiAgentId).map((instance) => {
                      const agent = agents.find(a => a.id === instance.aiAgentId);
                      return (
                        <div key={instance.id} className="flex items-center justify-between p-3 bg-background rounded border">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                              📱 {instance.name}
                            </span>
                            <span className="text-sm text-muted-foreground">↔</span>
                            <span className="text-sm font-medium">
                              🤖 {agent?.name || "Agente não encontrado"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Ativo
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlink(instance.id, instance.name)}
                              disabled={unlinkMutation.isPending}
                              className="text-destructive hover:text-destructive"
                              data-testid={`unlink-button-${instance.id}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              {unlinkMutation.isPending ? "Removendo..." : "Remover"}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Agent Usage History Tab */}
          <TabsContent value="usage">
            <AgentUsageHistory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
