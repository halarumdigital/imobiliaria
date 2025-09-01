import { Hash, Phone, CheckCircle, XCircle, Users, Building, Info, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AvailablePhoneNumber {
  id: string;
  number: string;
  provider: "twilio" | "vapi";
  name?: string;
  status: "active" | "inactive";
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  country: string;
  region?: string;
  type: "local" | "tollfree" | "mobile";
  isSelected: boolean;
  usage: {
    totalCalls: number;
    monthlyMinutes: number;
  };
}

export function NumerosPage() {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailablePhoneNumber[]>([
    // Mock data - available numbers assigned to current company
    {
      id: "pn_789",
      number: "+15559876543",
      provider: "vapi",
      name: "Número Principal",
      status: "active",
      capabilities: { voice: true, sms: false, mms: false },
      country: "US",
      region: "California",
      type: "local",
      isSelected: true,
      usage: { totalCalls: 156, monthlyMinutes: 890 }
    },
    {
      id: "pn_101",
      number: "+15557777777",
      provider: "twilio",
      name: "Linha de Backup",
      status: "active",
      capabilities: { voice: true, sms: true, mms: false },
      country: "US",
      region: "Texas",
      type: "local",
      isSelected: false,
      usage: { totalCalls: 23, monthlyMinutes: 145 }
    },
    {
      id: "pn_202",
      number: "+18009998888",
      provider: "twilio",
      name: "Toll-Free Vendas",
      status: "active",
      capabilities: { voice: true, sms: false, mms: false },
      country: "US",
      type: "tollfree",
      isSelected: false,
      usage: { totalCalls: 45, monthlyMinutes: 234 }
    }
  ]);

  const getStatusBadge = (status: AvailablePhoneNumber["status"]) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Ativo", icon: CheckCircle },
      inactive: { variant: "secondary" as const, label: "Inativo", icon: XCircle }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <IconComponent className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getProviderBadge = (provider: AvailablePhoneNumber["provider"]) => {
    const providerConfig = {
      twilio: { variant: "outline" as const, label: "Twilio" },
      vapi: { variant: "secondary" as const, label: "Vapi" }
    };

    const config = providerConfig[provider];

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: AvailablePhoneNumber["type"]) => {
    const typeConfig = {
      local: { label: "Local", icon: "📍" },
      tollfree: { label: "Toll-Free", icon: "🆓" },
      mobile: { label: "Mobile", icon: "📱" }
    };

    const config = typeConfig[type];

    return (
      <span className="text-sm text-muted-foreground">
        {config.icon} {config.label}
      </span>
    );
  };

  const toggleNumberSelection = (numberId: string) => {
    setAvailableNumbers(prev => prev.map(num => {
      if (num.id === numberId) {
        return { ...num, isSelected: !num.isSelected };
      }
      return num;
    }));
  };

  const saveSelection = async () => {
    const selected = availableNumbers.filter(num => num.isSelected);
    console.log("Números selecionados para uso:", selected.map(n => n.number));
    
    // Here you would save the selection to the API
    // await updateSelectedNumbers(selected.map(n => n.id));
    
    alert(`${selected.length} número(s) selecionado(s) para suas chamadas!`);
  };

  const selectedCount = availableNumbers.filter(n => n.isSelected).length;
  const totalCalls = availableNumbers.reduce((sum, n) => sum + n.usage.totalCalls, 0);
  const totalMinutes = availableNumbers.reduce((sum, n) => sum + n.usage.monthlyMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Números Disponíveis</h1>
            <p className="text-muted-foreground">
              Selecione os números que deseja usar em suas chamadas
            </p>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <Button onClick={saveSelection}>
            <PhoneCall className="w-4 h-4 mr-2" />
            Usar {selectedCount} Número(s)
          </Button>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona:</strong> Os números abaixo foram disponibilizados pelo administrador para sua empresa.
          Selecione os números que deseja usar em suas chamadas automáticas. Você pode alterar sua seleção a qualquer momento.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {availableNumbers.length}
              </div>
              <div className="text-sm text-muted-foreground">Números Disponíveis</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedCount}
              </div>
              <div className="text-sm text-muted-foreground">Selecionados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalCalls}
              </div>
              <div className="text-sm text-muted-foreground">Chamadas Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalMinutes}
              </div>
              <div className="text-sm text-muted-foreground">Minutos/Mês</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Numbers List */}
      {availableNumbers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="w-16 h-16 text-muted-foreground mb-4" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Nenhum número disponível</h3>
              <p className="text-muted-foreground max-w-md">
                Não há números de telefone disponíveis para sua empresa no momento. 
                Entre em contato com o administrador para solicitar números para suas chamadas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableNumbers.map((phoneNumber) => (
            <Card 
              key={phoneNumber.id} 
              className={`cursor-pointer transition-all ${
                phoneNumber.isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
              }`}
              onClick={() => toggleNumberSelection(phoneNumber.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={phoneNumber.isSelected}
                        onChange={() => toggleNumberSelection(phoneNumber.id)}
                        className="w-4 h-4 rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Phone className="w-5 h-5" />
                      <span>{phoneNumber.number}</span>
                    </div>
                    {getStatusBadge(phoneNumber.status)}
                    {getProviderBadge(phoneNumber.provider)}
                    {phoneNumber.isSelected && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Selecionado
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription>
                  {phoneNumber.name || "Sem nome"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recursos</h4>
                    <div className="flex flex-wrap gap-1">
                      {phoneNumber.capabilities.voice && (
                        <Badge variant="outline" className="text-xs">
                          📞 Voz
                        </Badge>
                      )}
                      {phoneNumber.capabilities.sms && (
                        <Badge variant="outline" className="text-xs">
                          💬 SMS
                        </Badge>
                      )}
                      {phoneNumber.capabilities.mms && (
                        <Badge variant="outline" className="text-xs">
                          📷 MMS
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Localização</h4>
                    <div className="space-y-1">
                      <div>{getTypeBadge(phoneNumber.type)}</div>
                      <div className="text-sm text-muted-foreground">
                        {phoneNumber.country}
                        {phoneNumber.region && `, ${phoneNumber.region}`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Uso Atual</h4>
                    <div className="text-sm space-y-1">
                      <div>{phoneNumber.usage.totalCalls} chamadas</div>
                      <div className="text-muted-foreground">{phoneNumber.usage.monthlyMinutes} min/mês</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="w-5 h-5" />
              <span>Números Selecionados</span>
            </CardTitle>
            <CardDescription>
              Você selecionou {selectedCount} número(s) para suas chamadas automáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableNumbers
                .filter(n => n.isSelected)
                .map(number => (
                  <Badge key={number.id} variant="default" className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{number.number}</span>
                  </Badge>
                ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Estes números estarão disponíveis nos formulários de chamadas
              </div>
              <Button onClick={saveSelection}>
                <PhoneCall className="w-4 h-4 mr-2" />
                Confirmar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}