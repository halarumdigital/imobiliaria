import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WhatsappInstance } from "@/types";
import { MessageCircle, Bot, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Component for Agent Usage History
function AgentUsageHistory() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");

  const { data: instances = [] } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
  });

  const { data: usageStats = [] } = useQuery({
    queryKey: ["/api/agents/usage-stats"],
    select: (data: any[]) => data.sort((a, b) => b.messageCount - a.messageCount)
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: [`/api/conversations/by-instance/${selectedInstanceId}`],
    enabled: !!selectedInstanceId,
  });

  const { data: messagesWithAgents = [] } = useQuery<any[]>({
    queryKey: [`/api/conversations/${selectedConversationId}/messages-with-agents`],
    enabled: !!selectedConversationId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">📊 Estatísticas de Uso dos Agentes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Veja qual agente (principal ou secundário) foi usado em cada conversa
        </p>
        
        {usageStats.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {usageStats.map((stat: any, index: number) => (
              <Card key={stat.agentId} className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.agentType === 'secondary' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {stat.agentType === 'secondary' ? 
                      <Bot className="text-blue-600 dark:text-blue-400" /> : 
                      <Bot className="text-purple-600 dark:text-purple-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {stat.agentName}
                      <Badge variant={stat.agentType === 'secondary' ? "default" : "secondary"} className={
                        stat.agentType === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }>
                        {stat.agentType === 'secondary' ? 'Secundário' : 'Principal'}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.messageCount} mensagens
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Última atividade:</span>
                    <span>
                      {stat.lastUsed && stat.lastUsed !== 'N/A' ? 
                        (() => {
                          try {
                            const date = new Date(stat.lastUsed);
                            return isNaN(date.getTime()) ? 'N/A' : format(date, "dd/MM HH:mm", { locale: ptBR });
                          } catch {
                            return 'N/A';
                          }
                        })() : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instance Selector & Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Selecionar Conversa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Instância do WhatsApp</label>
              <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
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
                <label className="text-sm font-medium mb-2 block">Conversas</label>
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {conversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedConversationId === conversation.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium">Conversa com {conversation.contactPhone}</p>
                            <p className="text-xs text-muted-foreground">
                              Clique para ver o histórico
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages with Agent Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedConversationId ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Selecione uma conversa para ver o histórico</p>
              </div>
            ) : messagesWithAgents.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messagesWithAgents.map((message: any) => (
                  <div key={message.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          message.sender === 'user' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium">
                          {message.sender === 'user' ? 'Cliente' : 'Agente'}
                        </span>
                        {message.sender !== 'user' && message.agentName && (
                          <Badge variant={message.agentType === 'secondary' ? "default" : "secondary"} className={`text-xs ${
                            message.agentType === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {message.agentName} ({message.agentType === 'secondary' ? 'Sec.' : 'Prin.'})
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(message.createdAt);
                            return isNaN(date.getTime()) ? '--:--' : format(date, "HH:mm", { locale: ptBR });
                          } catch {
                            return '--:--';
                          }
                        })()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
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
      <AgentUsageHistory />
    </div>
  );
}
