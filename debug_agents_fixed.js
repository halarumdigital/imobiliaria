const mysql = require('mysql2/promise');

async function debugAgents() {
  try {
    console.log('🔍 Procurando agentes de IA no banco de dados...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sistema_multiempresa',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      charset: 'utf8mb4',
    });

    // Buscar todos os agentes
    const [agents] = await connection.execute(
      'SELECT id, name, company_id, agent_type FROM ai_agents ORDER BY created_at DESC'
    );

    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach((agent, index) => {
      console.log(`  [${index + 1}] ID: ${agent.id}`);
      console.log(`      Nome: ${agent.name}`);
      console.log(`      Empresa: ${agent.company_id}`);
      console.log(`      Tipo: ${agent.agent_type || 'main'}`);
      console.log('');
    });

    // Buscar empresas para saber quais têm agentes
    const [companies] = await connection.execute(
      'SELECT id, name FROM companies ORDER BY created_at DESC'
    );

    console.log(`\n✅ Encontradas ${companies.length} empresas:`);
    companies.forEach((company, index) => {
      console.log(`  [${index + 1}] ID: ${company.id}`);
      console.log(`      Nome: ${company.name}`);
      console.log('');
    });

    await connection.end();
    
    console.log('\n📝 Para testar a API, use um dos IDs de agentes acima no script test_busca_imoveis.js');
    
  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error.message);
  }
}

console.log('🔍 Script para debug de agentes de IA');
console.log('⚠️  Execute: node debug_agents_fixed.js');
debugAgents();