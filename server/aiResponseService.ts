import { OpenAiService } from "./services/openai";
import { EvolutionApiService } from "./services/evolutionApi";
import { getStorage } from "./storage";
import { AiAgent } from "@shared/schema";

export interface AiResponseRequest {
  message: string;
  agentId: string;
  agentPrompt: string;
  agentTrainingContent?: string;
  temperatura?: number;
  modelo?: string;
  numeroTokens?: number;
  agentType?: 'main' | 'secondary';
  delegationKeywords?: string[];
  companyId?: string;
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>;
}

export class AiResponseService {
  private openAiService: OpenAiService;

  constructor(apiKey: string) {
    this.openAiService = new OpenAiService(apiKey);
  }

  /**
   * Generates an AI response with hierarchical delegation support
   */
  async generateResponse(request: AiResponseRequest): Promise<string> {
    try {
      console.log(`🚨🚨🚨 [CRITICAL] AI-RESPONSE-SERVICE.GENERATE-RESPONSE CHAMADO!`);
      console.log(`🤖 [AI-RESPONSE] Gerando resposta para agente ID: ${request.agentId} (Tipo: ${request.agentType || 'main'})`);
      console.log(`🔍 [AI-RESPONSE] CompanyId recebido: ${request.companyId}`);
      console.log(`🔍 [AI-RESPONSE] Mensagem: "${request.message}"`);
      console.log(`🔍 [AI-RESPONSE] Request completo:`, JSON.stringify(request, null, 2));
      
      // If this is a main agent, check if we need to delegate to secondary agents
      if (request.agentType === 'main' && request.companyId) {
        const delegationResult = await this.checkForDelegation(request);
        if (delegationResult) {
          console.log(`🔄 Delegando para agente secundário: ${delegationResult.agent.name}`);
          return delegationResult.response;
        }
      }

      // Generate response from the current agent
      console.log(`🔍 [AI-RESPONSE] Chamando generateDirectResponse...`);
      return await this.generateDirectResponse(request);
    } catch (error: any) {
      console.error('❌ Erro ao gerar resposta do agente:', error);
      throw new Error(`Erro na geração da resposta: ${error.message}`);
    }
  }

  /**
   * Check if the message should be delegated to a secondary agent
   */
  private async checkForDelegation(request: AiResponseRequest): Promise<{ agent: AiAgent; response: string } | null> {
    if (!request.companyId) return null;

    const storage = getStorage();
    const secondaryAgents = await storage.getSecondaryAgentsByParent(request.agentId);
    
    console.log(`🔍 Verificando delegação entre ${secondaryAgents.length} agentes secundários`);

    for (const secondaryAgent of secondaryAgents) {
      const keywords = Array.isArray(secondaryAgent.delegationKeywords) ? secondaryAgent.delegationKeywords : [];
      if (this.shouldDelegate(request.message, keywords)) {
        console.log(`✅ Palavras-chave encontradas para delegação ao agente: ${secondaryAgent.name}`);
        
        // Generate response using the secondary agent
        const delegatedResponse = await this.generateDirectResponse({
          ...request,
          agentId: secondaryAgent.id,
          agentPrompt: secondaryAgent.prompt,
          agentTrainingContent: secondaryAgent.trainingContent || undefined,
          temperatura: Number(secondaryAgent.temperatura) || 0.7,
          modelo: secondaryAgent.modelo || "gpt-4o",
          numeroTokens: Number(secondaryAgent.numeroTokens) || 1000,
          agentType: 'secondary'
        });

        return {
          agent: secondaryAgent,
          response: delegatedResponse
        };
      }
    }

    return null;
  }

