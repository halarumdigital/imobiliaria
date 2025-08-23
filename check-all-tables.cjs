require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
  let connection;
  try {
    console.log('🔍 Verificando estruturas das tabelas...');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'imobiliaria',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });
    
    console.log('✅ Conectado ao MySQL!');
    
    // Verificar todas as tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tabelas disponíveis:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });
    
    // Verificar estrutura da tabela conversations
    console.log('\n📞 Estrutura da tabela conversations:');
    const [convColumns] = await connection.execute('DESCRIBE conversations');
    convColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    // Verificar estrutura da tabela messages
    console.log('\n💬 Estrutura da tabela messages:');
    const [msgColumns] = await connection.execute('DESCRIBE messages');
    msgColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    // Verificar se há mensagens
    const [messageCount] = await connection.execute('SELECT COUNT(*) as total FROM messages');
    console.log(`\n📊 Total de mensagens: ${messageCount[0].total}`);
    
    if (messageCount[0].total > 0) {
      const [recentMessages] = await connection.execute(`
        SELECT id, conversation_id, content, sender, created_at 
        FROM messages 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n💬 Últimas 5 mensagens:');
      recentMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ID: ${msg.id}`);
        console.log(`   Conversa: ${msg.conversation_id}`);
        console.log(`   Sender: ${msg.sender}`);
        console.log(`   Conteúdo: ${msg.content.substring(0, 100)}...`);
        console.log(`   Data: ${msg.created_at}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
