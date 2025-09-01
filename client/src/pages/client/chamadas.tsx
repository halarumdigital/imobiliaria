import { PhoneCall, Plus, Clock, CheckCircle, XCircle, Play, Users, TrendingUp, Calendar, User, Bot, AlertCircle, Search, Filter, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CallForm } from "@/components/forms/call-form";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useContactLists, ContactList as RealContactList, ContactListContact } from "@/hooks/use-contact-lists";
import { useCampaigns, useCalls, useCreateCampaign, CallCampaign as RealCallCampaign, Call as RealCall } from "@/hooks/use-campaigns";

// Using imported interfaces from hooks
type CallCampaign = RealCallCampaign;
type Call = RealCall;

export function ChamadasPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "calls" | "create">("campaigns");
  const [selectedContactList, setSelectedContactList] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Get real contact lists from WhatsApp lists
  const { data: contactLists = [], isLoading: contactListsLoading, error: contactListsError } = useContactLists();
  
  // Get real campaigns and calls data
  const { data: campaigns = [], isLoading: campaignLoading, error: campaignError } = useCampaigns();
  const { data: allCalls = [], isLoading: callsLoading } = useCalls(selectedCampaign !== 'all' ? selectedCampaign : undefined);
  const createCampaignMutation = useCreateCampaign();

  // Reset pagination when campaign filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampaign]);

  const getCampaignStatusBadge = (status: CallCampaign["status"]) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Rascunho", icon: Clock },
      running: { variant: "default" as const, label: "Em Execução", icon: Play },
      completed: { variant: "outline" as const, label: "Concluída", icon: CheckCircle },
      paused: { variant: "secondary" as const, label: "Pausada", icon: XCircle },
      failed: { variant: "destructive" as const, label: "Falhou", icon: AlertCircle }
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

  const getCallStatusBadge = (status: Call["status"]) => {
    const statusConfig = {
      queued: { variant: "secondary" as const, label: "Na Fila", icon: Clock },
      ringing: { variant: "default" as const, label: "Chamando", icon: PhoneCall },
      "in-progress": { variant: "default" as const, label: "Em Andamento", icon: Play },
      completed: { variant: "outline" as const, label: "Atendida", icon: CheckCircle },
      "no-answer": { variant: "secondary" as const, label: "Não Atendeu", icon: XCircle },
      failed: { variant: "destructive" as const, label: "Falhou", icon: AlertCircle }
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnswerRate = (campaign: CallCampaign) => {
    if (campaign.completedCalls === 0) return 0;
    return Math.round((campaign.answeredCalls / campaign.completedCalls) * 100);
  };

  const getProgressPercentage = (campaign: CallCampaign) => {
    if (campaign.totalContacts === 0) return 0;
    return Math.round((campaign.completedCalls / campaign.totalContacts) * 100);
  };

  // Statistics
  const totalCampaigns = campaigns.length;
  const totalCalls = campaigns.reduce((sum, c) => sum + c.completedCalls, 0);
  const totalAnswered = campaigns.reduce((sum, c) => sum + c.answeredCalls, 0);
  const totalContacts = campaigns.reduce((sum, c) => sum + c.totalContacts, 0);
  const overallAnswerRate = totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PhoneCall className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campanhas de Chamadas</h1>
            <p className="text-muted-foreground">
              Gerencie suas campanhas de chamadas automáticas com listas de contatos
            </p>
          </div>
        </div>
        
        {activeTab !== "create" && (
          <Button onClick={() => setActiveTab("create")}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "campaigns" | "calls" | "create")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="campaigns" 
            className="flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Campanhas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calls"
            className="flex items-center space-x-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Chamadas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Nova Campanha de Chamadas</CardTitle>
              <CardDescription>
                Crie uma campanha para fazer chamadas automáticas para uma lista de contatos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Nome da Campanha</Label>
                  <Input id="campaignName" placeholder="Ex: Vendas Q1 2024" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactListSelect">Lista de Contatos</Label>
                  <Select value={selectedContactList} onValueChange={setSelectedContactList}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactListsLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                            <span>Carregando listas...</span>
                          </div>
                        </SelectItem>
                      ) : contactLists.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Nenhuma lista encontrada</span>
                          </div>
                        </SelectItem>
                      ) : (
                        contactLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{list.name}</span>
                              <Badge variant="secondary">{list.contacts.filter(c => c.valid).length} contatos válidos</Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedContactList && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Contatos Selecionados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const selectedList = contactLists.find(l => l.id === selectedContactList);
                      if (!selectedList) return null;

                      const validContacts = selectedList.contacts.filter(c => c.valid);
                      const invalidContacts = selectedList.contacts.filter(c => !c.valid);
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {selectedList.name}
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant="default">{validContacts.length} válidos</Badge>
                              {invalidContacts.length > 0 && (
                                <Badge variant="secondary">{invalidContacts.length} inválidos</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-green-700">Contatos Válidos (serão chamados):</div>
                            <div className="grid grid-cols-1 gap-2">
                              {validContacts.slice(0, 4).map((contact, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm bg-green-50 p-2 rounded">
                                  <User className="w-3 h-3 text-green-600" />
                                  <span>{contact.name}</span>
                                  <span className="text-muted-foreground">{contact.phone}</span>
                                </div>
                              ))}
                              {validContacts.length > 4 && (
                                <div className="text-sm text-muted-foreground">
                                  +{validContacts.length - 4} mais contatos válidos...
                                </div>
                              )}
                            </div>
                          </div>

                          {invalidContacts.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-orange-700">Contatos com Problemas (serão ignorados):</div>
                              <div className="grid grid-cols-1 gap-2">
                                {invalidContacts.slice(0, 2).map((contact, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm bg-orange-50 p-2 rounded">
                                    <AlertCircle className="w-3 h-3 text-orange-600" />
                                    <span>{contact.name}</span>
                                    <span className="text-muted-foreground">{contact.phone}</span>
                                    <span className="text-xs text-orange-600">({contact.error})</span>
                                  </div>
                                ))}
                                {invalidContacts.length > 2 && (
                                  <div className="text-sm text-muted-foreground">
                                    +{invalidContacts.length - 2} mais contatos com problemas...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <CallForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalCampaigns}</div>
                    <div className="text-sm text-muted-foreground">Total Campanhas</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalCalls}</div>
                    <div className="text-sm text-muted-foreground">Chamadas Realizadas</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{totalAnswered}</div>
                    <div className="text-sm text-muted-foreground">Chamadas Atendidas</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{overallAnswerRate}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Atendimento</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaigns List */}
            {campaignLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="ml-2">Carregando campanhas...</span>
                </CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PhoneCall className="w-16 h-16 text-muted-foreground mb-4" />
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Nenhuma campanha criada</h3>
                    <p className="text-muted-foreground max-w-md">
                      Crie sua primeira campanha de chamadas automáticas usando as listas de contatos do WhatsApp.
                    </p>
                    <div className="pt-4">
                      <Button onClick={() => setActiveTab("create")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeira Campanha
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>{campaign.name}</span>
                          {getCampaignStatusBadge(campaign.status)}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {campaign.startedAt && formatDateTime(new Date(campaign.startedAt))}
                        </div>
                      </div>
                      <CardDescription className="flex items-center justify-between">
                        <span>
                          <Users className="w-4 h-4 inline mr-1" />
                          {campaign.contactListName} • 
                          <Bot className="w-4 h-4 inline mx-1" />
                          {campaign.assistantName}
                        </span>
                        <span className="text-sm">
                          Número: {campaign.phoneNumber}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso da Campanha</span>
                            <span>{campaign.completedCalls}/{campaign.totalContacts}</span>
                          </div>
                          <Progress value={getProgressPercentage(campaign)} />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{campaign.totalContacts}</div>
                            <div className="text-xs text-muted-foreground">Total Contatos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{campaign.completedCalls}</div>
                            <div className="text-xs text-muted-foreground">Chamadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{campaign.answeredCalls}</div>
                            <div className="text-xs text-muted-foreground">Atendidas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">{campaign.notAnsweredCalls}</div>
                            <div className="text-xs text-muted-foreground">Não Atendeu</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{getAnswerRate(campaign)}%</div>
                            <div className="text-xs text-muted-foreground">Taxa Resposta</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedCampaign(campaign.id);
                            setActiveTab("calls");
                          }}>
                            <Search className="w-4 h-4 mr-1" />
                            Ver Chamadas
                          </Button>
                          {campaign.status === "running" && (
                            <Button variant="outline" size="sm">
                              <XCircle className="w-4 h-4 mr-1" />
                              Pausar
                            </Button>
                          )}
                          {campaign.status === "paused" && (
                            <Button variant="outline" size="sm">
                              <Play className="w-4 h-4 mr-1" />
                              Retomar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <div className="space-y-4">
            {/* Campaign Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrar Chamadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="campaignFilter">Campanha</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as campanhas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as campanhas</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Calls List */}
            <div className="space-y-4">
              {(() => {
                const filteredCalls = allCalls;

                // Pagination logic
                const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedCalls = filteredCalls.slice(startIndex, endIndex);

                // Reset page when campaign changes
                if (currentPage > totalPages && totalPages > 0) {
                  setCurrentPage(1);
                }

                if (callsLoading) {
                  return (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="ml-2">Carregando chamadas...</span>
                      </CardContent>
                    </Card>
                  );
                }

                return filteredCalls.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <PhoneCall className="w-16 h-16 text-muted-foreground mb-4" />
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">Nenhuma chamada encontrada</h3>
                        <p className="text-muted-foreground max-w-md">
                          {selectedCampaign && selectedCampaign !== "all" ? "Esta campanha ainda não possui chamadas." : "Não há chamadas registradas no momento."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Pagination Info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCalls.length)} de {filteredCalls.length} chamadas
                      </span>
                      <span>Página {currentPage} de {totalPages}</span>
                    </div>

                    {/* Calls */}
                    <div className="space-y-4">
                      {paginatedCalls.map((call) => {
                        const campaign = campaigns.find(c => c.id === call.campaignId);
                        return (
                          <Card key={call.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                              <User className="w-5 h-5" />
                              <span>{call.contactName}</span>
                              {getCallStatusBadge(call.status)}
                              {call.analysis?.successEvaluation && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ Sucesso
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {call.startedAt && formatDateTime(new Date(call.startedAt))}
                            </div>
                          </div>
                          <CardDescription>
                            {call.customerNumber} • {campaigns.find(c => c.id === call.campaignId)?.name} • {call.assistantName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Informações da Chamada</h4>
                                <div className="text-sm space-y-1">
                                  <div>Duração: {call.duration ? formatDuration(call.duration) : "N/A"}</div>
                                  <div>Status: {call.endReason || "Em andamento"}</div>
                                  {call.endedAt && (
                                    <div>Finalizada: {formatDateTime(new Date(call.endedAt))}</div>
                                  )}
                                </div>
                              </div>

                              {call.analysis && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Análise da Chamada</h4>
                                  <div className="text-sm">
                                    <p className="text-muted-foreground">{call.analysis.summary}</p>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Ações</h4>
                                <div className="flex flex-wrap gap-2">
                                  {call.recordingUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(call.recordingUrl, '_blank')}
                                    >
                                      <Play className="w-4 h-4 mr-1" />
                                      Gravação
                                    </Button>
                                  )}
                                  {call.transcript && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const element = document.createElement("a");
                                        const file = new Blob([call.transcript!], {type: 'text/plain'});
                                        element.href = URL.createObjectURL(file);
                                        element.download = `transcricao-${call.contactName}-${call.id}.txt`;
                                        document.body.appendChild(element);
                                        element.click();
                                        document.body.removeChild(element);
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Baixar Transcrição
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm">
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Transcript Section */}
                            {call.transcript && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4" />
                                  <h4 className="font-medium text-sm">Transcrição da Chamada</h4>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">
                                    {call.transcript}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>

                        <div className="flex space-x-1">
                          {Array.from({ length: totalPages }, (_, index) => {
                            const page = index + 1;
                            const isCurrentPage = page === currentPage;
                            const shouldShow = 
                              page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1;

                            if (!shouldShow) {
                              if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <span key={page} className="px-3 py-1 text-muted-foreground">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                variant={isCurrentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-10"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}