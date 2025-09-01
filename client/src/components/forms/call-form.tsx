import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, Phone, User, Settings, Loader2, AlertCircle, Hash, Volume2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CallAgent } from "@/types";

interface CallFormData {
  // Customer information (required)
  customer: {
    number: string; // E.164 format phone number
    name?: string;
    email?: string;
  };
  
  // Assistant configuration (required - either assistantId OR assistant object)
  assistantId?: string;
  assistant?: {
    name: string;
    firstMessage?: string;
    systemMessage?: string;
    model: {
      provider: "openai";
      model: string;
      temperature?: number;
    };
    voice: {
      provider: "elevenlabs";
      voiceId: string;
    };
    transcriber: {
      provider: "openai";
      model: "whisper-1";
    };
  };
  
  // Phone number configuration (required - either phoneNumberId OR phoneNumber object)
  phoneNumberId?: string;
  phoneNumber?: {
    provider: string;
    number: string;
  };
  
  // Optional fields
  maxDurationSeconds?: number;
  recordingEnabled?: boolean;
  endCallAfterSilenceMs?: number;
  endCallPhrases?: string[];
  metadata?: Record<string, any>;
}

interface Assistant {
  id: string;
  name: string;
}

interface AdminPhoneNumber {
  id: string;
  number: string;
  provider: string;
  status: string;
}

interface AdminVoice {
  id: string;
  name: string;
  voiceId: string;
  provider: string;
  language?: string;
}


/**
 * ENDPOINTS NECESSÁRIOS NO BACKEND:
 * 
 * 1. GET /api/admin/phone-numbers
 *    - Retorna números de telefone configurados pelo admin
 *    - Apenas números com status 'active' devem ser mostrados
 *    - Estrutura: { id, number, provider, status }
 * 
 * 2. GET /api/admin/voices  
 *    - Retorna vozes configuradas pelo admin
 *    - Estrutura: { id, name, voiceId, provider, language? }
 * 
 * 3. POST /api/campaigns/create
 *    - Recebe: { assistantId?, assistant?, selectedPhoneNumberId, selectedVoiceId, ... }
 *    - Cria campanha usando número e voz selecionados das listas do admin
 */

