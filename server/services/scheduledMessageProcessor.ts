import { getStorage } from "../storage";
import { EvolutionApiService } from "./evolutionApi";
import { ScheduledMessage } from "@shared/schema";

class ScheduledMessageProcessor {
  private processingInterval: NodeJS.Timeout | null = null;
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private evolutionApiService: EvolutionApiService | null = null;

  start() {
    console.log("🚀🚀🚀 SCHEDULED MESSAGE PROCESSOR STARTED AT", new Date().toISOString());
    console.log("⏰ Will check for messages every 30 seconds");
    console.log("🔍 Will check for stuck messages every 5 minutes");
    
    // Check for pending messages every 30 seconds
    this.processingInterval = setInterval(() => {
      console.log("⏰ [Processor] Checking for scheduled messages at", new Date().toISOString());
      this.processScheduledMessages();
    }, 30000); // 30 seconds

    // Check for stuck messages every 5 minutes
    this.timeoutCheckInterval = setInterval(() => {
      console.log("🔍 [Processor] Checking for stuck messages at", new Date().toISOString());
      this.checkStuckMessages();
    }, 300000); // 5 minutes

    // Process immediately on start
    console.log("🏃 [Processor] Running initial check...");
    this.processScheduledMessages();
    this.checkStuckMessages();
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
  }

  private async checkStuckMessages() {
    try {
      const storage = getStorage();
      
      // Get all messages that have been processing for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      // This is a simplified version - you might need to add a method to storage
      // to get messages by status and started time
      const messages = await storage.getScheduledMessagesByStatus('processing');
      
      for (const message of messages) {
        if (message.startedAt && new Date(message.startedAt) < thirtyMinutesAgo) {
          console.log(`⚠️ Message ${message.id} stuck in processing for over 30 minutes, marking as failed`);
          
          await storage.updateScheduledMessage(message.id, {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: 'Processamento travado - timeout após 30 minutos'
          });
        }
      }
    } catch (error) {
      console.error("Error checking stuck messages:", error);
    }
  }

  private async processScheduledMessages() {
    if (this.isProcessing) {
      console.log("⏳ Already processing messages, skipping this cycle");
      return;
    }

    this.isProcessing = true;
    console.log("🔎 [Processor] Searching for pending messages...");

    try {
      const storage = getStorage();
      await storage.init(); // Ensure storage is initialized
      
      const pendingMessages = await storage.getPendingScheduledMessages();
      console.log(`📊 [Processor] Query returned ${pendingMessages.length} pending messages`);

      if (pendingMessages.length === 0) {
        console.log("😴 [Processor] No pending messages found");
        return;
      }

      console.log(`📨 Found ${pendingMessages.length} messages to process:`, 
        pendingMessages.map(m => ({ 
          id: m.id, 
          status: m.status, 
          scheduledDateTime: m.scheduledDateTime 
        }))
      );

      for (const message of pendingMessages) {
        await this.processSingleMessage(message);
      }
    } catch (error) {
      console.error("Error processing scheduled messages:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async getEvolutionApiService(): Promise<EvolutionApiService> {
    if (!this.evolutionApiService) {
      const storage = getStorage();
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      
      if (!evolutionConfig || !evolutionConfig.evolutionURL || !evolutionConfig.evolutionToken) {
        throw new Error("Configuração da Evolution API não encontrada");
      }
      
      this.evolutionApiService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });
    }
    
    return this.evolutionApiService;
  }

