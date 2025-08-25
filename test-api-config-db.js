import mysql from 'mysql2/promise';

async function testApiConfigDatabase() {
  console.log('🧪 Testando configurações da API no banco...');
  
  try {
    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: '2C3zBiVyM949', // Usando a senha do .env
      database: 'gilliard_imobi'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar a estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela api_settings...');
    const [columns] = await connection.execute('DESCRIBE api_settings');
    console.table(columns);

    // Verificar registros existentes
    console.log('\n📊 Verificando registros existentes...');
    const [rows] = await connection.execute('SELECT * FROM api_settings');
    
    if (rows.length === 0) {
      console.log('⚠️ Nenhuma configuração de API encontrada no banco');
      
      // Inserir uma configuração de teste
      console.log('➕ Inserindo configuração de teste...');
      await connection.execute(`
        INSERT INTO api_settings (id, company_id, api_url, api_token, is_active) 
        VALUES (UUID(), 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2', 'https://suderneg-rest.vistahost.com.br', 'test-token-123', true)
      `);
      
      console.log('✅ Configuração de teste inserida');
    } else {
      console.log(`✅ Encontradas ${rows.length} configuração(ões) de API:`);
      rows.forEach((row, index) => {
        console.log(`\n📝 Configuração ${index + 1}:`, {
          id: row.id,
          companyId: row.company_id,
          apiUrl: row.api_url ? 'Configurada' : 'Não configurada',
          apiToken: row.api_token ? `Token com ${row.api_token.length} caracteres` : 'Não configurado',
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      });
    }

    // Testar se a coluna is_active foi adicionada corretamente
    console.log('\n🔍 Testando a coluna is_active...');
    const [testRows] = await connection.execute('SELECT is_active FROM api_settings LIMIT 1');
    console.log('✅ Coluna is_active está funcionando corretamente');

    await connection.end();
    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testApiConfigDatabase();
