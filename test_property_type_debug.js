// Test para verificar por que property_type está vindo como null na tool busca_imoveis

async function testPropertyTypeFiltering() {
  console.log('🧪 ========== TESTE DE FILTRO DE PROPERTY_TYPE ==========\n');

  // Simular o que o OpenAI retorna
  const functionArgs = {
    cidade: "Joaçaba",
    tipo_transacao: "locacao",
    tipo_imovel: "apartamento"
  };

  console.log('📥 Argumentos da função (do OpenAI):');
  console.log('  cidade:', functionArgs.cidade);
  console.log('  tipo_transacao:', functionArgs.tipo_transacao);
  console.log('  tipo_imovel:', functionArgs.tipo_imovel);
  console.log('  tipo_imovel type:', typeof functionArgs.tipo_imovel);
  console.log('  tipo_imovel is undefined?', functionArgs.tipo_imovel === undefined);
  console.log('  tipo_imovel is null?', functionArgs.tipo_imovel === null);
  console.log('  tipo_imovel is empty?', functionArgs.tipo_imovel === '');
  console.log('');

  // Simular normalização
  let tipo_imovel = functionArgs.tipo_imovel;
  const tiposImovelMap = {
    'apartamento': 'apartamento',
    'ap': 'apartamento',
    'apto': 'apartamento',
    'casa': 'casa',
    'sobrado': 'sobrado',
    'sala': 'sala',
    'terreno': 'terreno',
    'chácara': 'chácara',
    'chacara': 'chácara'
  };

  if (tipo_imovel) {
    const tipoNormalizado = tiposImovelMap[tipo_imovel.toLowerCase()];
    if (tipoNormalizado) {
      console.log(`🔄 Normalizando: "${tipo_imovel}" → "${tipoNormalizado}"`);
      tipo_imovel = tipoNormalizado;
    }
  }

  console.log('\n📦 Após normalização:');
  console.log('  tipo_imovel:', tipo_imovel);
  console.log('  tipo_imovel type:', typeof tipo_imovel);
  console.log('');

  // Simular criação dos filtros
  const searchFilters = {
    city: functionArgs.cidade,
    transactionType: functionArgs.tipo_transacao === 'aluguel' ? 'locacao' : functionArgs.tipo_transacao,
    propertyType: tipo_imovel
  };

  console.log('🔍 Filtros que serão enviados para searchProperties:');
  console.log(JSON.stringify(searchFilters, null, 2));
  console.log('');
  console.log('  searchFilters.propertyType:', searchFilters.propertyType);
  console.log('  searchFilters.propertyType type:', typeof searchFilters.propertyType);
  console.log('  searchFilters.propertyType is undefined?', searchFilters.propertyType === undefined);
  console.log('  searchFilters.propertyType is null?', searchFilters.propertyType === null);
  console.log('');

  // Testar cenário 2: OpenAI NÃO retorna tipo_imovel
  console.log('\n🧪 ========== TESTE 2: OpenAI não fornece tipo_imovel ==========\n');

  const functionArgs2 = {
    cidade: "Joaçaba"
    // tipo_imovel: undefined (não fornecido)
  };

  console.log('📥 Argumentos da função (do OpenAI):');
  console.log('  cidade:', functionArgs2.cidade);
  console.log('  tipo_imovel:', functionArgs2.tipo_imovel);
  console.log('  tipo_imovel type:', typeof functionArgs2.tipo_imovel);
  console.log('  tipo_imovel is undefined?', functionArgs2.tipo_imovel === undefined);
  console.log('');

  let tipo_imovel2 = functionArgs2.tipo_imovel;

  console.log('❌ tipo_imovel NÃO foi fornecido pelo OpenAI!');
  console.log('   Tentando extrair do histórico...');

  // Simular extração do histórico
  const conversationText = 'oi tudo bem? procuro apartamento em joaçaba para alugar';
  console.log('   Histórico da conversa:', conversationText);

  for (const [variacao, tipo] of Object.entries(tiposImovelMap)) {
    if (conversationText.includes(variacao)) {
      tipo_imovel2 = tipo;
      console.log(`✅ Tipo extraído do histórico: ${tipo_imovel2}`);
      break;
    }
  }

  const searchFilters2 = {
    city: functionArgs2.cidade,
    propertyType: tipo_imovel2
  };

  console.log('\n🔍 Filtros após extração do histórico:');
  console.log(JSON.stringify(searchFilters2, null, 2));
  console.log('');
  console.log('  searchFilters.propertyType:', searchFilters2.propertyType);
  console.log('  searchFilters.propertyType type:', typeof searchFilters2.propertyType);
  console.log('');

  console.log('✅ Testes concluídos!');
}

testPropertyTypeFiltering();
