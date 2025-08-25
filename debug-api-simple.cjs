const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugApiSettings() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '31.97.91.252',
      user: process.env.MYSQL_USER || 'gilliard_imobi',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'gilliard_imobi',
      port: parseInt(process.env.MYSQL_PORT) || 3306
    });
    
    console.log('✅ Conectado ao banco');
    
    // Test company ID from logs
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    
    console.log('🔍 Buscando configurações da API para empresa:', companyId);
    
    const [rows] = await connection.execute(
      'SELECT * FROM api_settings WHERE company_id = ?',
      [companyId]
    );
    
    if (rows.length > 0) {
      const settings = rows[0];
      console.log('✅ Configurações encontradas:');
      console.log({
        id: settings.id,
        companyId: settings.company_id,
        apiUrl: settings.api_url,
        hasToken: !!settings.api_token,
        tokenStart: settings.api_token ? settings.api_token.substring(0, 10) + '...' : null,
        tokenLength: settings.api_token ? settings.api_token.length : 0,
        isActive: settings.is_active,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at
      });
      
      // Test the API URL if configured
      if (settings.api_url && settings.api_token) {
        console.log('\\n🧪 Testando conexão com a API...');
        const testUrl = `${settings.api_url}/properties?limit=1`;
        console.log('URL de teste:', testUrl);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${settings.api_token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('Status da resposta:', response.status, response.statusText);
          console.log('Headers da resposta:', Object.fromEntries(response.headers));
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              console.log('✅ Teste bem-sucedido!');
              console.log('Tipo de dados:', typeof data);
              console.log('Chaves disponíveis:', Object.keys(data || {}));
              if (Array.isArray(data)) {
                console.log('Array com', data.length, 'items');
              }
            } else {
              const text = await response.text();
              console.log('✅ Resposta recebida (não JSON):', text.substring(0, 200));
            }
          } else {
            const errorText = await response.text();
            console.log('❌ Teste falhou:');
            console.log('Status:', response.status, response.statusText);
            console.log('Resposta:', errorText.substring(0, 300));
          }
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            console.log('❌ Timeout - API não respondeu em 10 segundos');
          } else {
            console.log('❌ Erro na requisição:', fetchError.message);
          }
        }
      } else {
        console.log('⚠️ URL ou token não configurados');
      }
    } else {
      console.log('❌ Nenhuma configuração encontrada para a empresa');
      
      // Check if table exists and has any data
      const [tableCheck] = await connection.execute('SHOW TABLES LIKE "api_settings"');
      if (tableCheck.length === 0) {
        console.log('❌ Tabela api_settings não existe');
      } else {
        const [allRows] = await connection.execute('SELECT COUNT(*) as total FROM api_settings');
        console.log('ℹ️ Total de registros na tabela:', allRows[0].total);
      }
    }
    
    await connection.end();
    console.log('🔌 Conexão encerrada');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

debugApiSettings();