  /**
   * Check if a message should trigger delegation based on keywords
   */
  private shouldDelegate(message: string, keywords: string[]): boolean {
    if (!keywords || keywords.length === 0) return false;
    
    const messageLower = message.toLowerCase();
    return keywords.some(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Generate a direct response from the specified agent
   */
  private async generateDirectResponse(request: AiResponseRequest): Promise<string> {
    // Check for property search integration first
    console.log(`🚨🚨🚨 [CRITICAL-DEBUG] GENERATE-DIRECT-RESPONSE CHAMADO!`);
    console.log(`🏢 [DIRECT-RESPONSE] CompanyId presente: ${!!request.companyId}, valor: ${request.companyId}`);
    console.log(`🏢 [DIRECT-RESPONSE] request.message: "${request.message}"`);
    console.log(`🏢 [DIRECT-RESPONSE] request.userMessage: "${request.userMessage}"`);
    
    // Ensure userMessage is set (for backward compatibility)
    if (!request.userMessage && request.message) {
      request.userMessage = request.message;
    }
    
    if (request.companyId) {
      console.log(`🏢 [DIRECT-RESPONSE] Chamando handlePropertySearch...`);
      const propertyResponse = await this.handlePropertySearch(request);
      console.log(`🏢 [DIRECT-RESPONSE] PropertyResponse resultado: ${propertyResponse ? 'RESPONSE GERADA' : 'NULL'}`);
      if (propertyResponse) {
        return propertyResponse;
      }
    }

    // Build the enhanced prompt combining agent prompt + training content
    let enhancedPrompt = request.agentPrompt;
    
    if (request.agentTrainingContent && request.agentTrainingContent.trim()) {
      enhancedPrompt += `\n\n=== CONHECIMENTO BASE ===\n${request.agentTrainingContent}\n=== FIM CONHECIMENTO BASE ===\n\n`;
      enhancedPrompt += `Use as informações do CONHECIMENTO BASE acima para responder às perguntas do usuário de forma precisa e detalhada.`;
    }

    // Add delegation context if this is a secondary agent
    if (request.agentType === 'secondary') {
      enhancedPrompt += `\n\nVocê é um agente especializado. Responda com base em sua especialização e conhecimento específico.`;
    }

    // Add specific instructions to avoid repetition
    enhancedPrompt += `\n\nResponda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.`;
    
    // Add context awareness instructions
    enhancedPrompt += `\n\n*** IMPORTANTE SOBRE CONTEXTO ***
- Se você já se apresentou nesta conversa, NÃO se apresente novamente
- Se o usuário já forneceu o nome dele, use-o sem pedir novamente
- Mantenha continuidade da conversa e evite repetir perguntas já feitas
- Analise o histórico da conversa antes de responder
- Se não há histórico, você pode fazer uma apresentação inicial
- Se há histórico, continue naturalmente a partir do último contexto

*** ANÁLISE DO HISTÓRICO ***
${request.conversationHistory && request.conversationHistory.length > 0 
  ? `HISTÓRICO EXISTE (${request.conversationHistory.length} mensagens) - Continue a conversa naturalmente SEM se apresentar novamente`
  : 'PRIMEIRA CONVERSA - Pode se apresentar brevemente'
}

*** INSTRUÇÕES ESPECÍFICAS ***
- NUNCA repita a mesma pergunta se já foi feita
- NUNCA se apresente se já o fez antes
- Use o nome do usuário se ele já se identificou
- Seja direto e útil nas respostas`;

    console.log(`📝 Prompt construído - Tamanho: ${enhancedPrompt.length} caracteres`);
    console.log(`💬 Mensagem do usuário: "${request.message}"`);
    console.log(`📚 Histórico de conversa: ${request.conversationHistory?.length || 0} mensagens`);
    
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      console.log(`🔍 [HISTÓRIA] Últimas mensagens do histórico:`, 
        request.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`)
      );
    } else {
      console.log(`⚠️ [HISTÓRIA] Nenhum histórico encontrado - primeira conversa`);
    }
    
    const response = await this.openAiService.generateResponse(
      request.message,
      enhancedPrompt,
      {
        model: request.modelo || "gpt-4o",
        temperature: request.temperatura || 0.7,
        maxTokens: request.numeroTokens || 1000,
        conversationHistory: request.conversationHistory
      }
    );

    console.log(`✅ Resposta gerada com sucesso - Tamanho: ${response.content.length} caracteres`);
    return response.content;
  }

  /**
   * Handles property search integration when user asks about real estate
   */
  private async handlePropertySearch(request: AiResponseRequest): Promise<string | null> {
    try {
      console.log(`🚨🚨🚨 [CRITICAL] handlePropertySearch CHAMADO!`);
      console.log(`🚨 [CRITICAL] request.message: "${request.message}"`);
      console.log(`🚨 [CRITICAL] request.userMessage: "${request.userMessage}"`);
      
      const message = (request.userMessage || request.message || '').toLowerCase();
      console.log(`🏠🏠🏠 [PROPERTY SEARCH] MÉTODO CHAMADO - Analisando mensagem: "${message}"`);
      console.log(`🏠 [PROPERTY SEARCH] Request tem message: "${request.message}"`);
      console.log(`🏠 [PROPERTY SEARCH] Request tem userMessage: "${request.userMessage}"`);
      
      // Check if user is asking for photos or details of a specific property
      const photoKeywords = ['foto', 'fotos', 'imagem', 'imagens', 'envie fotos', 'me envie', 'quero ver', 'mostrar fotos'];
      const detailKeywords = ['detalhes', 'detalhe', 'mais informações', 'mais informacoes', 'informações completas', 'dados completos', 'características', 'caracteristicas'];
      
      const isPhotoRequest = photoKeywords.some(keyword => message.includes(keyword));
      const isDetailRequest = detailKeywords.some(keyword => message.includes(keyword));
      
      console.log(`🏠 [PROPERTY SEARCH] isPhotoRequest: ${isPhotoRequest}, isDetailRequest: ${isDetailRequest}`);
      
      if (isPhotoRequest || isDetailRequest) {
        const requestType = isPhotoRequest ? 'fotos' : 'detalhes';
        console.log(`📸 Detectada solicitação de ${requestType}: "${request.message}"`);
        return await this.handlePropertyPhotos(request);
      }
      
      // Keywords that indicate user is asking about properties
      const propertyKeywords = [
        'imóvel', 'imovel', 'imóveis', 'imoveis', 'casa', 'casas', 'apartamento', 'apartamentos',
        'propriedade', 'propriedades', 'terreno', 'terrenos', 'venda', 'vender', 'comprar',
        'aluguel', 'alugar', 'aluga', 'locação', 'locar', 'quarto', 'quartos', 'dormitório', 'dormitórios', 'garagem',
        'banheiro', 'banheiros', 'metro', 'metros', 'm²', 'preço', 'valor', 'disponível',
        'disponíveis', 'localização', 'bairro', 'cidade', 'região', 'encontrou', 'achou', 'tem', 
        'possui', 'existe', 'há', 'mostrar', 'ver', 'listar', 'opções', 'alternativas'
      ];

      console.log(`🔍 [PROPERTY-KEYWORDS] Mensagem original: "${message}"`);
      console.log(`🔍 [PROPERTY-KEYWORDS] Mensagem normalizada: "${message.toLowerCase()}"`);
      
      // Check if message contains property-related keywords
      const isPropertyQuery = propertyKeywords.some(keyword => {
        const found = message.toLowerCase().includes(keyword.toLowerCase());
        if (found) {
          console.log(`🎯 [PROPERTY-KEYWORDS] Palavra-chave encontrada: "${keyword}"`);
        }
        return found;
      });
      
      console.log(`🏠 [PROPERTY SEARCH] Palavras-chave de imóveis encontradas: ${isPropertyQuery}`);
      
      if (!isPropertyQuery) {
        console.log(`🏠 [PROPERTY SEARCH] Nenhuma palavra-chave de imóveis encontrada - retornando null`);
        return null;
      }

      console.log(`🏠 Detectada consulta sobre imóveis: "${request.message}"`);

      // Extract filters from the message using AI
      let filters = await this.extractPropertyFilters(request.message);
      console.log(`🔍 Filtros extraídos:`, filters);
      
      // Se estiver buscando aluguel mas não há imóveis para alugar, ajustar busca
      const isRentalSearch = message.includes('alug') || message.includes('locar');
      if (isRentalSearch) {
        console.log(`🏠 [PROPERTY SEARCH] Busca por aluguel detectada`);
        // Não adicionar filtro de finalidade para permitir mostrar todos os imóveis
        if (filters) {
          delete filters.Finalidade;
          delete filters.StatusImovel;
        }
      }

      // Get API settings for the company
      const storage = getStorage();
      console.log(`🔍 [DEBUG] Buscando configurações da API para empresa: ${request.companyId!}`);
      
      const apiSettings = await storage.getApiSettings(request.companyId!);
      
      console.log(`🔍 [DEBUG] API settings raw result:`, apiSettings);
      console.log(`🔍 [DEBUG] API settings encontradas:`, {
        exists: !!apiSettings,
        hasUrl: !!apiSettings?.apiUrl,
        hasToken: !!apiSettings?.apiToken,
        url: apiSettings?.apiUrl ? `Configurada: ${apiSettings.apiUrl}` : 'Não configurada',
        token: apiSettings?.apiToken ? `Configurado (${apiSettings.apiToken.length} chars)` : 'Não configurado'
      });
      
      if (!apiSettings?.apiUrl || !apiSettings?.apiToken) {
        console.log(`❌ [DEBUG] Configurações da API faltando - apiSettings:`, apiSettings);
        
        // Provide more helpful guidance
        const missingConfig = [];
        if (!apiSettings?.apiUrl) missingConfig.push("URL da API");
        if (!apiSettings?.apiToken) missingConfig.push("Token de acesso");
        
        return `🔧 **Configuração necessária para busca de imóveis:**

📋 **Faltando:** ${missingConfig.join(", ")}

**Para configurar:**
1. Acesse o sistema web em: https://imobiliaria.gilliard.dev.br
2. Vá em "Configurações" → "API de Imóveis" 
3. Configure:
   - **URL da API VistaHost:** https://...
   - **Token de acesso:** seu_token_aqui

Após a configuração, você poderá buscar imóveis com fotos! 🏠📸`;
      }

      // Search for properties seguindo formato n8n que funciona
      const searchParams = {
        filter: { 
          SiteSuder: "Sim",
          ...(filters && Object.keys(filters).length > 0 ? filters : {})
        },
        fields: [
          "Codigo", "Categoria", "BairroComercial", "Cidade", "Suites", "DescricaoWeb", 
          "Dormitorios", "Vagas", "Endereco", "Complemento", "AreaPrivativa", 
          "ValorVenda", "ValorLocacao", "FotoDestaque"
        ],
        paginacao: { 
          pagina: 1, 
          quantidade: 10 
        }
      };

      console.log(`🔍 [DEBUG] Search params being sent:`, JSON.stringify(searchParams, null, 2));
      console.log(`🔍 [DEBUG] API Settings:`, { 
        apiUrl: apiSettings.apiUrl, 
        hasToken: !!apiSettings.apiToken,
        tokenLength: apiSettings.apiToken?.length 
      });

      // Construir URL seguindo formato n8n (com v2=1)
      const baseUrl = `${apiSettings.apiUrl}/imoveis/listar`;
      const pesquisaParam = encodeURIComponent(JSON.stringify(searchParams));
      const apiUrl = `${baseUrl}?key=${apiSettings.apiToken}&v2=1&pesquisa=${pesquisaParam}&showtotal=1`;
      
      console.log(`🔍 [DEBUG] Final API URL:`, apiUrl);

      // Log API call start
      const apiCallStart = Date.now();
      console.log(`🚀 [DEBUG] Making API call to:`, apiUrl);
      
      // Header obrigatório segundo documentação VistaHost
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📡 [DEBUG] API Response status: ${response.status} ${response.statusText}`);

      const executionTime = Date.now() - apiCallStart;

      if (!response.ok) {
        // Log failed API call
        await this.logApiCall({
          companyId: request.companyId!,
          agentId: request.agentId,
          apiType: 'property_search',
          endpoint: apiUrl,
          requestData: { searchParams, filters },
          responseStatus: 'error',
          responseData: { status: response.status, statusText: response.statusText },
          executionTime,
          userPhone: null
        });
        
        return "Desculpe, ocorreu um erro ao buscar os imóveis. Tente novamente mais tarde.";
      }

      const data = await response.json();
      console.log(`✅ [PROPERTY-SEARCH] Resposta da API recebida:`, {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResult: !!data.result,
        hasImoveis: !!data.imoveis,
        hasData: !!data.data,
        keys: Object.keys(data || {}),
        dataKeys: data ? Object.keys(data) : [],
        sampleData: data
      });

      // Com v2=1, VistaSoft retorna formato: {"result": [...], "paginacao": {...}}
      let properties = [];
      
      console.log(`🔍 [DEBUG] Estrutura completa da resposta:`, JSON.stringify(data, null, 2));
      
      if (data.result && Array.isArray(data.result)) {
        properties = data.result;
        console.log(`🎯 [DEBUG] VistaSoft v2=1: Encontrados ${data.result.length} imóveis em data.result`);
        
        // Log dos metadados da paginação
        if (data.paginacao) {
          console.log(`📊 [DEBUG] VistaSoft metadados: Total=${data.paginacao.total}, Páginas=${data.paginacao.paginas}, Página=${data.paginacao.pagina}, Quantidade=${data.paginacao.quantidade}`);
        }
      } else if (Array.isArray(data)) {
        properties = data;
        console.log(`🔍 [DEBUG] Dados são array direto com ${data.length} itens`);
      } else if (data.registros && Array.isArray(data.registros)) {
        properties = data.registros;
        console.log(`🔍 [DEBUG] Dados em data.registros com ${data.registros.length} itens`);
      } else if (data && typeof data === 'object') {
        // Fallback: formato antigo com chaves numéricas
        const propertyKeys = Object.keys(data).filter(key => 
          !['total', 'paginas', 'pagina', 'quantidade', 'result', 'paginacao'].includes(key) && 
          data[key] && 
          typeof data[key] === 'object' && 
          (data[key].Codigo || data[key].codigo)
        );
        
        if (propertyKeys.length > 0) {
          properties = propertyKeys.map(key => ({
            ...data[key],
            _id: key,
            _originalKey: key
          }));
          console.log(`🎯 [DEBUG] VistaSoft formato antigo: Encontrados ${properties.length} imóveis em formato objeto (chaves: ${propertyKeys.join(', ')})`);
        } else {
          console.log(`🔍 [DEBUG] Estrutura de objeto não contém imóveis reconhecíveis`);
        }
      } else {
        console.log(`🔍 [DEBUG] Estrutura não reconhecida, tentando buscar arrays:`);
        Object.keys(data || {}).forEach(key => {
          const value = data[key];
          console.log(`🔍 [DEBUG] Chave "${key}": tipo=${typeof value}, isArray=${Array.isArray(value)}, length=${Array.isArray(value) ? value.length : 'N/A'}`);
          
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            const firstItem = value[0];
            const hasPropertyFields = firstItem.Codigo || firstItem.codigo || firstItem.id || 
                                    firstItem.Categoria || firstItem.categoria || 
                                    firstItem.Endereco || firstItem.endereco ||
                                    firstItem.ValorVenda || firstItem.valorVenda ||
                                    firstItem.ValorLocacao || firstItem.valorLocacao;
            if (hasPropertyFields) {
              console.log(`🎯 [DEBUG] Encontrado array de imóveis na chave "${key}" com ${value.length} itens`);
              properties = value;
            }
          }
        });
      }
      
      console.log(`✅ [PROPERTY-SEARCH] ${properties.length || 0} imóveis encontrados`);
      
      // 🔧 DEBUGGING: Log especial para verificar se a correção está funcionando
      console.log(`🔧 [WHATSAPP-DEBUG] RESULTADO FINAL:`, {
        propertiesCount: properties.length,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data).slice(0, 10) : [],
        hasNumericKeys: data ? Object.keys(data).some(k => !isNaN(Number(k))) : false,
        sample: properties.length > 0 ? properties[0] : null
      });

      // Verificar se temos dados válidos
      if (!properties || properties.length === 0) {
        console.log(`❌ [PROPERTY-SEARCH] Nenhum imóvel encontrado`);
        console.log(`🔍 [DEBUG] Estrutura da resposta completa:`, JSON.stringify(data, null, 2));
        
        // 🚨 ALERTA: Se chegou aqui, a correção VistaSoft não funcionou
        console.log(`🚨 [WHATSAPP-DEBUG] CORREÇÃO VISTASOFT FALHOU! Dados recebidos:`, {
          type: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : [],
          hasTotal: data && data.total,
          rawData: data
        });
        
        return "Não encontrei imóveis que correspondem aos critérios solicitados. Posso ajudar com uma busca mais ampla?";
      }

      // Para produção, vamos usar apenas os dados básicos primeiro (sem enriquecimento extra)
      console.log(`📋 [PROPERTY-SEARCH] Processando ${properties.length} imóveis com dados básicos`);

      // Log successful API call
      await this.logApiCall({
        companyId: request.companyId!,
        agentId: request.agentId,
        apiType: 'property_search',
        endpoint: apiUrl,
        requestData: { searchParams, filters },
        responseStatus: 'success',
        responseData: { count: properties.length || 0 },
        executionTime,
        userPhone: null
      });

      // Format the response with found properties
      return await this.formatPropertyResponse(properties, request.message, request);

    } catch (error) {
      console.error("❌ Erro na busca de imóveis:", error);
      return "Desculpe, ocorreu um erro ao buscar os imóveis. Tente novamente mais tarde.";
    }
  }

  /**
   * Extracts property search filters from user message using AI
   */
  private async extractPropertyFilters(message: string): Promise<any> {
    try {
      const filterExtractionPrompt = `
        Analise a seguinte mensagem sobre imóveis e extraia os filtros de busca.
        Retorne APENAS um JSON válido com os filtros encontrados.
        
        Filtros possíveis:
        - Cidade: string
        - BairroComercial: string ou array de strings  
        - ValorVenda: number (valor exato) ou [min, max] (faixa)
        - Dormitorios: number
        - Vagas: number
        - Categoria: string (ex: "Residencial", "Comercial")
        
        Exemplos:
        "Quero um apartamento em São Paulo no bairro Vila Madalena" → {"Cidade": "São Paulo", "BairroComercial": "Vila Madalena"}
        "Casa com 3 quartos até 500 mil" → {"Dormitorios": 3, "ValorVenda": ["<=", 500000]}
        "Imóveis entre 300 e 600 mil reais" → {"ValorVenda": [300000, 600000]}
        
        Mensagem: "${message}"
        
        JSON:`;

      const response = await this.openAiService.generateResponse(
        filterExtractionPrompt,
        "Você é um especialista em extrair filtros de busca de imóveis. Retorne apenas JSON válido.",
        {
          model: "gpt-4o",
          temperature: 0.1,
          maxTokens: 200
        }
      );

      try {
        return JSON.parse(response.content);
      } catch {
        console.log("⚠️ Não foi possível extrair filtros específicos, usando busca geral");
        return {};
      }
    } catch (error) {
      console.error("Erro ao extrair filtros:", error);
      return {};
    }
  }

  /**
   * Formats the property search results into a user-friendly response
   */
  private async formatPropertyResponse(properties: any[], originalMessage: string, request?: AiResponseRequest): Promise<string> {
    try {
      if (!properties || properties.length === 0) {
        // Verificar se o usuário estava buscando aluguel
        const isRentalSearch = originalMessage.toLowerCase().includes('alug');
        
        if (isRentalSearch) {
          return "No momento não temos imóveis disponíveis para locação, mas temos excelentes opções para venda! Gostaria de ver nossos imóveis à venda?";
        }
        
        return "Não encontrei imóveis que correspondem aos critérios solicitados. Posso ajudar com uma busca mais ampla?";
      }

      // Use AI to generate a natural response with the property data
      const propertyData = JSON.stringify(properties, null, 2);
      
      const responsePrompt = `
        Usuário perguntou: "${originalMessage}"
        
        Encontrei os seguintes imóveis:
        ${propertyData}
        
        Gere uma resposta natural e amigável apresentando esses imóveis. 
        
        Para cada imóvel, inclua:
        - Código do imóvel
        - Localização (cidade e bairro)
        - Preço de venda (formatado em reais)
        - Quartos e vagas
        - Área (se disponível)
        - Descrição resumida
        
        *** INSTRUÇÕES PARA APRESENTAÇÃO ***
        - Para cada imóvel, inclua: código, localização, preço, quartos, descrição resumida
        - Se o imóvel tiver "FotoDestaque" (URL da foto principal), sempre mencione: "📸 Foto disponível: [LINK]"
        - Use formato amigável e inclua emojis apropriados (🏠 🏢 💰 🛏️ 🚗)
        - Seja conversacional e ofereça ajuda adicional
        - SEMPRE inclua a foto de destaque quando disponível no campo "FotoDestaque"
        
        Use português brasileiro e seja helpful. 
        Ofereça para buscar mais detalhes se necessário.
        `;

      console.log(`🤖 [AI-FORMAT] Formatando resposta para ${properties.length} imóveis`);

      const response = await this.openAiService.generateResponse(
        responsePrompt,
        "Você é um assistente especializado em imóveis. SEMPRE inclua as fotos de destaque quando disponíveis no campo FotoDestaque. Apresente os resultados de forma clara e organizada.",
        {
          model: "gpt-4o",
          temperature: 0.7,
          maxTokens: 1500,
          conversationHistory: request?.conversationHistory
        }
      );

      return response.content;
    } catch (error) {
      console.error("Erro ao formatar resposta de imóveis:", error);
      return "Encontrei alguns imóveis, mas ocorreu um erro ao formatar a resposta. Tente novamente.";
    }
  }

  /**
   * Handles property photo requests
   */
  private async handlePropertyPhotos(request: AiResponseRequest): Promise<string | null> {
    try {
      // Extract property code from the message or recent conversation
      const propertyCode = await this.extractPropertyCodeFromContext(request);
      
      if (!propertyCode) {
        return "Para enviar as fotos, preciso saber o código do imóvel. Você pode me informar qual imóvel você gostou?";
      }

      console.log(`📸 Buscando fotos do imóvel código: ${propertyCode}`);

      // Get API settings for the company
      const storage = getStorage();
      const apiSettings = await storage.getApiSettings(request.companyId!);
      
      if (!apiSettings?.apiUrl || !apiSettings?.apiToken) {
        return "Desculpe, as configurações da API de imóveis não foram encontradas.";
      }

      // Search for complete property details with photos (following n8n pattern)
      const searchParams = {
        fields: [
          'Codigo', 'Categoria', 'BairroComercial', 'Cidade', 'Endereco', 'Numero', 'Complemento', 'CEP',
          'ValorVenda', 'ValorLocacao', 'Dormitorios', 'Suites', 'Banheiro', 'Vagas',
          'AreaTotal', 'AreaPrivativa', 'AreaTerreno', 'DescricaoWeb', 'FotoDestaque',
          'Churrasqueira', 'Lareira', 'Piscina', 'Quadra', 'Sauna', 'Salao',
          'DataCadastro', 'DataAtualizacao', 'Status', 'TipoImovel', 'Finalidade',
          { 'fotos': ['Foto', 'FotoPequena', 'Destaque', 'Tipo', 'Descricao'] },
          { 'Corretor': ['Nome', 'Fone', 'E-mail', 'Creci', 'Celular'] },
          { 'Agencia': ['Nome', 'Fone', 'Endereco', 'Numero', 'Complemento', 'Bairro', 'Cidade', 'E-mail'] }
        ]
      };

      const searchQuery = encodeURIComponent(JSON.stringify(searchParams));
      const apiUrl = `${apiSettings.apiUrl}/imoveis/detalhes?key=${apiSettings.apiToken}&pesquisa=${searchQuery}&imovel=${propertyCode}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return "Desculpe, não consegui buscar as fotos deste imóvel no momento.";
      }

      const propertyData = await response.json();
      
      if (!propertyData) {
        return "Não consegui encontrar este imóvel na nossa base de dados.";
      }

      console.log(`✅ Dados do imóvel obtidos, processando fotos...`);

      // Send photos via WhatsApp and return confirmation message
      return await this.sendPropertyPhotos(propertyData, request);

    } catch (error) {
      console.error("❌ Erro ao buscar fotos do imóvel:", error);
      return "Desculpe, ocorreu um erro ao buscar as fotos. Tente novamente mais tarde.";
    }
  }

  /**
   * Sends property photos directly via WhatsApp
   */
  private async sendPropertyPhotos(propertyData: any, request: AiResponseRequest): Promise<string> {
    try {
      console.log(`📸 [PHOTOS] Processando fotos do imóvel ${propertyData.Codigo}`);
      
      const photos = [];
      
      // Add FotoDestaque if available
      if (propertyData.FotoDestaque) {
        photos.push(propertyData.FotoDestaque);
      }
      
      // Add additional photos if available
      if (propertyData.fotos && Array.isArray(propertyData.fotos)) {
        propertyData.fotos.forEach((foto: any) => {
          if (foto.Url) {
            photos.push(foto.Url);
          }
        });
      }
      
      console.log(`📸 [PHOTOS] Encontradas ${photos.length} fotos`);
      
      if (photos.length === 0) {
        return "Desculpe, não encontrei fotos disponíveis para este imóvel no momento.";
      }
      
      // Formatar resposta com informações do imóvel e fotos
      let response = `🏠 **Imóvel ${propertyData.Codigo}**\n`;
      response += `📍 ${propertyData.BairroComercial}, ${propertyData.Cidade}\n\n`;
      
      if (propertyData.DescricaoWeb) {
        response += `📋 ${propertyData.DescricaoWeb.substring(0, 200)}...\n\n`;
      }
      
      response += `📸 **Fotos do imóvel:**\n`;
      photos.slice(0, 5).forEach((photoUrl, index) => {
        response += `${index + 1}. ${photoUrl}\n`;
      });
      
      response += `\n� *Clique nos links acima para ver as fotos do imóvel!*`;
      
      return response;

    } catch (error) {
      console.error("❌ Erro ao processar fotos:", error);
      return "Desculpe, ocorreu um erro ao buscar as fotos. Tente novamente mais tarde.";
    }
  }

  /**
   * Extracts property code from conversation context
   */
  private async extractPropertyCodeFromContext(request: AiResponseRequest): Promise<string | null> {
    try {
      // First try to extract from the current message
      const codeMatch = request.message.match(/\b(\d{3,6})\b/);
      if (codeMatch) {
        return codeMatch[1];
      }

      // Use AI to extract property code from message context
      const extractionPrompt = `
        Analise a seguinte mensagem e extraia o código do imóvel mencionado.
        O usuário está pedindo fotos de um imóvel específico.
        
        Mensagem: "${request.message}"
        
        Se não conseguir identificar um código específico, retorne "NONE".
        Se encontrar um código, retorne apenas o número.
        
        Código:`;

      const response = await this.openAiService.generateResponse(
        extractionPrompt,
        "Você é um especialista em extrair códigos de imóveis. Retorne apenas o código numérico ou NONE.",
        {
          model: "gpt-4o",
          temperature: 0.1,
          maxTokens: 50
        }
      );

      const extracted = response.content.trim();
      return extracted === "NONE" ? null : extracted;
    } catch (error) {
      console.error("Erro ao extrair código do imóvel:", error);
      return null;
    }
  }

  /**
   * Enriquece propriedades com fotos adicionais usando endpoint /detalhes
   */
  private async enrichPropertiesWithPhotos(properties: any[], apiSettings: any): Promise<any[]> {
    const enrichedProperties = [];
    
    for (const property of properties) {
      try {
        // Buscar detalhes com fotos para cada imóvel
        const detailsParams = {
          fields: [
            "Codigo", "Categoria", "BairroComercial", "Cidade", "Suites", "DescricaoWeb", 
            "Dormitorios", "Vagas", "Endereco", "Complemento", "AreaPrivativa", 
            "ValorVenda", "ValorLocacao", "FotoDestaque"
          ]
        };

        const baseUrl = `${apiSettings.apiUrl}/imoveis/detalhes`;
        const queryParams = new URLSearchParams({
          key: apiSettings.apiToken,
          pesquisa: JSON.stringify(detailsParams),
          imovel: property.Codigo
        });
        
        const detailsUrl = `${baseUrl}?${queryParams.toString()}`;
        console.log(`📸 [PHOTOS] Buscando fotos para imóvel ${property.Codigo}...`);
        
        const detailsResponse = await fetch(detailsUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          console.log(`📸 [PHOTOS] Fotos encontradas para imóvel ${property.Codigo}:`, {
            hasDestaque: !!detailsData.FotoDestaque,
            fotoDestaque: detailsData.FotoDestaque
          });
          
          // Mesclar dados originais com detalhes enriquecidos
          enrichedProperties.push({
            ...property,
            ...detailsData
          });
        } else {
          console.log(`⚠️ [PHOTOS] Não foi possível buscar fotos para imóvel ${property.Codigo}`);
          enrichedProperties.push(property);
        }
      } catch (error) {
        console.error(`❌ [PHOTOS] Erro ao buscar fotos para imóvel ${property.Codigo}:`, error);
        enrichedProperties.push(property);
      }
    }
    
    return enrichedProperties;
  }

  /**
   * Logs API calls for monitoring and debugging
   */
  private async logApiCall(logData: {
    companyId: string;
    agentId: string;
    apiType: string;
    endpoint: string;
    requestData: any;
    responseStatus: string;
    responseData: any;
    executionTime: number;
    userPhone: string | null;
  }) {
    try {
      const storage = getStorage();
      await storage.logApiCall(logData);
    } catch (error) {
      console.error("Erro ao salvar log da API:", error);
    }
  }

  /**
   * Test if an AI agent can generate responses with its current configuration
   */
  async testAgent(request: Omit<AiResponseRequest, 'message'>): Promise<{ success: boolean; message: string }> {
    try {
      const testMessage = "Olá! Este é um teste de conexão.";
      const response = await this.generateResponse({
        ...request,
        message: testMessage,
      });

      return {
        success: true,
        message: `Teste realizado com sucesso. Resposta: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no teste: ${error.message}`
      };
    }
  }
}