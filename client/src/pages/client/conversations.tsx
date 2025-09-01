import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsappInstance } from "@/types";
import { MessageCircle, Bot, BarChart3, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to format contact display name
function formatContactName(chat: any): string {
  // Priority: pushName > name > formatted phone number
  if (chat.pushName) return chat.pushName;
  if (chat.name) return chat.name;
  
  // Extract phone number from remoteJid (remove @s.whatsapp.net or @g.us)
  if (chat.remoteJid) {
    const phoneNumber = chat.remoteJid.replace(/@[sg]\.(?:whatsapp\.net|us)$/i, '');
    // Format Brazilian phone numbers
    if (phoneNumber.startsWith('55')) {
      const cleaned = phoneNumber.substring(2);
      if (cleaned.length === 11) {
        return `+55 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
      }
    }
    return phoneNumber;
  }
  
  return 'Contato Desconhecido';
}

// Component for Real-time Conversations
function RealTimeConversations() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { data: instances = [] } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
  });

  // Get selected instance details
  const selectedInstance = instances.find(inst => inst.id === selectedInstanceId);
  
  // Fetch conversations from Evolution API - using instanceId (not evolutionInstanceId) for the API route
  const { data: evolutionChatsRaw, isLoading: chatsLoading, error: chatsError, refetch: refetchChats } = useQuery<any>({
    queryKey: [`/api/conversations/evolution/${selectedInstanceId}`],
    enabled: !!selectedInstanceId,
    retry: 2,
  });

  // Ensure evolutionChats is always an array
  const evolutionChats = Array.isArray(evolutionChatsRaw) ? evolutionChatsRaw : [];

  // Fetch messages from specific chat - using instanceId for the API route
  const { data: chatMessagesRaw, isLoading: messagesLoading, refetch: refetchMessages } = useQuery<any>({
    queryKey: [`/api/conversations/evolution/${selectedInstanceId}/${selectedChatId}/messages`],
    enabled: !!selectedInstanceId && !!selectedChatId,
  });

  // Ensure chatMessages is always an array
  const chatMessages = Array.isArray(chatMessagesRaw) ? chatMessagesRaw : [];

  // Refresh function with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh chats
      await refetchChats();
      
      // If a chat is selected, refresh its messages too
      if (selectedChatId) {
        await refetchMessages();
      }
      
      // Optional: Show success feedback
      console.log("✅ Conversas atualizadas com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao atualizar conversas:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversas da Evolution API
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || !selectedInstanceId}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instance Selector & Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Selecionar Conversa
              {(chatsLoading || isRefreshing) && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Instância do WhatsApp</label>
              <Select value={selectedInstanceId} onValueChange={(value) => {
                setSelectedInstanceId(value);
                setSelectedChatId(""); // Reset chat selection
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância..." />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedInstanceId && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Conversas da Evolution API {chatsLoading && "(Carregando...)"}
                </label>
                {chatsError ? (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm text-red-800 font-medium">Erro ao carregar conversas:</p>
                    <p className="text-sm text-red-600 mt-1">
                      {chatsError?.message || "Erro desconhecido"}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => refetchChats()}
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                ) : evolutionChats.length === 0 && !chatsLoading ? (
                  <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
                ) : (
                  <div className={`space-y-2 max-h-60 overflow-y-auto ${isRefreshing ? 'opacity-60' : ''}`}>
                    {evolutionChats.map((chat: any) => (
                      <div
                        key={chat.id || chat.remoteJid}
                        onClick={() => setSelectedChatId(chat.remoteJid || chat.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedChatId === (chat.remoteJid || chat.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {formatContactName(chat)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {chat.lastMessage?.text || "Clique para ver mensagens"}
                            </p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages from Evolution API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mensagens da Conversa
              {(messagesLoading || (isRefreshing && selectedChatId)) && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedChatId ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Selecione uma conversa para ver as mensagens</p>
              </div>
            ) : chatMessages.length === 0 && !messagesLoading ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              <div className={`space-y-3 max-h-96 overflow-y-auto ${isRefreshing && selectedChatId ? 'opacity-60' : ''}`}>
                {chatMessages.map((message: any, index: number) => (
                  <div key={message.id || index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          message.fromMe ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-medium">
                          {message.fromMe ? 'Bot/Agente' : 'Cliente'}
                        </span>
                        {message.fromMe && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            Evolution API
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const timestamp = message.messageTimestamp || message.timestamp;
                            if (!timestamp) return '--:--';
                            const date = new Date(timestamp * 1000); // Evolution API uses Unix timestamp
                            return isNaN(date.getTime()) ? '--:--' : format(date, "HH:mm dd/MM", { locale: ptBR });
                          } catch {
                            return '--:--';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {/* Handle different message types */}
                      {message.message?.imageMessage && (
                        <div className="space-y-1">
                          <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground ml-2">Imagem</p>
                          </div>
                          {message.message.imageMessage.caption && (
                            <p className="text-xs text-muted-foreground italic">
                              Legenda: {message.message.imageMessage.caption}
                            </p>
                          )}
                        </div>
                      )}
                      {message.message?.audioMessage && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-sm">Mensagem de áudio</span>
                        </div>
                      )}
                      {message.message?.conversation && (
                        <p className="text-sm">{message.message.conversation}</p>
                      )}
                      {message.message?.extendedTextMessage?.text && (
                        <p className="text-sm">{message.message.extendedTextMessage.text}</p>
                      )}
                      {/* Fallback for text content */}
                      {!message.message?.conversation && 
                       !message.message?.extendedTextMessage?.text && 
                       !message.message?.imageMessage && 
                       !message.message?.audioMessage && 
                       message.text && (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Conversations() {
  return (
    <div className="space-y-6">
      <RealTimeConversations />
    </div>
  );
}
