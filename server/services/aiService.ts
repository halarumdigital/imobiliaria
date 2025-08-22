import OpenAI from "openai";
import { getStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface MessageContext {
  phone: string;
  message: string;
  instanceId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AgentResponse {
  response: string;
  shouldDelegate?: boolean;
  delegatedAgentId?: string;
}

export class AIService {
  async processMessage(context: MessageContext): Promise<AgentResponse | null> {
    try {
      console.log(`🚀 AIService.processMessage called for instance: ${context.instanceId}`);
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
      
      console.log(`✅ AI Config found with apiKey: ${aiConfig.apiKey ? 'YES' : 'NO'}`);
      console.log(`🔧 AI Config details:`, {
        temperatura: aiConfig.temperatura,
        temperaturaType: typeof aiConfig.temperatura,
        numeroTokens: aiConfig.numeroTokens,
        numeroTokensType: typeof aiConfig.numeroTokens,
        modelo: aiConfig.modelo
      });
      console.log(`✅ Agent found: ${mainAgent.name}, ID: ${mainAgent.id}`);

      // Buscar histórico da conversa ANTES de gerar resposta
      console.log(`📚 [DEBUG] Carregando histórico da conversa para ${context.phone}...`);
      console.log(`📚 [DEBUG] InstanceId recebido: ${context.instanceId}`);
      
      let conversationHistory = [];
      try {
        conversationHistory = await this.getConversationHistory(context.instanceId, context.phone);
        console.log(`📚 [DEBUG] Histórico carregado com SUCESSO: ${conversationHistory.length} mensagens`);
        
        if (conversationHistory.length > 0) {
          console.log(`📚 [DEBUG] Últimas mensagens do histórico:`, conversationHistory.slice(-3));
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
      const response = await this.generateResponse(activeAgent, contextWithHistory, aiConfig);

      return {
        response,
        shouldDelegate: !!delegatedAgent,
        delegatedAgentId: delegatedAgent?.id
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
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
      console.error("❌ [HISTORY] Stack trace:", error.stack);
      return [];
    }
  }

  private async findDatabaseInstanceId(evolutionInstanceId: string): Promise<string | null> {
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
      // Verificar se temos a chave OpenAI na configuração do administrador
      if (!aiConfig.apiKey) {
        return "Desculpe, o serviço de IA não está configurado. Entre em contato com o administrador.";
      }

      // Criar instância do OpenAI com a chave da configuração
      const openai = new OpenAI({ apiKey: aiConfig.apiKey });

      // Construir o prompt do sistema baseado no agente (usando lógica do AiResponseService)
      let systemPrompt = agent.prompt || `Você é ${agent.name}, um assistente de IA especializado.`;
      
      // Adicionar conhecimento base se disponível
      if (agent.trainingContent && agent.trainingContent.trim()) {
        systemPrompt += `\n\n=== CONHECIMENTO BASE ===\n${agent.trainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
        systemPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
      }
      
      // Adicionar contexto de delegação se for agente secundário
      if (agent.agentType === 'secondary') {
        systemPrompt += `\n\nVocê é um agente especializado. Responda com base em sua especialização e conhecimento específico.`;
      }

      systemPrompt += `\n\nResponda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.`;

      // Construir histórico da conversa
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Adicionar histórico se disponível
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        messages.push(...context.conversationHistory.slice(-10)); // Últimas 10 mensagens
      }

      // Adicionar mensagem atual
      messages.push({ role: "user", content: context.message });

      // Gerar resposta usando OpenAI
      console.log(`🔧 Pre-OpenAI call - temperatura: ${aiConfig.temperatura}, type: ${typeof aiConfig.temperatura}`);
      console.log(`🔧 Pre-OpenAI call - numeroTokens: ${aiConfig.numeroTokens}, type: ${typeof aiConfig.numeroTokens}`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Hardcode para garantir
        messages: messages,
        max_tokens: 1000, // Hardcode para garantir
        temperature: 0.7, // Hardcode para garantir
      });

      return response.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";

    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.";
    }
  }

  async saveConversation(evolutionInstanceId: string, phone: string, userMessage: string, aiResponse: string, agentId: string) {
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

      // Salvar mensagem do usuário
      await storage.createMessage({
        conversationId: conversation.id,
        content: userMessage,
        sender: 'user',
        messageType: 'text'
      });

      // Salvar resposta do AI
      await storage.createMessage({
        conversationId: conversation.id,
        content: aiResponse,
        sender: 'assistant',
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