export function CallForm() {
  const [formData, setFormData] = useState<CallFormData>({
    customer: {
      number: "",
      name: "",
      email: ""
    },
    maxDurationSeconds: 300, // 5 minutes default
    recordingEnabled: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [useTransientAssistant, setUseTransientAssistant] = useState(false);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string>("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");

  // Load real call agents using React Query
  const { data: agents = [], isLoading: agentsLoading } = useQuery<CallAgent[]>({
    queryKey: ["/api/call-agents"],
  });

  // Load admin phone numbers
  // TODO: Implementar endpoint /api/admin/phone-numbers que retorna números configurados pelo admin
  const { data: adminPhoneNumbers = [], isLoading: phoneNumbersLoading } = useQuery<AdminPhoneNumber[]>({
    queryKey: ["/api/admin/phone-numbers"],
    queryFn: () => {
      // Mock data - substituir por chamada real da API
      return Promise.resolve([
        { id: "pn_1", number: "+55 11 99999-1111", provider: "Twilio", status: "active" },
        { id: "pn_2", number: "+55 21 88888-2222", provider: "Vapi", status: "active" },
        { id: "pn_3", number: "+1 555 123-4567", provider: "Twilio", status: "inactive" }
      ] as AdminPhoneNumber[]);
    }
  });

  // Load admin voices
  // TODO: Implementar endpoint /api/admin/voices que retorna vozes configuradas pelo admin  
  const { data: adminVoices = [], isLoading: voicesLoading } = useQuery<AdminVoice[]>({
    queryKey: ["/api/admin/voices"],
    queryFn: () => {
      // Mock data - substituir por chamada real da API
      return Promise.resolve([
        { id: "v_1", name: "Isabela - Português BR", voiceId: "pNInz6obpgDQGcFmaJgB", provider: "ElevenLabs", language: "pt-BR" },
        { id: "v_2", name: "Carlos - Português BR", voiceId: "xYz9AbCd3FgH2iJkL4mN", provider: "ElevenLabs", language: "pt-BR" },
        { id: "v_3", name: "Sarah - English US", voiceId: "qRsT5UvW8xYz1AbC6dEf", provider: "ElevenLabs", language: "en-US" }
      ] as AdminVoice[]);
    }
  });




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Validation
    const newErrors = [];
    
    if (!useTransientAssistant && !formData.assistantId) {
      newErrors.push("Selecione um agente ou configure um agente personalizado");
    }

    if (useTransientAssistant) {
      if (!formData.assistant?.name.trim()) {
        newErrors.push("Nome do agente é obrigatório");
      }
      if (!formData.assistant?.voice?.voiceId.trim()) {
        newErrors.push("Voice ID do ElevenLabs é obrigatório para agente personalizado");
      }
    }

    if (!selectedPhoneNumberId) {
      newErrors.push("Selecione um número de telefone");
    }

    if (!selectedVoiceId) {
      newErrors.push("Selecione uma voz para o assistente");
    }

    if (formData.maxDurationSeconds && (formData.maxDurationSeconds < 10 || formData.maxDurationSeconds > 43200)) {
      newErrors.push("Duração máxima deve estar entre 10 segundos e 12 horas");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Build the API payload
      const payload: any = {};

      // Add assistant configuration
      if (useTransientAssistant) {
        payload.assistant = {
          name: formData.assistant!.name,
          ...(formData.assistant!.firstMessage && { firstMessage: formData.assistant!.firstMessage }),
          ...(formData.assistant!.systemMessage && { systemMessage: formData.assistant!.systemMessage }),
          model: {
            provider: "openai",
            model: formData.assistant!.model.model,
            ...(formData.assistant!.model.temperature && { temperature: formData.assistant!.model.temperature })
          },
          voice: {
            provider: "elevenlabs",
            voiceId: formData.assistant!.voice.voiceId
          },
          transcriber: {
            provider: "openai",
            model: "whisper-1"
          }
        };
      } else {
        payload.assistantId = formData.assistantId;
      }


      // Add optional fields
      if (formData.maxDurationSeconds) {
        payload.maxDurationSeconds = formData.maxDurationSeconds;
      }
      if (formData.recordingEnabled) {
        payload.recordingEnabled = formData.recordingEnabled;
      }
      if (formData.endCallAfterSilenceMs) {
        payload.endCallAfterSilenceMs = formData.endCallAfterSilenceMs;
      }
      if (formData.endCallPhrases && formData.endCallPhrases.length > 0) {
        payload.endCallPhrases = formData.endCallPhrases;
      }

      // Add selected phone number and voice
      payload.selectedPhoneNumberId = selectedPhoneNumberId;
      payload.selectedVoiceId = selectedVoiceId;

      console.log("Criando campanha com payload:", payload);

      // Here you would make the actual API call to create campaign
      // const response = await fetch('/api/campaigns/create', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}`
      //   },
      //   body: JSON.stringify(payload)
      // });
      // const result = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert("Campanha criada com sucesso! As chamadas serão iniciadas automaticamente.");
      
      // Reset form
      setFormData({
        customer: { number: "", name: "", email: "" },
        maxDurationSeconds: 300,
        recordingEnabled: false
      });
      setSelectedPhoneNumberId("");
      setSelectedVoiceId("");
      
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      setErrors(["Erro ao criar campanha. Tente novamente."]);
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

      {/* Assistant Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Configuração do Agente</span>
            <Badge variant="destructive">Obrigatório</Badge>
          </CardTitle>
          <CardDescription>
            Escolha um agente existente ou configure um personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="existingAssistant"
                checked={!useTransientAssistant}
                onChange={() => setUseTransientAssistant(false)}
              />
              <Label htmlFor="existingAssistant">Usar agente existente</Label>
            </div>

            {!useTransientAssistant && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="assistantSelect">Selecione o Agente</Label>
                <Select
                  value={formData.assistantId || ""}
                  onValueChange={(value) => updateFormData('assistantId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={agentsLoading ? "Carregando agentes..." : "Selecione um agente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agentsLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Carregando agentes...</span>
                        </div>
                      </SelectItem>
                    ) : agents.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        <span>Nenhum agente encontrado</span>
                      </SelectItem>
                    ) : (
                      agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="transientAssistant"
                checked={useTransientAssistant}
                onChange={() => setUseTransientAssistant(true)}
              />
              <Label htmlFor="transientAssistant">Configurar agente personalizado</Label>
            </div>

            {useTransientAssistant && (
              <div className="space-y-4 ml-6 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="assistantName">Nome do Agente *</Label>
                  <Input
                    id="assistantName"
                    value={formData.assistant?.name || ""}
                    onChange={(e) => updateFormData('assistant.name', e.target.value)}
                    placeholder="Agente de Chamada"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voiceId">Voice ID ElevenLabs *</Label>
                  <Input
                    id="voiceId"
                    value={formData.assistant?.voice?.voiceId || ""}
                    onChange={(e) => updateFormData('assistant.voice.voiceId', e.target.value)}
                    placeholder="pNInz6obpgDQGcFmaJgB"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">Primeira Mensagem</Label>
                  <Textarea
                    id="firstMessage"
                    value={formData.assistant?.firstMessage || ""}
                    onChange={(e) => updateFormData('assistant.firstMessage', e.target.value)}
                    placeholder="Olá! Como posso ajudá-lo hoje?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assistantModel">Modelo OpenAI</Label>
                  <Select
                    value={formData.assistant?.model?.model || "gpt-4o"}
                    onValueChange={(value) => updateFormData('assistant.model.model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phone Number Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hash className="w-5 h-5" />
            <span>Número de Telefone</span>
            <Badge variant="destructive">Obrigatório</Badge>
          </CardTitle>
          <CardDescription>
            Selecione o número de telefone para fazer as chamadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumberSelect">Número de Telefone *</Label>
            <Select
              value={selectedPhoneNumberId}
              onValueChange={(value) => setSelectedPhoneNumberId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={phoneNumbersLoading ? "Carregando números..." : "Selecione um número"} />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbersLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando números...</span>
                    </div>
                  </SelectItem>
                ) : adminPhoneNumbers.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4" />
                      <span>Nenhum número encontrado</span>
                    </div>
                  </SelectItem>
                ) : (
                  adminPhoneNumbers
                    .filter(phone => phone.status === 'active')
                    .map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4" />
                          <span>{phone.number}</span>
                          <Badge variant="outline" className="text-xs">
                            {phone.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            {adminPhoneNumbers.length === 0 && !phoneNumbersLoading && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Nenhum número de telefone configurado pelo administrador. Contacte o admin para adicionar números.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Voz do Assistente</span>
            <Badge variant="destructive">Obrigatório</Badge>
          </CardTitle>
          <CardDescription>
            Selecione a voz que será usada pelo assistente nas chamadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voiceSelect">Voz *</Label>
            <Select
              value={selectedVoiceId}
              onValueChange={(value) => setSelectedVoiceId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={voicesLoading ? "Carregando vozes..." : "Selecione uma voz"} />
              </SelectTrigger>
              <SelectContent>
                {voicesLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando vozes...</span>
                    </div>
                  </SelectItem>
                ) : adminVoices.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4" />
                      <span>Nenhuma voz encontrada</span>
                    </div>
                  </SelectItem>
                ) : (
                  adminVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4" />
                        <span>{voice.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {voice.provider}
                        </Badge>
                        {voice.language && (
                          <Badge variant="secondary" className="text-xs">
                            {voice.language}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {adminVoices.length === 0 && !voicesLoading && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Nenhuma voz configurada pelo administrador. Contacte o admin para adicionar vozes.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações Avançadas</span>
            <Badge variant="secondary">Opcional</Badge>
          </CardTitle>
          <CardDescription>
            Configurações opcionais para a chamada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxDuration">Duração Máxima (segundos)</Label>
              <Input
                id="maxDuration"
                type="number"
                min="10"
                max="43200"
                value={formData.maxDurationSeconds || ""}
                onChange={(e) => updateFormData('maxDurationSeconds', parseInt(e.target.value) || undefined)}
                placeholder="300"
              />
              <p className="text-sm text-muted-foreground">Padrão: 300 segundos (5 minutos)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endCallSilence">Encerrar após silêncio (ms)</Label>
              <Input
                id="endCallSilence"
                type="number"
                value={formData.endCallAfterSilenceMs || ""}
                onChange={(e) => updateFormData('endCallAfterSilenceMs', parseInt(e.target.value) || undefined)}
                placeholder="30000"
              />
              <p className="text-sm text-muted-foreground">30000ms = 30 segundos</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recordingEnabled"
              checked={formData.recordingEnabled || false}
              onChange={(e) => updateFormData('recordingEnabled', e.target.checked)}
            />
            <Label htmlFor="recordingEnabled">Habilitar Gravação</Label>
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
            <p className="text-sm text-muted-foreground">Separe as frases por vírgulas</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando Campanha...
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4 mr-2" />
              Criar Campanha
            </>
          )}
        </Button>
      </div>
    </form>
  );
}