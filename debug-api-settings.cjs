const { MySQLStorage } = require('./server/storage.ts');

async function debugApiSettings() {
  try {
    const storage = new MySQLStorage();
    await storage.init();
    
    // Test company ID from logs
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    
    console.log('🔍 Buscando configurações da API para empresa:', companyId);
    
    const settings = await storage.getApiSettings(companyId);
    
    if (settings) {
      console.log('✅ Configurações encontradas:');
      console.log({
        id: settings.id,
        companyId: settings.companyId,
        apiUrl: settings.apiUrl,
        hasToken: !!settings.apiToken,
        tokenLength: settings.apiToken ? settings.apiToken.length : 0,
        isActive: settings.isActive,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      });
      
      // Test the API URL
      if (settings.apiUrl && settings.apiToken) {
        console.log('\n🧪 Testando conexão com a API...');
        const testUrl = `${settings.apiUrl}/properties?limit=1`;
        console.log('URL de teste:', testUrl);
        
        try {
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${settings.apiToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Status da resposta:', response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Teste bem-sucedido!');
            console.log('Dados recebidos:', typeof data, Object.keys(data || {}));
          } else {
            const errorText = await response.text();
            console.log('❌ Teste falhou:');
            console.log('Resposta:', errorText.substring(0, 200));
          }
        } catch (fetchError) {
          console.log('❌ Erro na requisição:', fetchError.message);
        }
      } else {
        console.log('⚠️ URL ou token não configurados');
      }
    } else {
      console.log('❌ Nenhuma configuração encontrada para a empresa');
    }
    
    await storage.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugApiSettings();
