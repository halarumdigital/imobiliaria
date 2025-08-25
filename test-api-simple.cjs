const http = require('http');

function testarAPI() {
  console.log('🔍 Testando endpoint de busca de propriedades...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-property-search',
    method: 'GET'
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
            
            // Verificar se é uma mensagem de configuração faltando
            if (result.result.includes('Configuração necessária') || 
                result.result.includes('Faltando')) {
              console.log('\n❌ PROBLEMA IDENTIFICADO: Configuração da API faltando');
              console.log('🔧 SOLUÇÃO: Inserir configurações no banco de dados');
            } else {
              console.log('\n✅ API configurada e funcionando');
            }
          } else {
            console.log('⚠️  Nenhum resultado retornado');
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

  req.end();
}

// Aguardar para o servidor estar pronto
setTimeout(testarAPI, 1000);
