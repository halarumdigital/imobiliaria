// Teste para verificar se o companyId está sendo passado corretamente
const http = require('http');

function testarCompanyId() {
  console.log('🔍 TESTE: Verificando se companyId está sendo passado');
  
  const postData = JSON.stringify({
    message: "Procuro apartamento",
    agentId: "test-agent",
    companyId: "a9a2f3e1-6e37-43d4-b411-d7fb999f93e2", // ID explícito
    agentType: "main"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai-response',
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
      console.log('📊 RESULTADO:');
      console.log('Status:', res.statusCode);
      
      try {
        const response = JSON.parse(data);
        console.log('Resposta:', response.response);
        
        // Verificar se a resposta indica que está tentando detectar imóveis
        if (response.response.includes('nome') && response.response.includes('imóvel')) {
          console.log('✅ SUCESSO: Agent detectou busca de imóveis e iniciou coleta');
        } else {
          console.log('❌ PROBLEMA: Agent não detectou busca de imóveis');
        }
        
      } catch (error) {
        console.log('Resposta (texto):', data);
        console.log('❌ Erro ao parsear JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.write(postData);
  req.end();
}

// Aguardar servidor
setTimeout(testarCompanyId, 2000);
