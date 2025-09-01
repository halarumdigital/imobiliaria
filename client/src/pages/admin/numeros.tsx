import { Hash, Plus, Phone, Settings, Trash2, Users, CheckCircle, XCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneNumberForm } from "@/components/forms/phone-number-form";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Company {
  id: string;
  name: string;
}

interface AdminPhoneNumber {
  id: string;
  number: string;
  provider: "twilio" | "vapi";
  name?: string;
  status: "active" | "inactive" | "error";
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  createdAt: Date;
  monthlyFee?: number;
  country: string;
  region?: string;
  type: "local" | "tollfree" | "mobile";
  // Admin-specific fields
  assignedToCompany?: string;
  companyName?: string;
  isAvailable: boolean;
  usage: {
    totalCalls: number;
    monthlyMinutes: number;
  };
}

export function AdminNumerosPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<AdminPhoneNumber | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  // Mock data
  const [companies] = useState<Company[]>([
    { id: "comp_1", name: "TechCorp Solutions" },
    { id: "comp_2", name: "Marketing Digital Ltda" },
    { id: "comp_3", name: "Vendas Online Inc" },
    { id: "comp_4", name: "Suporte Premium" }
  ]);

  const [phoneNumbers, setPhoneNumbers] = useState<AdminPhoneNumber[]>([
    // Only real phone numbers will be displayed
    // Mock data removed - real numbers should be loaded from API
  ]);

  const getStatusBadge = (status: AdminPhoneNumber["status"]) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Ativo", icon: CheckCircle },
      inactive: { variant: "secondary" as const, label: "Inativo", icon: XCircle },
      error: { variant: "destructive" as const, label: "Erro", icon: XCircle }
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

  const getAvailabilityBadge = (phoneNumber: AdminPhoneNumber) => {
    if (phoneNumber.isAvailable) {
      return <Badge variant="secondary">📍 Disponível</Badge>;
    } else if (phoneNumber.assignedToCompany) {
      return <Badge variant="outline">🏢 {phoneNumber.companyName}</Badge>;
    } else {
      return <Badge variant="destructive">🔒 Indisponível</Badge>;
    }
  };

  const getProviderBadge = (provider: AdminPhoneNumber["provider"]) => {
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

  const getTypeBadge = (type: AdminPhoneNumber["type"]) => {
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDeleteNumber = async (phoneNumber: AdminPhoneNumber) => {
    setSelectedNumber(phoneNumber);
    setDeleteDialogOpen(true);
  };

  const handleAssignNumber = (phoneNumber: AdminPhoneNumber) => {
    setSelectedNumber(phoneNumber);
    setSelectedCompany(phoneNumber.assignedToCompany || "");
    setAssignDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedNumber) return;

    try {
      setPhoneNumbers(prev => prev.filter(num => num.id !== selectedNumber.id));
      setDeleteDialogOpen(false);
      setSelectedNumber(null);
      
      console.log(`Número ${selectedNumber.number} removido com sucesso`);
    } catch (error) {
      console.error("Erro ao deletar número:", error);
    }
  };

  const confirmAssignment = async () => {
    if (!selectedNumber) return;

    try {
      setPhoneNumbers(prev => prev.map(num => {
        if (num.id === selectedNumber.id) {
          const company = companies.find(c => c.id === selectedCompany);
          return {
            ...num,
            assignedToCompany: selectedCompany || undefined,
            companyName: company?.name,
            isAvailable: !selectedCompany
          };
        }
        return num;
      }));

      setAssignDialogOpen(false);
      setSelectedNumber(null);
      setSelectedCompany("");
      
      console.log(`Número ${selectedNumber.number} atribuído com sucesso`);
    } catch (error) {
      console.error("Erro ao atribuir número:", error);
    }
  };

  const totalNumbers = phoneNumbers.length;
  const availableNumbers = phoneNumbers.filter(n => n.isAvailable).length;
  const assignedNumbers = phoneNumbers.filter(n => n.assignedToCompany).length;
  const totalMonthlyCost = phoneNumbers.reduce((sum, n) => sum + (n.monthlyFee || 0), 0);
  const totalCalls = phoneNumbers.reduce((sum, n) => sum + n.usage.totalCalls, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Números</h1>
            <p className="text-muted-foreground">
              Compre, configure e atribua números de telefone para empresas
            </p>
          </div>
        </div>
        
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Número
          </Button>
        )}
      </div>

      <Tabs defaultValue={showCreateForm ? "create" : "list"} value={showCreateForm ? "create" : "list"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="list" 
            onClick={() => setShowCreateForm(false)}
            className="flex items-center space-x-2"
          >
            <Hash className="w-4 h-4" />
            <span>Números do Sistema</span>
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Comprar/Importar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Número ao Sistema</CardTitle>
              <CardDescription>
                Importe, compre ou obtenha números gratuitos para serem usados pelas empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhoneNumberForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalNumbers}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{availableNumbers}</div>
                    <div className="text-sm text-muted-foreground">Disponíveis</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{assignedNumbers}</div>
                    <div className="text-sm text-muted-foreground">Atribuídos</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">${totalMonthlyCost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Custo Mensal</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{totalCalls}</div>
                    <div className="text-sm text-muted-foreground">Chamadas Total</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phone Numbers List */}
            {phoneNumbers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Hash className="w-16 h-16 text-muted-foreground mb-4" />
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Nenhum número no sistema</h3>
                    <p className="text-muted-foreground max-w-md">
                      Adicione números de telefone para que as empresas possam usá-los 
                      em suas chamadas automatizadas.
                    </p>
                    <div className="pt-4">
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Número
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {phoneNumbers.map((phoneNumber) => (
                  <Card key={phoneNumber.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Phone className="w-5 h-5" />
                          <span>{phoneNumber.number}</span>
                          {getStatusBadge(phoneNumber.status)}
                          {getProviderBadge(phoneNumber.provider)}
                          {getAvailabilityBadge(phoneNumber)}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignNumber(phoneNumber)}
                          >
                            <Building className="w-4 h-4 mr-1" />
                            {phoneNumber.assignedToCompany ? "Reatribuir" : "Atribuir"}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-1" />
                            Configurar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteNumber(phoneNumber)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="flex items-center justify-between">
                        <span>{phoneNumber.name || "Sem nome"}</span>
                        <span className="text-sm">
                          Criado em: {formatDateTime(phoneNumber.createdAt)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Recursos</h4>
                          <div className="flex flex-wrap gap-1">
                            {phoneNumber.capabilities.voice && (
                              <Badge variant="outline" className="text-xs">📞 Voz</Badge>
                            )}
                            {phoneNumber.capabilities.sms && (
                              <Badge variant="outline" className="text-xs">💬 SMS</Badge>
                            )}
                            {phoneNumber.capabilities.mms && (
                              <Badge variant="outline" className="text-xs">📷 MMS</Badge>
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
                          <h4 className="font-medium text-sm">Uso</h4>
                          <div className="text-sm space-y-1">
                            <div>{phoneNumber.usage.totalCalls} chamadas</div>
                            <div className="text-muted-foreground">{phoneNumber.usage.monthlyMinutes} min/mês</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Custo</h4>
                          <div className="text-sm">
                            {phoneNumber.monthlyFee === 0 ? (
                              <span className="text-green-600 font-medium">Gratuito</span>
                            ) : (
                              <span>${phoneNumber.monthlyFee?.toFixed(2)}/mês</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Número</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o número <strong>{selectedNumber?.number}</strong>?
              {selectedNumber?.assignedToCompany && (
                <span className="text-orange-600">
                  <br />⚠️ Este número está atribuído à empresa "{selectedNumber.companyName}".
                </span>
              )}
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover Número
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Dialog */}
      <AlertDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir Número</AlertDialogTitle>
            <AlertDialogDescription>
              Atribua o número <strong>{selectedNumber?.number}</strong> a uma empresa ou deixe-o disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="companySelect">Empresa</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa ou deixe disponível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">🌐 Disponível para todas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    🏢 {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignment}>
              Confirmar Atribuição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}