import { getStorage } from "../storage";

export interface PropertySearchCriteria {
  companyId: string;
  transactionType?: 'venda' | 'locacao';
  bedrooms?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  bathrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  parkingSpaces?: number;
  minParkingSpaces?: number;
  city?: string;
  neighborhood?: string;
  minPrivateArea?: number;
  maxPrivateArea?: number;
}

export class PropertyService {
  /**
   * Busca imóveis disponíveis da empresa baseado na mensagem do usuário
   * Usa IA para entender a intenção do usuário e buscar imóveis apropriados
   */
  async searchPropertiesFromMessage(message: string, companyId: string): Promise<any[]> {
    console.log(`🏠 [PROPERTY] Buscando imóveis para empresa: ${companyId}`);
    console.log(`🏠 [PROPERTY] Mensagem: ${message}`);

    const storage = getStorage();

    // Buscar todos os imóveis ativos da empresa
    const allProperties = await storage.getPropertiesByCompany(companyId);
    console.log(`🏠 [PROPERTY] Total de imóveis encontrados: ${allProperties.length}`);

    // Filtrar apenas imóveis ativos
    const activeProperties = allProperties.filter(p => p.status === 'active');
    console.log(`🏠 [PROPERTY] Imóveis ativos: ${activeProperties.length}`);

    if (activeProperties.length === 0) {
      console.log(`🏠 [PROPERTY] Nenhum imóvel ativo encontrado`);
      return [];
    }

    // Analisar a mensagem para extrair critérios de busca
    const criteria = this.extractSearchCriteria(message);
    console.log(`🏠 [PROPERTY] Critérios extraídos:`, criteria);

    // Filtrar imóveis baseado nos critérios
    let filteredProperties = activeProperties;

    // Filtrar por tipo de transação (venda/locação)
    if (criteria.transactionType) {
      filteredProperties = filteredProperties.filter(p => p.transactionType === criteria.transactionType);
      console.log(`🏠 [PROPERTY] Após filtro tipo transação (${criteria.transactionType}): ${filteredProperties.length}`);
    }

    // Filtrar por quartos
    if (criteria.minBedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => (p.bedrooms || 0) >= criteria.minBedrooms!);
    }
    if (criteria.maxBedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => (p.bedrooms || 0) <= criteria.maxBedrooms!);
    }
    if (criteria.bedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.bedrooms === criteria.bedrooms);
    }

    // Filtrar por banheiros
    if (criteria.minBathrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => (p.bathrooms || 0) >= criteria.minBathrooms!);
    }
    if (criteria.maxBathrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => (p.bathrooms || 0) <= criteria.maxBathrooms!);
    }

    // Filtrar por vagas de garagem
    if (criteria.minParkingSpaces !== undefined) {
      filteredProperties = filteredProperties.filter(p => (p.parkingSpaces || 0) >= criteria.minParkingSpaces!);
    }

    // Filtrar por cidade
    if (criteria.city) {
      filteredProperties = filteredProperties.filter(p =>
        p.city?.toLowerCase().includes(criteria.city!.toLowerCase())
      );
    }

    // Filtrar por bairro
    if (criteria.neighborhood) {
      filteredProperties = filteredProperties.filter(p =>
        p.neighborhood?.toLowerCase().includes(criteria.neighborhood!.toLowerCase())
      );
    }

    // Filtrar por área privativa
    if (criteria.minPrivateArea !== undefined) {
      filteredProperties = filteredProperties.filter(p =>
        parseFloat(p.privateArea?.toString() || '0') >= criteria.minPrivateArea!
      );
    }
    if (criteria.maxPrivateArea !== undefined) {
      filteredProperties = filteredProperties.filter(p =>
        parseFloat(p.privateArea?.toString() || '0') <= criteria.maxPrivateArea!
      );
    }

    console.log(`🏠 [PROPERTY] Imóveis após todos os filtros: ${filteredProperties.length}`);

    // Limitar a 5 resultados para não sobrecarregar
    const limitedProperties = filteredProperties.slice(0, 5);

    console.log(`🏠 [PROPERTY] Retornando ${limitedProperties.length} imóveis`);

    return limitedProperties;
  }

  /**
   * Extrai critérios de busca da mensagem do usuário usando análise de palavras-chave
   */
  private extractSearchCriteria(message: string): PropertySearchCriteria {
    const messageLower = message.toLowerCase();
    const criteria: any = {};

    // Detectar tipo de transação
    if (messageLower.includes('alugar') || messageLower.includes('aluguel') || messageLower.includes('locação') || messageLower.includes('locacao')) {
      criteria.transactionType = 'locacao';
    } else if (messageLower.includes('comprar') || messageLower.includes('venda') || messageLower.includes('compra')) {
      criteria.transactionType = 'venda';
    }

    // Detectar número de quartos
    const bedroomPatterns = [
      /(\d+)\s*quartos?/i,
      /(\d+)\s*dormitórios?/i,
      /(\d+)\s*dormitorios?/i,
      /(\d+)q/i,
      /(\d+)\s*quarto/i
    ];

    for (const pattern of bedroomPatterns) {
      const match = messageLower.match(pattern);
      if (match) {
        criteria.bedrooms = parseInt(match[1]);
        break;
      }
    }

    // Detectar número de banheiros
    const bathroomPatterns = [
      /(\d+)\s*banheiros?/i,
      /(\d+)\s*wc/i,
      /(\d+)\s*suítes?/i,
      /(\d+)\s*suites?/i
    ];

    for (const pattern of bathroomPatterns) {
      const match = messageLower.match(pattern);
      if (match) {
        criteria.bathrooms = parseInt(match[1]);
        break;
      }
    }

    // Detectar vagas de garagem
    const parkingPatterns = [
      /(\d+)\s*vagas?/i,
      /(\d+)\s*garagens?/i,
      /(\d+)\s*estacionamentos?/i
    ];

    for (const pattern of parkingPatterns) {
      const match = messageLower.match(pattern);
      if (match) {
        criteria.parkingSpaces = parseInt(match[1]);
        break;
      }
    }

    return criteria;
  }

  /**
   * Formata informações do imóvel para envio ao usuário
   */
  formatPropertyInfo(property: any): string {
    let info = `📍 *${property.name}*\n`;
    info += `🏷️ Código: ${property.code}\n\n`;

    info += `📌 *Endereço:*\n`;
    info += `${property.street}, ${property.number}`;
    if (property.neighborhood) info += `, ${property.neighborhood}`;
    if (property.city) info += `\n${property.city}`;
    if (property.state) info += ` - ${property.state}`;
    if (property.zipCode) info += `\nCEP: ${property.zipCode}`;
    if (property.proximity) info += `\nProximidade: ${property.proximity}`;
    info += `\n\n`;

    info += `📊 *Características:*\n`;
    info += `• Área privativa: ${property.privateArea} m²\n`;
    if (property.bedrooms > 0) info += `• Quartos: ${property.bedrooms}\n`;
    info += `• Banheiros: ${property.bathrooms}\n`;
    info += `• Vagas de garagem: ${property.parkingSpaces}\n`;

    // Características adicionais
    const features = [];
    if (property.hasServiceArea) features.push('Área de serviço');
    if (property.hasSocialBathroom) features.push('Lavabo');
    if (property.hasTvRoom) features.push('Sala de TV');
    if (features.length > 0) {
      info += `• ${features.join(', ')}\n`;
    }

    if (property.description) {
      info += `\n📝 *Descrição:*\n${property.description}\n`;
    }

    // Tipo de transação
    const tipoTransacao = property.transactionType === 'venda' ? 'Venda' : 'Locação';
    info += `\n💰 *Tipo:* ${tipoTransacao}\n`;

    // Link do mapa se disponível
    if (property.mapLocation) {
      info += `\n🗺️ *Localização:* ${property.mapLocation}\n`;
    }

    return info;
  }

  /**
   * Verifica se a mensagem do usuário é sobre busca de imóveis
   */
  isPropertySearchIntent(message: string): boolean {
    const messageLower = message.toLowerCase();

    const propertyKeywords = [
      'imovel', 'imóvel', 'imoveis', 'imóveis',
      'casa', 'casas', 'apartamento', 'apartamentos',
      'alugar', 'aluguel', 'locação', 'locacao',
      'comprar', 'compra', 'venda', 'vender',
      'propriedade', 'propriedades',
      'quartos', 'dormitórios', 'dormitorios',
      'disponível', 'disponivel', 'disponíveis', 'disponiveis'
    ];

    return propertyKeywords.some(keyword => messageLower.includes(keyword));
  }
}

export const propertyService = new PropertyService();
