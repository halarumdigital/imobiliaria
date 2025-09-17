import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { getStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface MessageContext {
  phone: string;
  message: string;
  instanceId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mediaUrl?: string;
  mediaBase64?: string;
  caption?: string;
  mimeType?: string;
  messageType?: string;
  pushName?: string; // Nome do contato no WhatsApp
}

export interface AgentResponse {
  response: string;
  shouldDelegate?: boolean;
  delegatedAgentId?: string;
  activeAgentId?: string;
  activeAgentName?: string;
  activeAgentType?: string;
}

export class AIService {
  async processMessage(context: MessageContext): Promise<AgentResponse | null> {
    const aiProcessId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();

    try {
      console.log(`🤖 [AI-${aiProcessId}] ========================================`);
      console.log(`🤖 [AI-${aiProcessId}] AIService.processMessage called`);
      console.log(`🤖 [AI-${aiProcessId}] Instance: ${context.instanceId}`);
      console.log(`🤖 [AI-${aiProcessId}] Phone: ${context.phone}`);
      console.log(`🤖 [AI-${aiProcessId}] Message: "${context.message}"`);
      console.log(`🤖 [AI-${aiProcessId}] Message type: ${context.messageType || 'text'}`);
      console.log(`🤖 [AI-${aiProcessId}] Has media: ${!!context.mediaBase64}`);
      console.log(`🤖 [AI-${aiProcessId}] Push name: ${context.pushName || 'none'}`);

      const storage = getStorage();

      // Buscar a instância diretamente pelo evolutionInstanceId
      let instance = await storage.getWhatsappInstanceByEvolutionId(context.instanceId);

      // Se não encontrou e temos um databaseInstanceId, usar ele
      if (!instance && (context as any).databaseInstanceId) {
        console.log(`🔄 Using databaseInstanceId as fallback: ${(context as any).databaseInstanceId}`);
        instance = await storage.getWhatsappInstance((context as any).databaseInstanceId);
      }

      // Se ainda não encontrou, tentar fallback para deploy2 (temporário)
      if (!instance && context.instanceId === "e5b71c35-276b-417e-a1c3-267f904b2b98") {
        console.log(`🎯 FALLBACK ESPECÍFICO: Mapeando ${context.instanceId} -> buscando deploy2`);
        const companies = await storage.getAllCompanies();
        for (const company of companies) {
          const instances = await storage.getWhatsappInstancesByCompany(company.id);
          const found = instances.find(i => i.name === "deploy2");
          if (found) {
            instance = found;
            console.log(`✅ Found deploy2 instance via fallback`);
            break;
          }
        }
      }
      
      if (!instance) {
        console.error(`❌ [AI-${aiProcessId}] No instance found for instanceId: ${context.instanceId}`);
        return null;
      }

      console.log(`✅ [AI-${aiProcessId}] Instance found: ${instance.name} (DB ID: ${instance.id})`);

      if (!instance.aiAgentId) {
        console.error(`❌ [AI-${aiProcessId}] No agent linked to instance ${instance.name}. AgentId: ${instance.aiAgentId}`);
        return null;
      }

      console.log(`🔗 [AI-${aiProcessId}] Instance has agent linked: ${instance.aiAgentId}`);

      // Buscar o agente principal
      console.log(`🔍 Looking for agent with ID: ${instance.aiAgentId}`);
      const mainAgent = await storage.getAiAgent(instance.aiAgentId);
      if (!mainAgent) {
        console.log(`❌ Agent ${instance.aiAgentId} not found`);
        return null;
      }
      console.log(`✅ Agent found: ${mainAgent.name}`);

      // Verificar se deve delegar para um agente secundário
      console.log(`🔍 Verificando delegação para agente principal: ${mainAgent.name}`);
      const delegatedAgent = await this.checkDelegation(mainAgent, context.message);
      const activeAgent = delegatedAgent || mainAgent;
      
      if (delegatedAgent) {
        console.log(`🔄 DELEGAÇÃO ATIVADA! Mudando de "${mainAgent.name}" para "${delegatedAgent.name}"`);
      } else {
        console.log(`📋 Sem delegação. Usando agente principal: ${mainAgent.name}`);
      }

      // Buscar configuração global de IA (nível administrador)
      const aiConfig = await storage.getAiConfiguration();
      console.log(`🔍 DEBUG: AI Config retrieved:`, aiConfig);
      if (!aiConfig) {
        console.log(`❌ Global AI config not found`);
        return null;
      }
      
      if (!aiConfig.apiKey) {
        console.log(`❌ AI Config exists but apiKey is missing:`, aiConfig);
        return null;
      }
      
      console.log(`✅ AI Config found with apiKey: ${aiConfig.apiKey ? 'YES (length: ' + aiConfig.apiKey.length + ')' : 'NO'}`);
      console.log(`🔧 AI Config details:`, {
        temperatura: aiConfig.temperatura,
        temperaturaType: typeof aiConfig.temperatura,
        numeroTokens: aiConfig.numeroTokens,
        numeroTokensType: typeof aiConfig.numeroTokens,
        modelo: aiConfig.modelo,
        apiKeyPrefix: aiConfig.apiKey ? aiConfig.apiKey.substring(0, 10) + '...' : 'NONE'
      });
      console.log(`✅ Agent found: ${mainAgent.name}, ID: ${mainAgent.id}`);

      // Buscar histórico da conversa ANTES de gerar resposta
      console.log(`📚 [DEBUG] Carregando histórico da conversa para ${context.phone}...`);
      console.log(`📚 [DEBUG] InstanceId recebido: ${context.instanceId}`);
      
      let conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
      try {
        conversationHistory = await this.getConversationHistory(context.instanceId, context.phone);
        console.log(`📚 [DEBUG] Histórico carregado com SUCESSO: ${conversationHistory.length} mensagens`);
        
        if (conversationHistory.length > 0) {
          console.log(`📚 [DEBUG] Últimas mensagens do histórico:`, conversationHistory.slice(-3));
        }
      } catch (error) {
        console.error(`❌ [DEBUG] Erro ao carregar histórico:`, error);
        conversationHistory = [];
      }
      
      const contextWithHistory = {
        ...context,
        conversationHistory
      };
      
      console.log(`📚 [DEBUG] Context com histórico preparado - Total mensagens: ${conversationHistory.length}`);
      
      // Gerar resposta usando OpenAI
      console.log(`🤖 Gerando resposta com agente ativo: ${activeAgent.name} (Tipo: ${activeAgent.agentType || 'main'})`);
      console.log(`🔑 Testando inicialização OpenAI com chave: ${aiConfig.apiKey ? aiConfig.apiKey.substring(0, 8) + '...' : 'MISSING'}`);
      
      const response = await this.generateResponse(activeAgent, contextWithHistory, aiConfig);

      return {
        response,
        shouldDelegate: !!delegatedAgent,
        delegatedAgentId: delegatedAgent?.id,
        activeAgentId: activeAgent.id, // ID do agente que realmente respondeu
        activeAgentName: activeAgent.name,
        activeAgentType: activeAgent.agentType || 'main'
      };

    } catch (error) {
      console.error("Error processing message:", error);
      return null;
    }
  }

  private async getConversationHistory(evolutionInstanceId: string, phone: string): Promise<Array<{role: 'user' | 'assistant', content: string}>> {
    try {
      console.log(`📚 [HISTORY] Iniciando busca de histórico para evolutionId: ${evolutionInstanceId}, phone: ${phone}`);
      const storage = getStorage();
      
      // PRIMEIRO: Encontrar a instância do nosso banco usando o evolutionInstanceId
      console.log(`📚 [HISTORY] Buscando instância do banco...`);
      const dbInstanceId = await this.findDatabaseInstanceId(evolutionInstanceId);
      if (!dbInstanceId) {
        console.log(`❌ [HISTORY] Instância do banco não encontrada para evolutionId: ${evolutionInstanceId}`);
        return [];
      }
      
      console.log(`✅ [HISTORY] Instância do banco encontrada: ${dbInstanceId} (evolutionId: ${evolutionInstanceId})`);
      
      // Buscar conversa existente usando o ID correto do banco
      console.log(`📚 [HISTORY] Buscando conversas na instância ${dbInstanceId}...`);
      const conversations = await storage.getConversationsByInstance(dbInstanceId);
      console.log(`📚 [HISTORY] Total de conversas encontradas: ${conversations.length}`);
      
      const conversation = conversations.find(c => c.contactPhone === phone);
      
      if (!conversation) {
        console.log(`❌ [HISTORY] Nenhuma conversa encontrada para ${phone} na instância ${dbInstanceId}`);
        console.log(`📚 [HISTORY] Conversas disponíveis:`, conversations.map(c => ({ id: c.id, phone: c.contactPhone })));
        return [];
      }
      
      console.log(`✅ [HISTORY] Conversa encontrada: ${conversation.id} para telefone ${phone}`);
      
      // Buscar mensagens da conversa
      console.log(`📚 [HISTORY] Buscando mensagens da conversa ${conversation.id}...`);
      const messages = await storage.getMessagesByConversation(conversation.id);
      console.log(`📚 [HISTORY] Encontradas ${messages.length} mensagens na conversa`);
      
      if (messages.length > 0) {
        console.log(`📚 [HISTORY] Primeiras mensagens:`, messages.slice(0, 3).map(m => ({ sender: m.sender, content: m.content.substring(0, 50) + '...' })));
      }
      
      // Converter para formato OpenAI (últimas 10 mensagens para não sobrecarregar)
      const history = messages
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        })
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      console.log(`✅ [HISTORY] Histórico formatado com SUCESSO: ${history.length} mensagens`);
      if (history.length > 0) {
        console.log(`📚 [HISTORY] Histórico formatado:`, history);
      }
      
      return history;
      
    } catch (error) {
      console.error("❌ [HISTORY] Erro ao carregar histórico da conversa:", error);
      console.error("❌ [HISTORY] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  async findDatabaseInstanceId(evolutionInstanceId: string): Promise<string | null> {
    try {
      const storage = getStorage();
      const companies = await storage.getAllCompanies();
      
      for (const company of companies) {
        const instances = await storage.getWhatsappInstancesByCompany(company.id);
        
        // Buscar por evolutionInstanceId OU usar fallback
        let found = instances.find(i => i.evolutionInstanceId === evolutionInstanceId);
        
        // Fallback específico para IDs conhecidos
        if (!found && evolutionInstanceId === "e5b71c35-276b-417e-a1c3-267f904b2b98") {
          found = instances.find(i => i.name === "deploy2");
        }
        
        // Fallback para o ID atual do deploy10
        if (!found && evolutionInstanceId === "4d0f0895-9c71-4199-b48d-a3df4e3de3da") {
          found = instances.find(i => i.name === "deploy10");
        }
        
        if (found) {
          console.log(`🔍 Mapeamento encontrado: evolutionId=${evolutionInstanceId} -> dbId=${found.id}`);
          return found.id;
        }
      }
      
      console.log(`❌ Nenhuma instância encontrada para evolutionId: ${evolutionInstanceId}`);
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar instância do banco:", error);
      return null;
    }
  }

  private async checkDelegation(mainAgent: any, message: string): Promise<any | null> {
    try {
      const storage = getStorage();
      
      // Buscar agentes secundários vinculados ao agente principal
      const secondaryAgents = await storage.getSecondaryAgentsByParent(mainAgent.id);
      console.log(`🔗 Agentes secundários encontrados: ${secondaryAgents.length}`);
      
      if (!secondaryAgents || secondaryAgents.length === 0) {
        console.log(`❌ Nenhum agente secundário vinculado ao agente principal "${mainAgent.name}"`);
        return null;
      }

      // Verificar palavras-chave de delegação (mesma lógica do AiResponseService)
      const messageLower = message.toLowerCase();
      console.log(`🔍 Verificando delegação entre ${secondaryAgents.length} agentes secundários`);
      
      for (const agent of secondaryAgents) {
        if (agent.delegationKeywords && Array.isArray(agent.delegationKeywords) && agent.delegationKeywords.length > 0) {
          const keywords = agent.delegationKeywords;
          const hasKeyword = keywords.some(keyword => 
            messageLower.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword) {
            console.log(`✅ Palavras-chave encontradas para delegação ao agente: ${agent.name}`);
            console.log(`🔑 Keywords: ${agent.delegationKeywords.join(', ')}`);
            return agent;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking delegation:", error);
      return null;
    }
  }

  private async generateResponse(agent: any, context: MessageContext, aiConfig: any): Promise<string> {
    try {
      console.log(`🤖 [GENERATE] Starting generateResponse for agent: ${agent.name}`);
      console.log(`🔑 [GENERATE] API Key exists: ${!!aiConfig.apiKey}, length: ${aiConfig.apiKey?.length || 0}`);
      
      // Verificar se temos a chave OpenAI na configuração do administrador
      if (!aiConfig.apiKey) {
        return "Desculpe, o serviço de IA não está configurado. Entre em contato com o administrador.";
      }

      // Criar instância do OpenAI com a chave da configuração
      console.log(`🔧 [GENERATE] Creating OpenAI instance...`);
      const openai = new OpenAI({ apiKey: aiConfig.apiKey });
      console.log(`✅ [GENERATE] OpenAI instance created successfully`);

      // Construir o prompt do sistema baseado no agente (usando lógica do AiResponseService)
      let systemPrompt = agent.prompt || `Você é ${agent.name}, um assistente de IA especializado.`;
      
      // Adicionar conhecimento base se disponível
      if (agent.trainingContent && agent.trainingContent.trim()) {
        systemPrompt += `\n\n=== CONHECIMENTO BASE ===\n${agent.trainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
        systemPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
      }
      
      // Adicionar contexto de delegação se for agente secundário
      if (agent.agentType === 'secondary') {
        systemPrompt += `\n\nVocê é um agente especializado. Responda com base em sua especialização e conhecimento específico.`;
      }

      systemPrompt += `\n\nResponda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.`;

      // Construir histórico da conversa
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Adicionar histórico se disponível
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        messages.push(...context.conversationHistory.slice(-10)); // Últimas 10 mensagens
      }

      // Adicionar mensagem atual (com suporte a imagem e áudio)
      console.log(`🔍 [MEDIA CHECK] messageType: ${context.messageType}, has mediaBase64: ${!!context.mediaBase64}`);
      console.log(`🔍 [MEDIA CHECK] mediaBase64 length: ${context.mediaBase64?.length || 0}`);
      console.log(`🔍 [MEDIA CHECK] mimeType: ${context.mimeType}`);
      
      // PROCESSAR ÁUDIO PRIMEIRO (transcrever para texto)
      if (context.messageType === 'audio' && context.mediaBase64) {
        console.log(`🎤 ✅ PROCESSANDO ÁUDIO COM WHISPER!`);
        try {
          // Converter base64 para buffer
          const audioBuffer = Buffer.from(context.mediaBase64, 'base64');
          console.log(`🎤 Audio buffer size: ${audioBuffer.length} bytes`);
          
          // Salvar temporariamente em arquivo para OpenAI Whisper
          const tmpDir = '/tmp';
          const tmpFile = path.join(tmpDir, `audio_${Date.now()}.ogg`);
          
          fs.writeFileSync(tmpFile, audioBuffer);
          console.log(`🎤 Arquivo temporário criado: ${tmpFile}`);
          
          // Transcrever usando OpenAI Whisper
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tmpFile),
            model: "whisper-1",
          });
          
          console.log(`🎤 ✅ TRANSCRIÇÃO CONCLUÍDA!`);
          console.log(`🎤 Texto transcrito: "${transcription.text}"`);
          
          // Limpar arquivo temporário
          fs.unlinkSync(tmpFile);
          console.log(`🎤 Arquivo temporário removido`);
          
          // Usar o texto transcrito como mensagem
          context.message = transcription.text || "Não foi possível transcrever o áudio";
          
        } catch (error) {
          console.error("❌ Erro na transcrição de áudio:", error);
          context.message = "Desculpe, não consegui processar o áudio enviado.";
        }
      }
      
      if ((context.messageType === 'image' || context.messageType === 'imageMessage') && context.mediaBase64) {
        console.log(`🖼️ ✅ ENTRANDO NO PROCESSAMENTO DE IMAGEM!`);
        console.log(`🖼️ Image details: type=${context.mimeType}, size=${context.mediaBase64.length} chars`);
        
        // Usar o mimeType correto detectado pela detecção de magic bytes
        const mimeType = context.mimeType || 'image/jpeg';
        
        const userMessage: any = {
          role: "user",
          content: [
            {
              type: "text",
              text: context.caption ? `${context.message}\n\nDescrição da imagem: ${context.caption}` : context.message
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${context.mediaBase64}`
              }
            }
          ]
        };
        messages.push(userMessage);
      } else {
        messages.push({ role: "user", content: context.message });
      }

      // Gerar resposta usando OpenAI
      console.log(`🔧 [OPENAI] Pre-OpenAI call - temperatura: ${aiConfig.temperatura}, type: ${typeof aiConfig.temperatura}`);
      console.log(`🔧 [OPENAI] Pre-OpenAI call - numeroTokens: ${aiConfig.numeroTokens}, type: ${typeof aiConfig.numeroTokens}`);
      console.log(`🔧 [OPENAI] Messages count: ${messages.length}, has image: ${context.messageType === 'image' || context.messageType === 'imageMessage'}`);
      console.log(`🔧 [OPENAI] About to call OpenAI API...`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Hardcode para garantir - gpt-4o suporta imagens
        messages: messages,
        max_tokens: 1000, // Hardcode para garantir
        temperature: 0.7, // Hardcode para garantir
      });
      
      console.log(`✅ [OPENAI] OpenAI call successful, response length: ${response.choices[0]?.message?.content?.length || 0}`);

      return response.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";

    } catch (error) {
      console.error("❌ Error generating AI response - DETAILED:", {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      // Log específico se for erro da OpenAI
      if (error instanceof Error && error.message.includes('API')) {
        console.error("🔑 OpenAI API Error detected - checking configuration...");
        console.error("🔑 Error details:", error.message);
      }
      
      return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.";
    }
  }

  async saveConversation(evolutionInstanceId: string, phone: string, userMessage: string, aiResponse: string, agentId: string, messageData?: {
    messageType?: string;
    mediaUrl?: string;
    mediaBase64?: string;
    caption?: string;
    pushName?: string; // Nome do contato no WhatsApp
  }) {
    try {
      const storage = getStorage();
      
      // PRIMEIRO: Encontrar a instância do nosso banco usando o evolutionInstanceId
      const dbInstanceId = await this.findDatabaseInstanceId(evolutionInstanceId);
      if (!dbInstanceId) {
        console.log(`💾 Erro: Instância do banco não encontrada para salvar conversa. EvolutionId: ${evolutionInstanceId}`);
        return null;
      }
      
      console.log(`💾 Salvando conversa na instância: ${dbInstanceId} (evolutionId: ${evolutionInstanceId})`);
      
      // Buscar conversa existente usando o ID correto do banco
      const conversations = await storage.getConversationsByInstance(dbInstanceId);
      let conversation = conversations.find(c => c.contactPhone === phone);
      
      let isNewConversation = false;
      if (!conversation) {
        console.log(`💾 Criando nova conversa para ${phone}`);
        isNewConversation = true;
        conversation = await storage.createConversation({
          whatsappInstanceId: dbInstanceId,
          contactPhone: phone,
          lastMessage: userMessage
        });
      } else {
        console.log(`💾 Usando conversa existente: ${conversation.id}`);
      }
      
      // 🎯 NOVA FUNCIONALIDADE: Criar customer automaticamente no kanban (verifica se já existe)
      await this.createOrUpdateCustomerFromConversation(dbInstanceId, phone, conversation.id, messageData?.pushName);

      // Salvar mensagem do usuário (com dados de imagem se presente)
      const userMessageData: any = {
        conversationId: conversation.id,
        content: userMessage,
        sender: 'user',
        messageType: messageData?.messageType || 'text'
      };

      // Adicionar dados de imagem se presente
      if (messageData) {
        if (messageData.mediaUrl) userMessageData.mediaUrl = messageData.mediaUrl;
        if (messageData.mediaBase64) userMessageData.mediaBase64 = messageData.mediaBase64;
        if (messageData.caption) userMessageData.caption = messageData.caption;
      }

      await storage.createMessage(userMessageData);

      // Salvar resposta do AI
      await storage.createMessage({
        conversationId: conversation.id,
        content: aiResponse,
        sender: 'assistant',
        agentId: agentId, // Rastrear qual agente respondeu
        messageType: 'text'
      });

      console.log(`💾 Conversa salva com sucesso: ${conversation.id}`);
      return conversation;
    } catch (error) {
      console.error("❌ Error saving conversation:", error);
      throw error;
    }
  }

  // 🎯 NOVA FUNCIONALIDADE: Criar customer automaticamente no kanban para novas conversas
  private async createOrUpdateCustomerFromConversation(whatsappInstanceId: string, phone: string, conversationId: string, pushName?: string) {
    try {
      console.log(`🎯 [CUSTOMER] Verificando/criando customer para conversa - Phone: ${phone}, ConversationId: ${conversationId}`);
      
      const storage = getStorage();
      
      // Obter a instância para determinar a empresa
      const instance = await storage.getWhatsappInstance(whatsappInstanceId);
      if (!instance?.companyId) {
        console.log(`❌ [CUSTOMER] Instância ou companyId não encontrada para WhatsApp instance: ${whatsappInstanceId}`);
        return;
      }
      
      console.log(`🏢 [CUSTOMER] Company ID encontrado: ${instance.companyId}`);
      
      // Verificar se já existe um customer com este telefone na empresa
      const existingCustomer = await storage.getCustomerByPhone(phone, instance.companyId);
      if (existingCustomer) {
        console.log(`⚠️ [CUSTOMER] Customer já existe para este telefone: ${phone} na empresa ${instance.companyId}`);
        
        // Atualizar o lastContact e conversationId se necessário
        if (existingCustomer.conversationId !== conversationId) {
          console.log(`📝 [CUSTOMER] Atualizando conversationId do customer existente`);
          await storage.updateCustomer(existingCustomer.id, {
            conversationId: conversationId,
            lastContact: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
        }
        return;
      }
      
      // Buscar a primeira etapa ativa do funil desta empresa para colocar o customer
      const funnelStages = await storage.getFunnelStagesByCompany(instance.companyId);
      const firstActiveStage = funnelStages.find(stage => stage.isActive);
      
      if (!firstActiveStage) {
        console.log(`❌ [CUSTOMER] Nenhuma etapa ativa encontrada no funil da empresa ${instance.companyId}`);
        return;
      }
      
      console.log(`📊 [CUSTOMER] Primeira etapa ativa encontrada: ${firstActiveStage.name} (${firstActiveStage.id})`);
      
      // Usar pushName se disponível, senão usar o número completo
      const customerName = pushName || phone;
      console.log(`👤 [CUSTOMER] Nome do customer: ${customerName} (pushName: ${pushName ? 'sim' : 'não'})`)
      
      // Criar o customer
      const newCustomer = await storage.createCustomer({
        companyId: instance.companyId,
        name: customerName,
        phone: phone,
        funnelStageId: firstActiveStage.id,
        lastContact: new Date().toISOString().slice(0, 19).replace('T', ' '),
        source: 'WhatsApp',
        conversationId: conversationId
      });
      
      console.log(`✅ [CUSTOMER] Customer criado com sucesso no kanban:`, {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        stage: firstActiveStage.name,
        conversationId: conversationId
      });
      
    } catch (error) {
      console.error("❌ [CUSTOMER] Erro ao criar customer para nova conversa:", error);
      // Não vamos interromper o fluxo principal por este erro
    }
  }
}

export const aiService = new AIService();