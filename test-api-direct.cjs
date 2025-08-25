const http = require('http');

function testarAPIComValoresPadrao() {
  console.log('🔍 Testando se API é chamada com valores padrão...');
  
  const testData = {
    message: "apartamento",
    agentId: "test-agent",
    agentPrompt: "Você é um assistente imobiliário",
    temperatura: 0.7,
    modelo: "gpt-4o",
    numeroTokens: 1000,
    agentType: "main",
    companyId: "a9a2f3e1-6e37-43d4-b411-d7fb999f93e2",
    conversationHistory: []
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
      console.log('\n📊 RESULTADO DO TESTE:');
      console.log('Status HTTP:', res.statusCode);
      
      try {
        const result = JSON.parse(data);
        console.log('\n🎯 ANÁLISE:');
        
        if (result.success) {
          console.log('✅ Teste executado com sucesso');
          
          if (result.result) {
            console.log('📝 Resposta do agente:', result.result);
            
            // Verificar se a resposta contém informações de imóveis
            if (result.result.includes('imóvel') || result.result.includes('propriedade') || 
                result.result.includes('apartamento') || result.result.includes('casa') ||
                result.result.includes('Código') || result.result.includes('R$')) {
              console.log('\n🎉 SUCESSO: API foi chamada e retornou dados de imóveis!');
            } else if (result.result.includes('nome') || result.result.includes('telefone')) {
              console.log('\n❌ PROBLEMA: Ainda está pedindo dados do usuário');
            } else if (result.result.includes('Configuração necessária') || 
                       result.result.includes('Faltando')) {
              console.log('\n⚠️ CONFIGURAÇÃO: API não configurada');
            } else {
              console.log('\n❓ INDEFINIDO: Resposta não categorizada');
            }
          } else {
            console.log('⚠️ Nenhum resultado retornado');
          }
        } else {
          console.log('❌ Teste falhou:', result.error);
        }
        
      } catch (error) {
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
setTimeout(testarAPIComValoresPadrao, 1000);
