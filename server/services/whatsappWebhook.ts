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
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      senderLid?: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
        fileLength?: string;
        height?: number;
        width?: number;
        mediaKey?: string;
        fileEncSha256?: string;
        fileSha256?: string;
        jpegThumbnail?: string;
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
  
  // Função para baixar imagem da Evolution API e converter para base64
  private async downloadImageAsBase64(imageUrl: string, instanceId: string): Promise<string | null> {
    try {
      console.log(`🖼️ Downloading image from URL: ${imageUrl}`);
      
      // Obter configuração da Evolution API
      const storage = getStorage();
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      
      if (!evolutionConfig?.evolutionURL || !evolutionConfig?.evolutionToken) {
        console.error("❌ Evolution API configuration not found");
        return null;
      }

      // Fazer download da imagem via Evolution API
      const response = await fetch(imageUrl, {
        headers: {
          'apikey': evolutionConfig.evolutionToken
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to download image: ${response.status} ${response.statusText}`);
        return null;
      }

      // Converter para base64
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      console.log(`✅ Image downloaded and converted to base64 (${base64.length} chars)`);
      return base64;
      
    } catch (error) {
      console.error("❌ Error downloading image:", error);
      return null;
    }
  }

  async handleEvolutionMessage(evolutionData: EvolutionWebhookData): Promise<void> {
    try {
      console.log("📨 Processing Evolution API message:", JSON.stringify(evolutionData, null, 2));

      // Verificar se é uma mensagem válida para processar
      if (!this.shouldProcessEvolutionMessage(evolutionData)) {
        console.log("❌ Evolution message ignored - not suitable for processing");
        return;
      }

      const data = evolutionData.data;
      
      // Verificar se é uma mensagem de imagem
      const imageMessage = data.message.imageMessage;
      const isImageMessage = !!imageMessage;
      
      // Extrair o conteúdo da mensagem (texto ou legenda da imagem)
      let messageText = data.message.conversation || data.message.extendedTextMessage?.text;
      let caption: string | undefined;
      let mediaUrl: string | undefined;
      let mediaBase64: string | undefined;

      if (isImageMessage) {
        console.log("🖼️ Detected image message");
        caption = imageMessage.caption;
        mediaUrl = imageMessage.url;
        messageText = caption || "Imagem enviada";
        
        // Baixar a imagem e converter para base64
        if (mediaUrl) {
          mediaBase64 = await this.downloadImageAsBase64(mediaUrl, data.instanceId);
        }
      }

      if (!messageText) {
        console.log("❌ No text content or image found in Evolution message");
        return;
      }

      // Extrair o número do remetente CORRETO da mensagem - usar data.key.remoteJid
      const senderPhone = (evolutionData.data as any).key?.remoteJid?.replace('@s.whatsapp.net', '');
      if (!senderPhone) {
        console.log("❌ Could not extract sender phone from Evolution message");
        console.log("❌ Debug - data.key:", (evolutionData.data as any).key);
        console.log("❌ Debug - evolutionData.sender:", evolutionData.sender);
        return;
      }
      
      console.log(`📞 Sender phone extracted: ${senderPhone} (from remoteJid: ${(evolutionData.data as any).key?.remoteJid})`);

      // Buscar o nome da instância no Evolution API pela instanceId
      console.log(`🔍 About to search for instance ID: ${data.instanceId}`);
      const instanceName = await this.getInstanceNameById(data.instanceId);
      console.log(`🔍 Instance search result: ${instanceName}`);
      if (!instanceName) {
        console.log(`❌ Could not find instance name for ID: ${data.instanceId}`);
        return;
      }

      console.log(`📱 Processing Evolution message from ${senderPhone} to instance ${instanceName}: "${messageText}"`);

      // Processar mensagem com IA (incluindo dados de imagem se presente)
      const messageContext = {
        phone: senderPhone,
        message: messageText,
        instanceId: data.instanceId, // IMPORTANTE: Usar o instanceId real, não o nome
        mediaUrl,
        mediaBase64,
        caption,
        messageType: isImageMessage ? 'image' : 'text'
      };

      console.log(`🔄 About to call AIService.processMessage with:`, {
        ...messageContext,
        mediaBase64: mediaBase64 ? `[${mediaBase64.length} chars]` : undefined // Não logar base64 completo
      });
      
      const aiService = new AIService();
      const aiResponse = await aiService.processMessage(messageContext);

      console.log(`🤖 Raw AI Response:`, aiResponse);
      if (!aiResponse) {
        console.log("🤖 No AI response generated for Evolution message");
        return;
      }

      console.log(`🤖 AI Response for Evolution message: "${aiResponse.response}"`);
      console.log(`🔍 [DEBUG] Full AI Response object:`, JSON.stringify(aiResponse, null, 2));

      // Enviar resposta via Evolution API
      console.log(`🚀 About to call sendResponse with instance: ${instanceName}, phone: ${senderPhone}`);
      await this.sendResponse(instanceName, senderPhone, aiResponse.response);

      // Salvar conversa no banco de dados
      let agentIdToSave = aiResponse.activeAgentId;
      
      // Se não tem activeAgentId, buscar o agente principal da empresa
      if (!agentIdToSave) {
        console.log(`💾 [DEBUG] No activeAgentId, searching for main agent...`);
        try {
          // Buscar a instância para obter a empresa
          const dbInstanceId = await aiService.findDatabaseInstanceId(data.instanceId);
          if (dbInstanceId) {
            const storage = getStorage();
            const instance = await storage.getWhatsappInstance(dbInstanceId);
            if (instance?.companyId) {
              const mainAgents = await storage.getMainAgentsByCompany(instance.companyId);
              if (mainAgents.length > 0) {
                agentIdToSave = mainAgents[0].id;
                console.log(`💾 [DEBUG] Using main agent ID: ${agentIdToSave}`);
              }
            }
          }
        } catch (error) {
          console.error(`💾 [DEBUG] Error finding main agent:`, error);
        }
      }
      
      console.log(`💾 [DEBUG] Final agentId to save: ${agentIdToSave}`);
      
      // Preparar dados de imagem para salvar
      const messageData = isImageMessage ? {
        messageType: 'image',
        mediaUrl,
        mediaBase64,
        caption
      } : undefined;

      // Se ainda não tem agentId, não salvar a mensagem com agente
      if (agentIdToSave) {
        await aiService.saveConversation(
          data.instanceId,
          senderPhone,
          messageText,
          aiResponse.response,
          agentIdToSave,
          messageData
        );
      } else {
        console.log(`⚠️ [DEBUG] No valid agentId found, skipping conversation save with agent tracking`);
        // Salvar apenas a conversa sem rastreamento de agente
        await aiService.saveConversation(
          data.instanceId,
          senderPhone,
          messageText,
          aiResponse.response,
          'unknown', // Usar placeholder para agente desconhecido
          messageData
        );
      }

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
        aiResponse.activeAgentId || 'main'
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
    
    // CRÍTICO: Verificar se a mensagem foi enviada por nós (evitar loop infinito)
    if (data.key?.fromMe === true) {
      console.log("❌ Evolution message ignored - message sent by us (fromMe: true)");
      return false;
    }
    
    // Verificação adicional para mensagens PENDING com destination
    if (data.status === 'PENDING' && evolutionData.destination) {
      console.log("❌ Evolution message ignored - message sent by us (detected via status and destination)");
      return false;
    }
    
    // Verificar se tem conteúdo de texto ou imagem
    const messageText = data.message.conversation || data.message.extendedTextMessage?.text;
    const imageMessage = data.message.imageMessage;
    
    if (!messageText && !imageMessage) {
      console.log("❌ Evolution message ignored - no text or image content");
      return false;
    }

    // Se tem texto mas não tem imagem, verificar se está vazio
    if (messageText && !imageMessage && messageText.trim().length === 0) {
      console.log("❌ Evolution message ignored - empty text content");
      return false;
    }

    // Verificar se o tipo de mensagem é suportado (texto ou imagem)
    const supportedTypes = ['conversation', 'extendedTextMessage', 'imageMessage'];
    if (!supportedTypes.includes(data.messageType)) {
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
      console.error("❌ Stack trace:", (error as Error).stack);
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