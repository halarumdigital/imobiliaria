const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkApiSettings() {
  try {
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: process.env.DB_PASSWORD,
      database: 'gilliard_imobi',
      port: 3306
    });

    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      'SHOW TABLES LIKE "api_settings"'
    );
    
    if (tables.length === 0) {
      console.log('❌ Tabela api_settings não existe');
      await connection.end();
      return;
    }
    
    console.log('✅ Tabela api_settings existe');
    
    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE api_settings');
    console.log('📊 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar dados
    const [rows] = await connection.execute('SELECT * FROM api_settings');
    console.log(`\n📋 Total de registros: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\n🔍 Dados encontrados:');
      rows.forEach((row, index) => {
        console.log(`  Registro ${index + 1}:`);
        Object.keys(row).forEach(key => {
          const value = key.includes('key') || key.includes('password') 
            ? '***' 
            : row[key];
          console.log(`    ${key}: ${value}`);
        });
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum registro encontrado na tabela api_settings');
      console.log('\n🔍 Criando registro de exemplo...');
      
      await connection.execute(`
        INSERT INTO api_settings (id, vistahost_api_key, vistahost_api_password, vistahost_base_url, is_active, created_at, updated_at)
        VALUES (
          UUID(),
          'test_api_key',
          'test_password',
          'https://api.vistahost.com.br',
          true,
          NOW(),
          NOW()
        )
      `);
      
      console.log('✅ Registro criado com sucesso');
      
      // Verificar novamente
      const [newRows] = await connection.execute('SELECT * FROM api_settings');
      console.log(`\n📋 Agora temos ${newRows.length} registro(s)`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes("doesn't exist")) {
      console.log('\n📝 Tentando criar a tabela api_settings...');
      
      try {
        const connection = await mysql.createConnection({
          host: '31.97.91.252',
          user: 'gilliard_imobi',
          password: process.env.DB_PASSWORD,
          database: 'gilliard_imobi',
          port: 3306
        });

        await connection.execute(`
          CREATE TABLE api_settings (
            id VARCHAR(36) PRIMARY KEY,
            vistahost_api_key VARCHAR(255),
            vistahost_api_password VARCHAR(255),
            vistahost_base_url VARCHAR(255),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✅ Tabela api_settings criada com sucesso');
        
        await connection.execute(`
          INSERT INTO api_settings (id, vistahost_api_key, vistahost_api_password, vistahost_base_url, is_active, created_at, updated_at)
          VALUES (
            UUID(),
            'test_api_key',
            'test_password',
            'https://api.vistahost.com.br',
            true,
            NOW(),
            NOW()
          )
        `);
        
        console.log('✅ Registro inicial criado');
        await connection.end();
      } catch (createError) {
        console.error('❌ Erro ao criar tabela:', createError.message);
      }
    }
  }
}

checkApiSettings();
