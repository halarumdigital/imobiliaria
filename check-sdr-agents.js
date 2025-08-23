const mysql = require('mysql2/promise');

async function checkSDRAgents() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'imobiliaria'
    });
    
    // Buscar agentes SDR
    const [sdrRows] = await connection.execute(`
      SELECT id, name, agent_type, specialization, delegation_keywords, prompt 
      FROM ai_agents 
      WHERE specialization LIKE "%SDR%" 
         OR specialization LIKE "%coleta%" 
         OR specialization LIKE "%dados%" 
         OR name LIKE "%SDR%"
    `);
    
    console.log('=== AGENTES SDR ENCONTRADOS ===');
    if (sdrRows.length === 0) {
      console.log('❌ Nenhum agente SDR específico encontrado');
    } else {
      sdrRows.forEach(agent => {
        console.log(`✅ Agente: ${agent.name}`);
        console.log(`   Tipo: ${agent.agent_type}`);
        console.log(`   Especialização: ${agent.specialization || 'N/A'}`);
        console.log(`   Palavras-chave: ${agent.delegation_keywords || 'N/A'}`);
        console.log('---');
      });
    }
    
    // Verificar todos os agentes secundários
    const [allSecondary] = await connection.execute(`
      SELECT id, name, agent_type, specialization, delegation_keywords 
      FROM ai_agents 
      WHERE agent_type = "secondary"
    `);
    
    console.log(`\n=== TODOS OS AGENTES SECUNDÁRIOS (${allSecondary.length}) ===`);
    allSecondary.forEach(agent => {
      console.log(`- ${agent.name} | Especialização: ${agent.specialization || 'N/A'}`);
      if (agent.delegation_keywords) {
        console.log(`  Palavras-chave: ${agent.delegation_keywords}`);
      }
    });
    
    // Verificar se existe prompt com instruções de coleta de dados
    const [promptRows] = await connection.execute(`
      SELECT id, name, prompt 
      FROM ai_agents 
      WHERE prompt LIKE "%nome%" 
        AND prompt LIKE "%telefone%" 
        AND (prompt LIKE "%coleta%" OR prompt LIKE "%dados%")
    `);
    
    console.log(`\n=== AGENTES COM PROMPTS DE COLETA DE DADOS (${promptRows.length}) ===`);
    promptRows.forEach(agent => {
      console.log(`- ${agent.name}`);
      console.log(`  Prompt (primeiros 200 chars): ${agent.prompt.substring(0, 200)}...`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkSDRAgents();
