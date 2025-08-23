import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { getStorage } from "../storage";
import { AiResponseService, AiResponseRequest } from "../aiResponseService";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface MessageContext {
  phone: string;
  message: string;
  instanceId: string;
  companyId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mediaUrl?: string;
  mediaBase64?: string;
  caption?: string;
  mimeType?: string;
  messageType?: string;
}

export interface AgentResponse {
  response: string;
  shouldDelegate?: boolean;
  delegatedAgentId?: string;
  activeAgentId?: string;
  activeAgentName?: string;
  activeAgentType?: string;
}

export class AIService {
  async processMessage(context: MessageContext): Promise<AgentResponse | null> {
    try {
      console.log(`🚀 [MAIN] AIService.processMessage called for instance: ${context.instanceId}`);
      console.log(`🚀 [MAIN] Context:`, { phone: context.phone, message: context.message.substring(0, 50) + '...' });
      const storage = getStorage();
      
      // Buscar todas as instâncias para encontrar a correta por evolutionInstanceId
      let instance = null;
      
      // Como não temos método direto, vamos buscar em todas as empresas
      const companies = await storage.getAllCompanies();
      console.log(`🔍 Found ${companies.length} companies to search`);
      
      for (const company of companies) {
        const instances = await storage.getWhatsappInstancesByCompany(company.id);
        console.log(`🏢 Company ${company.name} has ${instances.length} instances`);
        
        // Debug: Mostrar todas as instâncias
        instances.forEach(i => {
          console.log(`🔍 Instance details: name=${i.name}, evolutionId=${i.evolutionInstanceId}, agentId=${i.aiAgentId}`);
        });
        
        // Buscar por evolutionInstanceId OU por nome (fallback)
        let found = instances.find(i => i.evolutionInstanceId === context.instanceId);
        
        // Se não encontrou por evolutionInstanceId, usar FALLBACK UNIVERSAL
        if (!found) {
          console.log(`🔄 FALLBACK ATIVADO: Não encontrou ${context.instanceId}, tentando fallback...`);
          
          // Para o ID específico do webhook, mapear para deploy2
          if (context.instanceId === "e5b71c35-276b-417e-a1c3-267f904b2b98") {
            found = instances.find(i => i.name === "deploy2");
            console.log(`🎯 FALLBACK ESPECÍFICO: Mapeando ${context.instanceId} -> deploy2`);
          }
          
          // Se ainda não encontrou, pegar a primeira instância com agente vinculado
          if (!found) {
            found = instances.find(i => i.aiAgentId);
            console.log(`🆘 FALLBACK GENÉRICO: Usando primeira instância com agente: ${found?.name}`);
          }
        }
        
        if (found) {
          instance = found;
          console.log(`✅ Found matching instance: ${found.name}, Agent ID: ${found.aiAgentId}`);
          break;
        } else {
          console.log(`❌ No instance found with evolutionInstanceId: ${context.instanceId}`);
        }
      }
      
      if (!instance || !instance.aiAgentId) {
        console.log(`❌ No agent linked to instance ${context.instanceId}. Instance found: ${!!instance}, Agent ID: ${instance?.aiAgentId}`);
        return null;
      }

      // Buscar o agente principal
      console.log(`🔍 Looking for agent with ID: ${instance.aiAgentId}`);
      const mainAgent = await storage.getAiAgent(instance.aiAgentId);
      if (!mainAgent) {
        console.log(`❌ Agent ${instance.aiAgentId} not found`);
        return null;
      }
      console.log(`✅ Agent found: ${mainAgent.name}`);

      // Verificar se deve delegar para um agente secundário
      console.log(`🔍 Verificando delegação para agente principal: ${mainAgent.name}`);
      const delegatedAgent = await this.checkDelegation(mainAgent, context.message);
      const activeAgent = delegatedAgent || mainAgent;
      
      if (delegatedAgent) {
        console.log(`🔄 DELEGAÇÃO ATIVADA! Mudando de "${mainAgent.name}" para "${delegatedAgent.name}"`);
      } else {
        console.log(`📋 Sem delegação. Usando agente principal: ${mainAgent.name}`);
      }

      // Buscar configuração global de IA (nível administrador)
      const aiConfig = await storage.getAiConfiguration();
      console.log(`🔍 DEBUG: AI Config retrieved:`, aiConfig);
      if (!aiConfig) {
        console.log(`❌ Global AI config not found`);
        return null;
      }
      
      if (!aiConfig.apiKey) {
        console.log(`❌ AI Config exists but apiKey is missing:`, aiConfig);
        return null;
      }
      
      console.log(`✅ AI Config found with apiKey: ${aiConfig.apiKey ? 'YES (length: ' + aiConfig.apiKey.length + ')' : 'NO'}`);
      console.log(`🔧 AI Config details:`, {
        temperatura: aiConfig.temperatura,
        temperaturaType: typeof aiConfig.temperatura,
        numeroTokens: aiConfig.numeroTokens,
        numeroTokensType: typeof aiConfig.numeroTokens,
        modelo: aiConfig.modelo,
        apiKeyPrefix: aiConfig.apiKey ? aiConfig.apiKey.substring(0, 10) + '...' : 'NONE'
      });
      console.log(`✅ Agent found: ${mainAgent.name}, ID: ${mainAgent.id}`);

      // Buscar histórico da conversa ANTES de gerar resposta
      console.log(`📚 [DEBUG] Carregando histórico da conversa para ${context.phone}...`);
      console.log(`📚 [DEBUG] InstanceId recebido: ${context.instanceId}`);
      
      let conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
      try {
        conversationHistory = await this.getConversationHistory(context.instanceId, context.phone);
        console.log(`📚 [DEBUG] Histórico carregado com SUCESSO: ${conversationHistory.length} mensagens`);
        
        if (conversationHistory.length > 0) {
          console.log(`📚 [DEBUG] Últimas mensagens do histórico:`, conversationHistory.slice(-3));
          console.log(`🎯 [CONTEXT] HISTÓRICO ENCONTRADO - Agente deve continuar conversa SEM se apresentar`);
        } else {
          console.log(`🎯 [CONTEXT] NENHUM HISTÓRICO - Primeira conversa, agente pode se apresentar`);
        }
      } catch (error) {
        console.error(`❌ [DEBUG] Erro ao carregar histórico:`, error);
        conversationHistory = [];
      }
      
      const contextWithHistory = {
        ...context,
        conversationHistory
      };
      
      console.log(`📚 [DEBUG] Context com histórico preparado - Total mensagens: ${conversationHistory.length}`);
      
      // Gerar resposta usando OpenAI
      console.log(`🤖 Gerando resposta com agente ativo: ${activeAgent.name} (Tipo: ${activeAgent.agentType || 'main'})`);
      console.log(`🔑 Testando inicialização OpenAI com chave: ${aiConfig.apiKey ? aiConfig.apiKey.substring(0, 8) + '...' : 'MISSING'}`);
      
      const response = await this.generateResponse(activeAgent, contextWithHistory, aiConfig);

      return {
        response,
        shouldDelegate: !!delegatedAgent,
        delegatedAgentId: delegatedAgent?.id,
        activeAgentId: activeAgent.id, // ID do agente que realmente respondeu
        activeAgentName: activeAgent.name,
        activeAgentType: activeAgent.agentType || 'main'
      };

    } catch (error) {
      console.error("Error processing message:", error);
      return null;
    }
  }

