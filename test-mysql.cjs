const mysql = require('mysql2/promise');

async function testMySQL() {
  let connection;
  try {
    console.log('Testando conexão MySQL...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'imobiliaria'
    });
    
    console.log('✅ Conectado ao MySQL!');
    
    // Listar tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });
    
    // Verificar se a tabela ai_agents existe
    const hasAiAgents = tables.some(table => Object.values(table)[0] === 'ai_agents');
    
    if (hasAiAgents) {
      console.log('\n🤖 Verificando estrutura da tabela ai_agents:');
      const [columns] = await connection.execute('DESCRIBE ai_agents');
      columns.forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
      
      // Contar registros
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM ai_agents');
      console.log(`\n📊 Total de agentes: ${count[0].total}`);
      
      if (count[0].total > 0) {
        console.log('\n🎯 Primeiros 3 agentes:');
        const [agents] = await connection.execute('SELECT id, name, agent_type, specialization LIMIT 3');
        agents.forEach(agent => {
          console.log(`ID: ${agent.id} | Nome: ${agent.name} | Tipo: ${agent.agent_type} | Esp: ${agent.specialization || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Tabela ai_agents não encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error.code);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMySQL();
