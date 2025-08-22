import { OpenAiService } from "./services/openai";
import { getStorage } from "./storage";
import { AiAgent } from "@shared/schema";

export interface AiResponseRequest {
  message: string;
  agentId: string;
  agentPrompt: string;
  agentTrainingContent?: string;
  temperatura?: number;
  modelo?: string;
  numeroTokens?: number;
  agentType?: 'main' | 'secondary';
  delegationKeywords?: string[];
  companyId?: string;
}

export class AiResponseService {
  private openAiService: OpenAiService;

  constructor(apiKey: string) {
    this.openAiService = new OpenAiService(apiKey);
  }

  /**
   * Generates an AI response with hierarchical delegation support
   */
  async generateResponse(request: AiResponseRequest): Promise<string> {
    try {
      console.log(`🤖 Gerando resposta para agente ID: ${request.agentId} (Tipo: ${request.agentType || 'main'})`);
      
      // If this is a main agent, check if we need to delegate to secondary agents
      if (request.agentType === 'main' && request.companyId) {
        const delegationResult = await this.checkForDelegation(request);
        if (delegationResult) {
          console.log(`🔄 Delegando para agente secundário: ${delegationResult.agent.name}`);
          return delegationResult.response;
        }
      }

      // Generate response from the current agent
      return await this.generateDirectResponse(request);
    } catch (error: any) {
      console.error('❌ Erro ao gerar resposta do agente:', error);
      throw new Error(`Erro na geração da resposta: ${error.message}`);
    }
  }

  /**
   * Check if the message should be delegated to a secondary agent
   */
  private async checkForDelegation(request: AiResponseRequest): Promise<{ agent: AiAgent; response: string } | null> {
    if (!request.companyId) return null;

    const storage = getStorage();
    const secondaryAgents = await storage.getSecondaryAgentsByParent(request.agentId);
    
    console.log(`🔍 Verificando delegação entre ${secondaryAgents.length} agentes secundários`);

    for (const secondaryAgent of secondaryAgents) {
      const keywords = Array.isArray(secondaryAgent.delegationKeywords) ? secondaryAgent.delegationKeywords : [];
      if (this.shouldDelegate(request.message, keywords)) {
        console.log(`✅ Palavras-chave encontradas para delegação ao agente: ${secondaryAgent.name}`);
        
        // Generate response using the secondary agent
        const delegatedResponse = await this.generateDirectResponse({
          ...request,
          agentId: secondaryAgent.id,
          agentPrompt: secondaryAgent.prompt,
          agentTrainingContent: secondaryAgent.trainingContent || undefined,
          temperatura: Number(secondaryAgent.temperatura) || 0.7,
          modelo: secondaryAgent.modelo || "gpt-4o",
          numeroTokens: Number(secondaryAgent.numeroTokens) || 1000,
          agentType: 'secondary'
        });

        return {
          agent: secondaryAgent,
          response: delegatedResponse
        };
      }
    }

    return null;
  }

  /**
   * Check if a message should trigger delegation based on keywords
   */
  private shouldDelegate(message: string, keywords: string[]): boolean {
    if (!keywords || keywords.length === 0) return false;
    
    const messageLower = message.toLowerCase();
    return keywords.some(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Generate a direct response from the specified agent
   */
  private async generateDirectResponse(request: AiResponseRequest): Promise<string> {
    // Build the enhanced prompt combining agent prompt + training content
    let enhancedPrompt = request.agentPrompt;
    
    if (request.agentTrainingContent && request.agentTrainingContent.trim()) {
      enhancedPrompt += `\n\n=== CONHECIMENTO BASE ===\n${request.agentTrainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
      enhancedPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
    }

    // Add delegation context if this is a secondary agent
    if (request.agentType === 'secondary') {
      enhancedPrompt += `\n\nVocê é um agente especializado. Responda com base em sua especialização e conhecimento específico.`;
    }

    // Add specific instructions
    enhancedPrompt += `\n\nResponda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.`;

    console.log(`📝 Prompt construído - Tamanho: ${enhancedPrompt.length} caracteres`);
    console.log(`💬 Mensagem do usuário: "${request.message}"`);
    
    const response = await this.openAiService.generateResponse(
      request.message,
      enhancedPrompt,
      {
        model: request.modelo || "gpt-4o",
        temperature: request.temperatura || 0.7,
        maxTokens: request.numeroTokens || 1000,
      }
    );

    console.log(`✅ Resposta gerada com sucesso - Tamanho: ${response.content.length} caracteres`);
    return response.content;
  }

  /**
   * Test if an AI agent can generate responses with its current configuration
   */
  async testAgent(request: Omit<AiResponseRequest, 'message'>): Promise<{ success: boolean; message: string }> {
    try {
      const testMessage = "Olá! Este é um teste de conexão.";
      const response = await this.generateResponse({
        ...request,
        message: testMessage,
      });

      return {
        success: true,
        message: `Teste realizado com sucesso. Resposta: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no teste: ${error.message}`
      };
    }
  }
}