  private async processSingleMessage(message: ScheduledMessage) {
    const storage = getStorage();
    
    try {
      console.log(`📤 Processing message ${message.id}`);
      
      // Get Evolution API service
      const evolutionApiService = await this.getEvolutionApiService();
      
      // Mark as processing
      await storage.updateScheduledMessage(message.id, {
        status: 'processing',
        startedAt: new Date()
      });

      // Get contact list
      const contactList = await storage.getContactList(message.contactListId);
      if (!contactList) {
        throw new Error("Lista de contatos não encontrada");
      }

      // Get contact list items
      const contacts = await storage.getContactListItems(message.contactListId);
      console.log(`📋 Found ${contacts.length} total contacts for list ${message.contactListId}`);
      
      const validContacts = contacts.filter(c => c.valid);
      console.log(`✅ ${validContacts.length} valid contacts to process`);

      if (validContacts.length === 0) {
        throw new Error("Nenhum contato válido na lista");
      }

      // Get instances
      const instances = await storage.getWhatsappInstancesByIds(message.instanceIds);
      console.log(`📋 Retrieved ${instances.length} instances:`, instances.map(i => ({ 
        id: i.id, 
        name: i.name, 
        status: i.status, 
        evolutionId: i.evolutionId 
      })));
      
      const connectedInstances = instances.filter(i => i.status === 'connected');
      console.log(`🟢 ${connectedInstances.length} connected instances:`, connectedInstances.map(i => ({ 
        id: i.id, 
        name: i.name, 
        evolutionId: i.evolutionId 
      })));

      if (connectedInstances.length === 0) {
        throw new Error("Nenhuma instância conectada disponível");
      }

      let sentCount = 0;
      let failedCount = 0;
      let currentInstanceIndex = 0;

      console.log(`🚀 Starting to process ${validContacts.length} contacts...`);
      
      // Process each contact
      for (const contact of validContacts) {
        console.log(`📱 Processing contact ${sentCount + 1}/${validContacts.length}: ${contact.phone}`);
        try {
          // Select instance (random or round-robin)
          let selectedInstance;
          if (message.useMultipleInstances && message.randomizeInstances) {
            const randomIndex = Math.floor(Math.random() * connectedInstances.length);
            selectedInstance = connectedInstances[randomIndex];
            console.log(`🎲 Selected random instance ${randomIndex}: ${selectedInstance.name} (${selectedInstance.evolutionId})`);
          } else if (message.useMultipleInstances) {
            const instanceIndex = currentInstanceIndex % connectedInstances.length;
            selectedInstance = connectedInstances[instanceIndex];
            console.log(`🔄 Selected round-robin instance ${instanceIndex}: ${selectedInstance.name} (${selectedInstance.evolutionId})`);
            currentInstanceIndex++;
          } else {
            selectedInstance = connectedInstances[0];
            console.log(`🎯 Selected single instance: ${selectedInstance.name} (${selectedInstance.evolutionId})`);
          }
          
          if (!selectedInstance || !selectedInstance.evolutionId) {
            console.error(`❌ Selected instance is invalid:`, selectedInstance);
            throw new Error(`Instância selecionada é inválida: ${selectedInstance?.name || 'unknown'}`);
          }

          // Format phone number (remove non-digits and add country code if needed)
          let phoneNumber = contact.phone.replace(/\D/g, '');
          if (!phoneNumber.startsWith('55')) {
            phoneNumber = '55' + phoneNumber;
          }

          // Send message based on type
          console.log(`📨 Sending ${message.messageType} message to ${phoneNumber} via instance ${selectedInstance.evolutionId}`);
          
          if (message.messageType === 'text') {
            const messages = message.useMultipleMessages && message.messages 
              ? message.messages 
              : [message.messageContent];

            console.log(`📝 Sending ${messages.length} text message(s)`);
            
            for (const textMessage of messages) {
              console.log(`📤 Sending text: "${textMessage.substring(0, 50)}..."`);
              await evolutionApiService.sendTextMessage(
                selectedInstance.evolutionId,
                phoneNumber,
                textMessage
              );
              console.log(`✅ Text message sent successfully`);
              
              // Wait between messages
              if (messages.length > 1) {
                await this.delay(2000); // 2 seconds between multiple messages to same contact
              }
            }
          } else if (message.messageType === 'image' && message.fileBase64) {
            await evolutionApiService.sendImageMessage(
              selectedInstance.evolutionId,
              phoneNumber,
              message.fileBase64,
              message.messageContent // caption
            );
          } else if (message.messageType === 'audio' && message.fileBase64) {
            await evolutionApiService.sendAudioMessage(
              selectedInstance.evolutionId,
              phoneNumber,
              message.fileBase64
            );
          } else if (message.messageType === 'video' && message.fileBase64) {
            await evolutionApiService.sendVideoMessage(
              selectedInstance.evolutionId,
              phoneNumber,
              message.fileBase64,
              message.messageContent // caption
            );
          }

          sentCount++;
          console.log(`✅ Sent message ${sentCount}/${validContacts.length} to ${contact.phone}`);

          // Update progress
          await storage.updateScheduledMessage(message.id, {
            sentMessages: sentCount,
            failedMessages: failedCount
          });
          console.log(`📊 Updated progress: ${sentCount} sent, ${failedCount} failed`);

          // Random delay between contacts (skip delay for last contact)
          if (sentCount + failedCount < validContacts.length) {
            const delayMs = this.getRandomDelay(message.intervalMin, message.intervalMax);
            console.log(`⏱️ Waiting ${delayMs}ms before next message`);
            await this.delay(delayMs);
          }

        } catch (error: any) {
          console.error(`❌ Failed to send to ${contact.phone}:`, error);
          console.error(`❌ Error details:`, {
            message: error.message,
            stack: error.stack,
            response: error.response
          });
          failedCount++;
          
          // Update failed count immediately
          await storage.updateScheduledMessage(message.id, {
            sentMessages: sentCount,
            failedMessages: failedCount
          });
        }
      }

      // Mark as completed
      console.log(`🎯 Marking message ${message.id} as completed...`);
      await storage.updateScheduledMessage(message.id, {
        status: 'completed',
        completedAt: new Date(),
        sentMessages: sentCount,
        failedMessages: failedCount
      });

      console.log(`✅ Message ${message.id} completed: ${sentCount} sent, ${failedCount} failed`);

    } catch (error: any) {
      console.error(`❌ Failed to process message ${message.id}:`, error);
      
      await storage.updateScheduledMessage(message.id, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message || 'Erro desconhecido ao processar mensagem'
      });
    }
  }

  private getRandomDelay(minSeconds: number, maxSeconds: number): number {
    const min = minSeconds * 1000;
    const max = maxSeconds * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const scheduledMessageProcessor = new ScheduledMessageProcessor();