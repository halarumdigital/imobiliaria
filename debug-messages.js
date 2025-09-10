import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkMessages() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    console.log('🔍 Verificando mensagens no banco...');
    
    // Total de mensagens
    const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM messages');
    console.log(`📊 Total de mensagens: ${totalRows[0].total}`);
    
    // Mensagens de assistant
    const [assistantRows] = await connection.execute('SELECT COUNT(*) as total FROM messages WHERE sender = ?', ['assistant']);
    console.log(`🤖 Mensagens de assistant: ${assistantRows[0].total}`);
    
    // Mensagens de assistant com agent_id
    const [withAgentRows] = await connection.execute('SELECT COUNT(*) as total FROM messages WHERE sender = ? AND agent_id IS NOT NULL', ['assistant']);
    console.log(`🎯 Mensagens de assistant com agent_id: ${withAgentRows[0].total}`);
    
    // Últimas 5 mensagens de assistant com agent_id
    const [recentRows] = await connection.execute(
      'SELECT id, content, agent_id, created_at FROM messages WHERE sender = ? AND agent_id IS NOT NULL ORDER BY created_at DESC LIMIT 5',
      ['assistant']
    );
    
    console.log(`\n📝 Últimas mensagens de assistant com agent_id:`);
    recentRows.forEach((row, index) => {
      console.log(`${index + 1}. AgentId: ${row.agent_id}, Content: ${row.content.substring(0, 50)}..., Date: ${row.created_at}`);
    });
    
    // Verificar agentes existentes
    const [agentsRows] = await connection.execute('SELECT id, name FROM ai_agents');
    console.log(`\n🤖 Agentes cadastrados: ${agentsRows.length}`);
    agentsRows.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.id})`);
    });
    
    // Verificar instâncias WhatsApp
    const [instancesRows] = await connection.execute('SELECT id, name, evolution_instance_id, ai_agent_id FROM whatsapp_instances');
    console.log(`\n📱 Instâncias WhatsApp: ${instancesRows.length}`);
    instancesRows.forEach(instance => {
      console.log(`   - ${instance.name} (${instance.id})`);
      console.log(`     Evolution ID: ${instance.evolution_instance_id}`);
      console.log(`     Agent ID: ${instance.ai_agent_id || 'NÃO VINCULADO'}`);
    });
    
    console.log(`\n🔍 PROBLEMA IDENTIFICADO:`);
    console.log(`   Logs mostram que Evolution API envia: 4d0f0895-9c71-4199-b48d-a3df4e3de3da`);
    console.log(`   Mas no banco temos evolution_instance_id: deploy10`);
    console.log(`   O método findDatabaseInstanceId não está encontrando a correspondência!`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

checkMessages();