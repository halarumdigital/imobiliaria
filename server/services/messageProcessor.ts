import { aiService } from "./aiService";
import { whatsappWebhookService } from "./whatsappWebhook";

// Serviço para testar o processamento de mensagens
export class MessageProcessorService {
  
  // Método para testar uma mensagem sem webhook real
  async testMessage(instanceId: string, phone: string, message: string): Promise<any> {
    try {
      console.log(`🧪 Testing message processing...`);
      console.log(`📱 Instance: ${instanceId}`);
      console.log(`📞 Phone: ${phone}`);
      console.log(`💬 Message: "${message}"`);

      // Simular dados do webhook
      const webhookData = {
        event: 'message',
        instance: instanceId,
        data: {
          key: {
            remoteJid: `${phone}@s.whatsapp.net`,
            fromMe: false,
            id: `test-${Date.now()}`
          },
          message: {
            conversation: message
          },
          messageTimestamp: Date.now(),
          pushName: 'Test User',
          instance: instanceId
        }
      };

      // Processar com o serviço de webhook
      await whatsappWebhookService.handleMessage(webhookData);

      return {
        success: true,
        message: "Mensagem processada com sucesso!"
      };

    } catch (error) {
      console.error("❌ Error in test:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }
}

export const messageProcessorService = new MessageProcessorService();