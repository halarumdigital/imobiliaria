import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WhatsappInstance } from "@/types";
import { Send, MessageSquare, Mic, Image, Video, Eye, Upload, X, Users, Phone, List, Clock, Shuffle, CheckSquare, RefreshCw, Calendar, Timer } from "lucide-react";

type MessageType = "text" | "audio" | "image" | "video";

interface Contact {
  name: string;
  phone: string;
  valid: boolean;
  error?: string;
}

interface ContactList {
  id: string;
  name: string;
  contacts: Contact[];
  createdAt: Date;
}

interface BroadcastMessage {
  type: MessageType;
  content: string;
  messages?: string[]; // Array of multiple text messages
  file?: File;
  fileName?: string;
}

interface BroadcastConfig {
  intervalMin: number; // Intervalo mínimo em segundos
  intervalMax: number; // Intervalo máximo em segundos
  selectedInstances: string[]; // IDs das instâncias selecionadas
  randomizeInstances: boolean; // Se deve distribuir aleatoriamente entre instâncias
}

interface ScheduleConfig {
  enabled: boolean;
  date: string;
  time: string;
}

export default function WhatsAppDisparo() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [selectedContactList, setSelectedContactList] = useState<string>("");
  const [message, setMessage] = useState<BroadcastMessage>({
    type: "text",
    content: "",
    messages: []
  });
  const [showPreview, setShowPreview] = useState(false);
  const [broadcastConfig, setBroadcastConfig] = useState<BroadcastConfig>({
    intervalMin: 60,
    intervalMax: 120,
    selectedInstances: [],
    randomizeInstances: true
  });
  const [useMultipleInstances, setUseMultipleInstances] = useState(false);
  const [useMultipleMessages, setUseMultipleMessages] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    date: "",
    time: ""
  });

  const { data: instances = [], isLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
    refetchInterval: 30000, // Refresh every 30 seconds to get updated status
  });

  // Query to get contact lists from API
  const { data: contactLists = [], isLoading: listsLoading } = useQuery<ContactList[]>({
    queryKey: ["/api/contact-lists"],
    queryFn: () => apiGet("/contact-lists"),
  });

  // Function to get real-time connection status for an instance
  const getConnectionStatus = (instanceId: string) => {
    return useQuery({
      queryKey: ["/api/whatsapp-instances", instanceId, "status"],
      queryFn: () => apiGet(`/whatsapp-instances/${instanceId}/status`),
      refetchInterval: 30000, // Refresh every 30 seconds
      enabled: !!instanceId,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMessage(prev => ({
        ...prev,
        file,
        fileName: file.name
      }));
    }
  };

  const removeFile = () => {
    setMessage(prev => ({
      ...prev,
      file: undefined,
      fileName: undefined
    }));
  };

  const getSelectedContactList = () => {
    return contactLists.find(list => list.id === selectedContactList);
  };

  const getValidContactsCount = () => {
    const selectedList = getSelectedContactList();
    return selectedList ? selectedList.contacts.filter(c => c.valid).length : 0;
  };

  const getTotalContactsCount = () => {
    const selectedList = getSelectedContactList();
    return selectedList ? selectedList.contacts.length : 0;
  };

  // Funções para múltiplas mensagens
  const addMessage = () => {
    if (!message.messages) {
      setMessage(prev => ({ ...prev, messages: [""] }));
    } else {
      setMessage(prev => ({ 
        ...prev, 
        messages: [...prev.messages!, ""] 
      }));
    }
  };

  const updateMessage = (index: number, content: string) => {
    if (!message.messages) return;
    
    const updatedMessages = [...message.messages];
    updatedMessages[index] = content;
    setMessage(prev => ({ ...prev, messages: updatedMessages }));
  };

  const removeMessage = (index: number) => {
    if (!message.messages || message.messages.length <= 1) return;
    
    const updatedMessages = message.messages.filter((_, i) => i !== index);
    setMessage(prev => ({ ...prev, messages: updatedMessages }));
  };

  const getValidMessages = () => {
    if (useMultipleMessages && message.messages) {
      return message.messages.filter(msg => msg.trim().length > 0);
    }
    return message.content.trim() ? [message.content.trim()] : [];
  };

  const handleInstanceToggle = (instanceId: string) => {
    setBroadcastConfig(prev => {
      const isSelected = prev.selectedInstances.includes(instanceId);
      if (isSelected) {
        return {
          ...prev,
          selectedInstances: prev.selectedInstances.filter(id => id !== instanceId)
        };
      } else {
        return {
          ...prev,
          selectedInstances: [...prev.selectedInstances, instanceId]
        };
      }
    });
  };

  const handleSelectAllInstances = () => {
    const connectedInstances = enhancedInstances.filter(instance => instance.isConnected);
    setBroadcastConfig(prev => ({
      ...prev,
      selectedInstances: connectedInstances.map(instance => instance.id)
    }));
  };

  const handleClearInstances = () => {
    setBroadcastConfig(prev => ({
      ...prev,
      selectedInstances: []
    }));
  };

  const getRandomInterval = () => {
    const min = broadcastConfig.intervalMin * 1000; // Convert to milliseconds
    const max = broadcastConfig.intervalMax * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getRandomInstance = () => {
    if (!useMultipleInstances || broadcastConfig.selectedInstances.length === 0) {
      return selectedInstance;
    }
    const randomIndex = Math.floor(Math.random() * broadcastConfig.selectedInstances.length);
    return broadcastConfig.selectedInstances[randomIndex];
  };

  const getSelectedInstancesData = () => {
    return instances.filter(instance => broadcastConfig.selectedInstances.includes(instance.id));
  };

  // Function to get enhanced instances with real-time status
  const getEnhancedInstances = () => {
    return instances.map(instance => {
      const isConnected = instance.status === 'connected';
      
      return {
        ...instance,
        isConnected
      };
    });
  };

  const enhancedInstances = getEnhancedInstances();

  const handleRefreshInstances = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-instances"] });
    toast({
      title: "Atualizando",
      description: "Status das instâncias sendo atualizado...",
    });
  };

  const handleSendBroadcast = async () => {
    // Validar instâncias
    if (!useMultipleInstances && !selectedInstance) {
      toast({
        title: "Erro",
        description: "Selecione uma instância do WhatsApp",
        variant: "destructive"
      });
      return;
    }

    if (useMultipleInstances && broadcastConfig.selectedInstances.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma instância para envio múltiplo",
        variant: "destructive"
      });
      return;
    }

    if (!selectedContactList) {
      toast({
        title: "Erro",
        description: "Selecione uma lista de contatos",
        variant: "destructive"
      });
      return;
    }

    // Validar conteúdo da mensagem
    const validMessages = getValidMessages();
    if (message.type === "text" && validMessages.length === 0) {
      toast({
        title: "Erro",
        description: useMultipleMessages ? "Digite pelo menos uma mensagem válida" : "Digite uma mensagem",
        variant: "destructive"
      });
      return;
    }

    if (message.type !== "text" && !message.content && !message.file) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem ou selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    const validContacts = getValidContactsCount();
    if (validContacts === 0) {
      toast({
        title: "Erro",
        description: "A lista selecionada não possui contatos válidos",
        variant: "destructive"
      });
      return;
    }

    // Validar agendamento se habilitado
    if (scheduleConfig.enabled) {
      if (!scheduleConfig.date || !scheduleConfig.time) {
        toast({
          title: "Erro",
          description: "Defina a data e horário para o agendamento",
          variant: "destructive"
        });
        return;
      }

      const scheduledDateTime = new Date(`${scheduleConfig.date}T${scheduleConfig.time}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        toast({
          title: "Erro",
          description: "A data e hora do agendamento deve ser no futuro",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Preparar dados do arquivo se existir
      let fileBase64 = "";
      if (message.file) {
        fileBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove o prefixo data:tipo/subtipo;base64, para ficar apenas o base64
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(message.file!);
        });
      }

      const scheduleData = {
        contactListId: selectedContactList,
        instanceIds: useMultipleInstances ? broadcastConfig.selectedInstances : [selectedInstance],
        messageType: message.type,
        messageContent: message.type === "text" && useMultipleMessages 
          ? JSON.stringify(validMessages) // Array de mensagens como JSON
          : message.content,
        messages: message.type === "text" && useMultipleMessages ? validMessages : undefined,
        useMultipleMessages: message.type === "text" ? useMultipleMessages : false,
        fileName: message.fileName,
        fileBase64,
        intervalMin: broadcastConfig.intervalMin,
        intervalMax: broadcastConfig.intervalMax,
        useMultipleInstances,
        randomizeInstances: broadcastConfig.randomizeInstances,
        totalMessages: validContacts * (message.type === "text" && useMultipleMessages ? validMessages.length : 1),
        scheduledDateTime: scheduleConfig.enabled 
          ? new Date(`${scheduleConfig.date}T${scheduleConfig.time}`).toISOString()
          : new Date().toISOString() // Enviar imediatamente se não agendado
      };

      const response = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        throw new Error("Erro ao criar agendamento");
      }

      const averageInterval = (broadcastConfig.intervalMin + broadcastConfig.intervalMax) / 2;
      const totalTime = (validContacts - 1) * averageInterval;
      const hours = Math.floor(totalTime / 3600);
      const minutes = Math.floor((totalTime % 3600) / 60);

      let timeEstimate = "";
      if (hours > 0) timeEstimate += `${hours}h `;
      if (minutes > 0) timeEstimate += `${minutes}min`;
      if (!timeEstimate) timeEstimate = "menos de 1min";

      const instancesText = useMultipleInstances 
        ? `${broadcastConfig.selectedInstances.length} instâncias (aleatório)`
        : "1 instância";

      if (scheduleConfig.enabled) {
        const scheduledDate = new Date(`${scheduleConfig.date}T${scheduleConfig.time}`);
        toast({
          title: "Agendamento criado!",
          description: `${validContacts} mensagens agendadas para ${scheduledDate.toLocaleString('pt-BR')} via ${instancesText}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Disparo iniciado!",
          description: `${validContacts} mensagens sendo enviadas via ${instancesText}. Tempo estimado: ${timeEstimate}`,
          variant: "default"
        });
      }

      // Limpar formulário
      setSelectedContactList("");
      setMessage({ type: "text", content: "", messages: [] });
      setUseMultipleMessages(false);
      setScheduleConfig({ enabled: false, date: "", time: "" });
      
    } catch (error) {
      console.error("Erro ao criar disparo:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case "text":
        return <MessageSquare className="w-4 h-4" />;
      case "audio":
        return <Mic className="w-4 h-4" />;
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
    }
  };

  const renderPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visualização da Mensagem
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-3 bg-white rounded-lg shadow-sm border max-w-sm">
          {message.type === "text" && message.content && (
            <p className="text-sm">{message.content}</p>
          )}
          
          {message.type === "audio" && message.file && (
            <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
              <Mic className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700">{message.fileName}</span>
            </div>
          )}
          
          {message.type === "image" && message.file && (
            <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
              <Image className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">{message.fileName}</span>
              {message.content && <p className="text-sm mt-2">{message.content}</p>}
            </div>
          )}
          
          {message.type === "video" && message.file && (
            <div className="flex items-center gap-2 p-2 bg-purple-100 rounded">
              <Video className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700">{message.fileName}</span>
              {message.content && <p className="text-sm mt-2">{message.content}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading || listsLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Configurar Disparo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instance Selection Mode */}
          <div>
            <Label>Modo de Envio</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="single-instance"
                  name="instance-mode"
                  checked={!useMultipleInstances}
                  onChange={() => setUseMultipleInstances(false)}
                />
                <Label htmlFor="single-instance" className="text-sm">Instância única</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="multiple-instances"
                  name="instance-mode"
                  checked={useMultipleInstances}
                  onChange={() => setUseMultipleInstances(true)}
                />
                <Label htmlFor="multiple-instances" className="text-sm">Múltiplas instâncias (aleatório)</Label>
              </div>
            </div>
          </div>

          {/* Single Instance Selection */}
          {!useMultipleInstances && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="instance">Instância WhatsApp</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshInstances}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {enhancedInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name} {instance.isConnected ? '🟢' : '🔴'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multiple Instance Selection */}
          {useMultipleInstances && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Instâncias para Envio</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshInstances}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllInstances}
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Todas conectadas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearInstances}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                {enhancedInstances.map((instance) => (
                  <div key={instance.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`instance-${instance.id}`}
                      checked={broadcastConfig.selectedInstances.includes(instance.id)}
                      onChange={() => handleInstanceToggle(instance.id)}
                      disabled={!instance.isConnected}
                    />
                    <Label 
                      htmlFor={`instance-${instance.id}`} 
                      className={`text-sm flex-1 ${!instance.isConnected ? 'text-muted-foreground' : ''}`}
                    >
                      {instance.name} {instance.isConnected ? '🟢' : '🔴'}
                    </Label>
                  </div>
                ))}
              </div>
              {broadcastConfig.selectedInstances.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {broadcastConfig.selectedInstances.length} instância(s) selecionada(s)
                </p>
              )}
            </div>
          )}

          {/* Contact List Selection */}
          <div>
            <Label htmlFor="contactList">Lista de Contatos</Label>
            <Select value={selectedContactList} onValueChange={setSelectedContactList}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma lista de contatos" />
              </SelectTrigger>
              <SelectContent>
                {contactLists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{list.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {list.contacts.filter(c => c.valid).length} contatos
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContactList && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Total: {getTotalContactsCount()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Válidos: {getValidContactsCount()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interval Configuration */}
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Intervalo entre Mensagens
            </Label>
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="intervalMin" className="text-xs">Mínimo (segundos)</Label>
                  <Input
                    id="intervalMin"
                    type="number"
                    min="1"
                    max="3600"
                    value={broadcastConfig.intervalMin}
                    onChange={(e) => setBroadcastConfig(prev => ({ 
                      ...prev, 
                      intervalMin: parseInt(e.target.value) || 60 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="intervalMax" className="text-xs">Máximo (segundos)</Label>
                  <Input
                    id="intervalMax"
                    type="number"
                    min="1"
                    max="3600"
                    value={broadcastConfig.intervalMax}
                    onChange={(e) => setBroadcastConfig(prev => ({ 
                      ...prev, 
                      intervalMax: parseInt(e.target.value) || 120 
                    }))}
                  />
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Shuffle className="w-3 h-3" />
                  <span className="font-medium">Intervalo Aleatório</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cada mensagem será enviada com um intervalo aleatório entre {broadcastConfig.intervalMin}s e {broadcastConfig.intervalMax}s para parecer mais natural
                </p>
                {broadcastConfig.intervalMax <= broadcastConfig.intervalMin && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ O intervalo máximo deve ser maior que o mínimo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agendamento
            </Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="schedule-enabled"
                  checked={scheduleConfig.enabled}
                  onChange={(e) => setScheduleConfig(prev => ({ 
                    ...prev, 
                    enabled: e.target.checked,
                    // Reset date/time when disabling
                    ...(e.target.checked ? {} : { date: "", time: "" })
                  }))}
                />
                <Label htmlFor="schedule-enabled" className="text-sm">
                  Agendar envio
                </Label>
              </div>
              
              {scheduleConfig.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule-date" className="text-xs">Data</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleConfig.date}
                      min={new Date().toISOString().split('T')[0]} // Não permite datas no passado
                      onChange={(e) => setScheduleConfig(prev => ({ 
                        ...prev, 
                        date: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-time" className="text-xs">Horário</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleConfig.time}
                      onChange={(e) => setScheduleConfig(prev => ({ 
                        ...prev, 
                        time: e.target.value 
                      }))}
                    />
                  </div>
                </div>
              )}
              
              {scheduleConfig.enabled && scheduleConfig.date && scheduleConfig.time && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-blue-900">Agendado para:</span>
                  </div>
                  <p className="text-blue-700">
                    {new Date(`${scheduleConfig.date}T${scheduleConfig.time}`).toLocaleString('pt-BR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Type Selection */}
          <div>
            <Label htmlFor="messageType">Tipo de Mensagem</Label>
            <Select 
              value={message.type} 
              onValueChange={(value: MessageType) => 
                setMessage(prev => ({ 
                  ...prev, 
                  type: value,
                  file: undefined,
                  fileName: undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mensagem de Texto
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Mensagem de Áudio
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Mensagem de Imagem
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Mensagem de Vídeo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content based on message type */}
          {message.type === "text" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Mensagem</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="multiple-messages"
                    checked={useMultipleMessages}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setUseMultipleMessages(enabled);
                      if (enabled) {
                        // Inicializar com uma mensagem baseada no conteúdo atual
                        const initialMessage = message.content.trim() || "";
                        setMessage(prev => ({ 
                          ...prev, 
                          messages: initialMessage ? [initialMessage] : [""] 
                        }));
                      } else {
                        // Volta para mensagem única
                        const firstMessage = message.messages?.[0] || "";
                        setMessage(prev => ({ 
                          ...prev, 
                          content: firstMessage,
                          messages: []
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="multiple-messages" className="text-sm">
                    Múltiplas mensagens
                  </Label>
                </div>
              </div>

              {!useMultipleMessages ? (
                <Textarea
                  id="message"
                  placeholder="Digite sua mensagem aqui..."
                  value={message.content}
                  onChange={(e) => setMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              ) : (
                <div className="space-y-3">
                  {message.messages?.map((msg, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Textarea
                        placeholder={`Mensagem ${index + 1}...`}
                        value={msg}
                        onChange={(e) => updateMessage(index, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      {message.messages!.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMessage(index)}
                          className="shrink-0 mt-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMessage}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Adicionar Mensagem
                  </Button>
                  
                  {message.messages && message.messages.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                      <p className="font-medium text-blue-900 mb-1">
                        📝 {getValidMessages().length} mensagem(s) válida(s)
                      </p>
                      <p className="text-blue-700 text-xs">
                        As mensagens serão enviadas separadamente, uma após a outra, respeitando o intervalo configurado.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(message.type === "audio" || message.type === "image" || message.type === "video") && (
            <>
              <div>
                <Label htmlFor="file">Arquivo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept={
                      message.type === "audio" ? "audio/*" :
                      message.type === "image" ? "image/*" :
                      "video/*"
                    }
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="w-4 h-4" />
                    </label>
                  </Button>
                </div>
                {message.fileName && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-muted rounded">
                    <span className="text-sm">{message.fileName}</span>
                    <Button variant="ghost" size="sm" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {(message.type === "image" || message.type === "video") && (
                <div>
                  <Label htmlFor="caption">Legenda (opcional)</Label>
                  <Textarea
                    id="caption"
                    placeholder="Digite uma legenda para sua mídia..."
                    value={message.content}
                    onChange={(e) => setMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Ocultar" : "Visualizar"}
            </Button>
            <Button 
              onClick={handleSendBroadcast}
              className={`flex-1 ${scheduleConfig.enabled 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {scheduleConfig.enabled ? (
                <Calendar className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {scheduleConfig.enabled ? "Agendar Disparo" : "Enviar Disparo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            <div className="space-y-4">
              {/* Broadcast Configuration Info */}
              {(selectedContactList && (selectedInstance || broadcastConfig.selectedInstances.length > 0)) && (
                <div className="space-y-3">
                  {/* Contact List Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <List className="w-4 h-4 text-blue-600" />
                      Lista Selecionada
                    </h4>
                    <div className="space-y-1 text-xs">
                      <p><strong>Nome:</strong> {getSelectedContactList()?.name}</p>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Total: {getTotalContactsCount()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Válidos: {getValidContactsCount()}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium">
                        {getValidContactsCount()} mensagens serão enviadas
                      </p>
                    </div>
                  </div>

                  {/* Instance Configuration */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      Configuração de Envio
                    </h4>
                    <div className="space-y-1 text-xs">
                      {useMultipleInstances ? (
                        <>
                          <p><strong>Modo:</strong> Múltiplas instâncias (aleatório)</p>
                          <p><strong>Instâncias:</strong> {broadcastConfig.selectedInstances.length} selecionadas</p>
                          <div className="max-h-16 overflow-y-auto">
                            {getSelectedInstancesData().map((instance, index) => (
                              <p key={instance.id} className="text-green-700">
                                • {instance.name}
                              </p>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p><strong>Modo:</strong> Instância única</p>
                          <p><strong>Instância:</strong> {enhancedInstances.find(i => i.id === selectedInstance)?.name}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timing Configuration */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Configuração de Timing
                    </h4>
                    <div className="space-y-1 text-xs">
                      <p><strong>Intervalo:</strong> {broadcastConfig.intervalMin}s a {broadcastConfig.intervalMax}s (aleatório)</p>
                      {getValidContactsCount() > 0 && (() => {
                        const averageInterval = (broadcastConfig.intervalMin + broadcastConfig.intervalMax) / 2;
                        const totalTime = (getValidContactsCount() - 1) * averageInterval;
                        const hours = Math.floor(totalTime / 3600);
                        const minutes = Math.floor((totalTime % 3600) / 60);
                        let timeEstimate = "";
                        if (hours > 0) timeEstimate += `${hours}h `;
                        if (minutes > 0) timeEstimate += `${minutes}min`;
                        if (!timeEstimate) timeEstimate = "menos de 1min";
                        
                        return (
                          <p className="text-orange-600 font-medium">
                            Tempo estimado: {timeEstimate}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message Preview */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  {getMessageTypeIcon(message.type)}
                  Tipo: {
                    message.type === "text" ? "Texto" :
                    message.type === "audio" ? "Áudio" :
                    message.type === "image" ? "Imagem" : "Vídeo"
                  }
                </h4>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border max-w-sm">
                  {message.type === "text" && (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content || "Digite uma mensagem..."}
                    </p>
                  )}
                  
                  {message.type === "audio" && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
                      <Mic className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-green-700 font-medium">
                          {message.fileName || "Nenhum arquivo selecionado"}
                        </p>
                        <p className="text-xs text-green-600">Mensagem de áudio</p>
                      </div>
                    </div>
                  )}
                  
                  {message.type === "image" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                        <Image className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700 font-medium">
                            {message.fileName || "Nenhuma imagem selecionada"}
                          </p>
                          <p className="text-xs text-blue-600">Imagem</p>
                        </div>
                      </div>
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  )}
                  
                  {message.type === "video" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded">
                        <Video className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-purple-700 font-medium">
                            {message.fileName || "Nenhum vídeo selecionado"}
                          </p>
                          <p className="text-xs text-purple-600">Vídeo</p>
                        </div>
                      </div>
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Esta é uma visualização de como sua mensagem aparecerá no WhatsApp</p>
                <p>• A formatação pode variar dependendo do dispositivo do destinatário</p>
                {selectedContactList && (
                  <p>• Será enviada para {getValidContactsCount()} contatos válidos</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              {selectedContactList ? (
                <div className="space-y-3">
                  <List className="w-12 h-12 mx-auto text-blue-600" />
                  <div>
                    <p className="font-medium">{getSelectedContactList()?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getValidContactsCount()} contatos válidos selecionados
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Visualizar" para ver como sua mensagem ficará
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione uma lista de contatos e clique em "Visualizar"
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}