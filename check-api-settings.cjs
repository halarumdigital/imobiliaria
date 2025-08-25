const { getStorage } = require('./server/storage');

async function checkApiSettings() {
  try {
    console.log('🔍 Iniciando verificação das configurações da API...');
    
    // Inicializar storage
    const storage = getStorage();
    await storage.init();
    
    // Testar com diferentes companyIds
    const companyIds = [
      'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2', // Company ID padrão
      'test-company-id'
    ];
    
    for (const companyId of companyIds) {
      console.log(`\n📋 Verificando configurações para companyId: ${companyId}`);
      
      try {
        const settings = await storage.getApiSettings(companyId);
        
        if (settings) {
          console.log('✅ Configurações encontradas:');
          console.log(`   ID: ${settings.id}`);
          console.log(`   Company ID: ${settings.companyId}`);
          console.log(`   API URL: ${settings.apiUrl ? 'Configurada' : 'Não configurada'}`);
          console.log(`   API Token: ${settings.apiToken ? 'Configurado' : 'Não configurado'}`);
          
          if (settings.apiUrl) {
            console.log(`   URL completa: ${settings.apiUrl}`);
          }
          if (settings.apiToken) {
            console.log(`   Token length: ${settings.apiToken.length} caracteres`);
          }
        } else {
          console.log('❌ Nenhuma configuração encontrada para este companyId');
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar configurações para ${companyId}:`, error.message);
      }
    }
    
    // Verificar estrutura da tabela
    console.log('\n🏗️ Verificando estrutura da tabela api_settings...');
    
    try {
      const connection = storage.connection;
      const [rows] = await connection.execute('DESCRIBE api_settings');
      
      console.log('Estrutura da tabela:');
      rows.forEach(row => {
        console.log(`   ${row.Field} - ${row.Type} - ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}${row.Default ? ` - Default: ${row.Default}` : ''}`);
      });
    } catch (error) {
      console.error('❌ Erro ao verificar estrutura da tabela:', error.message);
    }
    
    // Verificar dados existentes
    console.log('\n📊 Verificando dados existentes na tabela api_settings...');
    
    try {
      const connection = storage.connection;
      const [rows] = await connection.execute('SELECT * FROM api_settings');
      
      console.log(`Total de registros encontrados: ${rows.length}`);
      
      rows.forEach((row, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Company ID: ${row.company_id}`);
        console.log(`   API URL: ${row.api_url || 'N/A'}`);
        console.log(`   API Token: ${row.api_token ? '***CONFIGURADO***' : 'N/A'}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Updated: ${row.updated_at}`);
      });
    } catch (error) {
      console.error('❌ Erro ao verificar dados da tabela:', error.message);
    }
    
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro fatal durante a verificação:', error);
  } finally {
    process.exit(0);
  }
}

checkApiSettings();
