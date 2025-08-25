const mysql = require('mysql2/promise');

async function verificarConfiguracoes() {
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Gilliard123@',
      database: 'imobiliaria_ai'
    });

    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar tabela api_settings
    console.log('\n=== VERIFICAÇÃO DA TABELA api_settings ===');
    const [apiSettings] = await connection.execute('SELECT * FROM api_settings');
    
    if (apiSettings.length === 0) {
      console.log('❌ Tabela api_settings está VAZIA');
    } else {
      console.log(`✅ Encontradas ${apiSettings.length} configurações:`);
      apiSettings.forEach((config, index) => {
        console.log(`\n${index + 1}. Configuração ID: ${config.id}`);
        console.log(`   Company ID: ${config.company_id}`);
        console.log(`   API URL: ${config.api_url || 'NÃO CONFIGURADA'}`);
        console.log(`   API Token: ${config.api_token ? `Configurado (${config.api_token.length} chars)` : 'NÃO CONFIGURADO'}`);
        console.log(`   Criado em: ${config.created_at}`);
      });
    }

    // 2. Verificar tabela companies
    console.log('\n=== VERIFICAÇÃO DA TABELA companies ===');
    const [companies] = await connection.execute('SELECT id, name FROM companies');
    
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
    } else {
      console.log(`✅ Encontradas ${companies.length} empresas:`);
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
      });
    }

    // 3. Verificar agentes SDR
    console.log('\n=== VERIFICAÇÃO DOS AGENTES SDR ===');
    const [agents] = await connection.execute(`
      SELECT id, name, company_id, agent_type, specialization 
      FROM ai_agents 
      WHERE name LIKE '%SDR%' OR specialization LIKE '%imov%' OR agent_type = 'secondary'
    `);
    
    if (agents.length === 0) {
      console.log('❌ Nenhum agente SDR encontrado');
    } else {
      console.log(`✅ Encontrados ${agents.length} agentes relacionados:`);
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}`);
        console.log(`   Company ID: ${agent.company_id}`);
        console.log(`   Tipo: ${agent.agent_type}`);
        console.log(`   Especialização: ${agent.specialization || 'N/A'}`);
      });
    }

    // 4. Verificar relacionamento empresa-configuração
    console.log('\n=== VERIFICAÇÃO DE RELACIONAMENTOS ===');
    const [relations] = await connection.execute(`
      SELECT 
        c.name as company_name,
        c.id as company_id,
        a.api_url,
        a.api_token IS NOT NULL as has_token
      FROM companies c
      LEFT JOIN api_settings a ON c.id = a.company_id
    `);
    
    relations.forEach((rel, index) => {
      console.log(`${index + 1}. Empresa: ${rel.company_name} (${rel.company_id})`);
      console.log(`   API URL: ${rel.api_url || 'NÃO CONFIGURADA'}`);
      console.log(`   Token: ${rel.has_token ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificarConfiguracoes();
