import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function addIsActiveColumn() {
  console.log('🔧 Adicionando coluna is_active à tabela api_settings...');
  
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

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'api_settings' 
      AND COLUMN_NAME = 'is_active'
    `, [process.env.MYSQL_DATABASE]);

    if (columns.length > 0) {
      console.log('⚠️ Coluna is_active já existe na tabela api_settings');
    } else {
      // Adicionar a coluna is_active
      await connection.execute(`
        ALTER TABLE api_settings 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE
      `);
      
      console.log('✅ Coluna is_active adicionada com sucesso!');
    }

    // Fechar conexão
    await connection.end();
    console.log('🔐 Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    process.exit(1);
  }
}

addIsActiveColumn();
