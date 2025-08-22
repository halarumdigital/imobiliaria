import { OpenAiService } from "./services/openai";

export interface AiResponseRequest {
  message: string;
  agentId: string;
  agentPrompt: string;
  agentTrainingContent?: string;
  temperatura?: number;
  modelo?: string;
  numeroTokens?: number;
}

export class AiResponseService {
  private openAiService: OpenAiService;

  constructor(apiKey: string) {
    this.openAiService = new OpenAiService(apiKey);
  }

  /**
   * Generates an AI response combining the agent's prompt and training content with the user's message
   */
  async generateResponse(request: AiResponseRequest): Promise<string> {
    try {
      console.log(`🤖 Gerando resposta para agente ID: ${request.agentId}`);
      
      // Build the enhanced prompt combining agent prompt + training content
      let enhancedPrompt = request.agentPrompt;
      
      if (request.agentTrainingContent && request.agentTrainingContent.trim()) {
        enhancedPrompt += `\n\n=== CONHECIMENTO BASE ===\n${request.agentTrainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
        enhancedPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
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
    } catch (error: any) {
      console.error('❌ Erro ao gerar resposta do agente:', error);
      throw new Error(`Erro na geração da resposta: ${error.message}`);
    }
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