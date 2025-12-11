import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead, InsertLead, FunnelStage } from "@shared/schema";

interface LeadForm {
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  notes: string;
}

const statusOptions = [
  { value: "new", label: "Novo", color: "bg-blue-500" },
  { value: "contacted", label: "Contatado", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualificado", color: "bg-green-500" },
  { value: "converted", label: "Convertido", color: "bg-purple-500" },
  { value: "lost", label: "Perdido", color: "bg-red-500" },
];

export default function ComercialLeads() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [form, setForm] = useState<LeadForm>({
    name: "",
    phone: "",
    email: "",
    source: "Manual",
    status: "new",
    notes: "",
  });

  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Falha ao carregar leads");
      return response.json();
    },
  });

  // Fetch funnel stages for conversion
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/funnel-stages"],
    queryFn: async () => {
      const response = await fetch("/api/funnel-stages", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Falha ao carregar etapas do funil");
      return response.json();
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: InsertLead) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(leadData),
      });
      if (!response.ok) throw new Error("Falha ao criar lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead",
        variant: "destructive",
      });
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Falha ao atualizar lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      resetForm();
      setIsDialogOpen(false);
      setIsEditMode(false);
      setCurrentLead(null);
      toast({
        title: "Sucesso",
        description: "Lead atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lead",
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Falha ao excluir lead");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Sucesso",
        description: "Lead excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lead",
        variant: "destructive",
      });
    },
  });

  // Convert lead to customer mutation
  const convertLeadMutation = useMutation({
    mutationFn: async ({ id, funnelStageId }: { id: string; funnelStageId: string }) => {
      const response = await fetch(`/api/leads/${id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ funnelStageId }),
      });
      if (!response.ok) throw new Error("Falha ao converter lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsConvertDialogOpen(false);
      setCurrentLead(null);
      setSelectedStageId("");
      toast({
        title: "Sucesso",
        description: "Lead convertido para cliente com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao converter lead",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      source: "Manual",
      status: "new",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode && currentLead) {
      updateLeadMutation.mutate({
        id: currentLead.id,
        data: {
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          source: form.source,
          status: form.status,
          notes: form.notes || null,
        }
      });
    } else {
      createLeadMutation.mutate({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        source: form.source,
        status: form.status,
        notes: form.notes || undefined,
      });
    }
  };

  const handleEdit = (lead: Lead) => {
    setCurrentLead(lead);
    setForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      source: lead.source,
      status: lead.status,
      notes: lead.notes || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lead?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleConvert = (lead: Lead) => {
    setCurrentLead(lead);
    setIsConvertDialogOpen(true);
  };

  const confirmConvert = () => {
    if (!currentLead || !selectedStageId) {
      toast({
        title: "Erro",
        description: "Selecione uma etapa do funil para conversão",
        variant: "destructive",
      });
      return;
    }
    convertLeadMutation.mutate({
      id: currentLead.id,
      funnelStageId: selectedStageId,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                Gerencie seus leads e converta-os em clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsEditMode(false); setCurrentLead(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? "Editar Lead" : "Novo Lead"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Edite as informações do lead" : "Adicione um novo lead ao sistema"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do lead"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="lead@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Origem</Label>
                    <Input
                      id="source"
                      value={form.source}
                      onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="WhatsApp, Site, Referência..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Anotações sobre o lead..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createLeadMutation.isPending || updateLeadMutation.isPending}>
                      {isEditMode ? "Atualizar" : "Criar"} Lead
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: Lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.email || "-"}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(lead)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {!lead.convertedToCustomer && (
                          <DropdownMenuItem onClick={() => handleConvert(lead)}>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Converter para Cliente
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum lead encontrado. Crie seu primeiro lead!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Convert Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Lead para Cliente</DialogTitle>
            <DialogDescription>
              Selecione a etapa do funil onde o cliente será inserido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Etapa do Funil</Label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage: FunnelStage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={confirmConvert}
              disabled={convertLeadMutation.isPending || !selectedStageId}
            >
              Converter para Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}