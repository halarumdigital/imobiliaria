import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Settings, Database, TestTube, Save, RefreshCw, BarChart3, MessageCircle, User, Bot } from "lucide-react";

interface ApiSettings {
  id?: string;
  companyId: string;
  apiUrl: string;
  apiToken: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Component for JSON visualization
function JSONViewer({ data }: { data: any }) {
  if (!data) {
    return <span className="text-xs text-muted-foreground italic">Dados não disponíveis</span>;
  }

  const renderValue = (value: any, key?: string, depth = 0): React.ReactNode => {
    // Limitar profundidade para evitar conteúdo muito extenso
    if (depth > 2) {
      return <span className="text-muted-foreground italic">...</span>;
    }
    
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof value === "string") {
      const truncated = value.length > 50 ? `${value.substring(0, 50)}...` : value;
      return <span className="text-green-600 dark:text-green-400">"{truncated}"</span>;
    }
    
    if (typeof value === "number") {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }
    
    if (typeof value === "boolean") {
      return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      
      if (value.length > 2) {
        return (
          <span className="text-gray-500">
            [<span className="text-muted-foreground italic"> {value.length} itens</span>]
          </span>
        );
      }
      
      return (
        <span className="text-gray-500">
          [{value.slice(0, 2).map((item, index) => (
            <span key={index}>
              {index > 0 && ", "}
              {renderValue(item, undefined, depth + 1)}
            </span>
          ))}
          {value.length > 2 && <span className="text-muted-foreground italic">, ...</span>}]
        </span>
      );
    }
    
    if (typeof value === "object") {
      const keys = Object.keys(value);
      
      if (keys.length === 0) {
        return <span className="text-gray-500">{}</span>;
      }
      
      if (keys.length > 3) {
        return (
          <span className="text-gray-500">
            {`{ `}<span className="text-muted-foreground italic">{keys.length} propriedades</span>{` }`}
          </span>
        );
      }
      
      return (
        <span className="text-gray-500">
          {"{ "}
          {keys.slice(0, 3).map((k, index) => (
            <span key={k}>
              {index > 0 && ", "}
              <span className="text-orange-600 dark:text-orange-400">"{k}"</span>
              <span className="text-gray-500">: </span>
              {renderValue(value[k], k, depth + 1)}
            </span>
          ))}
          {keys.length > 3 && <span className="text-muted-foreground italic">, ...</span>}
          {" }"}
        </span>
      );
    }
    
    return <span className="text-gray-500">{String(value)}</span>;
  };

  return (
    <div className="text-xs font-mono leading-relaxed">
      {renderValue(data)}
    </div>
  );
}