  private async getConversationHistory(evolutionInstanceId: string, phone: string): Promise<Array<{role: 'user' | 'assistant', content: string}>> {
    try {
      console.log(`📚 [HISTORY] Iniciando busca de histórico para evolutionId: ${evolutionInstanceId}, phone: ${phone}`);
      const storage = getStorage();
      
      // PRIMEIRO: Encontrar a instância do nosso banco usando o evolutionInstanceId
      console.log(`📚 [HISTORY] Buscando instância do banco...`);
      const dbInstanceId = await this.findDatabaseInstanceId(evolutionInstanceId);
      if (!dbInstanceId) {
        console.log(`❌ [HISTORY] Instância do banco não encontrada para evolutionId: ${evolutionInstanceId}`);
        return [];
      }
      
      console.log(`✅ [HISTORY] Instância do banco encontrada: ${dbInstanceId} (evolutionId: ${evolutionInstanceId})`);
      
      // Buscar conversa existente usando o ID correto do banco
      console.log(`📚 [HISTORY] Buscando conversas na instância ${dbInstanceId}...`);
      const conversations = await storage.getConversationsByInstance(dbInstanceId);
      console.log(`📚 [HISTORY] Total de conversas encontradas: ${conversations.length}`);
      
      const conversation = conversations.find(c => c.contactPhone === phone);
      
      if (!conversation) {
        console.log(`❌ [HISTORY] Nenhuma conversa encontrada para ${phone} na instância ${dbInstanceId}`);
        console.log(`📚 [HISTORY] Conversas disponíveis:`, conversations.map(c => ({ id: c.id, phone: c.contactPhone })));
        return [];
      }
      
      console.log(`✅ [HISTORY] Conversa encontrada: ${conversation.id} para telefone ${phone}`);
      
      // Buscar mensagens da conversa
      console.log(`📚 [HISTORY] Buscando mensagens da conversa ${conversation.id}...`);
      const messages = await storage.getMessagesByConversation(conversation.id);
      console.log(`📚 [HISTORY] Encontradas ${messages.length} mensagens na conversa`);
      
      if (messages.length > 0) {
        console.log(`📚 [HISTORY] Primeiras mensagens:`, messages.slice(0, 3).map(m => ({ sender: m.sender, content: m.content.substring(0, 50) + '...' })));
      }
      
      // Converter para formato OpenAI (últimas 10 mensagens para não sobrecarregar)
      const history = messages
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        })
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      console.log(`✅ [HISTORY] Histórico formatado com SUCESSO: ${history.length} mensagens`);
      if (history.length > 0) {
        console.log(`📚 [HISTORY] Histórico formatado:`, history);
      }
      
