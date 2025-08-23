require('dotenv').config();
const mysql = require('mysql2/promise');

async function showSDRPrompt() {
  let connection;
  try {
    console.log('🔍 Buscando prompt completo do agente SDR...');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'imobiliaria',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });
    
    // Buscar o agente SDR específico
    const [sdrAgent] = await connection.execute(`
      SELECT id, name, prompt, agent_type, specialization, delegation_keywords
      FROM ai_agents 
      WHERE name LIKE '%SDR%'
      LIMIT 1
    `);
    
    if (sdrAgent.length === 0) {
      console.log('❌ Agente SDR não encontrado');
      return;
    }
    
    const agent = sdrAgent[0];
    
    console.log('🤖 ================== AGENTE SDR ENCONTRADO ==================');
    console.log(`📋 Nome: ${agent.name}`);
    console.log(`🆔 ID: ${agent.id}`);
    console.log(`🏷️ Tipo: ${agent.agent_type}`);
    console.log(`🎯 Especialização: ${agent.specialization || 'N/A'}`);
    console.log(`🔑 Palavras-chave: ${agent.delegation_keywords || 'N/A'}`);
    console.log('');
    console.log('📝 ================== PROMPT COMPLETO ==================');
    console.log(agent.prompt);
    console.log('');
    console.log('🔍 ================== ANÁLISE DO PROMPT ==================');
    
    const prompt = agent.prompt.toLowerCase();
    const hasNome = prompt.includes('nome');
    const hasTelefone = prompt.includes('telefone');
    const hasCompraAluguel = prompt.includes('compra') || prompt.includes('aluguel');
    const hasCidade = prompt.includes('cidade');
    const hasTipoImovel = prompt.includes('tipo') && (prompt.includes('imovel') || prompt.includes('imóvel'));
    const hasColeta = prompt.includes('coleta') || prompt.includes('dados');
    const hasSequencial = prompt.includes('sequencial') || prompt.includes('etapa') || prompt.includes('passo');
    
    console.log(`✅ Menciona 'nome': ${hasNome ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Menciona 'telefone': ${hasTelefone ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Menciona 'compra/aluguel': ${hasCompraAluguel ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Menciona 'cidade': ${hasCidade ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Menciona 'tipo de imóvel': ${hasTipoImovel ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Menciona coleta de dados: ${hasColeta ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Processo sequencial: ${hasSequencial ? 'SIM' : 'NÃO'}`);
    
    console.log('');
    console.log('📊 ================== RECOMENDAÇÕES ==================');
    
    if (!hasColeta || !hasSequencial) {
      console.log('🔄 O prompt atual não implementa coleta sequencial de dados');
      console.log('💡 Recomendação: Adicionar instruções para:');
      console.log('   1. Coletar nome obrigatoriamente');
      console.log('   2. Coletar telefone obrigatoriamente');
      console.log('   3. Perguntar se é compra ou aluguel');
      console.log('   4. Perguntar a cidade de interesse');
      console.log('   5. Perguntar o tipo de imóvel');
      console.log('   6. Só fazer busca após coletar todos os dados');
    } else {
      console.log('✅ O prompt já implementa coleta de dados estruturada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showSDRPrompt();
