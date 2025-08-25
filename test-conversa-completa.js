const { AiResponseService } = require('./server/aiResponseService');
const { getStorage } = require('./server/storage');

async function testConversaCompleta() {
  console.log('🧪🧪🧪 [TESTE] INICIANDO TESTE DE CONVERSA COMPLETA 🧪🧪🧪');
  
  try {
    // Inicializar storage
    const storage = getStorage();
    await storage.init();
    
    // Criar instância do AiResponseService
    const aiResponseService = new AiResponseService('test-key');
    
    // Simular uma conversa completa passo a passo
    const conversa = [
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'Olá! Como posso ajudar você hoje?' },
      { role: 'user', content: 'quero comprar um apartamento' },
      { role: 'assistant', content: 'Ótimo! Vou ajudá-lo a encontrar o imóvel perfeito. Para começar, qual é o seu nome?' },
      { role: 'user', content: 'meu nome é João Silva' },
      { role: 'assistant', content: 'Prazer, João! Agora preciso do seu telefone para contato.' },
      { role: 'user', content: 'meu telefone é 11999999999' },
      { role: 'assistant', content: 'Excelente! Que tipo de imóvel você está procurando? (casa, apartamento, terreno, etc)' },
      { role: 'user', content: 'apartamento' },
      { role: 'assistant', content: 'Perfeito! Você deseja comprar ou alugar este imóvel?' },
      { role: 'user', content: 'comprar' },
      { role: 'assistant', content: 'Ótimo! Em qual cidade você está procurando o imóvel?' },
      { role: 'user', content: 'São Paulo' }
    ];
    
    console.log('📋 [TESTE] Simulando conversa completa com todas as informações coletadas');
    console.log('📋 [TESTE] Última mensagem do usuário:', conversa[conversa.length - 1].content);
    
    // Testar extração de contexto com o histórico completo
    console.log('\n🔍 [TESTE] Testando extractConversationContext com histórico completo...');
    
    // Acessar o método privado através de uma instância
    const extractContextMethod = aiResponseService.extractConversationContext.bind(aiResponseService);
    
    const request = {
      message: 'São Paulo',
      userMessage: 'São Paulo',
      agentId: 'test-agent',
      agentPrompt: 'Você é um assistente imobiliário',
      temperatura: 0.7,
      modelo: 'gpt-4o',
      numeroTokens: 1000,
      agentType: 'main',
      companyId: 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2',
      conversationHistory: conversa
    };
    
    console.log('🔍 [TESTE] Request enviado:', JSON.stringify({
      message: request.message,
      companyId: request.companyId,
      historyLength: request.conversationHistory.length
    }, null, 2));
    
    const contexto = await extractContextMethod(request);
    
    console.log('\n📊 [RESULTADO] Contexto extraído:');
    console.log(JSON.stringify(contexto, null, 2));
    
    // Verificar se todas as informações foram extraídas corretamente
    const informacoesFaltando = [];
    if (!contexto.nome) informacoesFaltando.push('nome');
    if (!contexto.telefone) informacoesFaltando.push('telefone');
    if (!contexto.tipoImovel) informacoesFaltando.push('tipoImovel');
    if (!contexto.finalidade) informacoesFaltando.push('finalidade');
    if (!contexto.cidade) informacoesFaltando.push('cidade');
    
    console.log('\n🎯 [ANÁLISE] Verificação de informações:');
    console.log(`✅ Nome: ${contexto.nome || 'NÃO ENCONTRADO'}`);
    console.log(`✅ Telefone: ${contexto.telefone || 'NÃO ENCONTRADO'}`);
    console.log(`✅ Tipo Imóvel: ${contexto.tipoImovel || 'NÃO ENCONTRADO'}`);
    console.log(`✅ Finalidade: ${contexto.finalidade || 'NÃO ENCONTRADO'}`);
    console.log(`✅ Cidade: ${contexto.cidade || 'NÃO ENCONTRADO'}`);
    
    if (informacoesFaltando.length === 0) {
      console.log('\n🎉 [SUCESSO] Todas as informações foram extraídas corretamente!');
      console.log('🚀 [PROGRESSO] O sistema deveria prosseguir com a busca na API');
    } else {
      console.log('\n❌ [PROBLEMA] Informações faltando:', informacoesFaltando.join(', '));
      console.log('🔄 [PROGRESSO] O sistema continuará pedindo os dados faltantes');
    }
    
    // Testar handlePropertySearch diretamente
    console.log('\n🏠 [TESTE] Testando handlePropertySearch...');
    
    const handlePropertySearchMethod = aiResponseService.handlePropertySearch.bind(aiResponseService);
    const resposta = await handlePropertySearchMethod(request);
    
    console.log('\n💬 [RESPOSTA] Resposta do handlePropertySearch:');
    console.log(resposta);
    
    // Verificar se a resposta é uma pergunta de coleta de dados ou uma busca
    const coletaKeywords = ['qual é o seu nome', 'telefone para contato', 'tipo de imóvel', 'comprar ou alugar', 'qual cidade'];
    const isColeta = coletaKeywords.some(keyword => resposta.toLowerCase().includes(keyword));
    
    if (isColeta) {
      console.log('\n🔄 [DIAGNÓSTICO] O sistema está em modo de coleta de dados');
      console.log('🔍 [PROBLEMA] Mesmo com todas as informações no histórico, o sistema não as extraiu corretamente');
    } else {
      console.log('\n🎉 [DIAGNÓSTICO] O sistema está em modo de busca!');
      console.log('✅ [SUCESSO] O sistema identificou que todas as informações foram coletadas');
    }
    
    console.log('\n🧪 [TESTE] Teste concluído!');
    
  } catch (error) {
    console.error('❌ [ERRO] Erro durante o teste:', error);
    console.error('❌ [STACK]', error.stack);
  }
}

// Executar teste
testConversaCompleta().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
