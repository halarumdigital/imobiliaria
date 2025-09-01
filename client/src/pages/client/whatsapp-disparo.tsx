import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WhatsappInstance } from "@/types";
import { Send, MessageSquare, Mic, Image, Video, Eye, Upload, X } from "lucide-react";

type MessageType = "text" | "audio" | "image" | "video";

interface BroadcastMessage {
  type: MessageType;
  content: string;
  file?: File;
  fileName?: string;
}

export default function WhatsAppDisparo() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [message, setMessage] = useState<BroadcastMessage>({
    type: "text",
    content: ""
  });
  const [showPreview, setShowPreview] = useState(false);

  const { data: instances = [], isLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/whatsapp-instances"],
  });

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

  const handleSendBroadcast = async () => {
    if (!selectedInstance) {
      toast({
        title: "Erro",
        description: "Selecione uma instância do WhatsApp",
        variant: "destructive"
      });
      return;
    }

    if (!message.content && !message.file) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem ou selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement broadcast sending logic
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de disparo será implementada em breve",
      variant: "default"
    });
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

  if (isLoading) {
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
          {/* Instance Selection */}
          <div>
            <Label htmlFor="instance">Instância WhatsApp</Label>
            <Select value={selectedInstance} onValueChange={setSelectedInstance}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
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
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={message.content}
                onChange={(e) => setMessage(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
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
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Disparo
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

              <div className="text-xs text-muted-foreground">
                <p>• Esta é uma visualização de como sua mensagem aparecerá no WhatsApp</p>
                <p>• A formatação pode variar dependendo do dispositivo do destinatário</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Clique em "Visualizar" para ver como sua mensagem ficará
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}