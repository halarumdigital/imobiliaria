import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, Phone, Settings, Loader2, AlertCircle, Import, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TwilioPhoneNumberData {
  // Provider configuration
  provider: "twilio";
  
  // Twilio credentials (required)
  twilioAccountSid: string;
  twilioAuthToken: string;
  
  // Phone number (required)
  number: string; // E.164 format
  
  // Optional Twilio settings
  name?: string;
  voiceUrl?: string;
  voiceMethod?: "GET" | "POST";
  voiceFallbackUrl?: string;
  voiceFallbackMethod?: "GET" | "POST";
  statusCallback?: string;
  statusCallbackMethod?: "GET" | "POST";
  voiceReceiveMode?: "voice" | "fax";
  identitySid?: string;
  addressSid?: string;
  emergencyStatus?: "Active" | "Inactive";
  emergencyAddressSid?: string;
  trunkSid?: string;
  voiceApplicationSid?: string;
}

interface VapiPhoneNumberData {
  provider: "vapi";
  // Vapi free numbers have limited configuration
  areaCode?: string;
  name?: string;
}

interface BuyPhoneNumberData {
  provider: "twilio";
  twilioAccountSid: string;
  twilioAuthToken: string;
  
  // Search criteria
  areaCode?: string;
  contains?: string;
  smsEnabled?: boolean;
  voiceEnabled?: boolean;
  mmsEnabled?: boolean;
  excludeAllAddressRequired?: boolean;
  excludeForeignAddressRequired?: boolean;
  excludeLocalAddressRequired?: boolean;
  beta?: boolean;
  nearNumber?: string;
  nearLatLong?: string;
  distance?: number;
  inPostalCode?: string;
  inRegion?: string;
  inRateCenter?: string;
  inLata?: string;
  inLocality?: string;
}

type PhoneNumberFormData = TwilioPhoneNumberData | VapiPhoneNumberData | BuyPhoneNumberData;

