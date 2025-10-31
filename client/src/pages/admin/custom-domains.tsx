import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Globe, CheckCircle2, Clock, XCircle, Mail, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  email: string | null;
}

interface CustomDomain {
  id: string;
  companyId: string;
  requestedDomain: string | null;
  currentDomain: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  company: Company | null;
}

export default function CustomDomains() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; domain: CustomDomain | null }>({
    open: false,
    domain: null,
  });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch domains
  const { data: domains = [], isLoading } = useQuery<CustomDomain[]>({
    queryKey: ["/api/admin/custom-domains", statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === "all"
          ? "/api/admin/custom-domains"
          : `/api/admin/custom-domains?status=${statusFilter}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erro ao buscar domínios");
      return response.json();
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) => {
      const response = await fetch(`/api/admin/custom-domains/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Status atualizado e email enviado para a empresa",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-domains"] });
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
      const response = await fetch(`/api/admin/custom-domains/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erro ao deletar domínio");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Domínio deletado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-domains"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ id, subject, message }: { id: string; subject: string; message: string }) => {
      const response = await fetch(`/api/admin/custom-domains/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar email");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Email enviado com sucesso",
      });
      setEmailDialog({ open: false, domain: null });
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: string, status: number) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este domínio?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendEmail = () => {
    if (!emailDialog.domain || !emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Atenção",
        description: "Preencha o assunto e a mensagem",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      id: emailDialog.domain.id,
      subject: emailSubject,
      message: emailMessage,
    });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 1:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            Removido
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = domains.filter((d) => d.status === 0).length;
  const connectedCount = domains.filter((d) => d.status === 1).length;

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
            <h1 className="text-3xl font-bold tracking-tight">Domínios Customizados</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as solicitações de domínios customizados das empresas
            </p>
          </div>
          <div className="flex gap-2">
            <Card className="px-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
                <p className="text-xs text-muted-foreground">Conectados</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filtrar por Status</CardTitle>
                <CardDescription>Visualize domínios por status</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">Pendentes</SelectItem>
                  <SelectItem value="1">Conectados</SelectItem>
                  <SelectItem value="2">Rejeitados</SelectItem>
                  <SelectItem value="3">Removidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Domínio Solicitado</TableHead>
                  <TableHead>Domínio Anterior</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum domínio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{domain.company?.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{domain.company?.email || "Sem email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`//${domain.requestedDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {domain.requestedDomain}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {domain.currentDomain || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={domain.status.toString()}
                          onValueChange={(value) => handleStatusChange(domain.id, Number(value))}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue>{getStatusBadge(domain.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Pendente</SelectItem>
                            <SelectItem value="1">Conectado</SelectItem>
                            <SelectItem value="2">Rejeitado</SelectItem>
                            <SelectItem value="3">Removido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(domain.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEmailDialog({ open: true, domain });
                              setEmailSubject("");
                              setEmailMessage("");
                            }}
                            disabled={!domain.company?.email}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(domain.id)}
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

      {/* Email Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog({ open, domain: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar Email</DialogTitle>
            <DialogDescription>
              Enviar email para {emailDialog.domain?.company?.name} sobre o domínio{" "}
              {emailDialog.domain?.requestedDomain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto do email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog({ open: false, domain: null })}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
