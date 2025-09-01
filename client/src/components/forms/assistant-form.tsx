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
import { Phone, Save, AlertCircle, Play, Volume2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CallAgent } from "@/types";

interface AssistantFormData {
  // Required fields
  name: string;
  
  // Transcriber (OpenAITranscriber)
  transcriber: {
    provider: "openai";
    model: "whisper-1";
    language?: string;
  };
  
  // Model (OpenAI)
  model: {
    provider: "openai";
    model: string;
    messages?: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
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
  
  // Optional fields
  maxDurationSeconds?: number;
  endCallMessage?: string;
  firstMessage?: string;
  systemMessage?: string;
  recordingEnabled?: boolean;
  endCallPhrases?: string[];
  interruptible?: boolean;
  responseDelaySeconds?: number;
  llmRequestDelaySeconds?: number;
  numWordsToInterruptAssistant?: number;
  maxDurationSecondsBeforeInterrupt?: number;
  backgroundSound?: string;
  voicemailMessage?: string;
  endCallFunctionEnabled?: boolean;
  dialKeypadFunctionEnabled?: boolean;
}

interface AssistantFormProps {
  onSuccess?: () => void;
  initialData?: CallAgent;
}

export function AssistantForm({ onSuccess, initialData }: AssistantFormProps) {
  const getInitialFormData = (): AssistantFormData => {
    if (initialData) {
      return {
        name: initialData.name,
        transcriber: {
          provider: "openai",
          model: initialData.transcriberModel,
          language: initialData.transcriberLanguage
        },
        model: {
          provider: "openai",
          model: initialData.model,
          temperature: parseFloat(initialData.temperature.toString()),
          maxTokens: initialData.maxTokens,
          topP: initialData.topP ? parseFloat(initialData.topP.toString()) : undefined,
          frequencyPenalty: initialData.frequencyPenalty ? parseFloat(initialData.frequencyPenalty.toString()) : undefined,
          presencePenalty: initialData.presencePenalty ? parseFloat(initialData.presencePenalty.toString()) : undefined
        },
        voice: {
          provider: "elevenlabs",
          voiceId: initialData.voiceId,
          model: initialData.voiceModel,
          stability: parseFloat(initialData.stability.toString()),
          similarityBoost: parseFloat(initialData.similarityBoost.toString()),
          style: parseFloat(initialData.style.toString()),
          useSpeakerBoost: initialData.useSpeakerBoost
        },
        maxDurationSeconds: initialData.maxDurationSeconds,
        endCallMessage: initialData.endCallMessage,
        firstMessage: initialData.firstMessage,
        systemMessage: initialData.systemMessage,
        recordingEnabled: initialData.recordingEnabled,
        endCallPhrases: initialData.endCallPhrases,
        interruptible: initialData.interruptible,
        responseDelaySeconds: parseFloat(initialData.responseDelaySeconds.toString()),
        llmRequestDelaySeconds: initialData.llmRequestDelaySeconds ? parseFloat(initialData.llmRequestDelaySeconds.toString()) : undefined,
        voicemailMessage: initialData.voicemailMessage
      };
    }
    return {
      name: "",
      transcriber: {
        provider: "openai",
        model: "whisper-1"
      },
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
      maxDurationSeconds: 600,
      interruptible: true,
      recordingEnabled: false,
      responseDelaySeconds: 0.4
    };
  };

  const [formData, setFormData] = useState<AssistantFormData>(getInitialFormData());

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when initialData changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [initialData]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Validation
    const newErrors = [];
    if (!formData.name.trim()) {
      newErrors.push("Nome do assistente é obrigatório");
    }
    if (formData.maxDurationSeconds && (formData.maxDurationSeconds < 10 || formData.maxDurationSeconds > 43200)) {
      newErrors.push("Duração máxima deve estar entre 10 segundos e 12 horas (43200 segundos)");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Make the real API call to create or update the assistant
      const isEditing = !!initialData;
      const url = isEditing ? `/api/call-agents/${initialData.id}` : '/api/call-agents';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} assistant:`, formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          // Transcriber settings
          transcriberModel: formData.transcriber.model,
          transcriberLanguage: formData.transcriber.language,
          // Model settings
          model: formData.model.model,
          temperature: formData.model.temperature || 0.7,
          maxTokens: formData.model.maxTokens || 500,
          topP: formData.model.topP,
          frequencyPenalty: formData.model.frequencyPenalty,
          presencePenalty: formData.model.presencePenalty,
          // Voice settings
          voiceId: formData.voice.voiceId,
          voiceModel: formData.voice.model || "eleven_multilingual_v2",
          stability: formData.voice.stability || 0.5,
          similarityBoost: formData.voice.similarityBoost || 0.75,
          style: formData.voice.style || 0.0,
          useSpeakerBoost: formData.voice.useSpeakerBoost || false,
          // Call behavior settings
          firstMessage: formData.firstMessage,
          systemMessage: formData.systemMessage || "Você é um assistente de voz útil.",
          maxDurationSeconds: formData.maxDurationSeconds,
          interruptible: formData.interruptible,
          recordingEnabled: formData.recordingEnabled,
          responseDelaySeconds: formData.responseDelaySeconds,
          llmRequestDelaySeconds: formData.llmRequestDelaySeconds,
          endCallPhrases: formData.endCallPhrases,
          voicemailMessage: formData.voicemailMessage,
          status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar assistente');
      }

      const savedAgent = await response.json();
      console.log(`Assistente ${isEditing ? 'atualizado' : 'criado'} com sucesso:`, savedAgent);
      
      // Success handling
      alert(`Assistente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      
      // Call success callback to refresh parent component
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form only if creating new agent
      if (!isEditing) {
        setFormData(getInitialFormData());
      }
      
    } catch (error) {
      console.error("Erro ao criar assistente:", error);
      setErrors([error.message || "Erro ao criar assistente. Tente novamente."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };


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

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Informações Básicas</span>
                <Badge variant="destructive">Obrigatório</Badge>
              </CardTitle>
              <CardDescription>
                Configurações básicas do assistente de voz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Assistente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Ex: Assistente de Vendas"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstMessage">Primeira Mensagem</Label>
                <Textarea
                  id="firstMessage"
                  value={formData.firstMessage || ""}
                  onChange={(e) => updateFormData('firstMessage', e.target.value)}
                  placeholder="Ex: Olá! Como posso ajudá-lo hoje?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemMessage">Mensagem do Sistema</Label>
                <Textarea
                  id="systemMessage"
                  value={formData.systemMessage || ""}
                  onChange={(e) => updateFormData('systemMessage', e.target.value)}
                  placeholder="Instruções para o comportamento do assistente..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endCallMessage">Mensagem de Encerramento</Label>
                <Textarea
                  id="endCallMessage"
                  value={formData.endCallMessage || ""}
                  onChange={(e) => updateFormData('endCallMessage', e.target.value)}
                  placeholder="Ex: Obrigado por ligar. Tenha um ótimo dia!"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDurationSeconds">Duração Máxima (segundos)</Label>
                <Input
                  id="maxDurationSeconds"
                  type="number"
                  min="10"
                  max="43200"
                  value={formData.maxDurationSeconds || ""}
                  onChange={(e) => updateFormData('maxDurationSeconds', parseInt(e.target.value) || undefined)}
                  placeholder="600 (10 minutos)"
                />
                <p className="text-sm text-muted-foreground">
                  Entre 10 segundos e 12 horas (43200 segundos). Padrão: 600 segundos (10 minutos)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configurações opcionais para comportamento avançado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="interruptible"
                    checked={formData.interruptible || false}
                    onChange={(e) => updateFormData('interruptible', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="interruptible">Interrompível</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recordingEnabled"
                    checked={formData.recordingEnabled || false}
                    onChange={(e) => updateFormData('recordingEnabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="recordingEnabled">Gravação Habilitada</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responseDelaySeconds">Delay de Resposta (segundos)</Label>
                  <Input
                    id="responseDelaySeconds"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.responseDelaySeconds || ""}
                    onChange={(e) => updateFormData('responseDelaySeconds', parseFloat(e.target.value) || undefined)}
                    placeholder="0.4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llmRequestDelaySeconds">Delay de Requisição LLM (segundos)</Label>
                  <Input
                    id="llmRequestDelaySeconds"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.llmRequestDelaySeconds || ""}
                    onChange={(e) => updateFormData('llmRequestDelaySeconds', parseFloat(e.target.value) || undefined)}
                    placeholder="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endCallPhrases">Frases de Encerramento</Label>
                <Textarea
                  id="endCallPhrases"
                  value={formData.endCallPhrases?.join(', ') || ""}
                  onChange={(e) => updateFormData('endCallPhrases', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  placeholder="tchau, até logo, obrigado"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  Separe as frases por vírgulas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voicemailMessage">Mensagem de Caixa Postal</Label>
                <Textarea
                  id="voicemailMessage"
                  value={formData.voicemailMessage || ""}
                  onChange={(e) => updateFormData('voicemailMessage', e.target.value)}
                  placeholder="Deixe sua mensagem após o sinal..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings Note */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Configurações de Modelo e Voz</h4>
                  <p className="text-sm text-blue-700">
                    As configurações de modelo OpenAI e voz ElevenLabs são definidas pelo administrador do sistema. 
                    Seu assistente usará automaticamente as configurações globais configuradas na área administrativa.
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
          {isSubmitting 
            ? (initialData ? "Salvando..." : "Criando...") 
            : (initialData ? "Salvar Alterações" : "Criar Assistente")
          }
        </Button>
      </div>
    </form>
  );
}