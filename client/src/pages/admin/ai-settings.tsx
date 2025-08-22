import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost } from "@/lib/api";
import { AiConfiguration } from "@/types";
import { Eye, EyeOff, Play } from "lucide-react";

export default function AiSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<AiConfiguration>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState("");

  const { data: config, isLoading } = useQuery<AiConfiguration>({
    queryKey: ["/ai-config"],
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AiConfiguration>) => apiPost("/ai-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/ai-config"] });
      toast({
        title: "Sucesso",
        description: "Configurações de IA salvas com sucesso!",
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
    mutationFn: (prompt: string) => apiPost("/ai-config/test", { prompt }),
    onSuccess: (data) => {
      toast({
        title: "Teste bem-sucedido",
        description: `IA respondeu: ${data.response.substring(0, 100)}...`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Erro ao testar IA",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof AiConfiguration, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestAI = () => {
    if (!testPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite um prompt para testar",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate(testPrompt);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de IA Global</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as configurações padrão para agentes de IA
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="apiKey">Chave da API OpenAI</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey || ""}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                placeholder="sk-..."
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Select
                value={formData.modelo || "gpt-4o"}
                onValueChange={(value) => handleInputChange("modelo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido e Econômico)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4 (Mais Preciso)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Recomendado - Mais Recente)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Balanceado)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Econômico)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperatura">Temperatura</Label>
              <Input
                id="temperatura"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperatura || "0.7"}
                onChange={(e) => handleInputChange("temperatura", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = Mais preciso, 2 = Mais criativo
              </p>
            </div>

            <div>
              <Label htmlFor="numeroTokens">Número de Tokens</Label>
              <Input
                id="numeroTokens"
                type="number"
                min="100"
                max="8000"
                value={formData.numeroTokens || 1000}
                onChange={(e) => handleInputChange("numeroTokens", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo de tokens por resposta (mais tokens = respostas mais longas)
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Teste de Funcionamento</h4>
            <Label htmlFor="testPrompt">Digite um prompt para testar</Label>
            <Textarea
              id="testPrompt"
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Exemplo: Explique o que é inteligência artificial em poucas palavras"
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setTestPrompt("Olá! Como você está funcionando?")}
                variant="outline"
                size="sm"
              >
                Teste Básico
              </Button>
              <Button
                type="button"
                onClick={() => setTestPrompt("Analise este texto e resuma os pontos principais: A inteligência artificial está revolucionando diversos setores.")}
                variant="outline"
                size="sm"
              >
                Teste Análise
              </Button>
              <Button
                type="button"
                onClick={handleTestAI}
                disabled={testMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {testMutation.isPending ? "Testando..." : "Executar Teste"}
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
