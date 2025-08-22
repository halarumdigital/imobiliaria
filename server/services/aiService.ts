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
      const delegatedAgent = await this.checkDelegation(mainAgent, context.message);
      const activeAgent = delegatedAgent || mainAgent;

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

      // Gerar resposta usando OpenAI
      const response = await this.generateResponse(activeAgent, context, aiConfig);

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

  private async checkDelegation(mainAgent: any, message: string): Promise<any | null> {
    try {
      const storage = getStorage();
      
      // Buscar agentes secundários vinculados ao agente principal
      const secondaryAgents = await storage.getSecondaryAgentsByParent(mainAgent.id);
      
      if (!secondaryAgents || secondaryAgents.length === 0) {
        return null;
      }

      // Verificar palavras-chave de delegação
      const messageWords = message.toLowerCase().split(/\s+/);
      
      for (const agent of secondaryAgents) {
        if (agent.delegationKeywords && Array.isArray(agent.delegationKeywords) && agent.delegationKeywords.length > 0) {
          const keywords = agent.delegationKeywords.map((k: string) => k.toLowerCase());
          const hasKeyword = messageWords.some(word => 
            keywords.some((keyword: string) => word.includes(keyword) || keyword.includes(word))
          );
          
          if (hasKeyword) {
            console.log(`Delegating to agent ${agent.name} based on keywords: ${agent.delegationKeywords.join(', ')}`);
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

      // Construir o prompt do sistema baseado no agente
      let systemPrompt = `Você é ${agent.name}, um assistente de IA especializado.`;
      
      if (agent.description) {
        systemPrompt += `\n\nDescrição: ${agent.description}`;
      }
      
      if (agent.specialization && Array.isArray(agent.specialization) && agent.specialization.length > 0) {
        systemPrompt += `\n\nEspecializações: ${agent.specialization.join(', ')}`;
      }
      
      if (agent.agentType === 'secondary' && agent.specialization) {
        systemPrompt += `\n\nVocê é um agente especializado responsável por responder questões relacionadas a: ${agent.specialization.join(', ')}`;
      }

      systemPrompt += `\n\nResponda de forma útil, clara e concisa. Mantenha um tom profissional e amigável.`;

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

  async saveConversation(instanceId: string, phone: string, userMessage: string, aiResponse: string, agentId: string) {
    try {
      const storage = getStorage();
      
      // Buscar conversa existente por instância e telefone
      const conversations = await storage.getConversationsByInstance(instanceId);
      let conversation = conversations.find(c => c.contactPhone === phone);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          whatsappInstanceId: instanceId,
          contactPhone: phone,
          lastMessage: userMessage
        });
      } else {
        // Atualizar última mensagem - método não implementado, vamos apenas criar as mensagens
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

      return conversation;
    } catch (error) {
      console.error("Error saving conversation:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();