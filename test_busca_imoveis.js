// Teste para verificar se a tool busca_imoveis está sendo chamada corretamente

const fetch = require('node-fetch');

async function testBuscaImoveis() {
  console.log('🧪 Iniciando teste da tool busca_imoveis...');
  
  try {
    // Simular uma chamada à API como se fosse o OpenAI
    const response = await fetch('http://localhost:5000/api/tools/busca_imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: 'test-agent-id',
        cidade: 'Joaçaba',
        tipo_transacao: 'venda',
        tipo_imovel: 'apartamento'
      })
    });

    const data = await response.json();
    console.log('✅ Resposta da API:', data);
    
    if (response.ok) {
      console.log(`✅ Tool funcionando! Encontrados ${data.total || 0} imóveis`);
    } else {
      console.log('❌ Erro na chamada da tool:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao testar a tool:', error);
  }
}

// Testar também a extração de parâmetros do histórico
async function testExtracaoParametros() {
  console.log('\n🧪 Testando extração de parâmetros...');
  
  // Simular histórico de conversa
  const conversationHistory = [
    { role: 'user', content: 'Olá' },
    { role: 'assistant', content: 'Olá! Como posso ajudar?' },
    { role: 'user', content: 'Estou procurando um apartamento em Joaçaba' }
  ];
  
  const conversationText = conversationHistory
    .map(m => m.content.toLowerCase())
    .join(' ');
  
  console.log('Texto da conversa:', conversationText);
  
  // Testar extração de cidade
  const cidades = ['joaçaba', 'joacaba', 'campinas', 'são paulo', 'sao paulo'];
  let cidadeDetectada = null;
  for (const c of cidades) {
    if (conversationText.includes(c)) {
      cidadeDetectada = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }
  console.log('Cidade detectada:', cidadeDetectada);
  
  // Testar extração de tipo de imóvel
  const tiposImovel = ['apartamento', 'ap', 'apto', 'casa', 'sobrado', 'sala', 'terreno', 'chácara', 'chacara'];
  let tipoDetectado = null;
  for (const tipo of tiposImovel) {
    if (conversationText.includes(tipo)) {
      tipoDetectado = tipo === 'ap' || tipo === 'apto' ? 'apartamento' : tipo;
      break;
    }
  }
  console.log('Tipo de imóvel detectado:', tipoDetectado);
  
  if (cidadeDetectada && tipoDetectado) {
    console.log('✅ Parâmetros extraídos com sucesso!');
    console.log(`🔍 Busca: ${tipoDetectado} em ${cidadeDetectada}`);
  } else {
    console.log('❌ Falha na extração de parâmetros');
  }
}

// Executar testes
async function runTests() {
  await testExtracaoParametros();
  console.log('\n' + '='.repeat(50));
  await testBuscaImoveis();
}

runTests();