const http = require('http');

// Criar um teste simples que simule uma conversa completa
// usando dados diretos sem autenticação

function simulateAIAgent(message, conversationHistory = []) {
  return new Promise((resolve, reject) => {
    // Construir URL com parâmetros
    const encodedMessage = encodeURIComponent(message);
    const encodedHistory = encodeURIComponent(JSON.stringify(conversationHistory));
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/test-property-search?message=${encodedMessage}&history=${encodedHistory}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          resolve({ raw: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testCompleteFlow() {
  console.log('🎯 TESTE DE FLUXO COMPLETO DO AGENTE IMOBILIÁRIO\n');
  
  const steps = [
    { user: "apartamento", description: "Usuário pergunta sobre apartamento" },
    { user: "João Silva", description: "Usuário fornece nome" },
    { user: "11987654321", description: "Usuário fornece telefone" },
    { user: "Quero um apartamento de 2 quartos para compra em São Paulo", description: "Usuário especifica requisitos" }
  ];
  
  let conversationHistory = [];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`📱 PASSO ${i + 1}: ${step.description}`);
    console.log(`👤 Usuário: "${step.user}"`);
    
    try {
      const response = await simulateAIAgent(step.user, conversationHistory);
      
      if (response.success && response.result) {
        console.log(`🤖 Agente: "${response.result}"`);
        
        // Adicionar à conversa
        conversationHistory.push({ role: 'user', content: step.user });
        conversationHistory.push({ role: 'assistant', content: response.result });
        
        // Analisar a resposta
        if (i === steps.length - 1) {
          // Na última etapa, verificar se fez busca de imóveis
          if (response.result.includes('Código') || 
              response.result.includes('imóvel') || 
              response.result.includes('R$') ||
              response.result.includes('propriedade') ||
              response.result.includes('encontrei')) {
            console.log('✅ SUCESSO: Agente fez busca de imóveis!');
          } else if (response.result.includes('Configuração necessária')) {
            console.log('⚠️ CONFIGURAÇÃO: API não configurada corretamente');
          } else {
            console.log('❓ INDEFINIDO: Resposta não indica busca de imóveis');
          }
        }
      } else {
        console.log(`❌ Erro na resposta:`, response);
      }
      
    } catch (error) {
      console.log(`❌ Erro na requisição:`, error.message);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  console.log('📋 RESUMO FINAL:');
  console.log(`• Conversação teve ${conversationHistory.length} mensagens`);
  console.log(`• Etapas completadas: ${steps.length}`);
  
  if (conversationHistory.length >= 6) {
    console.log('✅ Fluxo completo testado');
  } else {
    console.log('⚠️ Fluxo incompleto');
  }
}

// Aguardar um pouco para o servidor estar pronto
setTimeout(testCompleteFlow, 1000);
