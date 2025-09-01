import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, AlertCircle, Play, Volume2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ModeloVozFormData {
  // ElevenLabs API Configuration
  elevenlabsApiKey: string;
  
  // Model (OpenAI)
  model: {
    provider: "openai";
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  
  // Voice (ElevenLabsVoice)
  voice: {
    provider: "elevenlabs";
    voiceId: string;
    model?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  
  // Transcriber (OpenAITranscriber)
  transcriber: {
    provider: "openai";
    model: "whisper-1";
    language?: string;
  };
}

export function ModeloVozForm() {
  const [formData, setFormData] = useState<ModeloVozFormData>({
    elevenlabsApiKey: "",
    model: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 500
    },
    voice: {
      provider: "elevenlabs",
      voiceId: "",
      stability: 0.5,
      similarityBoost: 0.75
    },
    transcriber: {
      provider: "openai",
      model: "whisper-1"
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [testText, setTestText] = useState("Olá! Este é um teste da voz selecionada. Como você está hoje?");

  // Load existing configuration on component mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const response = await fetch("/api/global-config", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (response.ok) {
          const config = await response.json();
          
          // Update form data with loaded configuration
          setFormData(prev => ({
            elevenlabsApiKey: config.elevenlabs_api_key || prev.elevenlabsApiKey,
            model: {
              ...prev.model,
              model: config.default_ai_model || prev.model.model,
              temperature: config.default_ai_temperature || prev.model.temperature,
              maxTokens: config.default_ai_max_tokens || prev.model.maxTokens,
              topP: config.default_ai_top_p || prev.model.topP,
              frequencyPenalty: config.default_ai_frequency_penalty || prev.model.frequencyPenalty,
              presencePenalty: config.default_ai_presence_penalty || prev.model.presencePenalty,
            },
            voice: {
              ...prev.voice,
              voiceId: config.default_voice_id || prev.voice.voiceId,
              model: config.default_voice_model || prev.voice.model,
              stability: config.default_voice_stability || prev.voice.stability,
              similarityBoost: config.default_voice_similarity_boost || prev.voice.similarityBoost,
              style: config.default_voice_style || prev.voice.style,
              useSpeakerBoost: config.default_voice_use_speaker_boost || prev.voice.useSpeakerBoost,
            },
            transcriber: {
              ...prev.transcriber,
              model: config.default_transcriber_model || prev.transcriber.model,
              language: config.default_transcriber_language || prev.transcriber.language,
            }
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Validation
    const newErrors = [];
    if (!formData.elevenlabsApiKey.trim()) {
      newErrors.push("API Key do ElevenLabs é obrigatório");
    }
    if (!formData.voice.voiceId.trim()) {
      newErrors.push("Voice ID do ElevenLabs é obrigatório");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Map form data to the expected API format
      const apiPayload = {
        // ElevenLabs API Key
        elevenlabs_api_key: formData.elevenlabsApiKey,
        
        // AI Model Configuration
        default_ai_model: formData.model.model,
        default_ai_temperature: formData.model.temperature?.toString(),
        default_ai_max_tokens: formData.model.maxTokens,
        default_ai_top_p: formData.model.topP?.toString(),
        default_ai_frequency_penalty: formData.model.frequencyPenalty?.toString(),
        default_ai_presence_penalty: formData.model.presencePenalty?.toString(),
        
        // Voice Configuration
        default_voice_id: formData.voice.voiceId,
        default_voice_model: formData.voice.model,
        default_voice_stability: formData.voice.stability?.toString(),
        default_voice_similarity_boost: formData.voice.similarityBoost?.toString(),
        default_voice_style: formData.voice.style?.toString(),
        default_voice_use_speaker_boost: formData.voice.useSpeakerBoost,
        
        // Transcriber Configuration
        default_transcriber_model: formData.transcriber.model,
        default_transcriber_language: formData.transcriber.language
      };

      console.log("🔍 DADOS DO FORMULÁRIO:", formData);
      console.log("🔍 PAYLOAD PARA API:", apiPayload);
      console.log("🔍 API Key:", formData.elevenlabsApiKey);
      console.log("🔍 Voice ID:", formData.voice.voiceId);
      
      const response = await fetch("/api/global-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(apiPayload)
      });

      console.log("🔍 STATUS DA RESPOSTA:", response.status);
      console.log("🔍 HEADERS DA RESPOSTA:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔴 ERRO DA API:", response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || "Erro ao salvar configurações");
        } catch {
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log("✅ CONFIGURAÇÕES SALVAS COM SUCESSO:", result);
      
      // Success handling
      alert("Configurações salvas com sucesso!");
      
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setErrors([error instanceof Error ? error.message : "Erro ao salvar configurações. Tente novamente."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    console.log("🔧 ATUALIZANDO CAMPO:", path, "=", value);
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      console.log("🔧 NOVO ESTADO:", newData);
      return newData;
    });
  };

  const handleTestVoice = async () => {
    if (!formData.voice.voiceId.trim()) {
      setErrors(["Voice ID é obrigatório para testar a voz"]);
      return;
    }

    setIsPlayingVoice(true);
    setErrors([]);

    try {
      // Voice test configuration
      const voiceConfig = {
        voice_id: formData.voice.voiceId,
        text: testText,
        model_id: formData.voice.model === "default" ? undefined : formData.voice.model,
        voice_settings: {
          stability: formData.voice.stability || 0.5,
          similarity_boost: formData.voice.similarityBoost || 0.75,
          style: formData.voice.style || 0,
          use_speaker_boost: formData.voice.useSpeakerBoost || false
        }
      };

      console.log("Testando voz com configuração:", voiceConfig);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      alert("Teste de voz concluído! (Em produção, o áudio seria reproduzido aqui)");
      
    } catch (error) {
      console.error("Erro ao testar voz:", error);
      setErrors(["Erro ao testar a voz. Verifique o Voice ID e tente novamente."]);
    } finally {
      setIsPlayingVoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="model">Modelo</TabsTrigger>
          <TabsTrigger value="voice">Voz</TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Configuração do Modelo OpenAI</span>
                <Badge variant="destructive">Obrigatório</Badge>
              </CardTitle>
              <CardDescription>
                Configurações padrão do modelo de linguagem para assistentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo OpenAI *</Label>
                <Select
                  value={formData.model.model}
                  onValueChange={(value) => updateFormData('model.model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o-realtime-preview-2024-12-17">GPT-4o Realtime (Speech-to-Speech)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.model.temperature || ""}
                    onChange={(e) => updateFormData('model.temperature', parseFloat(e.target.value) || undefined)}
                    placeholder="0.7"
                  />
                  <p className="text-sm text-muted-foreground">0-2, controla aleatoriedade</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    value={formData.model.maxTokens || ""}
                    onChange={(e) => updateFormData('model.maxTokens', parseInt(e.target.value) || undefined)}
                    placeholder="500"
                  />
                  <p className="text-sm text-muted-foreground">Máximo de tokens na resposta</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topP">Top P</Label>
                  <Input
                    id="topP"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.model.topP || ""}
                    onChange={(e) => updateFormData('model.topP', parseFloat(e.target.value) || undefined)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                  <Input
                    id="frequencyPenalty"
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={formData.model.frequencyPenalty || ""}
                    onChange={(e) => updateFormData('model.frequencyPenalty', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="presencePenalty">Presence Penalty</Label>
                <Input
                  id="presencePenalty"
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={formData.model.presencePenalty || ""}
                  onChange={(e) => updateFormData('model.presencePenalty', parseFloat(e.target.value) || undefined)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração do Transcriber OpenAI</CardTitle>
              <CardDescription>
                Configurações de transcrição de voz para texto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transcriberLanguage">Idioma (Opcional)</Label>
                <Select
                  value={formData.transcriber.language || "auto"}
                  onValueChange={(value) => updateFormData('transcriber.language', value === "auto" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Configuração da Voz ElevenLabs</span>
                <Badge variant="destructive">Obrigatório</Badge>
              </CardTitle>
              <CardDescription>
                Configurações padrão da voz sintética para assistentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="elevenlabsApiKey">API Key ElevenLabs *</Label>
                <Input
                  id="elevenlabsApiKey"
                  type="password"
                  value={formData.elevenlabsApiKey}
                  onChange={(e) => updateFormData('elevenlabsApiKey', e.target.value)}
                  placeholder="sk-..."
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Chave de API da ElevenLabs. Obtenha em sua conta ElevenLabs.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice ID ElevenLabs *</Label>
                <Input
                  id="voiceId"
                  value={formData.voice.voiceId}
                  onChange={(e) => updateFormData('voice.voiceId', e.target.value)}
                  placeholder="Ex: pNInz6obpgDQGcFmaJgB"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  ID da voz clonada no ElevenLabs. Obtenha em sua conta ElevenLabs.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceModel">Modelo da Voz</Label>
                <Select
                  value={formData.voice.model || "default"}
                  onValueChange={(value) => updateFormData('voice.model', value === "default" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão</SelectItem>
                    <SelectItem value="eleven_multilingual_v2">Eleven Multilingual v2</SelectItem>
                    <SelectItem value="eleven_turbo_v2">Eleven Turbo v2</SelectItem>
                    <SelectItem value="eleven_monolingual_v1">Eleven Monolingual v1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stability">Stability</Label>
                  <Input
                    id="stability"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.voice.stability || ""}
                    onChange={(e) => updateFormData('voice.stability', parseFloat(e.target.value) || undefined)}
                    placeholder="0.5"
                  />
                  <p className="text-sm text-muted-foreground">0-1, estabilidade da voz</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="similarityBoost">Similarity Boost</Label>
                  <Input
                    id="similarityBoost"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.voice.similarityBoost || ""}
                    onChange={(e) => updateFormData('voice.similarityBoost', parseFloat(e.target.value) || undefined)}
                    placeholder="0.75"
                  />
                  <p className="text-sm text-muted-foreground">0-1, similaridade com a voz original</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Input
                    id="style"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.voice.style || ""}
                    onChange={(e) => updateFormData('voice.style', parseFloat(e.target.value) || undefined)}
                    placeholder="0.0"
                  />
                  <p className="text-sm text-muted-foreground">0-1, estilo/expressividade</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useSpeakerBoost"
                    checked={formData.voice.useSpeakerBoost || false}
                    onChange={(e) => updateFormData('voice.useSpeakerBoost', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="useSpeakerBoost">Use Speaker Boost</Label>
                </div>
              </div>

              <Separator />

              {/* Voice Test Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold">Teste de Voz</h4>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="testText">Texto para Teste</Label>
                  <Textarea
                    id="testText"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Digite o texto que deseja usar para testar a voz..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestVoice}
                    disabled={isPlayingVoice || !formData.voice.voiceId.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isPlayingVoice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{isPlayingVoice ? "Gerando..." : "Testar Voz"}</span>
                  </Button>
                  
                  {!formData.voice.voiceId.trim() && (
                    <p className="text-sm text-muted-foreground self-center">
                      Insira o Voice ID para testar
                    </p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Dica:</p>
                  <p>
                    O teste usará as configurações atuais de estabilidade, similaridade e estilo. 
                    Ajuste esses valores e teste novamente para encontrar a configuração ideal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}