import OpenAI from "openai";

interface AiResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAiService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(
    prompt: string,
    systemMessage: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>;
    } = {}
  ): Promise<AiResponse> {
    try {
      // Build messages array with conversation history
      const messages: any[] = [
        { role: "system", content: systemMessage }
      ];

      // Add conversation history if provided
      if (options.conversationHistory && options.conversationHistory.length > 0) {
        console.log(`📚 [OPENAI] Adding ${options.conversationHistory.length} messages from history`);
        messages.push(...options.conversationHistory.slice(-10)); // Last 10 messages to avoid token limits
      }

      // Add current message
      messages.push({ role: "user", content: prompt });

      console.log(`🔧 [OPENAI] Final messages count: ${messages.length}, with history: ${!!options.conversationHistory}`);

      const response = await this.openai.chat.completions.create({
        model: options.model || "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });

      return {
        content: response.choices[0].message.content || "",
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined
      };
    } catch (error) {
      throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(testPrompt: string = "Hello, this is a test."): Promise<boolean> {
    try {
      await this.generateResponse(testPrompt, "You are a helpful assistant. Respond briefly to test the connection.");
      return true;
    } catch (error) {
      return false;
    }
  }

  async analyzeDocument(text: string, context: string = ""): Promise<string> {
    const systemMessage = `You are an AI assistant that analyzes documents and provides insights. ${context}`;
    const response = await this.generateResponse(
      `Please analyze the following document and provide key insights: ${text}`,
      systemMessage
    );
    return response.content;
  }

  async listAvailableModels(): Promise<any[]> {
    try {
      const response = await this.openai.models.list();
      return response.data;
    } catch (error) {
      throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
