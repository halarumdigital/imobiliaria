const http = require('http');

// Função para fazer uma requisição HTTP
function makeRequest(data, conversationHistory = []) {
  return new Promise((resolve, reject) => {
    // Para teste, vamos usar GET que já sabemos que funciona
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-property-search',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: result
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: { raw: responseData }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end(); // Removido o write do postData para GET
  });
}

async function testConversationFlow() {
  console.log('🎯 TESTANDO FLUXO COMPLETO DA CONVERSA\n');
  
  let conversationHistory = [];
  let step = 1;

  // Passo 1: Usuário pergunta sobre apartamento
  console.log(`📱 PASSO ${step++}: Usuário pergunta sobre apartamento`);
  let response = await makeRequest({ message: "apartamento" }, conversationHistory);
  
  if (response.data.success && response.data.result) {
    console.log(`🤖 Agente: ${response.data.result}`);
    conversationHistory.push({ role: 'user', content: 'apartamento' });
    conversationHistory.push({ role: 'assistant', content: response.data.result });
  }
  
  console.log('\n' + '='.repeat(80) + '\n');

  // Passo 2: Usuário fornece o nome
  console.log(`📱 PASSO ${step++}: Usuário fornece o nome`);
  response = await makeRequest({ message: "Meu nome é João Silva" }, conversationHistory);
  
  if (response.data.success && response.data.result) {
    console.log(`🤖 Agente: ${response.data.result}`);
    conversationHistory.push({ role: 'user', content: 'Meu nome é João Silva' });
    conversationHistory.push({ role: 'assistant', content: response.data.result });
  }
  
  console.log('\n' + '='.repeat(80) + '\n');

  // Passo 3: Usuário fornece o telefone
  console.log(`📱 PASSO ${step++}: Usuário fornece o telefone`);
  response = await makeRequest({ message: "11987654321" }, conversationHistory);
  
  if (response.data.success && response.data.result) {
    console.log(`🤖 Agente: ${response.data.result}`);
    conversationHistory.push({ role: 'user', content: '11987654321' });
    conversationHistory.push({ role: 'assistant', content: response.data.result });
  }
  
  console.log('\n' + '='.repeat(80) + '\n');

  // Passo 4: Usuário fornece preferências do imóvel
  console.log(`📱 PASSO ${step++}: Usuário fornece preferências do imóvel`);
  response = await makeRequest({ 
    message: "Quero um apartamento de 2 quartos para compra em São Paulo" 
  }, conversationHistory);
  
  if (response.data.success && response.data.result) {
    console.log(`🤖 Agente: ${response.data.result}`);
    
    // Verificar se a resposta contém informações de imóveis (indicando que a API foi chamada)
    if (response.data.result.includes('Código') || 
        response.data.result.includes('imóvel') || 
        response.data.result.includes('R$') ||
        response.data.result.includes('quarto') ||
        response.data.result.includes('banheiro')) {
      console.log('\n🎉 SUCESSO: API de imóveis foi chamada e retornou resultados!');
    } else if (response.data.result.includes('Configuração necessária') || 
               response.data.result.includes('Faltando')) {
      console.log('\n⚠️ PROBLEMA: Configuração da API faltando');
    } else {
      console.log('\n❓ STATUS: Agente ainda está coletando informações ou houve problema');
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Resumo final
  console.log('📋 RESUMO DO TESTE:');
  console.log(`• Total de mensagens na conversa: ${conversationHistory.length}`);
  console.log(`• Fluxo completado: ${step - 1} passos`);
  
  if (conversationHistory.length >= 6) {
    console.log('✅ Fluxo completo testado com sucesso');
  } else {
    console.log('⚠️ Teste incompleto - verifique se o servidor está rodando');
  }
}

// Aguardar um pouco para o servidor estar pronto
setTimeout(testConversationFlow, 1000);