function AgentUsageHistory() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiLogs, setShowApiLogs] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {usageStats.map((stat: any, index: number) => (
              <Card key={stat.agentId} className="p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    stat.agentType === 'secondary' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {stat.agentType === 'secondary' ? 
                      <Bot className="text-blue-600 dark:text-blue-400" /> : 
                      <Bot className="text-purple-600 dark:text-purple-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{stat.agentName}</h4>
                      {stat.agentType === 'secondary' && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Secundário
                        </Badge>
                      )}
                    </div>
                    {stat.specialization && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        📋 {stat.specialization}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      Mensagens
                    </span>
                    <span className="font-medium">{stat.messageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 flex-shrink-0" />
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
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {usageStats.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum acionamento encontrado</p>
            </div>
          ) : (
            usageStats.map((stat: any) => (
              <Card key={stat.agentId} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      stat.agentType === 'secondary' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      <Bot className={`w-4 h-4 ${
                        stat.agentType === 'secondary' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{stat.agentName}</p>
                        <Badge variant={stat.agentType === 'secondary' ? "default" : "secondary"} className={`text-xs flex-shrink-0 ${
                          stat.agentType === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {stat.agentType === 'secondary' ? 'Secundário' : 'Principal'}
                        </Badge>
                      </div>
                      {stat.specialization && (
                        <p className="text-xs text-muted-foreground truncate">
                          📋 {stat.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
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
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Histórico completo de todas as chamadas para APIs externas (VistaHost, etc.)
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Filtrar por API, endpoint ou telefone..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="w-64 text-xs"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {apiLogs.filter((log: any) => {
                if (!logFilter) return true;
                const searchTerm = logFilter.toLowerCase();
                return (
                  log.apiType?.toLowerCase().includes(searchTerm) ||
                  log.endpoint?.toLowerCase().includes(searchTerm) ||
                  log.userPhone?.includes(searchTerm) ||
                  log.responseStatus?.includes(searchTerm)
                );
              }).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto text-muted-foreground mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    🔌
                  </div>
                  <p className="text-muted-foreground">
                    {logFilter ? "Nenhum log encontrado com os critérios de busca" : "Nenhuma chamada de API encontrada"}
                  </p>
                </div>
              ) : (
                apiLogs.filter((log: any) => {
                  if (!logFilter) return true;
                  const searchTerm = logFilter.toLowerCase();
                  return (
                    log.apiType?.toLowerCase().includes(searchTerm) ||
                    log.endpoint?.toLowerCase().includes(searchTerm) ||
                    log.userPhone?.includes(searchTerm) ||
                    log.responseStatus?.includes(searchTerm)
                  );
                }).map((log: any) => (
                  <Card key={log.id} className="p-3 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          log.responseStatus.startsWith('2') ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          <span className={`text-xs font-bold ${
                            log.responseStatus.startsWith('2') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {log.responseStatus.startsWith('2') ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium text-sm truncate">{log.apiType}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {log.responseStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {log.executionTime}ms
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">Endpoint:</span>
                        <span className="ml-1 break-all">{log.endpoint}</span>
                      </div>
                      {log.userPhone && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span>📱</span>
                          <span className="text-blue-600 dark:text-blue-400">{log.userPhone}</span>
                        </div>
                      )}
                    </div>
                    
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none py-2 px-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="group-open:hidden">▶ Mostrar dados da requisição e resposta</span>
                        <span className="hidden group-open:inline">▼ Ocultar dados da requisição e resposta</span>
                      </summary>
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <div>
                          <p className="text-xs font-medium mb-2 text-blue-600 dark:text-blue-400">📤 Dados da Requisição:</p>
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <JSONViewer data={log.requestData} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-2 text-green-600 dark:text-green-400">📥 Resposta da API:</p>
                          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <JSONViewer data={log.responseData} />
                          </div>
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

export default function ApiConfig() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("config");
  const [formData, setFormData] = useState<Partial<ApiSettings>>({
    apiUrl: "",
    apiToken: "",
    isActive: true,
  });

  const { data: apiSettings, isLoading, refetch } = useQuery<ApiSettings>({
    queryKey: ["/api/client/api-settings"],
    queryFn: () => apiGet("/client/api-settings"),
  });

  useEffect(() => {
    if (apiSettings) {
      setFormData(apiSettings);
    }
  }, [apiSettings]);

  const { data: testResult, refetch: refetchTest } = useQuery({
    queryKey: ["/api/client/test-api-settings"],
    queryFn: () => apiGet("/client/test-api-settings"),
    enabled: false,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ApiSettings>) => apiPut("/client/api-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/api-settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações da API atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar configurações",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    refetchTest();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ApiSettings, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = () => {
    if (!apiSettings) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    
    if (testResult?.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>;
    } else if (testResult?.success === false) {
      return <Badge variant="destructive">Erro na conexão</Badge>;
    }
    
    return <Badge variant="outline">Não testado</Badge>;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da API & Histórico de Uso
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure a integração com APIs externas e visualize o histórico de uso dos agentes
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="config">Configuração da API</TabsTrigger>
          <TabsTrigger value="usage">Histórico de Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge()}
                  </div>
                  <Button
                    onClick={handleTestConnection}
                    disabled={!formData.apiUrl || !formData.apiToken}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    Testar Conexão
                  </Button>
                </div>
                
                {testResult && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Resultado do Teste:</p>
                    <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.message}
                    </p>
                    {testResult.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="text-xs mt-1 text-muted-foreground whitespace-pre-wrap">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações da API</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Insira as credenciais da API VistaHost/VistaSoft
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="apiUrl">URL da API</Label>
                    <Input
                      id="apiUrl"
                      value={formData.apiUrl || ""}
                      onChange={(e) => handleInputChange("apiUrl", e.target.value)}
                      placeholder="https://api.vistahost.com.br"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL base da API VistaHost ou VistaSoft
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="apiToken">Token da API</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      value={formData.apiToken || ""}
                      onChange={(e) => handleInputChange("apiToken", e.target.value)}
                      placeholder="Insira seu token de API"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Token de autenticação fornecido pela VistaHost/VistaSoft
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive ?? true}
                      onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isActive" className="text-sm">
                      Ativar busca de imóveis via API
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending || !formData.apiUrl || !formData.apiToken}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruções de Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">1. Obter Credenciais VistaHost</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Acesse o painel administrativo da VistaHost</li>
                      <li>Vá em Configurações → API → Chaves de API</li>
                      <li>Gere um novo token ou use um existente</li>
                      <li>Copie a URL base e o token de acesso</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">2. Como Funciona</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>O sistema detecta automaticamente palavras-chave como "apartamento", "casa", "aluguel"</li>
                      <li>Quando detectada, busca imóveis na API configurada</li>
                      <li>Retorna resultados formatados para o usuário</li>
                      <li>Inclui fotos e informações detalhadas dos imóveis</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">3. Palavras-chave Disponíveis</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">apartamento</Badge>
                      <Badge variant="secondary">casa</Badge>
                      <Badge variant="secondary">imóvel</Badge>
                      <Badge variant="secondary">aluguel</Badge>
                      <Badge variant="secondary">alugar</Badge>
                      <Badge variant="secondary">comprar</Badge>
                      <Badge variant="secondary">venda</Badge>
                      <Badge variant="secondary">valor</Badge>
                      <Badge variant="secondary">preço</Badge>
                      <Badge variant="secondary">bairro</Badge>
                      <Badge variant="secondary">cidade</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <AgentUsageHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
