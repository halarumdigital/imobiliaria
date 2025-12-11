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
import { FunnelStage } from "@/types";
import { 
  Plus, Edit, Trash2, BarChart3, ArrowUp, ArrowDown, 
  Filter, Target, TrendingUp, Users 
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const defaultColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
];

export default function ComercialFunil() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: defaultColors[0],
  });

  const { data: stages = [], isLoading } = useQuery<FunnelStage[]>({
    queryKey: ["/api/funnel-stages"],
    queryFn: () => apiGet("/funnel-stages"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("/funnel-stages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnel-stages"] });
      resetForm();
      setActiveTab("list");
      toast({
        title: "Sucesso",
        description: "Etapa do funil criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar etapa",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/funnel-stages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnel-stages"] });
      resetForm();
      setActiveTab("list");
      toast({
        title: "Sucesso",
        description: "Etapa do funil atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar etapa",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/funnel-stages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnel-stages"] });
      toast({
        title: "Sucesso",
        description: "Etapa do funil excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir etapa",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ stageId, direction }: { stageId: string; direction: 'up' | 'down' }) => 
      apiPost(`/funnel-stages/${stageId}/reorder`, { direction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnel-stages"] });
      toast({
        title: "Sucesso",
        description: "Ordem das etapas atualizada!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao reordenar etapas",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiPut(`/funnel-stages/${id}/toggle`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnel-stages"] });
      toast({
        title: "Sucesso",
        description: "Status da etapa atualizado!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar status",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: defaultColors[0],
    });
    setEditingStage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da etapa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingStage) {
      updateMutation.mutate({ id: editingStage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (stage: FunnelStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description,
      color: stage.color,
    });
    setActiveTab("create");
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta etapa do funil?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReorder = (stageId: string, direction: 'up' | 'down') => {
    reorderMutation.mutate({ stageId, direction });
  };

  const handleToggleStatus = (stage: FunnelStage) => {
    toggleStatusMutation.mutate({ id: stage.id, isActive: !stage.isActive });
  };

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const activeStages = sortedStages.filter(stage => stage.isActive);
  const inactiveStages = sortedStages.filter(stage => !stage.isActive);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Funil de Vendas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as etapas do seu funil de vendas
          </p>
        </div>
        <Button onClick={() => { resetForm(); setActiveTab("create"); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Etapa
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="list">Etapas do Funil</TabsTrigger>
            <TabsTrigger value="create">
              {editingStage ? "Editar Etapa" : "Criar Etapa"}
            </TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Stages List Tab */}
          <TabsContent value="list">
            <div className="space-y-6">
              {/* Active Stages */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Etapas Ativas ({activeStages.length})
                </h3>
                
                {activeStages.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma etapa ativa</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeStages.map((stage, index) => (
                      <div key={stage.id} className="border rounded-lg p-4 bg-background">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReorder(stage.id, 'up')}
                                disabled={index === 0 || reorderMutation.isPending}
                                className="h-7 w-7 p-0"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReorder(stage.id, 'down')}
                                disabled={index === activeStages.length - 1 || reorderMutation.isPending}
                                className="h-7 w-7 p-0"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: stage.color }}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{stage.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  #{stage.order}
                                </Badge>
                              </div>
                              {stage.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(stage)}
                              disabled={toggleStatusMutation.isPending}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Desativar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(stage)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(stage.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inactive Stages */}
              {inactiveStages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    Etapas Inativas ({inactiveStages.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {inactiveStages.map((stage) => (
                      <div key={stage.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-md opacity-50"
                              style={{ backgroundColor: stage.color }}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-muted-foreground">{stage.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Inativa
                                </Badge>
                              </div>
                              {stage.description && (
                                <p className="text-sm text-muted-foreground mt-1 opacity-75">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(stage)}
                              disabled={toggleStatusMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              Ativar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(stage)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(stage.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Create/Edit Stage Tab */}
          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
              <div>
                <Label htmlFor="name">Nome da Etapa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Lead Qualificado, Proposta Enviada, Negociação..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que caracteriza esta etapa do funil..."
                />
              </div>

              <div>
                <Label htmlFor="color">Cor da Etapa</Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        formData.color === color 
                          ? 'border-foreground scale-110' 
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <span className="text-sm text-muted-foreground">
                    Ou escolha uma cor personalizada
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab("list")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingStage 
                    ? (updateMutation.isPending ? "Atualizando..." : "Atualizar Etapa")
                    : (createMutation.isPending ? "Criando..." : "Criar Etapa")
                  }
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas do Funil
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Etapas</p>
                          <p className="text-2xl font-bold">{stages.length}</p>
                        </div>
                        <Filter className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Etapas Ativas</p>
                          <p className="text-2xl font-bold text-green-600">{activeStages.length}</p>
                        </div>
                        <Target className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Etapas Inativas</p>
                          <p className="text-2xl font-bold text-gray-500">{inactiveStages.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {activeStages.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3">Visão Geral das Etapas Ativas</h4>
                  <div className="space-y-3">
                    {activeStages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{stage.order}
                          </span>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{stage.name}</h5>
                          {stage.description && (
                            <p className="text-sm text-muted-foreground">{stage.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          Posição {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}