require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkMessagesTable() {
  let connection;
  try {
    console.log('🔍 Verificando estrutura da tabela messages...');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'imobiliaria',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });
    
    console.log('✅ Conectado ao MySQL!');
    
    // Verificar estrutura da tabela messages
    const [columns] = await connection.execute('DESCRIBE messages');
    console.log('\n📋 Estrutura da tabela messages:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
    });
    
    // Verificar últimas mensagens para entender o contexto
    const [recentMessages] = await connection.execute(`
      SELECT id, conversation_id, content, sender_type, created_at 
      FROM messages 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`\n💬 Últimas ${recentMessages.length} mensagens:');
    recentMessages.forEach(msg => {
      console.log(`ID: ${msg.id} | Conversa: ${msg.conversation_id} | Tipo: ${msg.sender_type}`);
      console.log(`Conteúdo: ${msg.content.substring(0, 100)}...`);
      console.log(`Data: ${msg.created_at}`);
      console.log('---');
    });
    
    // Verificar se existe alguma conversa ativa
    const [conversations] = await connection.execute(`
      SELECT id, phone_number, status, created_at
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📞 Últimas ${conversations.length} conversas:');
    conversations.forEach(conv => {
      console.log(`ID: ${conv.id} | Telefone: ${conv.phone_number} | Status: ${conv.status} | Data: ${conv.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMessagesTable();
