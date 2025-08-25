const mysql = require('mysql2/promise');

async function checkAiConfig() {
  try {
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: process.env.DB_PASSWORD,
      database: 'gilliard_imobi',
      port: 3306
    });

    console.log('🔍 Verificando registros na tabela ai_configurations...');
    
    // Verificar se a tabela existe
    try {
      const [rows] = await connection.execute('SELECT * FROM ai_configurations');
      console.log(`📊 Total de registros: ${rows.length}`);
      
      if (rows.length > 0) {
        rows.forEach((row, index) => {
          console.log(`\nRegistro ${index + 1}:`);
          console.log(`   ID: ${row.id}`);
          console.log(`   Modelo: ${row.modelo || 'Não definido'}`);
          console.log(`   Temperatura: ${row.temperatura || 'Não definido'}`);
          console.log(`   Número de Tokens: ${row.numero_tokens || 'Não definido'}`);
          console.log(`   API Key: ${row.api_key ? 'CONFIGURADO (' + row.api_key.length + ' chars)' : 'NÃO CONFIGURADO'}`);
          console.log(`   Última Atualização: ${row.updated_at}`);
        });
      } else {
        console.log('⚠️ Nenhum registro encontrado na tabela ai_configurations');
      }
    } catch (error) {
      if (error.message.includes("doesn't exist")) {
        console.log('❌ Tabela ai_configurations não existe');
        console.log('🔧 Tentando criar a tabela...');
        
        await connection.execute(`
          CREATE TABLE ai_configurations (
            id VARCHAR(36) PRIMARY KEY,
            api_key TEXT NOT NULL,
            modelo VARCHAR(50) DEFAULT 'gpt-4o',
            temperatura DECIMAL(3,2) DEFAULT 0.7,
            numero_tokens INT DEFAULT 1000,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✅ Tabela ai_configurations criada com sucesso');
      } else {
        throw error;
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkAiConfig();
