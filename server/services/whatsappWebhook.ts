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
  
  // Função para detectar tipo de imagem pelos magic bytes
  private detectImageType(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    
    console.log(`🔍 [DETECT] Buffer size: ${bytes.length} bytes`);
    console.log(`🔍 [DETECT] First 16 bytes: [${Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(', ')}]`);
    
    // PNG signature
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      console.log(`✅ [DETECT] Detected PNG format`);
      return 'png';
    }
    
    // JPEG signature  
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      console.log(`✅ [DETECT] Detected JPEG format`);
      return 'jpeg';
    }
    
    // GIF signature
    if (bytes.length >= 6 && 
        bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && 
        bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
      console.log(`✅ [DETECT] Detected GIF format`);
      return 'gif';
    }
    
    // WebP signature
    if (bytes.length >= 12 && 
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      console.log(`✅ [DETECT] Detected WebP format`);
      return 'webp';
    }
    
    // Default para JPEG se não conseguir detectar
    console.log(`⚠️ [DETECT] Unknown format, defaulting to JPEG`);
    return 'jpeg';
  }

  // Função para baixar imagem da Evolution API e converter para base64
  private async downloadImageAsBase64(imageUrl: string, instanceId: string): Promise<{base64: string, mimeType: string} | null> {
    try {
      console.log(`🖼️ [DOWNLOAD] Starting download from URL: ${imageUrl}`);
      
      // Obter configuração da Evolution API
      const storage = getStorage();
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      
      if (!evolutionConfig?.evolutionURL || !evolutionConfig?.evolutionToken) {
        console.error("❌ [DOWNLOAD] Evolution API configuration not found");
        return null;
      }

      console.log(`🔑 [DOWNLOAD] Using Evolution API: ${evolutionConfig.evolutionURL}`);
      console.log(`🔑 [DOWNLOAD] API Key: ${evolutionConfig.evolutionToken.substring(0, 10)}...`);

      // Fazer download da imagem via Evolution API
      const response = await fetch(imageUrl, {
        headers: {
          'apikey': evolutionConfig.evolutionToken
        }
      });

      console.log(`📡 [DOWNLOAD] Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 [DOWNLOAD] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error(`❌ [DOWNLOAD] Failed to download image: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`❌ [DOWNLOAD] Error response:`, errorText);
        return null;
      }

      // Converter para base64
      const buffer = await response.arrayBuffer();
      console.log(`📊 [DOWNLOAD] Buffer size: ${buffer.byteLength} bytes`);
      
      const imageType = this.detectImageType(buffer);
      console.log(`🔍 [DOWNLOAD] Detected image type: ${imageType}`);
      
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = `image/${imageType}`;
      
      console.log(`✅ [DOWNLOAD] Image processed successfully:`);
      console.log(`   - Type: ${imageType}`);
      console.log(`   - MIME: ${mimeType}`);
      console.log(`   - Base64 length: ${base64.length} chars`);
      console.log(`   - Buffer size: ${buffer.byteLength} bytes`);
      
      // Verificar primeiros bytes do base64 para debug
      console.log(`🔍 [DOWNLOAD] First 100 chars of base64: ${base64.substring(0, 100)}`);
      
      return {
        base64,
        mimeType
      };
      
    } catch (error) {
      console.error("❌ [DOWNLOAD] Error downloading image:", error);
      return null;
    }
  }

  async handleEvolutionMessage(evolutionData: EvolutionWebhookData): Promise<void> {
    try {
      console.log("🚨🚨🚨 [URGENT-DEBUG] WEBHOOK CHAMADO - Mensagem do WhatsApp recebida!");
      console.log("📨 [WEBHOOK] RAW Evolution API message received!");
      console.log("📨 [WEBHOOK] Event type:", evolutionData.data?.messageType || 'unknown');
      console.log("📨 [WEBHOOK] FromMe:", evolutionData.data?.key?.fromMe);
      console.log("📨 [WEBHOOK] Status:", evolutionData.data?.status);
      console.log("📨 [WEBHOOK] Available message fields:", Object.keys(evolutionData.data?.message || {}));
      console.log("📨 [WEBHOOK] Full raw data:", JSON.stringify(evolutionData, null, 2));

      // Verificar se é uma mensagem válida para processar
      if (!this.shouldProcessEvolutionMessage(evolutionData)) {
        console.log("❌ Evolution message ignored - not suitable for processing");
        return;
      }

      const data = evolutionData.data;
      
      // DEBUG: Ver todas as propriedades da mensagem
      console.log("🔍 [MESSAGE DEBUG] Full message structure:");
      console.log("🔍 [MESSAGE DEBUG] data.message keys:", Object.keys(data.message));
      console.log("🔍 [MESSAGE DEBUG] data.message:", JSON.stringify(data.message, null, 2));
      
      // Verificar tipos de mensagem
      const imageMessage = data.message.imageMessage;
      const audioMessage = data.message.audioMessage;
      const isImageMessage = !!imageMessage;
      const isAudioMessage = !!audioMessage;
      
      console.log(`🔍 [MESSAGE DEBUG] imageMessage found: ${!!imageMessage}`);
      console.log(`🔍 [MESSAGE DEBUG] audioMessage found: ${!!audioMessage}`);
      console.log(`🔍 [MESSAGE DEBUG] isImageMessage: ${isImageMessage}`);
      console.log(`🔍 [MESSAGE DEBUG] isAudioMessage: ${isAudioMessage}`);
      
      // DEBUG EXTRA para áudio
      if (isAudioMessage) {
        console.log(`🎤🎤🎤 [AUDIO DEBUG] DETECTADO ÁUDIO!!!`);
        console.log(`🎤 [AUDIO DEBUG] audioMessage:`, JSON.stringify(audioMessage, null, 2));
      } else {
        console.log(`❌ [AUDIO DEBUG] Não é áudio - messageType: ${data.messageType}`);
        console.log(`❌ [AUDIO DEBUG] data.message keys:`, Object.keys(data.message));
      }
      
      // Extrair o conteúdo da mensagem (texto ou legenda da imagem)
      let messageText = data.message.conversation || data.message.extendedTextMessage?.text;
      let caption: string | undefined;
      let mediaUrl: string | undefined;
      let mediaBase64: string | undefined;
      let mimeType: string | undefined;

      if (isImageMessage) {
        console.log("🖼️ Detected image message");
        console.log("🖼️ Image message data:", JSON.stringify(imageMessage, null, 2));
        caption = imageMessage.caption;
        mediaUrl = imageMessage.url;
        messageText = caption || "Imagem enviada";
        
        console.log(`🖼️ Extracted media URL: ${mediaUrl}`);
        console.log(`🖼️ Caption: ${caption}`);
        
        // PROCURAR BASE64 EM TODOS OS LOCAIS POSSÍVEIS!
        const evolutionMessage = evolutionData.data as any;
        console.log(`🔍 [BASE64 SEARCH] Full evolutionData structure:`, JSON.stringify(evolutionData, null, 2));
        
        // Tentar diferentes locais onde o base64 pode estar
        let foundBase64: string | undefined;
        
        if (evolutionMessage.message?.base64) {
          foundBase64 = evolutionMessage.message.base64;
          console.log(`🎯 Found base64 at evolutionMessage.message.base64`);
        } else if (evolutionMessage.base64) {
          foundBase64 = evolutionMessage.base64;
          console.log(`🎯 Found base64 at evolutionMessage.base64`);
        } else if ((imageMessage as any)?.base64) {
          foundBase64 = (imageMessage as any).base64;
          console.log(`🎯 Found base64 at imageMessage.base64`);
        } else {
          console.log(`❌ No base64 found in any expected location`);
        }
        
        if (foundBase64) {
          console.log(`🎯 USING EXISTING BASE64 from Evolution API!`);
          mediaBase64 = foundBase64;
          
          // Detectar tipo de imagem pelo base64
          const buffer = Buffer.from(foundBase64, 'base64');
          const imageType = this.detectImageType(buffer.buffer);
          mimeType = `image/${imageType}`;
          
          console.log(`🎯 Evolution API base64 ready: type=${imageType}, base64 length=${foundBase64.length}`);
        } else if (mediaUrl) {
          console.log(`🖼️ No base64 in message, trying to download from: ${mediaUrl}`);
          const imageData = await this.downloadImageAsBase64(mediaUrl, data.instanceId);
          console.log(`🖼️ Download result:`, imageData ? 'SUCCESS' : 'FAILED');
          if (imageData) {
            mediaBase64 = imageData.base64;
            mimeType = imageData.mimeType;
            console.log(`🖼️ Final image data: type=${mimeType}, base64 length=${mediaBase64.length}`);
          } else {
            console.log(`🖼️ Failed to download/process image`);
          }
        } else {
          console.log(`🖼️ No base64 or media URL found in image message`);
        }
      } else if (isAudioMessage) {
        console.log("🎤 Detected audio message");
        console.log("🎤 Audio message data:", JSON.stringify(audioMessage, null, 2));
        messageText = "Áudio enviado";
        
        // PROCURAR BASE64 DE ÁUDIO!
        const evolutionMessage = evolutionData.data as any;
        console.log(`🔍 [AUDIO BASE64 SEARCH] Searching for audio base64...`);
        
        let foundAudioBase64: string | undefined;
        
        if (evolutionMessage.message?.base64) {
          foundAudioBase64 = evolutionMessage.message.base64;
          console.log(`🎯 Found audio base64 at evolutionMessage.message.base64`);
        } else if (evolutionMessage.base64) {
          foundAudioBase64 = evolutionMessage.base64;
          console.log(`🎯 Found audio base64 at evolutionMessage.base64`);
        } else if ((audioMessage as any)?.base64) {
          foundAudioBase64 = (audioMessage as any).base64;
          console.log(`🎯 Found audio base64 at audioMessage.base64`);
        } else {
          console.log(`❌ No audio base64 found in any expected location`);
        }
        
        if (foundAudioBase64) {
          console.log(`🎯 USING EXISTING AUDIO BASE64 from Evolution API!`);
          mediaBase64 = foundAudioBase64;
          mimeType = 'audio/ogg'; // Default para WhatsApp
          
          console.log(`🎯 Evolution API audio base64 ready: base64 length=${foundAudioBase64.length}`);
        } else {
          console.log(`🎤 No audio base64 found`);
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

      // Buscar companyId da instância para passar no contexto
      let companyId = undefined;
      try {
        const aiService = new AIService();
        const dbInstanceId = await aiService.findDatabaseInstanceId(data.instanceId);
        console.log(`🏢 [WEBHOOK] InstanceId: ${data.instanceId}, dbInstanceId: ${dbInstanceId}`);
        if (dbInstanceId) {
          const storage = getStorage();
          const instance = await storage.getWhatsappInstance(dbInstanceId);
          companyId = instance?.companyId;
          console.log(`🏢 [WEBHOOK] CompanyId encontrado: ${companyId}`);
        } else {
          console.log(`⚠️ [WEBHOOK] dbInstanceId não encontrado para instanceId: ${data.instanceId}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch companyId from instance: ${error}`);
      }

      // Processar mensagem com IA (incluindo dados de imagem se presente)
      const messageContext = {
        phone: senderPhone,
        message: messageText,
        instanceId: data.instanceId, // IMPORTANTE: Usar o instanceId real, não o nome
        companyId: companyId, // Adicionar companyId para o contexto
        mediaUrl,
        mediaBase64,
        caption,
        mimeType,
        messageType: isImageMessage ? 'image' : isAudioMessage ? 'audio' : 'text'
      };

      console.log(`🔄 About to call AIService.processMessage with:`, {
        ...messageContext,
        mediaBase64: mediaBase64 ? `[${mediaBase64.length} chars]` : undefined // Não logar base64 completo
      });
      
      console.log(`🚀🚀🚀 [WEBHOOK] CHAMANDO AIService.processMessage AGORA!`);
      const aiService = new AIService();
      
      let aiResponse;
      try {
        aiResponse = await aiService.processMessage(messageContext);
        console.log(`🏁🏁🏁 [WEBHOOK] AIService.processMessage RETORNOU COM SUCESSO:`, aiResponse);
      } catch (error) {
        console.error(`💥💥💥 [WEBHOOK] ERRO no AIService.processMessage:`, error);
        console.error(`💥 [WEBHOOK] Error stack:`, error instanceof Error ? error.stack : 'No stack');
        return; // Para prevenir erros downstream
      }
      
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
        caption,
        mimeType
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

      // Buscar companyId da instância
      const storage = getStorage();
      let companyId = null;
      
      try {
        // Buscar em todas as empresas para encontrar a instância
        const companies = await storage.getAllCompanies();
        for (const company of companies) {
          const instances = await storage.getWhatsappInstancesByCompany(company.id);
          const found = instances.find(i => 
            i.evolutionInstanceId === instanceId || 
            (instanceId === "e5b71c35-276b-417e-a1c3-267f904b2b98" && i.name === "deploy2")
          );
          
          if (found) {
            companyId = company.id;
            console.log(`🏢 [WEBHOOK] CompanyId encontrado: ${companyId} para instância: ${instanceId}`);
            break;
          }
        }
        
        if (!companyId) {
          console.log(`⚠️ [WEBHOOK] CompanyId não encontrado para instância: ${instanceId}`);
        }
      } catch (error) {
        console.error(`❌ [WEBHOOK] Erro ao buscar companyId:`, error);
      }

      // Processar mensagem com IA
      const aiService = new AIService();
      const aiResponse = await aiService.processMessage({
        phone: senderPhone,
        message: messageText,
        instanceId: instanceId,
        companyId: companyId || undefined
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
    
    console.log("🔍 [FILTER] shouldProcessEvolutionMessage called");
    console.log("🔍 [FILTER] data.key:", JSON.stringify(data.key, null, 2));
    console.log("🔍 [FILTER] data.messageType:", data.messageType);
    console.log("🔍 [FILTER] data.status:", data.status);
    console.log("🔍 [FILTER] evolutionData.destination:", evolutionData.destination);
    console.log("🔍 [FILTER] Available message types:", Object.keys(data.message));
    
    // CRÍTICO: Verificar se a mensagem foi enviada por nós (evitar loop infinito)
    if (data.key?.fromMe === true) {
      console.log("❌ [FILTER] Evolution message ignored - message sent by us (fromMe: true)");
      return false;
    }
    
    // Verificação adicional para mensagens PENDING com destination
    if (data.status === 'PENDING' && evolutionData.destination) {
      console.log("❌ Evolution message ignored - message sent by us (detected via status and destination)");
      return false;
    }
    
    // Verificar se tem conteúdo de texto, imagem ou áudio
    const messageText = data.message.conversation || data.message.extendedTextMessage?.text;
    const imageMessage = data.message.imageMessage;
    const audioMessage = data.message.audioMessage;
    
    if (!messageText && !imageMessage && !audioMessage) {
      console.log("❌ Evolution message ignored - no text, image or audio content");
      return false;
    }

    // Se tem texto mas não tem imagem/áudio, verificar se está vazio
    if (messageText && !imageMessage && !audioMessage && messageText.trim().length === 0) {
      console.log("❌ Evolution message ignored - empty text content");
      return false;
    }

    // Verificar se o tipo de mensagem é suportado (texto, imagem ou áudio)
    const supportedTypes = ['conversation', 'extendedTextMessage', 'imageMessage', 'audioMessage'];
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

      // Detectar URLs de imagens na resposta
      const imageUrlRegex = /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?/gi;
      const imageUrls = response.match(imageUrlRegex);
      
      if (imageUrls && imageUrls.length > 0) {
        console.log(`📸 [PHOTOS] Encontradas ${imageUrls.length} URLs de imagens na resposta`);
        
        // Enviar texto primeiro (sem as URLs)
        let cleanResponse = response;
        imageUrls.forEach((url, index) => {
          cleanResponse = cleanResponse.replace(url, `[Foto ${index + 1}]`);
        });
        
        console.log(`📡 Enviando resposta de texto...`);
        await evolutionService.sendMessage(instanceId, phone, cleanResponse);
        
        // Enviar cada imagem separadamente
        for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
          const imageUrl = imageUrls[i];
          console.log(`📸 [PHOTOS] Enviando imagem ${i + 1}: ${imageUrl}`);
          
          try {
            await evolutionService.sendPhotoFromUrl(instanceId, phone, imageUrl, `📸 Foto ${i + 1} do imóvel`);
            console.log(`✅ [PHOTOS] Imagem ${i + 1} enviada com sucesso`);
            
            // Pequena pausa entre envios
            if (i < imageUrls.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } catch (photoError) {
            console.error(`❌ [PHOTOS] Erro ao enviar imagem ${i + 1}:`, photoError);
            // Continue com as próximas imagens mesmo se uma falhar
          }
        }
        
        if (imageUrls.length > 5) {
          await evolutionService.sendMessage(instanceId, phone, `💡 Foram encontradas ${imageUrls.length} fotos, mas enviei apenas as primeiras 5 para melhor experiência.`);
        }
        
      } else {
        // Enviar mensagem normal se não há imagens
        console.log(`📡 Calling evolutionService.sendMessage with instance: ${instanceId}, phone: ${phone}`);
        await evolutionService.sendMessage(instanceId, phone, response);
      }
      
      console.log(`📤 Response sent to ${phone}`);
    } catch (error) {
      console.error("❌ Error sending response:", error);
      throw error;
    }
  }
}

export const whatsappWebhookService = new WhatsAppWebhookService();