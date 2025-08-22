import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { WhatsappInstance, AiAgent } from "@/types";
import { MessageSquare, Plus, Settings, Unlink, QrCode, RefreshCw, Trash2 } from "lucide-react";

export default function WhatsApp() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const { data: instances = [], isLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
  });

  const { data: agents = [] } = useQuery<AiAgent[]>({
    queryKey: ["/api/ai-agents"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/whatsapp-instances/create-evolution", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Instância criada com sucesso na Evolution API!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar instância",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/whatsapp-instances/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
      toast({
        title: "Sucesso",
        description: "Instância excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir instância",
        variant: "destructive",
      });
    },
  });

  const linkAgentMutation = useMutation({
    mutationFn: ({ instanceId, agentId }: { instanceId: string; agentId: string }) =>
      apiPost(`/whatsapp-instances/${instanceId}/link-agent`, { agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
      toast({
        title: "Sucesso",
        description: "Agente vinculado com sucesso!",
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

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleGenerateQR = async (instanceId: string) => {
    try {
      setSelectedInstance(instanceId);
      setQrLoading(true);
      setIsQrModalOpen(true);
      setQrCode(null);
      
      // Call Evolution API to generate QR code
      const response = await apiGet(`/whatsapp-instances/${instanceId}/qrcode`);
      setQrCode(response.qrCode);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code",
        variant: "destructive",
      });
      setIsQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta instância?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleLinkAgent = (instanceId: string, agentId: string) => {
    const finalAgentId = agentId === "none" ? "" : agentId;
    linkAgentMutation.mutate({ instanceId, agentId: finalAgentId });
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Nenhum agente";
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : "Agente não encontrado";
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Instances List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas instâncias de WhatsApp
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Instância WhatsApp</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Instância</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Atendimento Vendas"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="5511999999999"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Telefone que será usado na instância WhatsApp
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar Instância"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="space-y-4">
            {instances.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma instância encontrada</p>
              </div>
            ) : (
              instances.map((instance) => (
                <div key={instance.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        instance.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <h4 className="font-medium">{instance.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {instance.phone || "Sem telefone"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                      {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span>Agente IA: </span>
                      <span className="font-medium text-purple-600">
                        {getAgentName(instance.aiAgentId)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateQR(instance.id)}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(instance.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Agent Linking */}
                  {agents.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Select
                          value={instance.aiAgentId || "none"}
                          onValueChange={(value) => handleLinkAgent(instance.id, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Vincular agente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Remover agente</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Panel - Hidden on mobile, replaced by modal */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {qrCode ? (
              <div>
                <div className="w-48 h-48 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="max-w-full max-h-full" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Escaneie o QR Code com seu WhatsApp para conectar a instância
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedInstance && handleGenerateQR(selectedInstance)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar QR
                </Button>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            {!qrCode && (
              <p className="text-sm text-muted-foreground">
                Clique em "QR Code" em uma instância para gerar o código
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            {qrLoading ? (
              <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : qrCode ? (
              <div>
                <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    className="max-w-full max-h-full rounded" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code com seu WhatsApp para conectar a instância
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedInstance && handleGenerateQR(selectedInstance)}
                  disabled={qrLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar QR
                </Button>
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
