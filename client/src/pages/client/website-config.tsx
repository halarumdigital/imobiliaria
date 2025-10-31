import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Globe, Palette, Phone, Share2, Eye, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  features: string[];
}

interface TemplateConfig {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    videoUrl?: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    companyName: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    whatsapp?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  sections: {
    showAgents: boolean;
    showTestimonials: boolean;
    showContactForm: boolean;
    showWhatsappCTA: boolean;
  };
  properties: {
    featuredCount: number;
    layout: 'grid' | 'carousel';
  };
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface CompanyWebsite {
  id: string;
  companyId: string;
  templateId: string;
  config: TemplateConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CONFIG: TemplateConfig = {
  hero: {
    title: "Encontre o Imóvel dos Seus Sonhos",
    subtitle: "As melhores propriedades da região",
    backgroundImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=700&fit=crop",
  },
  branding: {
    primaryColor: "#EF4444",
    secondaryColor: "#1E293B",
    companyName: "Minha Imobiliária",
  },
  contact: {
    address: "Rua Exemplo, 123 - Cidade, Estado",
    phone: "+55 11 98765-4321",
    email: "contato@imobiliaria.com.br",
    socialMedia: {},
  },
  sections: {
    showAgents: true,
    showTestimonials: true,
    showContactForm: true,
    showWhatsappCTA: false,
  },
  properties: {
    featuredCount: 6,
    layout: "grid",
  },
  seo: {
    title: "Imobiliária - Encontre seu imóvel ideal",
    description: "Encontre as melhores casas, apartamentos e imóveis comerciais",
    keywords: ["imóveis", "casas", "apartamentos", "venda", "aluguel"],
  },
};

export default function WebsiteConfig() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<WebsiteTemplate[]>({
    queryKey: ["/api/website-templates"],
  });

  // Fetch current website config
  const { data: currentWebsite, isLoading: isLoadingWebsite } = useQuery<CompanyWebsite | null>({
    queryKey: ["/api/client/website"],
  });

  // Set initial values when website data loads
  useEffect(() => {
    if (currentWebsite) {
      setSelectedTemplateId(currentWebsite.templateId);
      setConfig(currentWebsite.config);
    }
  }, [currentWebsite]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/client/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateId: selectedTemplateId, config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configuração do website salva com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/website"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedTemplateId) {
      toast({
        title: "Atenção",
        description: "Selecione um template primeiro",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate();
  };

  if (isLoadingTemplates || isLoadingWebsite) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="w-8 h-8" />
              Configurar Website
            </h1>
            <p className="text-muted-foreground mt-2">
              Personalize o website público da sua imobiliária
            </p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !selectedTemplateId} size="lg">
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>
            )}
          </Button>
        </div>

        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Escolha um Template
            </CardTitle>
            <CardDescription>
              Selecione o design que melhor representa sua marca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{template.name}</h3>
                      {selectedTemplateId === template.id && (
                        <Badge className="bg-primary">
                          <Check className="w-3 h-3 mr-1" /> Selecionado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(template.features) ? template.features : []).slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhum template disponível. Entre em contato com o suporte.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        {selectedTemplateId && (
          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>
                Configure os detalhes do seu website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="branding">
                    <Palette className="w-4 h-4 mr-2" />
                    Marca
                  </TabsTrigger>
                  <TabsTrigger value="contact">
                    <Phone className="w-4 h-4 mr-2" />
                    Contato
                  </TabsTrigger>
                  <TabsTrigger value="sections">Seções</TabsTrigger>
                </TabsList>

                {/* Hero Tab */}
                <TabsContent value="hero" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroTitle">Título Principal</Label>
                    <Input
                      id="heroTitle"
                      value={config.hero.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, title: e.target.value },
                        })
                      }
                      placeholder="Encontre o Imóvel dos Seus Sonhos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Subtítulo</Label>
                    <Input
                      id="heroSubtitle"
                      value={config.hero.subtitle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, subtitle: e.target.value },
                        })
                      }
                      placeholder="As melhores propriedades da região"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroImage">Imagem de Fundo (URL)</Label>
                    <Input
                      id="heroImage"
                      value={config.hero.backgroundImage || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, backgroundImage: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 1920x700px
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroVideo">Vídeo YouTube (Embed URL) - Opcional</Label>
                    <Input
                      id="heroVideo"
                      value={config.hero.videoUrl || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, videoUrl: e.target.value },
                        })
                      }
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={config.branding.companyName}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          branding: { ...config.branding, companyName: e.target.value },
                        })
                      }
                      placeholder="Minha Imobiliária"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value },
                            })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value },
                            })
                          }
                          placeholder="#EF4444"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={config.branding.secondaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, secondaryColor: e.target.value },
                            })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          value={config.branding.secondaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, secondaryColor: e.target.value },
                            })
                          }
                          placeholder="#1E293B"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo (URL) - Opcional</Label>
                    <Input
                      id="logo"
                      value={config.branding.logo || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          branding: { ...config.branding, logo: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={config.contact.address}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          contact: { ...config.contact, address: e.target.value },
                        })
                      }
                      placeholder="Rua Exemplo, 123 - Cidade, Estado"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={config.contact.phone}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: { ...config.contact, phone: e.target.value },
                          })
                        }
                        placeholder="+55 11 98765-4321"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.contact.email}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: { ...config.contact, email: e.target.value },
                          })
                        }
                        placeholder="contato@imobiliaria.com.br"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp (apenas números)</Label>
                    <Input
                      id="whatsapp"
                      value={config.contact.whatsapp || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          contact: { ...config.contact, whatsapp: e.target.value },
                        })
                      }
                      placeholder="5511987654321"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 5511987654321 (código do país + DDD + número)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Redes Sociais
                    </Label>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={config.contact.socialMedia.facebook || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: {
                              ...config.contact,
                              socialMedia: {
                                ...config.contact.socialMedia,
                                facebook: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Facebook URL"
                      />

                      <Input
                        value={config.contact.socialMedia.instagram || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: {
                              ...config.contact,
                              socialMedia: {
                                ...config.contact.socialMedia,
                                instagram: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Instagram URL"
                      />

                      <Input
                        value={config.contact.socialMedia.twitter || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: {
                              ...config.contact,
                              socialMedia: {
                                ...config.contact.socialMedia,
                                twitter: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Twitter URL"
                      />

                      <Input
                        value={config.contact.socialMedia.linkedin || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contact: {
                              ...config.contact,
                              socialMedia: {
                                ...config.contact.socialMedia,
                                linkedin: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="LinkedIn URL"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Sections Tab */}
                <TabsContent value="sections" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="showAgents">Mostrar Corretores</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir perfis dos corretores da empresa
                        </p>
                      </div>
                      <Switch
                        id="showAgents"
                        checked={config.sections.showAgents}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sections: { ...config.sections, showAgents: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="showTestimonials">Mostrar Depoimentos</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir depoimentos de clientes satisfeitos
                        </p>
                      </div>
                      <Switch
                        id="showTestimonials"
                        checked={config.sections.showTestimonials}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sections: { ...config.sections, showTestimonials: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="showContactForm">Formulário de Contato</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir que visitantes entrem em contato
                        </p>
                      </div>
                      <Switch
                        id="showContactForm"
                        checked={config.sections.showContactForm}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sections: { ...config.sections, showContactForm: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="showWhatsappCTA">Botão WhatsApp Flutuante</Label>
                        <p className="text-sm text-muted-foreground">
                          Botão de chamada para ação do WhatsApp
                        </p>
                      </div>
                      <Switch
                        id="showWhatsappCTA"
                        checked={config.sections.showWhatsappCTA}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sections: { ...config.sections, showWhatsappCTA: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="featuredCount">Propriedades em Destaque</Label>
                    <Input
                      id="featuredCount"
                      type="number"
                      min={3}
                      max={12}
                      value={config.properties.featuredCount}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          properties: {
                            ...config.properties,
                            featuredCount: parseInt(e.target.value) || 6,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantas propriedades exibir na página inicial (3-12)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Save Button (Bottom) */}
        {selectedTemplateId && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
