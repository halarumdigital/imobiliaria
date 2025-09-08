import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, MessageCircle, Phone, Send } from "lucide-react";

interface TestMessageRequest {
  instanceId: string;
  phone: string;
  message: string;
}

export default function TestAI() {
  const [formData, setFormData] = useState<TestMessageRequest>({
    instanceId: "",
    phone: "",
    message: ""
  });
  const [response, setResponse] = useState<string>("");
  const { toast } = useToast();

  // Buscar instâncias WhatsApp
  const { data: instances = [] } = useQuery({
    queryKey: ["/api/whatsapp-instances"],
  });

  const testMutation = useMutation({
    mutationFn: async (data: TestMessageRequest) => {
      const response = await fetch("/api/test-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Mensagem de teste enviada com sucesso!",
      });
      setResponse(JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar mensagem de teste",
        variant: "destructive",
      });
      setResponse(error instanceof Error ? error.message : "Erro desconhecido");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instanceId || !formData.phone || !formData.message) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    testMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Bot className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Teste de Agentes IA</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Simular Mensagem WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Teste o sistema de resposta automática dos seus agentes IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance">Instância WhatsApp</Label>
                <Select
                  value={formData.instanceId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, instanceId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {(instances as any[])
                      .filter((instance: any) => instance.aiAgentId)
                      .map((instance: any) => (
                        <SelectItem key={instance.id} value={instance.evolutionInstanceId}>
                          📱 {instance.name} (ID: {instance.evolutionInstanceId})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {(instances as any[]).filter((instance: any) => instance.aiAgentId).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma instância com agente vinculado encontrada
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número do Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="5511999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite apenas números (DDI + DDD + número)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Olá! Preciso de ajuda com um imóvel..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  data-testid="textarea-message"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={testMutation.isPending}
                data-testid="button-send-test"
              >
                <Send className="w-4 h-4 mr-2" />
                {testMutation.isPending ? "Enviando..." : "Enviar Teste"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resposta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Resposta do Sistema</span>
            </CardTitle>
            <CardDescription>
              Veja como o agente IA responde à mensagem de teste
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Resultado:</h4>
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {response}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Envie uma mensagem de teste para ver a resposta do agente IA
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <h4 className="font-medium">Selecione uma Instância</h4>
              <p className="text-sm text-muted-foreground">Escolha uma instância WhatsApp que tenha um agente IA vinculado</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <h4 className="font-medium">Digite um Número</h4>
              <p className="text-sm text-muted-foreground">Simule o número de telefone de quem está enviando a mensagem</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <h4 className="font-medium">Escreva a Mensagem</h4>
              <p className="text-sm text-muted-foreground">Digite a mensagem que deseja testar com o agente IA</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <h4 className="font-medium">Veja a Resposta</h4>
              <p className="text-sm text-muted-foreground">O sistema processará a mensagem e mostrará como o agente responderia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}