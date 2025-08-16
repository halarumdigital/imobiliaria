import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost } from "@/lib/api";
import { EvolutionApiConfiguration } from "@/types";
import { Circle, Eye, EyeOff } from "lucide-react";

export default function EvolutionApiSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<EvolutionApiConfiguration>>({});
  const [showToken, setShowToken] = useState(false);

  const { data: config, isLoading } = useQuery<EvolutionApiConfiguration>({
    queryKey: ["/evolution-config"],
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<EvolutionApiConfiguration>) => apiPost("/evolution-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/evolution-config"] });
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => apiPost("/evolution-config/test"),
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.connected ? "Evolution API está respondendo" : "Verifique as configurações",
        variant: data.connected ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao testar conexão",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof EvolutionApiConfiguration, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = () => {
    testMutation.mutate();
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Evolution API</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure a integração global com a Evolution API para WhatsApp
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="evolutionURL">URL da Evolution API</Label>
            <Input
              id="evolutionURL"
              type="url"
              value={formData.evolutionURL || ""}
              onChange={(e) => handleInputChange("evolutionURL", e.target.value)}
              placeholder="https://api.evolution.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="evolutionToken">Token Global</Label>
            <div className="relative">
              <Input
                id="evolutionToken"
                type={showToken ? "text" : "password"}
                value={formData.evolutionToken || ""}
                onChange={(e) => handleInputChange("evolutionToken", e.target.value)}
                placeholder="Token da Evolution API"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="urlGlobalSistema">URL Global do Sistema</Label>
            <Input
              id="urlGlobalSistema"
              type="url"
              value={formData.urlGlobalSistema || ""}
              onChange={(e) => handleInputChange("urlGlobalSistema", e.target.value)}
              placeholder="https://meudominio.com"
            />
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Status da Conexão</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Circle className={`w-3 h-3 fill-current ${
                  (config as any)?.status === 'connected' ? 'text-green-400' : 'text-red-400'
                }`} />
                <span className="text-sm">
                  {(config as any)?.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
              >
                {testMutation.isPending ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
