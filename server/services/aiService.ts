import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { getStorage } from "../storage";
import { propertyService } from "./propertyService";

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

      // Sem fallbacks hardcoded - usar apenas o que está no banco
      
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
        console.error(`❌ [AI-${aiProcessId}] Agent ${instance.aiAgentId} not found in database`);
        return null;
      }

      console.log(`✅ [AI-${aiProcessId}] Agent found: ${mainAgent.name}`);
      console.log(`🔍 [AI-${aiProcessId}] Agent details:`, {
        id: mainAgent.id,
        name: mainAgent.name,
        agentType: mainAgent.agentType,
        hasOpenAIKey: !!mainAgent.openaiApiKey,
        hasPrompt: !!mainAgent.prompt,
        promptLength: mainAgent.prompt?.length || 0
      });

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
      const totalTime = Date.now() - startTime;
      console.error(`❌ [AI-${aiProcessId}] CRITICAL ERROR processing message after ${totalTime}ms:`, error);
      console.error(`❌ [AI-${aiProcessId}] ERROR STACK:`, error.stack);
      console.error(`❌ [AI-${aiProcessId}] ERROR MESSAGE:`, error.message);
      console.error(`❌ [AI-${aiProcessId}] ERROR TYPE:`, error.constructor.name);
      console.error(`❌ [AI-${aiProcessId}] CONTEXT:`, {
        instanceId: context.instanceId,
        phone: context.phone,
        messageLength: context.message?.length || 0,
        messageType: context.messageType
      });
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
      
      // Converter para formato OpenAI (últimas 50 mensagens para contexto completo)
      const history = messages
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        })
        .slice(-50)
        .map(msg => {
          console.log(`📝 [HISTORY] Mapeando mensagem - sender: "${msg.sender}", content: "${msg.content.substring(0, 50)}..."`);
          return {
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          };
        });

      console.log(`✅ [HISTORY] Histórico formatado com SUCESSO: ${history.length} mensagens`);
      if (history.length > 0) {
        console.log(`📚 [HISTORY] Histórico completo formatado:`);
        history.forEach((msg, index) => {
          console.log(`  [${index}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
        });
      }

      return history;
      
    } catch (error) {
      console.error("❌ [HISTORY] Erro ao carregar histórico da conversa:", error);
      console.error("❌ [HISTORY] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  async findDatabaseInstanceId(evolutionInstanceIdOrName: string): Promise<string | null> {
    try {
      console.log(`🔍 [FIND] Buscando instância do banco para: "${evolutionInstanceIdOrName}"`);
      const storage = getStorage();
      const companies = await storage.getAllCompanies();

      for (const company of companies) {
        const instances = await storage.getWhatsappInstancesByCompany(company.id);

        // Buscar por evolutionInstanceId OU nome da instância
        let found = instances.find(i =>
          i.evolutionInstanceId === evolutionInstanceIdOrName ||
          i.name === evolutionInstanceIdOrName
        );

        // Fallback específico para IDs conhecidos
        if (!found && evolutionInstanceIdOrName === "e5b71c35-276b-417e-a1c3-267f904b2b98") {
          found = instances.find(i => i.name === "deploy2");
        }

        // Fallback para o ID atual do deploy10
        if (!found && evolutionInstanceIdOrName === "4d0f0895-9c71-4199-b48d-a3df4e3de3da") {
          found = instances.find(i => i.name === "deploy10");
        }

        if (found) {
          console.log(`✅ [FIND] Mapeamento encontrado: input="${evolutionInstanceIdOrName}" -> dbId="${found.id}", name="${found.name}", evolutionId="${found.evolutionInstanceId}"`);
          return found.id;
        }
      }

      console.log(`❌ [FIND] Nenhuma instância encontrada para: "${evolutionInstanceIdOrName}"`);
      return null;
    } catch (error) {
      console.error("❌ [FIND] Erro ao buscar instância do banco:", error);
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

      // 👤 ADICIONAR INFORMAÇÃO SOBRE O NOME DO USUÁRIO
      const isFirstMessage = !context.conversationHistory || context.conversationHistory.length === 0;
      console.log(`👤 [NOME] ========================================`);
      console.log(`👤 [NOME] pushName no context: "${context.pushName}"`);
      console.log(`👤 [NOME] É primeira mensagem: ${isFirstMessage}`);

      if (context.pushName) {
        console.log(`✅ [NOME] Nome do usuário DISPONÍVEL: "${context.pushName}"`);

        systemPrompt += `\n\n=== INFORMAÇÃO DO USUÁRIO ===\n`;
        systemPrompt += `Nome do usuário: ${context.pushName}\n`;
        systemPrompt += `=== FIM INFORMAÇÃO DO USUÁRIO ===\n\n`;

        if (isFirstMessage) {
          systemPrompt += `IMPORTANTE: Esta é a PRIMEIRA mensagem do usuário. Cumprimente-o DIRETAMENTE pelo nome "${context.pushName}" de forma calorosa e amigável. Use o nome real do usuário, NÃO use placeholders como {{contact_name}}. O nome é: ${context.pushName}\n\n`;
          console.log(`👋 [SAUDAÇÃO] Instruindo agente a cumprimentar ${context.pushName} na primeira mensagem`);
        } else {
          systemPrompt += `Você pode e DEVE usar o nome "${context.pushName}" para se referir ao usuário de forma pessoal. NÃO use placeholders como {{contact_name}}, use diretamente: ${context.pushName}\n\n`;
        }
      } else {
        console.log(`⚠️ [NOME] pushName NÃO DISPONÍVEL no contexto`);
        if (isFirstMessage) {
          systemPrompt += `\nIMPORTANTE: Esta é a PRIMEIRA mensagem do usuário. Cumprimente-o de forma calorosa e amigável. Seja acolhedor e demonstre que você está à disposição para ajudá-lo.\n\n`;
        }
      }

      // Adicionar conhecimento base se disponível
      if (agent.trainingContent && agent.trainingContent.trim()) {
        systemPrompt += `\n\n=== CONHECIMENTO BASE ===\n${agent.trainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
        systemPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
      }

      // 🏠 BUSCAR IMÓVEIS SE O USUÁRIO PERGUNTAR SOBRE PROPRIEDADES
      let propertiesContext = '';
      const storage = getStorage();

      // Obter a instância para determinar a empresa
      const instance = await storage.getWhatsappInstanceByEvolutionId(context.instanceId);
      if (!instance && (context as any).databaseInstanceId) {
        const dbInstance = await storage.getWhatsappInstance((context as any).databaseInstanceId);
        if (dbInstance) {
          Object.assign(instance || {}, dbInstance);
        }
      }

      if (instance?.companyId && propertyService.isPropertySearchIntent(context.message)) {
        console.log(`🏠 [AI] Detectada intenção de busca de imóveis!`);

        try {
          const properties = await propertyService.searchPropertiesFromMessage(context.message, instance.companyId);

          if (properties.length > 0) {
            console.log(`🏠 [AI] ${properties.length} imóveis encontrados, adicionando ao contexto`);

            propertiesContext = `\n\n=== IMÓVEIS DISPONÍVEIS ===\n`;
            propertiesContext += `Encontrei ${properties.length} imóvel(is) que corresponde(m) à busca:\n\n`;

            properties.forEach((property, index) => {
              propertiesContext += `--- IMÓVEL ${index + 1} ---\n`;
              propertiesContext += propertyService.formatPropertyInfo(property);

              // Adicionar informações sobre mídias disponíveis
              if (property.images && Array.isArray(property.images) && property.images.length > 0) {
                propertiesContext += `📸 Imagens disponíveis: ${property.images.length}\n`;
              }
              if (property.youtubeVideoUrl) {
                propertiesContext += `🎥 Vídeo: ${property.youtubeVideoUrl}\n`;
              }
              propertiesContext += `\n`;
            });

            propertiesContext += `=== FIM IMÓVEIS DISPONÍVEIS ===\n\n`;
            propertiesContext += `INSTRUÇÕES IMPORTANTES:\n`;
            propertiesContext += `- Apresente os imóveis encontrados de forma clara e organizada\n`;
            propertiesContext += `- Destaque as características principais de cada imóvel\n`;
            propertiesContext += `- Informe que você pode enviar as fotos e vídeos dos imóveis\n`;
            propertiesContext += `- Seja prestativo e ofereça ajuda adicional\n`;
            propertiesContext += `- SEMPRE respeite o prompt original salvo no agente (${agent.name})\n`;
            propertiesContext += `- Mantenha o tom e personalidade definidos no prompt do agente\n`;

            systemPrompt += propertiesContext;
          } else {
            console.log(`🏠 [AI] Nenhum imóvel encontrado com os critérios da busca`);
            systemPrompt += `\n\nINFORMAÇÃO: Não encontrei imóveis disponíveis que correspondam exatamente aos critérios mencionados. Informe isso educadamente ao usuário e pergunte se ele gostaria de ver outras opções ou ajustar os critérios de busca.`;
          }
        } catch (error) {
          console.error(`❌ [AI] Erro ao buscar imóveis:`, error);
        }
      }

      // Adicionar contexto de delegação se for agente secundário
      if (agent.agentType === 'secondary') {
        systemPrompt += `\n\nVocê é um agente especializado. Responda com base em sua especialização e conhecimento específico.`;
      }

      systemPrompt += `\n\n=== ⚠️ REGRA NÚMERO 1: MEMÓRIA DA CONVERSA (PRIORIDADE MÁXIMA) ===\n`;
      systemPrompt += `ANTES DE FAZER QUALQUER COISA, VERIFIQUE O HISTÓRICO DA CONVERSA!\n\n`;
      systemPrompt += `REGRAS ABSOLUTAS DE MEMÓRIA:\n`;
      systemPrompt += `1. CONSULTE O HISTÓRICO: Você TEM acesso ao histórico completo acima. SEMPRE leia antes de responder.\n`;
      systemPrompt += `2. ZERO REPETIÇÃO: Se você JÁ perguntou algo, NUNCA pergunte novamente. Use a resposta anterior.\n`;
      systemPrompt += `3. USE O CONTEXTO: Se o usuário JÁ informou cidade, tipo, quartos, etc - USE essa informação!\n`;
      systemPrompt += `4. NÃO RECOMECE: Continue do ponto onde parou. Não trate cada mensagem como nova conversa.\n\n`;
      systemPrompt += `EXEMPLOS DE VIOLAÇÃO (NUNCA FAÇA ISSO):\n`;
      systemPrompt += `  ❌ Usuário disse "joaçaba" → Você pergunta "Em qual cidade?"\n`;
      systemPrompt += `  ❌ Usuário disse "apartamento" → Você pergunta "Que tipo de imóvel?"\n`;
      systemPrompt += `  ❌ Já perguntou a cidade 3 vezes e usuário respondeu → Você pergunta pela 4ª vez\n\n`;
      systemPrompt += `COMO USAR A MEMÓRIA CORRETAMENTE:\n`;
      systemPrompt += `  ✅ Verifique: O usuário já mencionou cidade? SIM → Use essa cidade na busca\n`;
      systemPrompt += `  ✅ Verifique: O usuário já mencionou tipo? SIM → Use esse tipo na busca\n`;
      systemPrompt += `  ✅ Tem AMBOS no histórico? → BUSQUE IMEDIATAMENTE sem perguntar nada\n`;
      systemPrompt += `=== FIM REGRAS DE MEMÓRIA ===\n\n`;

      systemPrompt += `=== PROTOCOLO DE BUSCA DE IMÓVEIS ===\n`;
      systemPrompt += `VOCÊ TEM ACESSO À FUNÇÃO busca_imoveis PARA CONSULTAR IMÓVEIS NO SISTEMA.\n\n`;
      systemPrompt += `CRITÉRIO MÍNIMO PARA BUSCA:\n`;
      systemPrompt += `Para chamar a função busca_imoveis, você PRECISA de:\n`;
      systemPrompt += `  1. CIDADE/LOCALIZAÇÃO\n`;
      systemPrompt += `  2. TIPO DE IMÓVEL (apartamento, casa, sala, terreno, etc)\n\n`;
      systemPrompt += `PASSO A PASSO OBRIGATÓRIO:\n`;
      systemPrompt += `  PASSO 1: Verifique o HISTÓRICO - O usuário já informou cidade? E tipo?\n`;
      systemPrompt += `  PASSO 2: Se TEM ambos no histórico → CHAME busca_imoveis AGORA\n`;
      systemPrompt += `  PASSO 3: Se FALTA algo → Pergunte APENAS o que falta (não repita perguntas)\n`;
      systemPrompt += `  PASSO 4: Quando tiver ambos → BUSQUE sem mais perguntas\n\n`;
      systemPrompt += `CENÁRIO REAL (O QUE ACONTECEU AGORA):\n`;
      systemPrompt += `  Usuário: "quero um ap"\n`;
      systemPrompt += `  Você: "Em qual cidade?"\n`;
      systemPrompt += `  Usuário: "joaçaba"\n`;
      systemPrompt += `  Você: "Que tipo?" ❌ ERRADO! Ele já disse "ap" = apartamento\n`;
      systemPrompt += `  CORRETO: [CHAMA busca_imoveis(cidade="Joaçaba", tipo_imovel="apartamento")]\n\n`;
      systemPrompt += `IMPORTANTE:\n`;
      systemPrompt += `  • "ap" = apartamento\n`;
      systemPrompt += `  • Se o usuário disse o tipo antes, NÃO pergunte de novo\n`;
      systemPrompt += `  • Se o usuário disse a cidade antes, NÃO pergunte de novo\n`;
      systemPrompt += `  • Cada pergunta só pode ser feita UMA VEZ\n`;
      systemPrompt += `=== FIM PROTOCOLO DE BUSCA ===\n\n`;

      systemPrompt += `Responda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.\n\n`;
      systemPrompt += `IMPORTANTE: SEMPRE siga o prompt e personalidade definidos no início desta mensagem. Não mude seu comportamento ou tom.`;

      // Construir histórico da conversa
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Adicionar histórico se disponível
      console.log(`📚 [GENERATE] ========================================`);
      console.log(`📚 [GENERATE] Verificando histórico da conversa`);
      console.log(`📚 [GENERATE] context.conversationHistory existe: ${!!context.conversationHistory}`);
      console.log(`📚 [GENERATE] context.conversationHistory.length: ${context.conversationHistory?.length || 0}`);

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        console.log(`✅ [GENERATE] HISTÓRICO ENCONTRADO! Adicionando ${context.conversationHistory.length} mensagens`);
        console.log(`📚 [GENERATE] Histórico completo:`, JSON.stringify(context.conversationHistory, null, 2));
        messages.push(...context.conversationHistory.slice(-50)); // Últimas 50 mensagens
        console.log(`📚 [GENERATE] Total de mensagens enviadas para OpenAI: ${messages.length} (1 system + ${Math.min(context.conversationHistory.length, 50)} histórico)`);
      } else {
        console.log(`❌ [GENERATE] NENHUM HISTÓRICO DISPONÍVEL - tratando como primeira mensagem`);
        console.log(`❌ [GENERATE] Isso significa que o agente NÃO vai lembrar de mensagens anteriores!`);
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

      // Definir tools disponíveis
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "busca_imoveis",
            description: "Busca imóveis cadastrados no sistema. IMPORTANTE: Esta função REQUER cidade E tipo de imóvel. SÓ chame quando tiver AMBAS informações. Se o usuário não informou cidade ou tipo, PERGUNTE primeiro antes de chamar esta função.",
            parameters: {
              type: "object",
              properties: {
                cidade: {
                  type: "string",
                  description: "Nome da cidade para filtrar os imóveis (OBRIGATÓRIO - pergunte se não souber)"
                },
                tipo_transacao: {
                  type: "string",
                  enum: ["venda", "aluguel", "locacao"],
                  description: "Tipo de transação: venda, aluguel ou locacao. Se não mencionado, assuma 'venda'"
                },
                tipo_imovel: {
                  type: "string",
                  description: "Tipo do imóvel: casa, apartamento, sala, terreno, sobrado, etc (OBRIGATÓRIO - pergunte se não souber)"
                }
              },
              required: ["cidade", "tipo_imovel"]
            }
          }
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Hardcode para garantir - gpt-4o suporta imagens
        messages: messages,
        max_tokens: 1000, // Hardcode para garantir
        temperature: 0.7, // Hardcode para garantir
        tools: tools,
        tool_choice: "auto" // O modelo decide quando usar a tool
      });

      console.log(`✅ [OPENAI] OpenAI call successful`);
      console.log(`🔍 [OPENAI_DEBUG] Response object:`, JSON.stringify(response, null, 2));

      const responseMessage = response.choices[0].message;
      console.log(`🔍 [OPENAI_DEBUG] Response message:`, JSON.stringify(responseMessage, null, 2));
      console.log(`🔍 [OPENAI_DEBUG] Has tool_calls: ${!!responseMessage.tool_calls}`);
      console.log(`🔍 [OPENAI_DEBUG] Tool_calls length: ${responseMessage.tool_calls?.length || 0}`);
      console.log(`🔍 [OPENAI_DEBUG] Message content: ${responseMessage.content?.substring(0, 100) || 'null'}`);

      // Verificar se o modelo quer chamar uma função
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log(`🛠️ [FUNCTION_CALL] Modelo solicitou chamada de função!`);

        const toolCall = responseMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🛠️ [FUNCTION_CALL] Função: ${functionName}`);
        console.log(`🛠️ [FUNCTION_CALL] Argumentos:`, functionArgs);

        if (functionName === "busca_imoveis") {
          try {
            // Buscar instância para obter companyId
            let instanceForSearch = await storage.getWhatsappInstanceByEvolutionId(context.instanceId);
            if (!instanceForSearch && (context as any).databaseInstanceId) {
              instanceForSearch = await storage.getWhatsappInstance((context as any).databaseInstanceId);
            }

            if (!instanceForSearch?.companyId) {
              throw new Error('Instância ou companyId não encontrado');
            }

            console.log(`🏢 [FUNCTION_CALL] CompanyId encontrado: ${instanceForSearch.companyId}`);

            // Buscar imóveis usando o companyId da instância
            const properties = await storage.searchProperties(instanceForSearch.companyId, {
              city: functionArgs.cidade,
              transactionType: functionArgs.tipo_transacao === 'aluguel' ? 'locacao' : functionArgs.tipo_transacao,
              propertyType: functionArgs.tipo_imovel
            });

            console.log(`🏠 [FUNCTION_CALL] Encontrados ${properties.length} imóveis`);

            // Formatar resultado para o modelo
            const functionResult = {
              total: properties.length,
              imoveis: properties.map(p => ({
                codigo: p.code,
                nome: p.name,
                endereco: `${p.street}, ${p.number} - ${p.neighborhood || ''}, ${p.city || ''} - ${p.state || ''}`,
                quartos: p.bedrooms,
                banheiros: p.bathrooms,
                vagas: p.parkingSpaces,
                area: p.privateArea,
                descricao: p.description,
                tipo_transacao: p.transactionType,
                tem_imagens: p.images && p.images.length > 0
              }))
            };

            // Adicionar a resposta da função ao contexto e fazer nova chamada
            // IMPORTANTE: Manter TODO o histórico da conversa para preservar memória
            messages.push(responseMessage);
            messages.push({
              role: "tool" as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            });

            console.log(`📚 [FUNCTION_CALL] Fazendo chamada final COM histórico completo (${messages.length} mensagens)`);
            console.log(`📚 [FUNCTION_CALL] Composição: 1 system + ${context.conversationHistory?.length || 0} histórico + mensagem atual + tool_call + tool_result`);

            // Fazer nova chamada para o modelo processar o resultado
            // Mantendo TODO o histórico para que o agente não perca memória
            const finalResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: messages, // Inclui: system + histórico + mensagem atual + tool_call + tool_result
              max_tokens: 1000,
              temperature: 0.7,
            });

            console.log(`✅ [FUNCTION_CALL] Resposta final gerada COM memória preservada`);
            return finalResponse.choices[0].message.content || "Encontrei os imóveis mas não consegui formatá-los.";

          } catch (error) {
            console.error(`❌ [FUNCTION_CALL] Erro ao executar busca_imoveis:`, error);
            return "Desculpe, ocorreu um erro ao buscar os imóveis. Tente novamente.";
          }
        }
      }

      console.log(`✅ [OPENAI] Response length: ${responseMessage.content?.length || 0}`);
      return responseMessage.content || "Desculpe, não consegui gerar uma resposta.";

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

  async saveConversation(evolutionInstanceIdOrName: string, phone: string, userMessage: string, aiResponse: string, agentId: string, messageData?: {
    messageType?: string;
    mediaUrl?: string;
    mediaBase64?: string;
    caption?: string;
    pushName?: string; // Nome do contato no WhatsApp
  }) {
    try {
      const storage = getStorage();

      console.log(`💾 [SAVE] ========================================`);
      console.log(`💾 [SAVE] saveConversation chamado`);
      console.log(`💾 [SAVE] instanceIdOrName: "${evolutionInstanceIdOrName}"`);
      console.log(`💾 [SAVE] phone: "${phone}"`);
      console.log(`💾 [SAVE] userMessage: "${userMessage.substring(0, 50)}..."`);
      console.log(`💾 [SAVE] messageData:`, JSON.stringify(messageData, null, 2));
      console.log(`💾 [SAVE] pushName recebido: "${messageData?.pushName || 'NULL/UNDEFINED'}"`);

      // PRIMEIRO: Encontrar a instância do nosso banco usando o evolutionInstanceId OU nome
      const dbInstanceId = await this.findDatabaseInstanceId(evolutionInstanceIdOrName);
      if (!dbInstanceId) {
        console.log(`💾 Erro: Instância do banco não encontrada para salvar conversa. IdOrName: ${evolutionInstanceIdOrName}`);
        return null;
      }

      console.log(`💾 Salvando conversa na instância: ${dbInstanceId} (input: ${evolutionInstanceIdOrName})`);
      
      // Buscar conversa existente usando o ID correto do banco
      const conversations = await storage.getConversationsByInstance(dbInstanceId);
      let conversation = conversations.find(c => c.contactPhone === phone);
      
      let isNewConversation = false;
      if (!conversation) {
        console.log(`💾 ========== NOVA CONVERSA DETECTADA ==========`);
        console.log(`💾 Criando nova conversa para ${phone}`);
        console.log(`💾 Esta é a PRIMEIRA mensagem deste usuário!`);
        console.log(`👤 [PUSHNAME] PushName recebido: ${messageData?.pushName || 'Não fornecido'}`);
        isNewConversation = true;

        // Criar conversa com pushName se disponível
        const conversationData = {
          whatsappInstanceId: dbInstanceId,
          contactPhone: phone,
          contactName: messageData?.pushName || null,
          lastMessage: userMessage
        };

        console.log(`💾 [CREATE] Dados da conversa a serem criados:`, JSON.stringify(conversationData, null, 2));

        conversation = await storage.createConversation(conversationData);

        console.log(`✅ [CREATE] Conversa criada com sucesso!`);
        console.log(`✅ [CREATE] ID: ${conversation.id}`);
        console.log(`✅ [CREATE] contactName salvo: "${conversation.contactName}"`);
        console.log(`✅ [CREATE] contactPhone: ${conversation.contactPhone}`);

        // 🎯 FUNCIONALIDADE: Criar lead E customer automaticamente quando alguém enviar a PRIMEIRA mensagem
        console.log(`🚀 [PRIMEIRA MENSAGEM] Detectada primeira mensagem de ${phone}, criando lead e customer automaticamente...`);
        console.log(`🔍 [DEBUG] Parâmetros para createLeadAndCustomerFromNewMessage:`, {
          whatsappInstanceId: dbInstanceId,
          phone: phone,
          conversationId: conversation.id,
          pushName: messageData?.pushName
        });
        try {
          await this.createLeadAndCustomerFromNewMessage(dbInstanceId, phone, conversation.id, messageData?.pushName);
          console.log(`✅ [DEBUG] createLeadAndCustomerFromNewMessage executada com sucesso`);
        } catch (error) {
          console.error(`❌ [DEBUG] Erro ao executar createLeadAndCustomerFromNewMessage:`, error);
        }
      } else {
        console.log(`💾 Usando conversa existente: ${conversation.id}`);

        // 👤 ATUALIZAR contactName se pushName foi fornecido e é diferente do atual
        if (messageData?.pushName && conversation.contactName !== messageData.pushName) {
          console.log(`👤 [PUSHNAME] Atualizando contactName de "${conversation.contactName}" para "${messageData.pushName}"`);
          try {
            await storage.updateConversation(conversation.id, {
              contactName: messageData.pushName
            });
            console.log(`✅ [PUSHNAME] ContactName atualizado com sucesso!`);
          } catch (error) {
            console.error(`❌ [PUSHNAME] Erro ao atualizar contactName:`, error);
          }
        } else if (messageData?.pushName) {
          console.log(`👤 [PUSHNAME] ContactName já está correto: "${conversation.contactName}"`);
        } else {
          console.log(`👤 [PUSHNAME] Nenhum pushName fornecido para atualização`);
        }
      }

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

  // 🎯 FUNCIONALIDADE: Criar lead E customer automaticamente quando alguém enviar a primeira mensagem
  private async createLeadAndCustomerFromNewMessage(whatsappInstanceId: string, phone: string, conversationId: string, pushName?: string) {
    try {
      console.log(`🎯 [LEAD+CUSTOMER] === INICIANDO CRIAÇÃO DE LEAD E CUSTOMER ===`);
      console.log(`📞 [LEAD+CUSTOMER] Phone: ${phone}`);
      console.log(`👤 [LEAD+CUSTOMER] PushName: ${pushName || 'N/A'}`);
      console.log(`🏢 [LEAD+CUSTOMER] WhatsApp Instance ID: ${whatsappInstanceId}`);
      console.log(`💬 [LEAD+CUSTOMER] Conversation ID: ${conversationId}`);

      const storage = getStorage();

      // Obter a instância para determinar a empresa
      const instance = await storage.getWhatsappInstance(whatsappInstanceId);
      if (!instance?.companyId) {
        console.log(`❌ [LEAD+CUSTOMER] Instância ou companyId não encontrada`);
        return;
      }

      console.log(`✅ [LEAD+CUSTOMER] Company ID: ${instance.companyId}`);

      // Verificar se já existe um lead para este telefone na empresa
      const existingLead = await storage.getLeadByPhone(phone, instance.companyId);
      if (existingLead) {
        console.log(`⚠️ [LEAD+CUSTOMER] Lead já existe! ID: ${existingLead.id}`);
      } else {
        // Criar lead na tabela leads
        console.log(`🚀 [LEAD+CUSTOMER] CRIANDO LEAD...`);
        const leadName = pushName || phone;
        console.log(`🔍 [LEAD+CUSTOMER] Dados do lead a ser criado:`, {
          companyId: instance.companyId,
          name: leadName,
          phone: phone,
          email: null,
          source: 'WhatsApp',
          status: 'new',
          notes: 'Lead criado automaticamente através da primeira mensagem do WhatsApp',
          convertedToCustomer: false,
          customerId: null
        });

        const newLead = await storage.createLead({
          companyId: instance.companyId,
          name: leadName,
          phone: phone,
          email: null,
          source: 'WhatsApp',
          status: 'new',
          notes: 'Lead criado automaticamente através da primeira mensagem do WhatsApp',
          convertedToCustomer: false,
          customerId: null
        });
        console.log(`🎉 [LEAD+CUSTOMER] LEAD CRIADO COM SUCESSO!`);
        console.log(`✅ [LEAD+CUSTOMER] Lead ID: ${newLead.id}`);
        console.log(`✅ [LEAD+CUSTOMER] Lead Nome: ${newLead.name}`);
        console.log(`✅ [LEAD+CUSTOMER] Lead Phone: ${newLead.phone}`);
      }

      // Verificar se já existe um customer com este telefone na empresa
      const existingCustomer = await storage.getCustomerByPhone(phone, instance.companyId);
      if (existingCustomer) {
        console.log(`⚠️ [LEAD+CUSTOMER] Customer já existe! ID: ${existingCustomer.id}`);
        // Atualizar conversationId se necessário
        if (existingCustomer.conversationId !== conversationId) {
          await storage.updateCustomer(existingCustomer.id, {
            conversationId: conversationId,
            lastContact: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
          console.log(`📝 [LEAD+CUSTOMER] Customer conversationId atualizado`);
        }
      } else {
        // Buscar primeiro estágio do funil para a empresa
        const funnelStages = await storage.getFunnelStagesByCompany(instance.companyId);
        const firstStage = funnelStages.find(stage => stage.order === 0) || funnelStages[0];

        if (firstStage) {
          // Criar customer na tabela customers
          console.log(`🚀 [LEAD+CUSTOMER] CRIANDO CUSTOMER...`);
          const customerName = pushName || phone;
          const newCustomer = await storage.createCustomer({
            companyId: instance.companyId,
            name: customerName,
            phone: phone,
            email: null,
            company: null,
            funnelStageId: firstStage.id,
            lastContact: new Date().toISOString().slice(0, 19).replace('T', ' '),
            notes: 'Customer criado automaticamente através da primeira mensagem do WhatsApp',
            value: null,
            source: 'WhatsApp',
            conversationId: conversationId
          });
          console.log(`🎉 [LEAD+CUSTOMER] CUSTOMER CRIADO! ID: ${newCustomer.id}, Nome: ${newCustomer.name}`);
        } else {
          console.log(`⚠️ [LEAD+CUSTOMER] Nenhum estágio do funil encontrado para a empresa`);
        }
      }

      console.log(`✅ [LEAD+CUSTOMER] PROCESSO CONCLUÍDO COM SUCESSO!`);

    } catch (error) {
      console.error("❌ [LEAD+CUSTOMER] ERRO ao criar lead e customer:", error);
      console.error("❌ [LEAD+CUSTOMER] Stack:", (error as Error).stack);
    }
  }
}

export const aiService = new AIService();