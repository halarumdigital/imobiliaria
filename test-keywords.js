// Teste simples da lógica de detecção de palavras-chave

function testPropertyKeywords() {
  const propertyKeywords = [
    'imóvel', 'imovel', 'imóveis', 'imoveis', 'casa', 'casas', 'apartamento', 'apartamentos',
    'propriedade', 'propriedades', 'terreno', 'terrenos', 'venda', 'vender', 'comprar',
    'aluguel', 'alugar', 'quarto', 'quartos', 'dormitório', 'dormitórios', 'garagem',
    'banheiro', 'banheiros', 'metro', 'metros', 'm²', 'preço', 'valor', 'disponível',
    'disponíveis', 'localização', 'bairro', 'cidade', 'região', 'buscar', 'procurar',
    'encontrar', 'quero', 'gostaria', 'preciso', 'tenho interesse', 'interessado',
    'suite', 'suites', 'vagas', 'vaga', 'financiamento', 'entrada', 'parcela'
  ];

  const testMessages = [
    "Oi, preciso de um apartamento",
    "Quero comprar uma casa",
    "Estou procurando imoveis para alugar",
    "Tem algum terreno disponível?",
    "Gostaria de ver apartamentos com 2 quartos",
    "Busco casa com garagem",
    "Preciso de imóvel em São Paulo",
    "Oi, como você está?",
    "Qual é o seu nome?",
    "Obrigado pela ajuda"
  ];

  console.log('=== TESTE DE DETECÇÃO DE PALAVRAS-CHAVE ===\n');

  testMessages.forEach((message, index) => {
    const isPropertyQuery = propertyKeywords.some(keyword => {
      return message.toLowerCase().includes(keyword.toLowerCase());
    });

    const foundKeywords = propertyKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log(`${index + 1}. "${message}"`);
    console.log(`   Detectado como busca de imóvel: ${isPropertyQuery ? '✅ SIM' : '❌ NÃO'}`);
    if (foundKeywords.length > 0) {
      console.log(`   Palavras-chave encontradas: ${foundKeywords.join(', ')}`);
    }
    console.log('');
  });

  console.log('=== RESUMO ===');
  const propertyQueries = testMessages.filter((message, index) => {
    return propertyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  console.log(`Total de mensagens testadas: ${testMessages.length}`);
  console.log(`Mensagens detectadas como busca de imóvel: ${propertyQueries.length}`);
  console.log(`Taxa de detecção: ${(propertyQueries.length / testMessages.length * 100).toFixed(1)}%`);
}

testPropertyKeywords();
