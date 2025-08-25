import fetch from 'node-fetch';

async function testApiConfigRoutes() {
  console.log('🧪 Testando rotas de configuração da API...');
  
  const baseUrl = 'http://localhost:3000';
  
  // Primeiro, vamos fazer login para obter um token
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Assumindo que existe um usuário admin
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou. Vamos tentar sem autenticação primeiro.');
      
      // Testar rota sem autenticação para verificar se pelo menos o servidor responde
      console.log('🔍 Testando rota sem autenticação...');
      const testResponse = await fetch(`${baseUrl}/api/health`);
      if (testResponse.ok) {
        console.log('✅ Servidor está respondendo!');
      } else {
        console.log('❌ Servidor não está respondendo corretamente');
      }
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    
    const token = loginData.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Testar GET /api/client/api-settings
    console.log('📥 Testando GET /api/client/api-settings...');
    const getResponse = await fetch(`${baseUrl}/api/client/api-settings`, {
      headers
    });

    if (getResponse.ok) {
      const settings = await getResponse.json();
      console.log('✅ GET api-settings funcionou!', settings);
    } else {
      console.log('❌ GET api-settings falhou:', getResponse.status, await getResponse.text());
    }

    // Testar PUT /api/client/api-settings
    console.log('📤 Testando PUT /api/client/api-settings...');
    const putResponse = await fetch(`${baseUrl}/api/client/api-settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        apiUrl: 'https://suderneg-rest.vistahost.com.br',
        apiToken: 'test-token-123',
        isActive: true
      })
    });

    if (putResponse.ok) {
      const updatedSettings = await putResponse.json();
      console.log('✅ PUT api-settings funcionou!', updatedSettings);
    } else {
      console.log('❌ PUT api-settings falhou:', putResponse.status, await putResponse.text());
    }

    // Testar GET /api/client/test-api-settings
    console.log('🧪 Testando GET /api/client/test-api-settings...');
    const testApiResponse = await fetch(`${baseUrl}/api/client/test-api-settings`, {
      headers
    });

    if (testApiResponse.ok) {
      const testResult = await testApiResponse.json();
      console.log('✅ Test api-settings funcionou!', testResult);
    } else {
      console.log('❌ Test api-settings falhou:', testApiResponse.status, await testApiResponse.text());
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testApiConfigRoutes();
