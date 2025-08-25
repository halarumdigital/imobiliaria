const mysql = require('mysql2/promise');

async function verificarConfiguracoes() {
  let connection;
  
  try {
    // Conectar ao banco de dados usando as mesmas configurações do servidor
    connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      database: 'gilliard_imobi',
      port: 3306,
      password: process.env.DB_PASSWORD || 'C,v7f>G_eFe&W&2N'
    });

    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar tabela api_settings
    console.log('\n=== VERIFICAÇÃO DA TABELA api_settings ===');
    const [apiSettings] = await connection.execute('SELECT * FROM api_settings');
    
    if (apiSettings.length === 0) {
      console.log('❌ Tabela api_settings está VAZIA - ESTE É O PROBLEMA!');
      console.log('\n💡 SOLUÇÃO: Inserir configurações da API VistaHost');
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
    const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 5');
    
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
    } else {
      console.log(`✅ Encontradas ${companies.length} empresas (primeiras 5):`);
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
      LIMIT 5
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

    // 4. Verificar um company_id específico para teste
    console.log('\n=== TESTE COM COMPANY_ID ESPECÍFICO ===');
    if (companies.length > 0) {
      const testCompanyId = companies[0].id;
      console.log(`Testando com company_id: ${testCompanyId}`);
      
      const [testConfig] = await connection.execute(
        'SELECT * FROM api_settings WHERE company_id = ?', 
        [testCompanyId]
      );
      
      if (testConfig.length === 0) {
        console.log('❌ NENHUMA configuração encontrada para esta empresa');
        console.log('\n🔧 AÇÃO NECESSÁRIA:');
        console.log('   1. Inserir configuração da API VistaHost');
        console.log('   2. URL: https://suderneg-rest.vistahost.com.br');
        console.log('   3. Token: [seu_token_aqui]');
      } else {
        console.log('✅ Configuração encontrada para esta empresa');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code) {
      console.error('   Código:', error.code);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificarConfiguracoes();
