import { OpenAiService } from "./services/openai";
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
      console.log(`🤖 Gerando resposta para agente ID: ${request.agentId} (Tipo: ${request.agentType || 'main'})`);
      
      // If this is a main agent, check if we need to delegate to secondary agents
      if (request.agentType === 'main' && request.companyId) {
        const delegationResult = await this.checkForDelegation(request);
        if (delegationResult) {
          console.log(`🔄 Delegando para agente secundário: ${delegationResult.agent.name}`);
          return delegationResult.response;
        }
      }

      // Generate response from the current agent
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
    if (request.companyId) {
      const propertyResponse = await this.handlePropertySearch(request);
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

    // Add specific instructions
    enhancedPrompt += `\n\nResponda sempre em português brasileiro de forma natural e helpful. Se a pergunta não puder ser respondida com o conhecimento fornecido, seja honesto sobre isso.`;

    console.log(`📝 Prompt construído - Tamanho: ${enhancedPrompt.length} caracteres`);
    console.log(`💬 Mensagem do usuário: "${request.message}"`);
    
    const response = await this.openAiService.generateResponse(
      request.message,
      enhancedPrompt,
      {
        model: request.modelo || "gpt-4o",
        temperature: request.temperatura || 0.7,
        maxTokens: request.numeroTokens || 1000,
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
      const message = request.message.toLowerCase();
      console.log(`🏠 [PROPERTY SEARCH] Analisando mensagem: "${message}"`);
      
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
        'aluguel', 'alugar', 'quarto', 'quartos', 'dormitório', 'dormitórios', 'garagem',
        'banheiro', 'banheiros', 'metro', 'metros', 'm²', 'preço', 'valor', 'disponível',
        'disponíveis', 'localização', 'bairro', 'cidade', 'região'
      ];

      // Check if message contains property-related keywords
      const isPropertyQuery = propertyKeywords.some(keyword => message.includes(keyword));
      console.log(`🏠 [PROPERTY SEARCH] Palavras-chave de imóveis encontradas: ${isPropertyQuery}`);
      
      if (!isPropertyQuery) {
        console.log(`🏠 [PROPERTY SEARCH] Nenhuma palavra-chave de imóveis encontrada - retornando null`);
        return null;
      }

      console.log(`🏠 Detectada consulta sobre imóveis: "${request.message}"`);

      // Extract filters from the message using AI
      const filters = await this.extractPropertyFilters(request.message);
      console.log(`🔍 Filtros extraídos:`, filters);

      // Get API settings for the company
      const storage = getStorage();
      const apiSettings = await storage.getApiSettings(request.companyId!);
      
      console.log(`🔍 [DEBUG] API settings encontradas:`, {
        exists: !!apiSettings,
        hasUrl: !!apiSettings?.apiUrl,
        hasToken: !!apiSettings?.apiToken,
        url: apiSettings?.apiUrl ? 'Configurada' : 'Não configurada',
        token: apiSettings?.apiToken ? 'Configurado' : 'Não configurado'
      });
      
      if (!apiSettings?.apiUrl || !apiSettings?.apiToken) {
        console.log(`❌ [DEBUG] Configurações da API faltando - retornando mensagem de erro`);
        return "Desculpe, as configurações da API de imóveis não foram encontradas. Por favor, configure a API primeiro na seção de configurações.";
      }

      // Search for properties (seguindo exatamente o modelo n8n)
      const searchParams = {
        filter: {
          ...filters,
          "SiteSuder": "Sim"
        },
        fields: [
          "Codigo", "Categoria", "BairroComercial", "Cidade", "Suites", "DescricaoWeb", 
          "Dormitorios", "Vagas", "Endereco", "Complemento", "AreaPrivativa", 
          "ValorVenda", "ValorLocacao"
        ],
        paginacao: { 
          pagina: "1", 
          quantidade: "50" 
        }
      };

      console.log(`🔍 [DEBUG] Search params being sent:`, JSON.stringify(searchParams, null, 2));

      // Construir URL exatamente como no n8n
      const baseUrl = `${apiSettings.apiUrl}/imoveis/listar`;
      const queryParams = new URLSearchParams({
        key: apiSettings.apiToken,
        v2: "1",
        pesquisa: JSON.stringify(searchParams),
        showtotal: "1"
      });
      
      const apiUrl = `${baseUrl}?${queryParams.toString()}`;
      console.log(`🔍 [DEBUG] Final API URL:`, apiUrl);

      // Log API call start
      const apiCallStart = Date.now();
      console.log(`🚀 [DEBUG] Making API call to:`, apiUrl);
      
      const response = await fetch(apiUrl, {
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
      console.log(`✅ ${data.length || 0} imóveis encontrados`);

      // Log successful API call
      await this.logApiCall({
        companyId: request.companyId!,
        agentId: request.agentId,
        apiType: 'property_search',
        endpoint: apiUrl,
        requestData: { searchParams, filters },
        responseStatus: 'success',
        responseData: { count: data.length || 0 },
        executionTime,
        userPhone: null
      });

      // Format the response with found properties
      return await this.formatPropertyResponse(data, request.message);

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
  private async formatPropertyResponse(properties: any[], originalMessage: string): Promise<string> {
    try {
      if (!properties || properties.length === 0) {
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
        - Dados do corretor (nome e telefone)
        
        Se houver fotos, mencione que o imóvel possui fotos disponíveis.
        
        Seja conversacional e helpful. Ofereça para buscar mais detalhes se necessário.
        `;

      const response = await this.openAiService.generateResponse(
        responsePrompt,
        "Você é um assistente especializado em imóveis. Apresente os resultados de forma clara e organizada.",
        {
          model: "gpt-4o",
          temperature: 0.7,
          maxTokens: 1000
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
      const apiUrl = `${apiSettings.apiUrl}/imoveis/detalhes?key=${apiSettings.apiToken}&v2=1&pesquisa=${searchQuery}&imovel=${propertyCode}`;

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
   * Sends detailed property information with photos
   */
  private async sendPropertyPhotos(propertyData: any, request: AiResponseRequest): Promise<string> {
    try {
      if (!propertyData) {
        return "Não consegui encontrar os detalhes deste imóvel.";
      }

      console.log(`📋 Preparando detalhes completos do imóvel ${propertyData.Codigo}...`);

      // Format complete property details using AI
      const detailsPrompt = `
        Formate os seguintes dados de um imóvel de forma organizada e atrativa para WhatsApp.
        Use emojis apropriados e organize as informações de forma clara e fácil de ler.
        
        Dados do imóvel: ${JSON.stringify(propertyData, null, 2)}
        
        Inclua:
        - Cabeçalho com código e localização
        - Valores (venda/locação se disponível)
        - Características (quartos, banheiros, vagas, áreas)
        - Lazer/Comodidades (piscina, churrasqueira, etc.)
        - Endereço completo
        - Dados do corretor
        - Dados da agência
        - Lista de fotos (se houver)
        
        Formato: WhatsApp friendly com quebras de linha \\n e emojis apropriados.
        Seja detalhado mas organizado.
      `;

      const response = await this.openAiService.generateResponse(
        detailsPrompt,
        "Você é um especialista em apresentação de imóveis. Formate as informações de forma atrativa e organizada.",
        {
          model: "gpt-4o",
          temperature: 0.3,
          maxTokens: 1500
        }
      );

      return response.content;
    } catch (error) {
      console.error("❌ Erro ao formatar detalhes do imóvel:", error);
      return "Encontrei o imóvel, mas ocorreu um erro ao formatar os detalhes. Tente novamente.";
    }
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