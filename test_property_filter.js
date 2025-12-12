// Teste para verificar se a filtragem por tipo de imóvel está funcionando
const { propertyService } = require('./dist/services/propertyService');

async function testPropertyFilter() {
  console.log('🧪 Iniciando teste de filtragem por tipo de imóvel...\n');
  
  // Teste 1: Busca por apartamento
  console.log('📍 Teste 1: Buscando "apartamento"');
  const result1 = propertyService.extractSearchCriteria('apartamento');
  console.log('Critérios extraídos:', JSON.stringify(result1, null, 2));
  console.log('');
  
  // Teste 2: Busca por casa
  console.log('📍 Teste 2: Buscando "casa"');
  const result2 = propertyService.extractSearchCriteria('casa');
  console.log('Critérios extraídos:', JSON.stringify(result2, null, 2));
  console.log('');
  
  // Teste 3: Busca por terreno
  console.log('📍 Teste 3: Buscando "terreno"');
  const result3 = propertyService.extractSearchCriteria('terreno');
  console.log('Critérios extraídos:', JSON.stringify(result3, null, 2));
  console.log('');
  
  // Teste 4: Busca com múltiplos termos
  console.log('📍 Teste 4: Buscando "apartamento em joaçaba"');
  const result4 = propertyService.extractSearchCriteria('apartamento em joaçaba');
  console.log('Critérios extraídos:', JSON.stringify(result4, null, 2));
  console.log('');
  
  // Teste 5: Busca com tipo de transação
  console.log('📍 Teste 5: Buscando "alugar apartamento"');
  const result5 = propertyService.extractSearchCriteria('alugar apartamento');
  console.log('Critérios extraídos:', JSON.stringify(result5, null, 2));
  console.log('');
  
  console.log('✅ Testes concluídos!');
}

testPropertyFilter().catch(console.error);