import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Edit, Trash2, Mail, Phone, Users, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompanyAgent {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string | null;
  bio: string | null;
  socialMedia: any;
  propertiesSold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  bio: string;
  socialMedia: {
    linkedin?: string;
    instagram?: string;
  };
  propertiesSold: number;
  isActive: boolean;
}

const EMPTY_FORM: AgentFormData = {
  name: "",
  email: "",
  phone: "",
  avatar: "",
  role: "",
  bio: "",
  socialMedia: {},
  propertiesSold: 0,
  isActive: true,
};

export default function Agents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CompanyAgent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>(EMPTY_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery<CompanyAgent[]>({
    queryKey: ["/api/client/agents"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const response = await fetch("/api/client/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar corretor");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Corretor criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/agents"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AgentFormData> }) => {
      const response = await fetch(`/api/client/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar corretor");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Corretor atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/agents"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client/agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar corretor");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Corretor deletado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/agents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (agent?: CompanyAgent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        email: agent.email || "",
        phone: agent.phone || "",
        avatar: agent.avatar || "",
        role: agent.role || "",
        bio: agent.bio || "",
        socialMedia: agent.socialMedia || {},
        propertiesSold: agent.propertiesSold,
        isActive: agent.isActive,
      });
    } else {
      setEditingAgent(null);
      setFormData(EMPTY_FORM);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAgent(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Atenção",
        description: "O nome do corretor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (agent: CompanyAgent) => {
    if (confirm(`Tem certeza que deseja deletar o corretor ${agent.name}?`)) {
      deleteMutation.mutate(agent.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="w-8 h-8" />
              Corretores
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie a equipe de corretores da sua imobiliária
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Corretor
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Corretores</CardDescription>
              <CardTitle className="text-3xl">{agents.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Corretores Ativos</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {agents.filter((a) => a.isActive).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Vendas</CardDescription>
              <CardTitle className="text-3xl">
                {agents.reduce((sum, a) => sum + a.propertiesSold, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum corretor cadastrado. Clique em "Novo Corretor" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={agent.avatar || undefined} alt={agent.name} />
                            <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            {agent.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {agent.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.role ? (
                          <Badge variant="outline">{agent.role}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {agent.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span>{agent.email}</span>
                            </div>
                          )}
                          {agent.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                          {!agent.email && !agent.phone && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{agent.propertiesSold} vendas</Badge>
                      </TableCell>
                      <TableCell>
                        {agent.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(agent)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(agent)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? "Editar Corretor" : "Novo Corretor"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do corretor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@imobiliaria.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+55 11 98765-4321"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Corretor Sênior, Especialista em Imóveis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Foto (URL)</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Breve descrição sobre o corretor..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertiesSold">Propriedades Vendidas</Label>
                <Input
                  id="propertiesSold"
                  type="number"
                  min={0}
                  value={formData.propertiesSold}
                  onChange={(e) =>
                    setFormData({ ...formData, propertiesSold: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>Redes Sociais</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={formData.socialMedia?.linkedin || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia, linkedin: e.target.value },
                      })
                    }
                    placeholder="LinkedIn URL"
                  />
                  <Input
                    value={formData.socialMedia?.instagram || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                      })
                    }
                    placeholder="Instagram URL"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="isActive">Status Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Corretor aparecerá no website público
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingAgent ? "Salvar Alterações" : "Criar Corretor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
