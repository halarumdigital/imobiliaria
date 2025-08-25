import fetch from 'node-fetch';

async function testApiRoutes() {
  console.log('🧪 Testando rotas da API...');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Primeiro, vamos testar se o servidor está rodando
    console.log('🔍 Verificando se o servidor está rodando...');
    const healthCheck = await fetch(`${baseUrl}/api/health`);
    
    if (!healthCheck.ok) {
      console.log('❌ Servidor não está respondendo. Vamos testar uma rota simples.');
      
      // Tentar uma rota que deveria existir
      const testRoute = await fetch(`${baseUrl}/`);
      console.log('📡 Status da rota principal:', testRoute.status);
      
      if (testRoute.status === 200) {
        console.log('✅ Servidor está rodando, mas rota /api/health não existe');
      }
    } else {
      console.log('✅ Servidor está rodando!');
    }

    // Testar rota sem autenticação - deveria retornar erro 401
    console.log('\n🔐 Testando rota sem autenticação...');
    const noAuthResponse = await fetch(`${baseUrl}/api/client/api-settings`);
    console.log('📡 Status sem auth:', noAuthResponse.status);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Rota protegida por autenticação (como esperado)');
    } else {
      const responseText = await noAuthResponse.text();
      console.log('📄 Resposta:', responseText.substring(0, 200));
    }

    // Verificar se existe algum usuário para fazer login
    console.log('\n👥 Testando login...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    console.log('📡 Status do login:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('✅ Login realizado com sucesso!');
      console.log('👤 Dados do usuário:', {
        id: loginData.user?.id,
        email: loginData.user?.email,
        role: loginData.user?.role,
        companyId: loginData.user?.companyId
      });

      // Agora testar a rota com autenticação
      if (loginData.token) {
        console.log('\n🔑 Testando com token de autenticação...');
        const authHeaders = {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        };

        const authResponse = await fetch(`${baseUrl}/api/client/api-settings`, {
          headers: authHeaders
        });

        console.log('📡 Status com auth:', authResponse.status);
        
        if (authResponse.ok) {
          const apiSettings = await authResponse.json();
          console.log('✅ Configurações obtidas com sucesso!');
          console.log('⚙️ Dados:', apiSettings);
        } else {
          const errorText = await authResponse.text();
          console.log('❌ Erro na requisição:', errorText);
        }
      }
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Falha no login:', loginError);
      
      // Tentar com outras credenciais comuns
      console.log('\n🔄 Tentando outras credenciais...');
      const altLogins = [
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'client@example.com', password: 'client123' },
        { email: 'user@test.com', password: 'password' }
      ];

      for (const creds of altLogins) {
        const altResponse = await fetch(`${baseUrl}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds)
        });
        
        if (altResponse.ok) {
          console.log(`✅ Login bem-sucedido com ${creds.email}`);
          const altData = await altResponse.json();
          console.log('👤 Dados do usuário:', {
            email: altData.user?.email,
            role: altData.user?.role,
            companyId: altData.user?.companyId
          });
          break;
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testApiRoutes();
