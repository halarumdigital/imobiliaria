const http = require('http');

function testPostRoute() {
  console.log('🧪 Testando rota POST /api/test-property-search...');
  
  const testData = {
    message: "Quero um apartamento de 2 quartos em São Paulo",
    agentId: "test-agent",
    agentPrompt: "Você é um assistente imobiliário",
    temperatura: 0.7,
    modelo: "gpt-4o",
    numeroTokens: 1000,
    agentType: "main",
    companyId: "a9a2f3e1-6e37-43d4-b411-d7fb999f93e2",
    conversationHistory: [
      { role: 'user', content: 'apartamento' },
      { role: 'assistant', content: 'Ótimo! Vou ajudá-lo a encontrar o imóvel perfeito. Para começar, qual é o seu nome?' },
      { role: 'user', content: 'Meu nome é João Silva' },
      { role: 'assistant', content: 'Prazer, João Silva! Agora preciso do seu telefone para contato.' },
      { role: 'user', content: '11987654321' },
      { role: 'assistant', content: 'Perfeito! Agora me conte sobre o imóvel que você procura.' }
    ]
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-property-search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📊 RESULTADO DO TESTE POST:');
      console.log('Status HTTP:', res.statusCode);
      
      try {
        const result = JSON.parse(data);
        console.log('\n🎯 ANÁLISE:');
        
        if (result.success) {
          console.log('✅ Rota POST funcionando');
          
          if (result.result || result.properties) {
            console.log('📝 Resposta do agente:', result.result || 'Propriedades encontradas');
            
            // Verificar se chamou a API de imóveis
            if (result.properties || 
                (result.result && (result.result.includes('Código') || 
                 result.result.includes('imóvel') || 
                 result.result.includes('R$')))) {
              console.log('\n🎉 SUCESSO: API de imóveis foi chamada!');
            } else if (result.result && result.result.includes('nome')) {
              console.log('\n❌ PROBLEMA: Ainda está pedindo dados básicos');
            } else {
              console.log('\n❓ INDEFINIDO: Resposta não categorizada');
              console.log('Resposta completa:', JSON.stringify(result, null, 2));
            }
          } else {
            console.log('⚠️ Nenhum resultado retornado');
            console.log('Resposta completa:', JSON.stringify(result, null, 2));
          }
        } else {
          console.log('❌ Teste falhou:', result.error);
        }
        
      } catch (error) {
        console.log('❌ Erro ao parsear resposta:', error.message);
        console.log('Resposta (texto puro):', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na conexão:', error.message);
  });

  req.write(postData);
  req.end();
}

// Aguardar para o servidor estar pronto
setTimeout(testPostRoute, 1000);
