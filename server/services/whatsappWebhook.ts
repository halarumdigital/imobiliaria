import { Request, Response } from "express";
import { AIService } from "./aiService";
import { EvolutionApiService } from "./evolutionApi";
import { getStorage } from "../storage";
import { WhatsappInstance } from "@shared/schema";

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

export interface EvolutionWebhookData {
  data: {
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    pushName?: string;
    messageTimestamp: number;
    instanceId: string;
    messageType: string;
    status?: string;
  };
  sender: string;
  destination: string;
  date_time: string;
  server_url: string;
  apikey: string;
}

export class WhatsAppWebhookService {
  
  async handleEvolutionMessage(evolutionData: EvolutionWebhookData): Promise<void> {
    try {
      console.log("📨 Processing Evolution API message:", JSON.stringify(evolutionData, null, 2));

      // Verificar se é uma mensagem válida para processar
      if (!this.shouldProcessEvolutionMessage(evolutionData)) {
        console.log("❌ Evolution message ignored - not suitable for processing");
        return;
      }

      const data = evolutionData.data;
      
      // Extrair o conteúdo da mensagem
      const messageText = data.message.conversation || data.message.extendedTextMessage?.text;
      if (!messageText) {
        console.log("❌ No text content found in Evolution message");
        return;
      }

      // Extrair o número do remetente CORRETO da mensagem
      const senderPhone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || 
                          evolutionData.sender?.replace('@s.whatsapp.net', '');
      if (!senderPhone) {
        console.log("❌ Could not extract sender phone from Evolution message");
        return;
      }
      
      console.log(`📞 Sender phone extracted: ${senderPhone} (from ${data.key?.remoteJid || evolutionData.sender})`);

      // Buscar o nome da instância no Evolution API pela instanceId
      console.log(`🔍 About to search for instance ID: ${data.instanceId}`);
      const instanceName = await this.getInstanceNameById(data.instanceId);
      console.log(`🔍 Instance search result: ${instanceName}`);
      if (!instanceName) {
        console.log(`❌ Could not find instance name for ID: ${data.instanceId}`);
        return;
      }

      console.log(`📱 Processing Evolution message from ${senderPhone} to instance ${instanceName}: "${messageText}"`);

      // Processar mensagem com IA
      console.log(`🔄 About to call AIService.processMessage with:`, {
        phone: senderPhone,
        message: messageText,
        instanceId: data.instanceId // IMPORTANTE: Usar o instanceId real, não o nome
      });
      
      const aiService = new AIService();
      const aiResponse = await aiService.processMessage({
        phone: senderPhone,
        message: messageText,
        instanceId: data.instanceId // IMPORTANTE: Usar o instanceId real, não o nome
      });

      console.log(`🤖 Raw AI Response:`, aiResponse);
      if (!aiResponse) {
        console.log("🤖 No AI response generated for Evolution message");
        return;
      }

      console.log(`🤖 AI Response for Evolution message: "${aiResponse.response}"`);

      // Enviar resposta via Evolution API
      console.log(`🚀 About to call sendResponse with instance: ${instanceName}, phone: ${senderPhone}`);
      await this.sendResponse(instanceName, senderPhone, aiResponse.response);

      // Salvar conversa no banco de dados
      await aiService.saveConversation(
        data.instanceId,
        senderPhone,
        messageText,
        aiResponse.response,
        aiResponse.delegatedAgentId || 'main'
      );

      console.log("✅ Evolution message processed successfully");

    } catch (error) {
      console.error("❌ Error processing Evolution API message:", error);
    }
  }

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
      const aiService = new AIService();
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

  private shouldProcessEvolutionMessage(evolutionData: EvolutionWebhookData): boolean {
    const data = evolutionData.data;
    
    // Verificar se tem conteúdo de texto
    const messageText = data.message.conversation || data.message.extendedTextMessage?.text;
    if (!messageText || messageText.trim().length === 0) {
      console.log("❌ Evolution message ignored - no text content");
      return false;
    }

    // Verificar se o tipo de mensagem é de texto
    if (data.messageType !== 'conversation' && data.messageType !== 'extendedTextMessage') {
      console.log(`❌ Evolution message ignored - unsupported type: ${data.messageType}`);
      return false;
    }

    // Aceitar mensagens com DELIVERY_ACK, PENDING ou sem status
    const validStatuses = ['DELIVERY_ACK', 'PENDING', undefined];
    if (data.status && !validStatuses.includes(data.status)) {
      console.log(`❌ Evolution message ignored - invalid status: ${data.status}`);
      return false;
    }

    console.log(`✅ Evolution message accepted for processing - type: ${data.messageType}, status: ${data.status || 'none'}`);
    return true;
  }

  private async getInstanceNameById(instanceId: string): Promise<string | null> {
    console.log(`🔍 STARTING getInstanceNameById with ID: ${instanceId}`);
    
    try {
      const storage = getStorage();
      console.log(`✅ Storage obtained successfully`);
      
      // Buscar todas as empresas
      const companies = await storage.getAllCompanies();
      console.log(`📋 Found ${companies.length} companies`);
      
      if (companies.length === 0) {
        console.log(`❌ No companies found in database`);
        return null;
      }
      
      // Buscar primeira instância disponível como fallback
      for (const company of companies) {
        console.log(`🏢 Checking company: ${company.name}`);
        
        try {
          const instances = await storage.getWhatsappInstancesByCompany(company.id);
          console.log(`📱 Company ${company.name} has ${instances.length} instances`);
          
          if (instances.length > 0) {
            const firstInstance = instances[0];
            console.log(`⚠️  Using first available instance: ${firstInstance.name} (${firstInstance.evolutionInstanceId})`);
            return firstInstance.evolutionInstanceId;
          }
        } catch (instanceError) {
          console.error(`❌ Error getting instances for company ${company.name}:`, instanceError);
        }
      }
      
      console.log(`❌ No instances found in any company`);
      return null;
    } catch (error) {
      console.error("❌ Error in getInstanceNameById:", error);
      console.error("❌ Stack trace:", error.stack);
      return null;
    }
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
      console.log(`🎯 sendResponse called with instanceId: ${instanceId}, phone: ${phone}`);
      
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
      console.log(`📡 Calling evolutionService.sendMessage with instance: ${instanceId}, phone: ${phone}`);
      await evolutionService.sendMessage(instanceId, phone, response);
      
      console.log(`📤 Response sent to ${phone}`);
    } catch (error) {
      console.error("❌ Error sending response:", error);
      throw error;
    }
  }
}

export const whatsappWebhookService = new WhatsAppWebhookService();