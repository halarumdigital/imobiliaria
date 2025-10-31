import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Globe, CheckCircle2, Clock, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomDomain {
  id: string;
  companyId: string;
  requestedDomain: string | null;
  currentDomain: string | null;
  status: number; // 0=Pending, 1=Connected, 2=Rejected, 3=Removed
  createdAt: string;
  updatedAt: string;
}

interface DomainsResponse {
  domains: CustomDomain[];
  latestDomain: CustomDomain | null;
}

export default function Domains() {
  const [requestedDomain, setRequestedDomain] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch domains
  const { data, isLoading } = useQuery<DomainsResponse>({
    queryKey: ["/api/client/domains"],
  });

  // Request domain mutation
  const requestDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch("/api/client/domains/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedDomain: domain }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao solicitar domínio");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Solicitação enviada. Aguarde aprovação do administrador.",
      });
      setRequestedDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/domains"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedDomain.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, insira um domínio válido",
        variant: "destructive",
      });
      return;
    }
    requestDomainMutation.mutate(requestedDomain);
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

  const latestDomain = data?.latestDomain;
  const hasPendingRequest = latestDomain?.status === 0;
  const hasConnectedDomain = latestDomain?.status === 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domínio Customizado</h1>
          <p className="text-muted-foreground mt-2">
            Conecte seu próprio domínio ao sistema e personalize seu acesso
          </p>
        </div>

        {/* Current Domain Status */}
        {hasConnectedDomain && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Domínio Ativo:</strong>{" "}
              <a
                href={`//${latestDomain.requestedDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1 hover:text-green-900"
              >
                {latestDomain.requestedDomain}
                <ExternalLink className="w-3 h-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Solicitar Domínio Customizado
            </CardTitle>
            <CardDescription>
              Configure seu próprio domínio para acessar o sistema (exemplo: meudominio.com)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPendingRequest ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Você já possui uma solicitação pendente para: <strong>{latestDomain.requestedDomain}</strong>
                  <br />
                  Aguarde a aprovação do administrador.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleRequestDomain} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domínio</Label>
                  <div className="flex gap-2">
                    <Input
                      id="domain"
                      placeholder="exemplo: meudominio.com"
                      value={requestedDomain}
                      onChange={(e) => setRequestedDomain(e.target.value)}
                      disabled={requestDomainMutation.isPending}
                    />
                    <Button type="submit" disabled={requestDomainMutation.isPending}>
                      {requestDomainMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Solicitar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Não use <strong>http://</strong> ou <strong>https://</strong> no domínio
                  </p>
                </div>

                {/* DNS Instructions */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong className="block mb-2">Antes de solicitar, configure o DNS do seu domínio:</strong>
                    <div className="bg-white p-3 rounded border text-sm font-mono space-y-1 mt-2">
                      <div>Tipo: <strong>A</strong></div>
                      <div>Nome: <strong>@</strong> (ou deixe em branco)</div>
                      <div>Valor: <strong>[IP do servidor]</strong></div>
                      <div className="text-muted-foreground text-xs mt-2">
                        * Entre em contato com o suporte para obter o IP correto
                      </div>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                      A propagação do DNS pode levar de 24 a 48 horas
                    </p>
                  </AlertDescription>
                </Alert>
              </form>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {data && data.domains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Solicitações</CardTitle>
              <CardDescription>
                Acompanhe todas as solicitações de domínio realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{domain.requestedDomain}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado em {new Date(domain.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>{getStatusBadge(domain.status)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
