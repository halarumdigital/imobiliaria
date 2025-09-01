import { Bot, Volume2, Settings, List, Play, Trash2, Edit, Loader2, RefreshCw, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeloVozForm } from "@/components/forms/modelo-voz-form";
import { useState, useEffect } from "react";

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
  provider: "elevenlabs" | "openai";
  description?: string;
  isActive: boolean;
  previewUrl?: string;
  category?: string;
  accent?: string;
  age?: string;
  use_case?: string;
  settings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
  };
}

export default function AdminAgentePage() {
  // States para vozes
  const [voices, setVoices] = useState<Voice[]>([
    {
      id: "pNInz6obpgDQGcFmaJgB",
      name: "Adam",
      language: "pt-BR",
      gender: "male",
      provider: "elevenlabs",
      description: "Voz masculina profissional e clara",
      isActive: true,
      settings: { stability: 0.5, similarityBoost: 0.75, style: 0.0 }
    },
    {
      id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      language: "pt-BR", 
      gender: "female",
      provider: "elevenlabs",
      description: "Voz feminina amigável e calorosa",
      isActive: true,
      settings: { stability: 0.7, similarityBoost: 0.8, style: 0.2 }
    },
    {
      id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      language: "pt-BR",
      gender: "female",
      provider: "elevenlabs", 
      description: "Voz feminina jovem e energética",
      isActive: true,
      settings: { stability: 0.6, similarityBoost: 0.7, style: 0.1 }
    },
    {
      id: "EXAVITQu4vr4xnSDxMaL",
      name: "Bella",
      language: "pt-BR",
      gender: "female",
      provider: "elevenlabs",
      description: "Voz feminina sofisticada",
      isActive: false,
      settings: { stability: 0.8, similarityBoost: 0.85, style: 0.3 }
    },
    {
      id: "nova",
      name: "Nova",
      language: "pt-BR", 
      gender: "female",
      provider: "openai",
      description: "Voz OpenAI - Clara e natural",
      isActive: true
    },
    {
      id: "alloy", 
      name: "Alloy",
      language: "pt-BR",
      gender: "male",
      provider: "openai",
      description: "Voz OpenAI - Masculina e confiável",
      isActive: true
    }
  ]);

  // States para filtros e carregamento
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playingVoices, setPlayingVoices] = useState<Set<string>>(new Set());

  // Função para carregar vozes da ElevenLabs
  const loadElevenLabsVoices = async () => {
    setIsLoadingVoices(true);
    setLoadError(null);

    try {
      console.log("🎤 Carregando vozes da ElevenLabs...");

      const response = await fetch("/api/elevenlabs/voices", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("🎤 Vozes carregadas:", data);

      // Mapear vozes da ElevenLabs para o formato interno
      const mappedVoices: Voice[] = (data.voices || []).map((voice: any) => {
        // Extrair informações de idioma da v2 API
        const primaryLanguage = voice.verified_languages?.[0] || {};
        const voiceLanguage = primaryLanguage.language || voice.labels?.language || "english";
        const voiceAccent = primaryLanguage.accent || voice.labels?.accent || "";
        const voiceGender = voice.labels?.gender || voice.labels?.description || "neutral";
        
        console.log(`🎤 Processando voz: ${voice.name}`, {
          verified_languages: voice.verified_languages,
          language: voiceLanguage,
          accent: voiceAccent,
          labels: voice.labels
        });

        return {
          id: voice.voice_id,
          name: voice.name,
          language: mapLanguage(voiceLanguage, voiceAccent),
          gender: mapGender(voiceGender),
          provider: "elevenlabs" as const,
          description: voice.labels?.descriptive || voice.labels?.['use case'] || `Voz ${voice.name}`,
          isActive: true,
          previewUrl: voice.preview_url,
          category: voice.category,
          accent: voiceAccent,
          age: voice.labels?.age,
          use_case: voice.labels?.['use case'],
          settings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0
          }
        };
      });

      // Manter as vozes OpenAI existentes e adicionar as da ElevenLabs
      const openAIVoices = voices.filter(v => v.provider === "openai");
      setVoices([...openAIVoices, ...mappedVoices]);

    } catch (error) {
      console.error("❌ Erro ao carregar vozes:", error);
      setLoadError(error instanceof Error ? error.message : "Erro desconhecido ao carregar vozes");
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Função para mapear idiomas
  const mapLanguage = (language: string, accent?: string): string => {
    const lang = language.toLowerCase();
    const acc = accent?.toLowerCase() || "";
    
    // Mapear idiomas específicos com acentos
    if (lang === "portuguese" || lang === "pt") {
      if (acc.includes("brazilian") || acc.includes("brazil") || acc.includes("br")) {
        return "pt-BR";
      }
      return "pt-PT"; // Português Europeu por padrão
    }
    
    if (lang === "english" || lang === "en") {
      if (acc.includes("american") || acc.includes("usa") || acc.includes("us")) {
        return "en-US";
      }
      if (acc.includes("british") || acc.includes("uk") || acc.includes("gb")) {
        return "en-GB";
      }
      if (acc.includes("australian") || acc.includes("au")) {
        return "en-AU";
      }
      return "en-US"; // Inglês Americano por padrão
    }
    
    const langMap: { [key: string]: string } = {
      "spanish": "es-ES",
      "french": "fr-FR",
      "german": "de-DE",
      "italian": "it-IT",
      "japanese": "ja-JP",
      "korean": "ko-KR",
      "chinese": "zh-CN",
      "hindi": "hi-IN",
      "arabic": "ar-SA",
      "russian": "ru-RU",
      "dutch": "nl-NL",
      "polish": "pl-PL",
      "turkish": "tr-TR",
      "swedish": "sv-SE",
      "norwegian": "no-NO",
      "danish": "da-DK",
      "finnish": "fi-FI"
    };
    
    return langMap[lang] || language || "en-US";
  };

  // Função para mapear gênero
  const mapGender = (description: string): "male" | "female" | "neutral" => {
    const desc = description.toLowerCase();
    if (desc.includes("male") && !desc.includes("female")) return "male";
    if (desc.includes("female")) return "female";
    return "neutral";
  };

  // Filtrar vozes
  const filteredVoices = voices.filter(voice => {
    if (languageFilter !== "all" && voice.language !== languageFilter) return false;
    if (genderFilter !== "all" && voice.gender !== genderFilter) return false;
    if (providerFilter !== "all" && voice.provider !== providerFilter) return false;
    return true;
  });

  // Função para testar voz
  const playVoice = async (voice: Voice) => {
    if (playingVoices.has(voice.id)) return;
    
    setPlayingVoices(prev => new Set(prev).add(voice.id));

    try {
      console.log("🎵 Testando voz:", voice.name, voice.id);

      if (voice.provider === "elevenlabs" && voice.previewUrl) {
        // Para ElevenLabs com preview URL, usar o preview diretamente
        const audio = new Audio(voice.previewUrl);
        
        audio.onended = () => {
          console.log("🎵 Reprodução de preview finalizada");
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
        };
        
        audio.onerror = (e) => {
          console.error("🎵 Erro no preview audio:", e);
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
        };

        await audio.play();
        console.log("🎵 Reproduzindo preview da voz");
        
      } else if (voice.provider === "elevenlabs") {
        // Para ElevenLabs sem preview, usar a API para gerar áudio
        const response = await fetch("/api/elevenlabs/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            voice_id: voice.id,
            text: "Olá! Esta é uma demonstração da voz " + voice.name + ". Como você está hoje?",
            model_id: voice.settings?.style ? "eleven_multilingual_v2" : "eleven_monolingual_v1"
          })
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }

        // Verificar se a resposta é realmente áudio
        const contentType = response.headers.get('content-type');
        console.log("🎵 Content-Type:", contentType);
        
        if (!contentType || !contentType.includes('audio')) {
          throw new Error(`Resposta inválida: ${contentType}. Esperado audio/*`);
        }

        // Reproduzir áudio
        const audioBlob = await response.blob();
        console.log("🎵 Audio blob size:", audioBlob.size, "bytes");
        
        if (audioBlob.size === 0) {
          throw new Error("Áudio vazio recebido da API");
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onloadstart = () => {
          console.log("🎵 Carregando áudio...");
        };
        
        audio.oncanplay = () => {
          console.log("🎵 Áudio carregado e pronto para reproduzir");
        };
        
        audio.onended = () => {
          console.log("🎵 Reprodução finalizada");
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error("🎵 Erro no elemento audio:", e);
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
          URL.revokeObjectURL(audioUrl);
        };

        try {
          await audio.play();
          console.log("🎵 Reprodução iniciada");
        } catch (playError) {
          console.error("🎵 Erro ao iniciar reprodução:", playError);
          throw playError;
        }
        
      } else if (voice.previewUrl) {
        // Para vozes com preview URL (como ElevenLabs pré-gravadas)
        const audio = new Audio(voice.previewUrl);
        
        audio.onended = () => {
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
        };
        
        audio.onerror = () => {
          setPlayingVoices(prev => {
            const newSet = new Set(prev);
            newSet.delete(voice.id);
            return newSet;
          });
        };

        await audio.play();
        
      } else {
        // Para OpenAI, simular ou mostrar aviso
        alert(`Preview não disponível para voz ${voice.name} (${voice.provider})`);
        setPlayingVoices(prev => {
          const newSet = new Set(prev);
          newSet.delete(voice.id);
          return newSet;
        });
      }

    } catch (error) {
      console.error("❌ Erro ao reproduzir voz:", error);
      setPlayingVoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(voice.id);
        return newSet;
      });
      alert(`Erro ao reproduzir voz: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const getProviderBadge = (provider: Voice["provider"]) => {
    const providerConfig = {
      elevenlabs: { variant: "default" as const, label: "ElevenLabs" },
      openai: { variant: "secondary" as const, label: "OpenAI" }
    };

    const config = providerConfig[provider];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getGenderBadge = (gender: Voice["gender"]) => {
    const genderConfig = {
      male: { icon: "👨", label: "Masculino" },
      female: { icon: "👩", label: "Feminino" },
      neutral: { icon: "⚡", label: "Neutro" }
    };

    const config = genderConfig[gender];
    return (
      <Badge variant="outline" className="text-xs">
        {config.icon} {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Bot className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração do Agente</h1>
          <p className="text-muted-foreground">
            Configure o modelo, voz padrão e gerencie vozes disponíveis para assistentes
          </p>
        </div>
      </div>

      <Tabs defaultValue="configuracao" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuracao" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuração</span>
          </TabsTrigger>
          <TabsTrigger value="vozes" className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4" />
            <span>Vozes Disponíveis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle>Modelo e Voz Padrão</CardTitle>
              <CardDescription>
                Configurações globais de modelo OpenAI e voz ElevenLabs para todos os assistentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeloVozForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vozes">
          <div className="space-y-4">
            {/* Botão Carregar Vozes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Volume2 className="w-5 h-5" />
                      <span>Carregar Vozes da ElevenLabs</span>
                    </CardTitle>
                    <CardDescription>
                      Carregue todas as vozes disponíveis na sua conta ElevenLabs
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={loadElevenLabsVoices} 
                    disabled={isLoadingVoices}
                    className="flex items-center space-x-2"
                  >
                    {isLoadingVoices ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{isLoadingVoices ? "Carregando..." : "Carregar Vozes"}</span>
                  </Button>
                </div>
              </CardHeader>
              {loadError && (
                <CardContent>
                  <Alert variant="destructive">
                    <AlertDescription>
                      {loadError}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="languageFilter">Idioma</Label>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os idiomas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os idiomas</SelectItem>
                        <SelectItem value="en-US">🇺🇸 Inglês</SelectItem>
                        <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                        <SelectItem value="es-ES">🇪🇸 Espanhol</SelectItem>
                        <SelectItem value="fr-FR">🇫🇷 Francês</SelectItem>
                        <SelectItem value="de-DE">🇩🇪 Alemão</SelectItem>
                        <SelectItem value="it-IT">🇮🇹 Italiano</SelectItem>
                        <SelectItem value="ja-JP">🇯🇵 Japonês</SelectItem>
                        <SelectItem value="ko-KR">🇰🇷 Coreano</SelectItem>
                        <SelectItem value="zh-CN">🇨🇳 Chinês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genderFilter">Gênero</Label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os gêneros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os gêneros</SelectItem>
                        <SelectItem value="male">👨 Masculino</SelectItem>
                        <SelectItem value="female">👩 Feminino</SelectItem>
                        <SelectItem value="neutral">⚡ Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="providerFilter">Provedor</Label>
                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os provedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os provedores</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Vozes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5" />
                    <span>Vozes Disponíveis ({filteredVoices.length})</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Adicionar Voz Manual
                  </Button>
                </CardTitle>
                <CardDescription>
                  Lista de vozes que os clientes podem usar em seus assistentes de ligação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredVoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Volume2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma voz encontrada</h3>
                      <p className="text-muted-foreground mb-4">
                        {voices.length === 0 
                          ? "Carregue as vozes da ElevenLabs ou ajuste os filtros"
                          : "Ajuste os filtros para ver mais vozes"
                        }
                      </p>
                      {voices.length === 0 && (
                        <Button onClick={loadElevenLabsVoices} disabled={isLoadingVoices}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Carregar Vozes da ElevenLabs
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredVoices.map((voice) => (
                    <Card key={voice.id} className={!voice.isActive ? "opacity-60" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h3 className="font-semibold text-lg">{voice.name}</h3>
                                <p className="text-sm text-muted-foreground">{voice.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getProviderBadge(voice.provider)}
                                {getGenderBadge(voice.gender)}
                                {voice.isActive ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    ✓ Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    ✕ Inativo  
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">ID:</span>
                                <p className="text-muted-foreground font-mono text-xs">{voice.id}</p>
                              </div>
                              <div>
                                <span className="font-medium">Idioma:</span>
                                <p className="text-muted-foreground">{voice.language}</p>
                              </div>
                              <div>
                                <span className="font-medium">Provedor:</span>
                                <p className="text-muted-foreground">{voice.provider === "elevenlabs" ? "ElevenLabs" : "OpenAI"}</p>
                              </div>
                              <div>
                                <span className="font-medium">Gênero:</span>
                                <p className="text-muted-foreground">{voice.gender === "male" ? "Masculino" : "Feminino"}</p>
                              </div>
                            </div>

                            {voice.settings && (
                              <div className="bg-muted p-3 rounded-lg">
                                <h4 className="font-medium text-sm mb-2">Configurações ElevenLabs:</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Stability:</span>
                                    <p className="text-muted-foreground">{voice.settings.stability}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Similarity:</span>
                                    <p className="text-muted-foreground">{voice.settings.similarityBoost}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Style:</span>
                                    <p className="text-muted-foreground">{voice.settings.style}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => playVoice(voice)}
                              disabled={playingVoices.has(voice.id)}
                            >
                              {playingVoices.has(voice.id) ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4 mr-1" />
                              )}
                              {playingVoices.has(voice.id) ? "Reproduzindo..." : "Testar"}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}