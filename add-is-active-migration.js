const mysql = require('mysql2/promise');

async function addIsActiveColumn() {
  console.log('🔧 Adicionando coluna is_active à tabela api_settings...');
  
  try {
    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: 'gilliard123',
      database: 'gilliard_imobi'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'gilliard_imobi' 
      AND TABLE_NAME = 'api_settings' 
      AND COLUMN_NAME = 'is_active'
    `);

    if (columns.length > 0) {
      console.log('⚠️  Coluna is_active já existe na tabela api_settings');
      return;
    }

    // Adicionar a coluna is_active
    await connection.execute(`
      ALTER TABLE api_settings 
      ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
      AFTER api_token
    `);

    console.log('✅ Coluna is_active adicionada com sucesso');

    // Atualizar registros existentes
    await connection.execute(`
      UPDATE api_settings 
      SET is_active = TRUE 
      WHERE is_active IS NULL
    `);

    console.log('✅ Registros existentes atualizados');

    // Verificar o resultado
    const [settings] = await connection.execute('SELECT * FROM api_settings');
    console.log(`📊 Total de configurações na tabela: ${settings.length}`);
    
    if (settings.length > 0) {
      console.log('📋 Exemplo de configuração:', {
        id: settings[0].id,
        companyId: settings[0].company_id,
        hasUrl: !!settings[0].api_url,
        hasToken: !!settings[0].api_token,
        isActive: settings[0].is_active
      });
    }

    await connection.end();
    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

addIsActiveColumn();
