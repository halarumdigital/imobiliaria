import { getStorage } from "../storage";
import { ScheduledMessage } from "@shared/schema";
import { EvolutionApiService } from "./evolutionApi";

export class ScheduledMessageProcessor {
  private static instance: ScheduledMessageProcessor;
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ScheduledMessageProcessor {
    if (!ScheduledMessageProcessor.instance) {
      ScheduledMessageProcessor.instance = new ScheduledMessageProcessor();
    }
    return ScheduledMessageProcessor.instance;
  }

  // Iniciar o processador com verificação a cada minuto
  start(): void {
    if (this.intervalId) {
      console.log("⚠️ Scheduled message processor already running");
      return;
    }

    console.log("🚀 Starting scheduled message processor...");
    
    // Processar imediatamente
    this.processScheduledMessages();
    
    // Processar a cada minuto
    this.intervalId = setInterval(() => {
      this.processScheduledMessages();
    }, 60000); // 1 minuto

    console.log("✅ Scheduled message processor started");
  }

  // Parar o processador
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 Scheduled message processor stopped");
    }
  }

  // Processar mensagens agendadas
  private async processScheduledMessages(): Promise<void> {
    if (this.isProcessing) {
      console.log("⏳ Processor already running, skipping...");
      return;
    }

    this.isProcessing = true;
    
    try {
      const storage = getStorage();
      await storage.init();

      // Buscar mensagens pendentes
      const pendingMessages = await storage.getPendingScheduledMessages();
      
      if (pendingMessages.length > 0) {
        console.log(`📨 Processing ${pendingMessages.length} scheduled messages`);
        
        for (const message of pendingMessages) {
          await this.processSingleMessage(message);
        }
      }
      
    } catch (error: any) {
      // Se a tabela não existe, não é um erro crítico - o sistema ainda está se inicializando
      if (error.code === 'ER_NO_SUCH_TABLE' && error.sqlMessage?.includes('scheduled_messages')) {
        console.log("⏳ Scheduled messages table not yet created - skipping processor run");
      } else {
        console.error("❌ Error processing scheduled messages:", error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Processar uma mensagem específica
  private async processSingleMessage(scheduledMessage: ScheduledMessage): Promise<void> {
    const storage = getStorage();
    
    try {
      console.log(`🎯 Processing scheduled message: ${scheduledMessage.id}`);
      
      // Marcar como em processamento
      await storage.updateScheduledMessage(scheduledMessage.id, {
        status: 'processing',
        startedAt: new Date()
      });

      // Buscar lista de contatos
      const contactList = await storage.getContactList(scheduledMessage.contactListId);
      if (!contactList) {
        throw new Error("Lista de contatos não encontrada");
      }

      // Buscar contatos da lista
      const contacts = await storage.getContactListItems(scheduledMessage.contactListId);
      const validContacts = contacts.filter(contact => contact.valid);

      if (validContacts.length === 0) {
        throw new Error("Nenhum contato válido encontrado na lista");
      }

      console.log(`📞 Sending to ${validContacts.length} contacts`);

      // Processar envios
      let sentCount = 0;
      let failedCount = 0;

      // Determinar se são múltiplas mensagens de texto
      const isMultipleTextMessages = scheduledMessage.messageType === 'text' && 
                                   scheduledMessage.useMultipleMessages && 
                                   scheduledMessage.messages && 
                                   scheduledMessage.messages.length > 0;

      const messagesToSend = isMultipleTextMessages 
        ? scheduledMessage.messages 
        : [scheduledMessage.messageContent];

      console.log(`📨 Will send ${messagesToSend.length} message(s) to ${validContacts.length} contacts`);
      if (isMultipleTextMessages) {
        console.log(`📝 Multiple messages:`, messagesToSend);
      }

      for (const contact of validContacts) {
        try {
          // Selecionar instância (aleatório se múltiplas)
          const instanceId = this.selectInstance(scheduledMessage);
          
          // Enviar cada mensagem separadamente
          for (let i = 0; i < messagesToSend.length; i++) {
            const messageContent = messagesToSend[i];
            
            console.log(`📱 Sending message ${i + 1}/${messagesToSend.length} to ${contact.name} (${contact.phone})`);
            
            // Criar objeto de mensagem para cada envio
            const messageToSend = {
              ...scheduledMessage,
              messageContent,
              // Para múltiplas mensagens, forçar como text simples
              useMultipleMessages: false,
              messages: undefined
            };
            
            await this.sendMessage(instanceId, contact.phone, messageToSend);
            
            sentCount++;
            console.log(`✅ Message ${i + 1}/${messagesToSend.length} sent to ${contact.name} (${contact.phone})`);

            // Aguardar intervalo entre mensagens (exceto na última mensagem do contato)
            const isLastMessage = (i === messagesToSend.length - 1);
            const isLastContact = (validContacts.indexOf(contact) === validContacts.length - 1);
            
            if (!isLastMessage || !isLastContact) {
              const interval = this.getRandomInterval(scheduledMessage.intervalMin, scheduledMessage.intervalMax);
              console.log(`⏱️ Waiting ${interval / 1000}s before next message...`);
              await this.sleep(interval);
            }
          }

        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to send messages to ${contact.name} (${contact.phone}):`, error);
        }

        // Atualizar progresso periodicamente
        await storage.updateScheduledMessage(scheduledMessage.id, {
          sentMessages: sentCount,
          failedMessages: failedCount
        });
      }

      // Marcar como concluído
      await storage.updateScheduledMessage(scheduledMessage.id, {
        status: 'completed',
        sentMessages: sentCount,
        failedMessages: failedCount,
        completedAt: new Date()
      });

      console.log(`✅ Completed scheduled message: ${scheduledMessage.id} - Sent: ${sentCount}, Failed: ${failedCount}`);

    } catch (error) {
      console.error(`❌ Error processing message ${scheduledMessage.id}:`, error);
      
      // Marcar como falhou
      await storage.updateScheduledMessage(scheduledMessage.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      });
    }
  }

  // Selecionar instância para envio
  private selectInstance(scheduledMessage: ScheduledMessage): string {
    if (!scheduledMessage.useMultipleInstances || scheduledMessage.instanceIds.length === 1) {
      return scheduledMessage.instanceIds[0];
    }

    // Seleção aleatória se múltiplas instâncias
    const randomIndex = Math.floor(Math.random() * scheduledMessage.instanceIds.length);
    return scheduledMessage.instanceIds[randomIndex];
  }

  // Gerar intervalo aleatório entre min e max
  private getRandomInterval(min: number, max: number): number {
    const minMs = min * 1000;
    const maxMs = max * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  // Função para aguardar
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Envio real através da Evolution API
  private async sendMessage(instanceId: string, phone: string, scheduledMessage: ScheduledMessage): Promise<void> {
    const storage = getStorage();
    
    try {
      // 1. Buscar configuração da Evolution API
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        throw new Error("Configuração da Evolution API não encontrada");
      }

      // 2. Buscar dados da instância WhatsApp para obter evolutionInstanceId
      const whatsappInstance = await storage.getWhatsappInstance(instanceId);
      if (!whatsappInstance) {
        throw new Error(`Instância WhatsApp ${instanceId} não encontrada`);
      }

      if (!whatsappInstance.evolutionInstanceId) {
        throw new Error(`Instância ${whatsappInstance.name} não possui evolutionInstanceId configurado`);
      }

      // 3. Criar serviço da Evolution API
      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      // 4. Formatear número para padrão da Evolution API
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

      // 5. Enviar mensagem baseada no tipo
      if (scheduledMessage.messageType === 'text') {
        console.log(`📱 Sending TEXT message to ${phone} via ${whatsappInstance.evolutionInstanceId}`);
        console.log(`💬 Message content: "${scheduledMessage.messageContent}"`);
        
        const result = await evolutionService.sendMessage(
          whatsappInstance.evolutionInstanceId,
          formattedPhone,
          scheduledMessage.messageContent
        );
        
        console.log(`✅ Text message sent successfully:`, result);
        
      } else if (['image', 'audio', 'video'].includes(scheduledMessage.messageType)) {
        console.log(`📁 Sending ${scheduledMessage.messageType.toUpperCase()} message to ${phone} via ${whatsappInstance.evolutionInstanceId}`);
        
        // Verificar se o arquivo base64 está disponível
        if (!scheduledMessage.fileBase64) {
          throw new Error(`Arquivo base64 não encontrado para mensagem de ${scheduledMessage.messageType}`);
        }

        if (!scheduledMessage.fileName) {
          throw new Error(`Nome do arquivo não encontrado para mensagem de ${scheduledMessage.messageType}`);
        }

        console.log(`📎 File details: ${scheduledMessage.fileName} (${Math.round(scheduledMessage.fileBase64.length * 0.75 / 1024)} KB)`);
        
        const mediaData = {
          mediaBase64: scheduledMessage.fileBase64,
          fileName: scheduledMessage.fileName,
          mediaType: scheduledMessage.messageType as 'image' | 'audio' | 'video',
          caption: scheduledMessage.messageContent || undefined // Use messageContent as caption for media
        };

        const result = await evolutionService.sendMedia(
          whatsappInstance.evolutionInstanceId,
          formattedPhone,
          mediaData
        );
        
        console.log(`✅ ${scheduledMessage.messageType} message sent successfully:`, result);
        
      } else {
        throw new Error(`Tipo de mensagem ${scheduledMessage.messageType} não suportado`);
      }

    } catch (error) {
      console.error(`❌ Error sending message to ${phone}:`, error);
      throw error; // Re-throw para que o processador principal possa contar como falha
    }
  }
}

// Instância global do processador
export const scheduledMessageProcessor = ScheduledMessageProcessor.getInstance();