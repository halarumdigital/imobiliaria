const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVistaHostEndpoints() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '31.97.91.252',
      user: process.env.MYSQL_USER || 'gilliard_imobi',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'gilliard_imobi',
      port: parseInt(process.env.MYSQL_PORT) || 3306
    });
    
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    const [rows] = await connection.execute(
      'SELECT * FROM api_settings WHERE company_id = ?',
      [companyId]
    );
    
    if (rows.length === 0) {
      console.log('❌ Configurações não encontradas');
      return;
    }
    
    const settings = rows[0];
    console.log('✅ API URL:', settings.api_url);
    console.log('✅ Token configurado:', !!settings.api_token);
    
    // Lista de endpoints comuns da VistaHost para testar
    const endpoints = [
      '/',
      '/imoveis',
      '/imovel', 
      '/properties',
      '/property',
      '/api',
      '/api/imoveis',
      '/api/properties',
      '/ping',
      '/health',
      '/status'
    ];
    
    console.log('\\n🧪 Testando endpoints disponíveis...');
    
    for (const endpoint of endpoints) {
      const testUrl = `${settings.api_url}${endpoint}`;
      console.log(`\\n📍 Testando: ${testUrl}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${settings.api_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
          console.log('   ✅ SUCESSO! Endpoint funcional');
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log('   📄 Tipo:', typeof data);
              if (Array.isArray(data)) {
                console.log(`   📄 Array com ${data.length} items`);
              } else if (typeof data === 'object') {
                console.log('   📄 Chaves:', Object.keys(data).slice(0, 5).join(', '));
              }
            } catch (e) {
              console.log('   📄 Resposta JSON inválida');
            }
          }
        } else if (response.status === 401) {
          console.log('   🔐 Não autorizado - Token pode estar inválido');
        } else if (response.status === 404) {
          console.log('   ❌ Endpoint não encontrado');
        } else {
          console.log(`   ⚠️ Status inesperado: ${response.status}`);
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('   ⏱️ Timeout');
        } else {
          console.log(`   ❌ Erro: ${error.message}`);
        }
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testVistaHostEndpoints();
