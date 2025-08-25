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
import { Eye, EyeOff, Play, RefreshCw } from "lucide-react";

export default function AiSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<AiConfiguration>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState("");
  const [availableModels, setAvailableModels] = useState<Array<{id: string, owned_by: string, created: number}>>(() => {
    // Load saved models from localStorage on component mount
    const savedModels = localStorage.getItem('openai-available-models');
    const models = savedModels ? JSON.parse(savedModels) : [];
    console.log("🔧 [FRONTEND] Loading models from localStorage:", models.length, "models");
    return models;
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Watch for changes in availableModels
  useEffect(() => {
    console.log("🔧 [FRONTEND] Available models changed:", availableModels.length, "models");
  }, [availableModels]);

  const { data: config, isLoading, error } = useQuery<AiConfiguration>({
    queryKey: ["/api/ai-config"],
  });

  useEffect(() => {
    console.log("AI Config loaded:", config);
    if (config) {
      setFormData(config);
    }
  }, [config]);

  useEffect(() => {
    if (error) {
      console.error("Error loading AI config:", error);
    }
  }, [error]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AiConfiguration>) => apiPost("/ai-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-config"] });
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
        title: "✅ Teste bem-sucedido!",
        description: `IA respondeu: ${data.response.length > 120 ? data.response.substring(0, 120) + '...' : data.response}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro no teste",
        description: error?.response?.data?.details || error?.response?.data?.error || error.message || "Erro ao testar IA",
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

  const loadAvailableModels = async () => {
    console.log("🔍 [FRONTEND] Starting to load models...");
    console.log("🔧 [FRONTEND] API Key present:", !!formData.apiKey);
    console.log("🔧 [FRONTEND] API Key length:", formData.apiKey?.length);
    console.log("🔧 [FRONTEND] API Key preview:", formData.apiKey?.substring(0, 10) + "...");
    
    if (!formData.apiKey) {
      console.log("❌ [FRONTEND] No API key configured");
      toast({
        title: "Erro",
        description: "Configure primeiro a chave da API OpenAI",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingModels(true);
    try {
      console.log("🌐 [FRONTEND] Making API request via apiGet...");
      const response = await apiGet("/ai-config/models");
      console.log("📋 [FRONTEND] API response:", response);
      
      if (response.models) {
        console.log(`✅ [FRONTEND] Successfully loaded ${response.models.length} models`);
        setAvailableModels(response.models);
        // Save models to localStorage for persistence
        localStorage.setItem('openai-available-models', JSON.stringify(response.models));
        toast({
          title: "Sucesso",
          description: `${response.models.length} modelos carregados da OpenAI`,
        });
      } else if (response.fallbackModels) {
        console.log("🔄 [FRONTEND] Using fallback models from response");
        setAvailableModels(response.fallbackModels);
        // Save fallback models to localStorage
        localStorage.setItem('openai-available-models', JSON.stringify(response.fallbackModels));
        toast({
          title: "Modelos padrão carregados",
          description: "Usando modelos padrão. Verifique sua chave da API",
          variant: "destructive",
        });
      } else {
        console.log("⚠️ [FRONTEND] No models or fallbackModels in response");
      }
    } catch (error: any) {
      console.error("❌ [FRONTEND] Error loading models:", error);
      console.log("📋 [FRONTEND] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Use fallback models from error response if available
      if (error.response?.data?.fallbackModels) {
        console.log("🔄 [FRONTEND] Using fallback models from error response");
        setAvailableModels(error.response.data.fallbackModels);
        // Save fallback models to localStorage
        localStorage.setItem('openai-available-models', JSON.stringify(error.response.data.fallbackModels));
      }
      toast({
        title: "Erro ao carregar modelos",
        description: error.response?.data?.error || "Verifique sua chave da API",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
      console.log("🏁 [FRONTEND] Finished loading models");
    }
  };

  // Default models for initial display
  const defaultModels = [
    { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Rápido e Econômico)" },
    { id: "gpt-4", label: "GPT-4 (Mais Preciso)" },
    { id: "gpt-4o", label: "GPT-4o (Recomendado - Mais Recente)" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo (Balanceado)" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini (Econômico)" },
  ];

  // Format model name for display
  const formatModelName = (modelId: string) => {
    const modelInfo: {[key: string]: string} = {
      'gpt-4o': 'GPT-4o (Recomendado - Mais Recente)',
      'gpt-4o-mini': 'GPT-4o Mini (Econômico)',
      'gpt-4-turbo': 'GPT-4 Turbo (Balanceado)',
      'gpt-4': 'GPT-4 (Mais Preciso)',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo (Rápido e Econômico)',
    };
    
    return modelInfo[modelId] || modelId;
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadAvailableModels}
                  disabled={isLoadingModels || !formData.apiKey}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  {isLoadingModels ? 'Carregando...' : 'Carregar Modelos'}
                </Button>
              </div>
              <Select
                value={formData.modelo || "gpt-4o"}
                onValueChange={(value) => handleInputChange("modelo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.length > 0 ? (
                    // Show dynamically loaded models
                    availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {formatModelName(model.id)}
                      </SelectItem>
                    ))
                  ) : (
                    // Show default models
                    defaultModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableModels.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✅ {availableModels.length} modelos carregados da sua conta OpenAI
                </p>
              )}
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
