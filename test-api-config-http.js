const http = require('http');

async function testarAPIConfig() {
  console.log('🔍 Testando configurações da API através do servidor...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-api-config',
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
        console.log('📊 Resposta do servidor:');
        console.log('Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('Dados:', JSON.stringify(response, null, 2));
          
          if (response.apiSettings) {
            if (response.apiSettings.length === 0) {
              console.log('\n❌ PROBLEMA IDENTIFICADO: Tabela api_settings está VAZIA');
              console.log('\n🔧 SOLUÇÃO NECESSÁRIA:');
              console.log('1. Inserir configurações da API VistaHost no banco');
              console.log('2. URL: https://suderneg-rest.vistahost.com.br');
              console.log('3. Token de acesso necessário');
            } else {
              console.log('\n✅ Configurações encontradas:', response.apiSettings.length);
            }
          }
          
        } catch (error) {
          console.log('Resposta (texto):', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Aguardar um pouco para o servidor estar pronto
setTimeout(testarAPIConfig, 2000);
