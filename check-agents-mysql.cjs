require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSDRAgents() {
  let connection;
  try {
    console.log('Tentando conectar ao MySQL usando configurações do .env...');
    console.log(`Host: ${process.env.MYSQL_HOST}`);
    console.log(`Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`User: ${process.env.MYSQL_USER}`);
    
    // Configuração do MySQL usando variáveis do .env
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'imobiliaria',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });
    
    console.log('✅ Conectado ao MySQL!');
    
    // Listar tabelas
    console.log('\n📋 Verificando tabelas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Tabelas encontradas: ${tables.length}`);
    
    // Verificar se a tabela ai_agents existe
    const hasAiAgents = tables.some(table => Object.values(table)[0] === 'ai_agents');
    
    if (!hasAiAgents) {
      console.log('❌ Tabela ai_agents não encontrada!');
      console.log('Tabelas disponíveis:');
      tables.forEach(table => {
        console.log(`- ${Object.values(table)[0]}`);
      });
      return;
    }
    
    console.log('✅ Tabela ai_agents encontrada!');
    
    // Contar registros
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM ai_agents');
    console.log(`\n📊 Total de agentes: ${count[0].total}`);
    
    if (count[0].total === 0) {
      console.log('❌ Nenhum agente cadastrado na tabela ai_agents');
      return;
    }
    
    // Buscar agentes SDR específicos
    const [sdrRows] = await connection.execute(`
      SELECT id, name, agent_type, specialization, delegation_keywords, prompt 
      FROM ai_agents 
      WHERE specialization LIKE '%SDR%' 
         OR specialization LIKE '%coleta%' 
         OR specialization LIKE '%dados%' 
         OR name LIKE '%SDR%'
         OR delegation_keywords LIKE '%SDR%'
    `);
    
    console.log('\n=== AGENTES SDR ENCONTRADOS ===');
    if (sdrRows.length === 0) {
      console.log('❌ Nenhum agente SDR específico encontrado');
    } else {
      sdrRows.forEach(agent => {
        console.log(`✅ Agente: ${agent.name}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Tipo: ${agent.agent_type}`);
        console.log(`   Especialização: ${agent.specialization || 'N/A'}`);
        console.log(`   Palavras-chave: ${agent.delegation_keywords || 'N/A'}`);
        console.log('---');
        if (agent.prompt) {
          console.log(`   Prompt (200 chars): ${agent.prompt.substring(0, 200)}...`);
        }
        console.log('');
      });
    }
    
    // Verificar todos os agentes secundários
    const [allSecondary] = await connection.execute(`
      SELECT id, name, agent_type, specialization, delegation_keywords 
      FROM ai_agents 
      WHERE agent_type = 'secondary'
    `);
    
    console.log(`\n=== AGENTES SECUNDÁRIOS (${allSecondary.length}) ===`);
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
      WHERE prompt LIKE '%nome%' 
        AND prompt LIKE '%telefone%' 
        AND (prompt LIKE '%coleta%' OR prompt LIKE '%dados%')
    `);
    
    console.log(`\n=== AGENTES COM PROMPTS DE COLETA DE DADOS (${promptRows.length}) ===`);
    promptRows.forEach(agent => {
      console.log(`- ${agent.name}`);
      console.log(`  Prompt (primeiros 300 chars): ${agent.prompt.substring(0, 300)}...`);
      console.log('');
    });
    
    // Listar todos os agentes para análise geral
    const [allAgents] = await connection.execute(`
      SELECT id, name, agent_type, specialization 
      FROM ai_agents 
      ORDER BY agent_type, name
    `);
    
    console.log(`\n=== RESUMO DE TODOS OS AGENTES (${allAgents.length}) ===`);
    allAgents.forEach(agent => {
      console.log(`ID: ${agent.id} | ${agent.name} | Tipo: ${agent.agent_type}`);
      if (agent.specialization) {
        console.log(`   Especialização: ${agent.specialization}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSDRAgents();
