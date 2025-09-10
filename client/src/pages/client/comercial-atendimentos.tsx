import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPut } from "@/lib/api";
import { FunnelStage } from "@/types";
import { 
  Users, MessageCircle, Phone, Calendar, 
  MoreVertical, Edit, Trash2, Filter
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  funnelStageId: string;
  lastContact?: string;
  notes?: string;
  value?: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface KanbanColumn {
  stage: FunnelStage;
  customers: Customer[];
}

export default function ComercialAtendimentos() {
  const { toast } = useToast();
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Fetch funnel stages
  const { data: funnelStages = [], isLoading: stagesLoading } = useQuery<FunnelStage[]>({
    queryKey: ["/api/funnel-stages"],
    queryFn: () => apiGet("/funnel-stages"),
  });

  // Fetch customers (mocked for now - you'll need to implement the backend)
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: () => apiGet("/customers"),
    // Mock data for demonstration - will be updated with real funnelStageIds
    initialData: [],
    enabled: funnelStages.length > 0, // Only fetch after stages are loaded
  });

  // Create mock customers with real stage IDs when stages are available
  const mockCustomers: Customer[] = funnelStages.length > 0 ? [
    {
      id: "1",
      name: "João Silva",
      phone: "(11) 99999-9999",
      email: "joao@empresa.com",
      company: "Empresa ABC",
      funnelStageId: funnelStages[0]?.id || "",
      lastContact: "2024-01-15",
      notes: "Cliente interessado em nossos serviços",
      value: 5000,
      source: "Website",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-15"
    },
    {
      id: "2", 
      name: "Maria Santos",
      phone: "(11) 88888-8888",
      email: "maria@xyz.com",
      company: "XYZ Ltda",
      funnelStageId: funnelStages[1]?.id || funnelStages[0]?.id || "",
      lastContact: "2024-01-14",
      notes: "Aguardando orçamento",
      value: 8000,
      source: "Indicação",
      createdAt: "2024-01-08",
      updatedAt: "2024-01-14"
    },
    {
      id: "3",
      name: "Pedro Costa",
      phone: "(11) 77777-7777",
      email: "pedro@tech.com",
      company: "Tech Solutions",
      funnelStageId: funnelStages[0]?.id || "",
      lastContact: "2024-01-16",
      notes: "Primeira reunião agendada",
      value: 12000,
      source: "LinkedIn",
      createdAt: "2024-01-12",
      updatedAt: "2024-01-16"
    }
  ] : [];

  // Use mock data if no real data exists
  const finalCustomers = customers.length > 0 ? customers : mockCustomers;

  // Create Kanban columns based on funnel stages
  const kanbanColumns: KanbanColumn[] = funnelStages
    .filter(stage => stage.isActive)
    .map(stage => ({
      stage,
      customers: finalCustomers.filter(customer => customer.funnelStageId === stage.id)
    }));

  // Add customers without stage to first column
  const customersWithoutStage = finalCustomers.filter(customer => !customer.funnelStageId);
  if (kanbanColumns.length > 0 && customersWithoutStage.length > 0) {
    kanbanColumns[0].customers = [...kanbanColumns[0].customers, ...customersWithoutStage];
  }

  const moveCustomerMutation = useMutation({
    mutationFn: async ({ customerId, newStageId }: { customerId: string; newStageId: string }) => {
      // Simular movimento local até implementar a API
      console.log(`Moving customer ${customerId} to stage ${newStageId}`);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Por enquanto, apenas simula sucesso
      return { success: true };
    },
    onSuccess: () => {
      // Atualizar localmente os dados dos clientes
      queryClient.setQueryData(["/api/customers"], (oldData: Customer[] | undefined) => {
        if (!oldData || !draggedCustomer) return oldData;
        
        return oldData.map(customer => 
          customer.id === draggedCustomer.id 
            ? { ...customer, funnelStageId: draggedCustomer.funnelStageId }
            : customer
        );
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error) => {
      console.error("Error moving customer:", error);
      toast({
        title: "Erro",
        description: "Erro ao mover cliente. Funcionalidade em desenvolvimento.",
        variant: "destructive",
      });
    },
  });


  const handleDragStart = (e: React.DragEvent, customer: Customer) => {
    setDraggedCustomer(customer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', customer.id);
    
    // Add drag image styling
    const dragTarget = e.currentTarget as HTMLElement;
    dragTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragTarget = e.currentTarget as HTMLElement;
    dragTarget.style.opacity = '1';
    setDraggedCustomer(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumn(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedCustomer && draggedCustomer.funnelStageId !== targetStageId) {
      // Atualizar o estado local imediatamente para feedback visual
      const updatedCustomer = { ...draggedCustomer, funnelStageId: targetStageId };
      
      // Atualizar o cache local primeiro para resposta imediata
      queryClient.setQueryData(["/api/customers"], (oldData: Customer[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(customer => 
          customer.id === draggedCustomer.id 
            ? updatedCustomer
            : customer
        );
      });
      
      // Mostrar notificação de sucesso
      const targetStage = funnelStages.find(s => s.id === targetStageId);
      toast({
        title: "Cliente movido",
        description: `${draggedCustomer.name} foi movido para ${targetStage?.name}`,
      });
      
      // Fazer a chamada da API (simulada por enquanto)
      moveCustomerMutation.mutate({
        customerId: draggedCustomer.id,
        newStageId: targetStageId
      });
    }
    
    setDraggedCustomer(null);
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (stagesLoading) {
    return <div>Carregando etapas do funil...</div>;
  }

  if (funnelStages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma etapa do funil encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Você precisa criar etapas do funil antes de gerenciar atendimentos.
          </p>
          <Button asChild>
            <a href="/client/comercial/funil">Criar Etapas do Funil</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Atendimentos
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus clientes no funil de vendas
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {kanbanColumns.map((column) => (
          <div
            key={column.stage.id}
            className={`flex-shrink-0 w-80 transition-all duration-200 ${
              dragOverColumn === column.stage.id 
                ? 'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500 ring-opacity-50 rounded-lg' 
                : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.stage.id)}
          >
            {/* Column Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: column.stage.color }}
                  />
                  <div>
                    <h3 className="font-semibold">{column.stage.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {column.customers.length} {column.customers.length === 1 ? 'cliente' : 'clientes'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(column.customers.reduce((sum, customer) => sum + (customer.value || 0), 0))}
                </Badge>
              </div>
            </div>

            {/* Customer Cards */}
            <div className="space-y-3 min-h-[400px]">
              {column.customers.map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-move hover:shadow-md transition-all duration-200 ${
                    draggedCustomer?.id === customer.id 
                      ? 'opacity-50 scale-95 ring-2 ring-blue-500' 
                      : 'hover:scale-[1.02]'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, customer)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-sm">{customer.name}</h4>
                          {customer.company && (
                            <p className="text-xs text-muted-foreground">{customer.company}</p>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{formatPhone(customer.phone)}</span>
                      </div>
                      
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      
                      {customer.value && customer.value > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(customer.value)}
                          </span>
                        </div>
                      )}

                      {customer.lastContact && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Último contato: {new Date(customer.lastContact).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}

                      {customer.source && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {customer.source}
                          </Badge>
                        </div>
                      )}

                      {customer.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {customer.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty state for column */}
              {column.customers.length === 0 && (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragOverColumn === column.stage.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-muted-foreground/25'
                }`}>
                  <Users className={`w-8 h-8 mx-auto mb-2 ${
                    dragOverColumn === column.stage.id 
                      ? 'text-blue-500' 
                      : 'text-muted-foreground'
                  }`} />
                  <p className={`text-sm ${
                    dragOverColumn === column.stage.id 
                      ? 'text-blue-600 font-medium' 
                      : 'text-muted-foreground'
                  }`}>
                    {dragOverColumn === column.stage.id 
                      ? 'Solte o cliente aqui' 
                      : 'Arraste clientes para esta etapa'
                    }
                  </p>
                </div>
              )}

              {/* Drop zone when column has customers but drag is active */}
              {column.customers.length > 0 && draggedCustomer && dragOverColumn === column.stage.id && (
                <div className="border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">
                    Solte aqui para mover para {column.stage.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}