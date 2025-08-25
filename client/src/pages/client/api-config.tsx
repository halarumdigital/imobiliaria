import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Settings, Database, TestTube, Save, RefreshCw } from "lucide-react";

interface ApiSettings {
  id?: string;
  companyId: string;
  apiUrl: string;
  apiToken: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ApiConfig() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<ApiSettings>>({
    apiUrl: "",
    apiToken: "",
    isActive: true,
  });

  const { data: apiSettings, isLoading, refetch } = useQuery<ApiSettings>({
    queryKey: ["/client/api-settings"],
    queryFn: () => apiGet("/client/api-settings"),
  });

  // Update form data when apiSettings changes
  useEffect(() => {
    if (apiSettings) {
      setFormData(apiSettings);
    }
  }, [apiSettings]);

  const { data: testResult, refetch: refetchTest } = useQuery({
    queryKey: ["/client/test-api-settings"],
    queryFn: () => apiGet("/client/test-api-settings"),
    enabled: false,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ApiSettings>) => apiPut("/client/api-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/client/api-settings"] });
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da API de Imóveis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure a integração com a API VistaHost/VistaSoft para busca de imóveis
          </p>
        </CardHeader>
      </Card>

      {/* Status Card */}
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

      {/* Configuration Form */}
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

      {/* Instructions */}
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
  );
}
