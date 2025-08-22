import { Request, Response } from "express";
import { aiService } from "./aiService";
import { EvolutionApiService } from "./evolutionApi";
import { getStorage } from "../storage";

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
  instance: string;
}

export interface WebhookData {
  event: string;
  instance: string;
  data: WhatsAppMessage;
}

export class WhatsAppWebhookService {
  
  async handleMessage(webhookData: WebhookData): Promise<void> {
    try {
      console.log("📨 Received WhatsApp message:", JSON.stringify(webhookData, null, 2));

      // Verificar se é uma mensagem válida para processar
      if (!this.shouldProcessMessage(webhookData)) {
        console.log("❌ Message ignored - not suitable for processing");
        return;
      }

      const message = webhookData.data;
      const instanceId = webhookData.instance;
      
      // Extrair o conteúdo da mensagem
      const messageText = this.extractMessageText(message);
      if (!messageText) {
        console.log("❌ No text content found in message");
        return;
      }

      // Extrair o número do remetente
      const senderPhone = this.extractSenderPhone(message);
      if (!senderPhone) {
        console.log("❌ Could not extract sender phone");
        return;
      }

      console.log(`📱 Processing message from ${senderPhone}: "${messageText}"`);

      // Processar mensagem com IA
      const aiResponse = await aiService.processMessage({
        phone: senderPhone,
        message: messageText,
        instanceId: instanceId
      });

      if (!aiResponse) {
        console.log("🤖 No AI response generated");
        return;
      }

      console.log(`🤖 AI Response: "${aiResponse.response}"`);

      // Enviar resposta via Evolution API
      await this.sendResponse(instanceId, senderPhone, aiResponse.response);

      // Salvar conversa no banco de dados
      await aiService.saveConversation(
        instanceId,
        senderPhone,
        messageText,
        aiResponse.response,
        aiResponse.delegatedAgentId || 'main'
      );

      console.log("✅ Message processed successfully");

    } catch (error) {
      console.error("❌ Error processing WhatsApp message:", error);
    }
  }

  private shouldProcessMessage(webhookData: WebhookData): boolean {
    // Verificar se é evento de mensagem
    if (webhookData.event !== 'message' && webhookData.event !== 'messages.upsert') {
      return false;
    }

    const message = webhookData.data;
    
    // Ignorar mensagens enviadas por nós mesmos
    if (message.key.fromMe) {
      return false;
    }

    // Verificar se tem conteúdo de texto
    const messageText = this.extractMessageText(message);
    if (!messageText || messageText.trim().length === 0) {
      return false;
    }

    return true;
  }

  private extractMessageText(message: WhatsAppMessage): string | null {
    // Mensagem simples
    if (message.message.conversation) {
      return message.message.conversation;
    }

    // Mensagem de texto estendida
    if (message.message.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }

    return null;
  }

  private extractSenderPhone(message: WhatsAppMessage): string | null {
    const remoteJid = message.key.remoteJid;
    
    if (!remoteJid) {
      return null;
    }

    // Remover sufixo @s.whatsapp.net se presente
    return remoteJid.replace('@s.whatsapp.net', '');
  }

  private async sendResponse(instanceId: string, phone: string, response: string): Promise<void> {
    try {
      const storage = getStorage();
      
      // Buscar configuração da Evolution API
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        console.error("❌ Evolution API configuration not found");
        return;
      }

      // Criar instância do serviço Evolution API
      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      // Enviar mensagem
      await evolutionService.sendMessage(instanceId, phone, response);
      
      console.log(`📤 Response sent to ${phone}`);
    } catch (error) {
      console.error("❌ Error sending response:", error);
      throw error;
    }
  }
}

export const whatsappWebhookService = new WhatsAppWebhookService();