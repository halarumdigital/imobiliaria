import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Bot, Plus, Edit, Trash2, FileText, Upload, TestTube2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  const { data: agents = [], isLoading } = useQuery<AiAgent[]>({
    queryKey: ["/api/ai-agents"],
  });

  const { data: mainAgents = [] } = useQuery<AiAgent[]>({
    queryKey: ["/api/ai-agents/main"],
  });

  const { data: instances = [] } = useQuery<WhatsappInstance[]>({
    queryKey: ["/whatsapp-instances"],
  });

  // Buscar configurações globais de IA do administrador
  const { data: aiConfig } = useQuery({
    queryKey: ["/api/ai-config/public"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/ai-agents", data),
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
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/api/ai-agents/${id}`, data),
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
    mutationFn: (id: string) => apiDelete(`/api/ai-agents/${id}`),
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
    mutationFn: (id: string) => apiPost(`/api/ai-agents/${id}/test`),
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
      apiPost(`/api/ai-agents/${id}/chat`, { message }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
      agentType: agent.agentType || "main",
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
          </TabsList>

          {/* Agents List Tab */}
          <TabsContent value="list">
            {agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum agente encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground">{agent.modelo}</p>
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

                    {agent.trainingFiles && agent.trainingFiles.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 dark:text-green-300">
                          {agent.trainingFiles.length} PDF{agent.trainingFiles.length > 1 ? 's' : ''} carregado{agent.trainingFiles.length > 1 ? 's' : ''}
                        </span>
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
              <p className="text-sm text-muted-foreground">
                Vincule agentes IA às suas instâncias WhatsApp diretamente na página de WhatsApp.
              </p>
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Vinculações Ativas</h4>
                <div className="space-y-2">
                  {instances.filter(i => i.aiAgentId).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma vinculação ativa</p>
                  ) : (
                    instances.filter(i => i.aiAgentId).map((instance) => {
                      const agent = agents.find(a => a.id === instance.aiAgentId);
                      return (
                        <div key={instance.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <span className="text-sm">
                            {instance.name} ↔ {agent?.name || "Agente não encontrado"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
