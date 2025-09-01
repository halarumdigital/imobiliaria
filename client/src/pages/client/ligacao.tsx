import { Phone, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssistantForm } from "@/components/forms/assistant-form";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CallAgent } from "@/types";

export function LigacaoPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CallAgent | null>(null);
  const queryClient = useQueryClient();
  
  // Load real call agents from API
  const { data: assistants = [], isLoading: assistantsLoading, refetch: refetchAssistants } = useQuery<CallAgent[]>({
    queryKey: ["/api/call-agents"],
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await fetch(`/api/call-agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao deletar assistente');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-agents"] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Phone className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assistentes de Voz</h1>
            <p className="text-muted-foreground">
              Crie e gerencie seus assistentes de voz usando Vapi.ai
            </p>
          </div>
        </div>
        
        {!showCreateForm && !editingAgent && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Assistente
          </Button>
        )}
      </div>

      {/* Create/Edit Assistant Form */}
      {(showCreateForm || editingAgent) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingAgent ? 'Editar Assistente' : 'Criar Novo Assistente'}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAgent(null);
                }}
              >
                Voltar à Lista
              </Button>
            </CardTitle>
            <CardDescription>
              Configure seu assistente de voz com integração OpenAI e ElevenLabs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssistantForm 
              initialData={editingAgent || undefined}
              onSuccess={() => {
                refetchAssistants();
                setShowCreateForm(false);
                setEditingAgent(null);
              }} 
            />
          </CardContent>
        </Card>
      )}

      {/* Assistants List */}
      {!showCreateForm && !editingAgent && (
        <div className="space-y-4">
          {assistantsLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
                <p className="text-muted-foreground">Carregando assistentes...</p>
              </CardContent>
            </Card>
          ) : assistants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Phone className="w-16 h-16 text-muted-foreground mb-4" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Nenhum assistente criado</h3>
                  <p className="text-muted-foreground max-w-md">
                    Comece criando seu primeiro assistente de voz com integração 
                    OpenAI para processamento de linguagem e ElevenLabs para síntese de voz.
                  </p>
                  <div className="pt-4">
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Assistente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assistants.map((assistant) => (
                <Card key={assistant.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="w-5 h-5" />
                      <span>{assistant.name}</span>
                    </CardTitle>
                    <CardDescription>
                      Modelo: {assistant.model} • Tokens: {assistant.maxTokens}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {assistant.systemMessage || assistant.firstMessage}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Temp: {assistant.temperature}</span>
                        <span>Voz: {assistant.voiceModel}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          assistant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assistant.status}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAgent(assistant)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar este assistente?')) {
                              deleteAgentMutation.mutate(assistant.id);
                            }
                          }}
                          className="flex-1"
                          disabled={deleteAgentMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}