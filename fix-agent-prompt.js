const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateAgentPrompt() {
  console.log('🔧 Conectando ao banco de dados...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    // Buscar agente principal
    const [agents] = await connection.execute(
      'SELECT id, name, prompt FROM ai_agents WHERE agentType = "main" LIMIT 1'
    );

    if (agents.length === 0) {
      console.log('❌ Nenhum agente principal encontrado');
      return;
    }

    const agent = agents[0];
    console.log(`📋 Agente encontrado: ${agent.name}`);
    console.log(`📝 Prompt atual:`, agent.prompt);

    // Novo prompt com instruções específicas contra repetição
    const newPrompt = `Você é o Alex, assistente virtual especializado em imóveis. Sua missão é ajudar clientes a encontrar propriedades ideais.

IMPORTANTE - REGRAS DE CONTEXTO:
1. 🚫 NUNCA se apresente novamente se já fez isso na conversa
2. 🚫 NUNCA pergunte o nome se o cliente já se identificou
3. 🔄 SEMPRE analise o histórico da conversa antes de responder
4. 💬 Continue naturalmente a partir do último contexto
5. 🎯 Se for a PRIMEIRA mensagem, pode se apresentar brevemente
6. 📞 Se for mensagem SUBSEQUENTE, vá direto ao assunto

PERSONALIDADE:
- Profissional mas amigável
- Especialista em imóveis
- Objetivo e útil
- Não repetitivo

CONHECIMENTOS:
- Mercado imobiliário
- Tipos de propriedades
- Financiamento
- Documentação
- Localização e valores

Responda sempre em português brasileiro de forma natural e útil.`;

    // Atualizar o prompt
    await connection.execute(
      'UPDATE ai_agents SET prompt = ? WHERE id = ?',
      [newPrompt, agent.id]
    );

    console.log('✅ Prompt do agente atualizado com sucesso!');
    console.log('📝 Novo prompt:', newPrompt);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

updateAgentPrompt();