      return history;
      
    } catch (error) {
      console.error("❌ [HISTORY] Erro ao carregar histórico da conversa:", error);
      console.error("❌ [HISTORY] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  async findDatabaseInstanceId(evolutionInstanceId: string): Promise<string | null> {
    try {
      const storage = getStorage();
      const companies = await storage.getAllCompanies();
      
      for (const company of companies) {
        const instances = await storage.getWhatsappInstancesByCompany(company.id);
        
        // Buscar por evolutionInstanceId OU usar fallback
        let found = instances.find(i => i.evolutionInstanceId === evolutionInstanceId);
        
        // Fallback específico para ID conhecido
        if (!found && evolutionInstanceId === "e5b71c35-276b-417e-a1c3-267f904b2b98") {
          found = instances.find(i => i.name === "deploy2");
        }
        
        if (found) {
          console.log(`🔍 Mapeamento encontrado: evolutionId=${evolutionInstanceId} -> dbId=${found.id}`);
          return found.id;
        }
      }
      
      console.log(`❌ Nenhuma instância encontrada para evolutionId: ${evolutionInstanceId}`);
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar instância do banco:", error);
      return null;
    }
  }

  private async checkDelegation(mainAgent: any, message: string): Promise<any | null> {
    try {
      const storage = getStorage();
      
      // Buscar agentes secundários vinculados ao agente principal
      const secondaryAgents = await storage.getSecondaryAgentsByParent(mainAgent.id);
      console.log(`🔗 Agentes secundários encontrados: ${secondaryAgents.length}`);
      
      if (!secondaryAgents || secondaryAgents.length === 0) {
        console.log(`❌ Nenhum agente secundário vinculado ao agente principal "${mainAgent.name}"`);
        return null;
      }

      // Verificar palavras-chave de delegação (mesma lógica do AiResponseService)
      const messageLower = message.toLowerCase();
      console.log(`🔍 Verificando delegação entre ${secondaryAgents.length} agentes secundários`);
      
      for (const agent of secondaryAgents) {
        if (agent.delegationKeywords && Array.isArray(agent.delegationKeywords) && agent.delegationKeywords.length > 0) {
          const keywords = agent.delegationKeywords;
          const hasKeyword = keywords.some(keyword => 
            messageLower.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword) {
            console.log(`✅ Palavras-chave encontradas para delegação ao agente: ${agent.name}`);
            console.log(`🔑 Keywords: ${agent.delegationKeywords.join(', ')}`);
            return agent;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking delegation:", error);
      return null;
    }
  }

  private async generateResponse(agent: any, context: MessageContext, aiConfig: any): Promise<string> {
    try {
      console.log(`🤖 [GENERATE] Starting generateResponse for agent: ${agent.name}`);
      console.log(`🔑 [GENERATE] API Key exists: ${!!aiConfig.apiKey}, length: ${aiConfig.apiKey?.length || 0}`);
      
      // Verificar se temos a chave OpenAI na configuração do administrador
      if (!aiConfig.apiKey) {
        return "Desculpe, o serviço de IA não está configurado. Entre em contato com o administrador.";
      }

      // Criar instância do OpenAI com a chave da configuração
      console.log(`🔧 [GENERATE] Creating OpenAI instance...`);
      const openai = new OpenAI({ apiKey: aiConfig.apiKey });
      console.log(`✅ [GENERATE] OpenAI instance created successfully`);

      // Gerar resposta usando AiResponseService
      console.log(`🤖 [RESPONSE] Using AiResponseService to generate response...`);
      const aiResponseService = new AiResponseService(aiConfig.apiKey);
      
      const responseRequest: AiResponseRequest = {
        message: context.message,
        agentId: agent.id,
        agentPrompt: agent.prompt,
        agentTrainingContent: agent.trainingContent || undefined,
        temperatura: Number(aiConfig.temperatura) || 0.7,
        modelo: aiConfig.modelo || "gpt-4o",
        numeroTokens: Number(aiConfig.numeroTokens) || 1000,
        agentType: agent.agentType as 'main' | 'secondary',
        companyId: context.companyId,
        conversationHistory: context.conversationHistory
      };

      const response = await aiResponseService.generateResponse(responseRequest);
      console.log(`✅ [RESPONSE] Response generated successfully - length: ${response.length}`);
      
      return response;

    } catch (error) {
      console.error("❌ Error generating AI response - DETAILED:", {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      // Log específico se for erro da OpenAI
      if (error instanceof Error && error.message.includes('API')) {
        console.error("🔑 OpenAI API Error detected - checking configuration...");
        console.error("🔑 Error details:", error.message);
      }
      
      return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.";
    }
  }

  async saveConversation(evolutionInstanceId: string, phone: string, userMessage: string, aiResponse: string, agentId: string, messageData?: {
    messageType?: string;
    mediaUrl?: string;
    mediaBase64?: string;
    caption?: string;
  }) {
    try {
      const storage = getStorage();
      
      // PRIMEIRO: Encontrar a instância do nosso banco usando o evolutionInstanceId
      const dbInstanceId = await this.findDatabaseInstanceId(evolutionInstanceId);
      if (!dbInstanceId) {
        console.log(`💾 Erro: Instância do banco não encontrada para salvar conversa. EvolutionId: ${evolutionInstanceId}`);
        return null;
      }
      
      console.log(`💾 Salvando conversa na instância: ${dbInstanceId} (evolutionId: ${evolutionInstanceId})`);
      
      // Buscar conversa existente usando o ID correto do banco
      const conversations = await storage.getConversationsByInstance(dbInstanceId);
      let conversation = conversations.find(c => c.contactPhone === phone);
      
      if (!conversation) {
        console.log(`💾 Criando nova conversa para ${phone}`);
        conversation = await storage.createConversation({
          whatsappInstanceId: dbInstanceId,
          contactPhone: phone,
          lastMessage: userMessage
        });
      } else {
        console.log(`💾 Usando conversa existente: ${conversation.id}`);
      }

      // Salvar mensagem do usuário (com dados de imagem se presente)
      const userMessageData: any = {
        conversationId: conversation.id,
        content: userMessage,
        sender: 'user',
        messageType: messageData?.messageType || 'text'
      };

      // Adicionar dados de imagem se presente
      if (messageData) {
        if (messageData.mediaUrl) userMessageData.mediaUrl = messageData.mediaUrl;
        if (messageData.mediaBase64) userMessageData.mediaBase64 = messageData.mediaBase64;
        if (messageData.caption) userMessageData.caption = messageData.caption;
      }

      await storage.createMessage(userMessageData);

      // Salvar resposta do AI
      await storage.createMessage({
        conversationId: conversation.id,
        content: aiResponse,
        sender: 'assistant',
        agentId: agentId, // Rastrear qual agente respondeu
        messageType: 'text'
      });

      console.log(`💾 Conversa salva com sucesso: ${conversation.id}`);
      return conversation;
    } catch (error) {
      console.error("❌ Error saving conversation:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();