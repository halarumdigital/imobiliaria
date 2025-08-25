const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: '2C3zBiVyM949',
      database: 'gilliard_imobi',
      port: 3306
    });

    console.log('📊 Conectado ao banco de dados');
    
    // Check if api_settings table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'api_settings'");
    console.log('🔍 Tabela api_settings existe:', tables.length > 0 ? 'Sim' : 'Não');
    
    if (tables.length > 0) {
      // Show table structure
      const [structure] = await connection.execute("DESCRIBE api_settings");
      console.log('📋 Estrutura da tabela api_settings:');
      structure.forEach(col => {
        console.log(`   ${col.Field}: ${col.Type}`);
      });
      
      // Check for data
      const [rows] = await connection.execute("SELECT COUNT(*) as count FROM api_settings");
      console.log('📊 Total de registros na tabela:', rows[0].count);
      
      if (rows[0].count > 0) {
        const [data] = await connection.execute("SELECT id, company_id, api_url, LENGTH(api_token) as token_length, created_at FROM api_settings");
        console.log('📋 Dados encontrados:');
        data.forEach(row => {
          console.log(`   ID: ${row.id}`);
          console.log(`   Company ID: ${row.company_id}`);
          console.log(`   API URL: ${row.api_url || 'NULL'}`);
          console.log(`   Token Length: ${row.token_length || 0}`);
          console.log(`   Created: ${row.created_at}`);
          console.log('   ---');
        });
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDatabase();
