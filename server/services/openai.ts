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
    } = {}
  ): Promise<AiResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
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

  async listModels(): Promise<Array<{ id: string; created: number; owned_by: string }>> {
    try {
      const response = await this.openai.models.list();
      // Filter for GPT models only
      const models = response.data
        .filter(model => model.id.startsWith('gpt-'))
        .sort((a, b) => b.created - a.created)
        .map(model => ({
          id: model.id,
          created: model.created,
          owned_by: model.owned_by
        }));
      return models;
    } catch (error) {
      throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