export function PhoneNumberForm() {
  const [formMode, setFormMode] = useState<"import" | "buy" | "vapi">("import");
  const [formData, setFormData] = useState<Partial<PhoneNumberFormData>>({
    provider: "twilio"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateE164PhoneNumber = (phone: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const validateAreaCode = (areaCode: string): boolean => {
    const areaCodeRegex = /^\d{3}$/;
    return areaCodeRegex.test(areaCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    const newErrors = [];

    if (formMode === "import") {
      const data = formData as Partial<TwilioPhoneNumberData>;
      
      if (!data.twilioAccountSid?.trim()) {
        newErrors.push("Twilio Account SID é obrigatório");
      }
      if (!data.twilioAuthToken?.trim()) {
        newErrors.push("Twilio Auth Token é obrigatório");
      }
      if (!data.number?.trim()) {
        newErrors.push("Número de telefone é obrigatório");
      } else if (!validateE164PhoneNumber(data.number)) {
        newErrors.push("Número deve estar no formato E.164 (ex: +15551234567)");
      }
    } else if (formMode === "buy") {
      const data = formData as Partial<BuyPhoneNumberData>;
      
      if (!data.twilioAccountSid?.trim()) {
        newErrors.push("Twilio Account SID é obrigatório");
      }
      if (!data.twilioAuthToken?.trim()) {
        newErrors.push("Twilio Auth Token é obrigatório");
      }
      if (data.areaCode && !validateAreaCode(data.areaCode)) {
        newErrors.push("Código de área deve ter 3 dígitos");
      }
    } else if (formMode === "vapi") {
      const data = formData as Partial<VapiPhoneNumberData>;
      
      if (data.areaCode && !validateAreaCode(data.areaCode)) {
        newErrors.push("Código de área deve ter 3 dígitos");
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Build API payload based on mode
      let payload: any;
      let endpoint: string;

      if (formMode === "import") {
        endpoint = "/api/vapi/phone-numbers";
        payload = {
          provider: "twilio",
          twilioAccountSid: (formData as TwilioPhoneNumberData).twilioAccountSid,
          twilioAuthToken: (formData as TwilioPhoneNumberData).twilioAuthToken,
          number: (formData as TwilioPhoneNumberData).number,
          ...(formData.name && { name: formData.name })
        };
      } else if (formMode === "buy") {
        endpoint = "/api/vapi/phone-numbers/buy";
        const data = formData as BuyPhoneNumberData;
        payload = {
          provider: "twilio",
          twilioAccountSid: data.twilioAccountSid,
          twilioAuthToken: data.twilioAuthToken,
          ...(data.areaCode && { areaCode: data.areaCode }),
          ...(data.contains && { contains: data.contains }),
          smsEnabled: data.smsEnabled ?? true,
          voiceEnabled: data.voiceEnabled ?? true,
          mmsEnabled: data.mmsEnabled ?? false
        };
      } else if (formMode === "vapi") {
        endpoint = "/api/vapi/phone-numbers";
        payload = {
          provider: "vapi",
          ...(formData.areaCode && { areaCode: formData.areaCode }),
          ...(formData.name && { name: formData.name })
        };
      }

      console.log(`${formMode.toUpperCase()} - Criando número com payload:`, payload);

      // Here you would make the actual API call
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${vapiApiKey}`
      //   },
      //   body: JSON.stringify(payload)
      // });
      // const result = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const actionText = formMode === "import" ? "importado" : formMode === "buy" ? "comprado" : "criado";
      alert(`Número ${actionText} com sucesso! (Em produção, o número seria ${actionText} via API)`);
      
      // Reset form
      setFormData({ provider: formMode === "vapi" ? "vapi" : "twilio" });
      
    } catch (error) {
      console.error("Erro ao processar número:", error);
      setErrors(["Erro ao processar número de telefone. Tente novamente."]);
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

  const resetForm = (mode: "import" | "buy" | "vapi") => {
    setFormMode(mode);
    setFormData({ 
      provider: mode === "vapi" ? "vapi" : "twilio"
    });
    setErrors([]);
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

      <Tabs value={formMode} onValueChange={(value: any) => resetForm(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Import className="w-4 h-4" />
            <span>Importar</span>
          </TabsTrigger>
          <TabsTrigger value="buy" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Comprar</span>
          </TabsTrigger>
          <TabsTrigger value="vapi" className="flex items-center space-x-2">
            <Hash className="w-4 h-4" />
            <span>Vapi Gratuito</span>
          </TabsTrigger>
        </TabsList>

        {/* Import Existing Twilio Number */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Import className="w-5 h-5" />
                <span>Importar Número do Twilio</span>
                <Badge variant="destructive">Obrigatório</Badge>
              </CardTitle>
              <CardDescription>
                Importe um número de telefone existente da sua conta Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilioAccountSid">Twilio Account SID *</Label>
                  <Input
                    id="twilioAccountSid"
                    value={(formData as TwilioPhoneNumberData).twilioAccountSid || ""}
                    onChange={(e) => updateFormData('twilioAccountSid', e.target.value)}
                    placeholder="AC..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilioAuthToken">Twilio Auth Token *</Label>
                  <Input
                    id="twilioAuthToken"
                    type="password"
                    value={(formData as TwilioPhoneNumberData).twilioAuthToken || ""}
                    onChange={(e) => updateFormData('twilioAuthToken', e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de Telefone *</Label>
                <Input
                  id="phoneNumber"
                  value={(formData as TwilioPhoneNumberData).number || ""}
                  onChange={(e) => updateFormData('number', e.target.value)}
                  placeholder="+15551234567"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Formato E.164 obrigatório (ex: +15551234567)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberName">Nome do Número (Opcional)</Label>
                <Input
                  id="numberName"
                  value={formData.name || ""}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Linha Principal de Vendas"
                />
              </div>

              <Alert>
                <Hash className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pré-requisitos:</strong> Você deve ter o número já configurado na sua conta Twilio.
                  As credenciais são encontradas na seção "API keys & tokens" do seu painel Twilio.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buy New Twilio Number */}
        <TabsContent value="buy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Comprar Novo Número</span>
                <Badge variant="destructive">Obrigatório</Badge>
              </CardTitle>
              <CardDescription>
                Compre um novo número de telefone através do Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyTwilioAccountSid">Twilio Account SID *</Label>
                  <Input
                    id="buyTwilioAccountSid"
                    value={(formData as BuyPhoneNumberData).twilioAccountSid || ""}
                    onChange={(e) => updateFormData('twilioAccountSid', e.target.value)}
                    placeholder="AC..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyTwilioAuthToken">Twilio Auth Token *</Label>
                  <Input
                    id="buyTwilioAuthToken"
                    type="password"
                    value={(formData as BuyPhoneNumberData).twilioAuthToken || ""}
                    onChange={(e) => updateFormData('twilioAuthToken', e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Critérios de Busca</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="areaCode">Código de Área</Label>
                    <Input
                      id="areaCode"
                      value={(formData as BuyPhoneNumberData).areaCode || ""}
                      onChange={(e) => updateFormData('areaCode', e.target.value)}
                      placeholder="212"
                      maxLength={3}
                    />
                    <p className="text-sm text-muted-foreground">3 dígitos (ex: 212, 415, 555)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contains">Contém Dígitos</Label>
                    <Input
                      id="contains"
                      value={(formData as BuyPhoneNumberData).contains || ""}
                      onChange={(e) => updateFormData('contains', e.target.value)}
                      placeholder="1234"
                    />
                    <p className="text-sm text-muted-foreground">Sequência de dígitos desejada</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-medium">Recursos Habilitados</h5>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="voiceEnabled"
                        checked={(formData as BuyPhoneNumberData).voiceEnabled ?? true}
                        onChange={(e) => updateFormData('voiceEnabled', e.target.checked)}
                      />
                      <Label htmlFor="voiceEnabled">Voz</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smsEnabled"
                        checked={(formData as BuyPhoneNumberData).smsEnabled ?? true}
                        onChange={(e) => updateFormData('smsEnabled', e.target.checked)}
                      />
                      <Label htmlFor="smsEnabled">SMS</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="mmsEnabled"
                        checked={(formData as BuyPhoneNumberData).mmsEnabled ?? false}
                        onChange={(e) => updateFormData('mmsEnabled', e.target.checked)}
                      />
                      <Label htmlFor="mmsEnabled">MMS</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Plus className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cobrança:</strong> A compra do número será cobrada diretamente na sua conta Twilio.
                  Verifique os preços na documentação do Twilio antes de prosseguir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vapi Free Number */}
        <TabsContent value="vapi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="w-5 h-5" />
                <span>Número Gratuito Vapi</span>
                <Badge variant="secondary">Gratuito</Badge>
              </CardTitle>
              <CardDescription>
                Obtenha um número gratuito dos EUA fornecido pela Vapi (limitado ao território americano)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vapiAreaCode">Código de Área Preferido (Opcional)</Label>
                <Input
                  id="vapiAreaCode"
                  value={(formData as VapiPhoneNumberData).areaCode || ""}
                  onChange={(e) => updateFormData('areaCode', e.target.value)}
                  placeholder="212"
                  maxLength={3}
                />
                <p className="text-sm text-muted-foreground">
                  Deixe em branco para um número aleatório disponível
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vapiNumberName">Nome do Número (Opcional)</Label>
                <Input
                  id="vapiNumberName"
                  value={formData.name || ""}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Linha de Teste"
                />
              </div>

              <Alert>
                <Hash className="h-4 w-4" />
                <AlertDescription>
                  <strong>Limitações:</strong> Números gratuitos Vapi são apenas para uso nacional nos EUA.
                  Para chamadas internacionais, use um número Twilio importado ou comprado.
                </AlertDescription>
              </Alert>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recomendação:</strong> Para uso em produção com clientes brasileiros,
                  recomendamos importar ou comprar um número Twilio com DDD brasileiro.
                </AlertDescription>
              </Alert>
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
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {formMode === "import" ? "Importando..." : formMode === "buy" ? "Comprando..." : "Criando..."}
            </>
          ) : (
            <>
              {formMode === "import" && <Import className="w-4 h-4 mr-2" />}
              {formMode === "buy" && <Plus className="w-4 h-4 mr-2" />}
              {formMode === "vapi" && <Hash className="w-4 h-4 mr-2" />}
              {formMode === "import" ? "Importar Número" : formMode === "buy" ? "Comprar Número" : "Criar Número"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}