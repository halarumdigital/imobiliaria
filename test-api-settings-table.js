import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testApiSettingsTable() {
  console.log('🔍 Testando acesso à tabela api_settings...');
  
  try {
    // Conectar ao banco usando as credenciais do .env
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    console.log('✅ Conectado ao banco de dados');

    // Buscar todas as configurações
    console.log('\n📊 Buscando todas as configurações da api_settings...');
    const [rows] = await connection.execute('SELECT * FROM api_settings');
    
    console.log(`📋 Encontradas ${rows.length} configuração(ões):`);
    
    rows.forEach((row, index) => {
      console.log(`\n🔧 Configuração ${index + 1}:`);
      console.log('  ID:', row.id);
      console.log('  Company ID:', row.company_id);
      console.log('  API URL:', row.api_url);
      console.log('  API Token (primeiros 10 chars):', row.api_token ? row.api_token.substring(0, 10) + '...' : 'Não configurado');
      console.log('  Is Active:', row.is_active);
      console.log('  Created At:', row.created_at);
      console.log('  Updated At:', row.updated_at);
    });

    // Buscar especificamente por company_id que vimos anteriormente
    console.log('\n🎯 Buscando pela company_id específica...');
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    const [specificRows] = await connection.execute(
      'SELECT * FROM api_settings WHERE company_id = ?', 
      [companyId]
    );

    if (specificRows.length > 0) {
      console.log('✅ Configuração encontrada para company_id:', companyId);
      const config = specificRows[0];
      console.log('📋 Dados da configuração:');
      console.log({
        id: config.id,
        companyId: config.company_id,
        apiUrl: config.api_url,
        apiToken: config.api_token ? `${config.api_token.length} caracteres` : 'Vazio',
        isActive: Boolean(config.is_active),
        createdAt: config.created_at,
        updatedAt: config.updated_at
      });
    } else {
      console.log('❌ Nenhuma configuração encontrada para company_id:', companyId);
    }

    // Verificar todas as companies disponíveis
    console.log('\n🏢 Verificando companies disponíveis...');
    const [companies] = await connection.execute('SELECT id, name FROM companies');
    console.log(`📋 Encontradas ${companies.length} empresas:`);
    companies.forEach(company => {
      console.log(`  - ${company.name} (ID: ${company.id})`);
    });

    await connection.end();
    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testApiSettingsTable();
