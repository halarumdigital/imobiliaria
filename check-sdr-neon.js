import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';

async function checkSDRAgents() {
  try {
    console.log('Verificando agentes SDR no PostgreSQL (Neon)...');
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL não configurada');
      return;
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // Buscar todos os agentes
    const agents = await db.select().from(schema.aiAgents);
    
    console.log(`📊 Total de agentes encontrados: ${agents.length}`);
    
    if (agents.length === 0) {
      console.log('❌ Nenhum agente encontrado na tabela ai_agents');
      return;
    }
    
    // Buscar agentes SDR específicos
    const sdrAgents = agents.filter(agent => 
      agent.name?.toLowerCase().includes('sdr') ||
      agent.specialization?.toLowerCase().includes('sdr') ||
      agent.specialization?.toLowerCase().includes('coleta') ||
      agent.specialization?.toLowerCase().includes('dados') ||
      agent.delegationKeywords?.toLowerCase().includes('sdr')
    );
    
    console.log('\n=== AGENTES SDR ENCONTRADOS ===');
    if (sdrAgents.length === 0) {
      console.log('❌ Nenhum agente SDR específico encontrado');
    } else {
      sdrAgents.forEach(agent => {
        console.log(`✅ Agente: ${agent.name}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Tipo: ${agent.agentType}`);
        console.log(`   Especialização: ${agent.specialization || 'N/A'}`);
        console.log(`   Palavras-chave: ${agent.delegationKeywords || 'N/A'}`);
        console.log(`   Ativo: ${agent.active ? 'Sim' : 'Não'}`);
        console.log('---');
      });
    }
    
    // Buscar agentes secundários
    const secondaryAgents = agents.filter(agent => agent.agentType === 'secondary');
    
    console.log(`\n=== AGENTES SECUNDÁRIOS (${secondaryAgents.length}) ===`);
    secondaryAgents.forEach(agent => {
      console.log(`- ${agent.name} | Especialização: ${agent.specialization || 'N/A'}`);
      if (agent.delegationKeywords) {
        console.log(`  Palavras-chave: ${agent.delegationKeywords}`);
      }
    });
    
    // Buscar agentes com prompts de coleta de dados
    const dataCollectionAgents = agents.filter(agent => {
      const prompt = agent.prompt?.toLowerCase() || '';
      return prompt.includes('nome') && 
             prompt.includes('telefone') && 
             (prompt.includes('coleta') || prompt.includes('dados'));
    });
    
    console.log(`\n=== AGENTES COM PROMPTS DE COLETA DE DADOS (${dataCollectionAgents.length}) ===`);
    dataCollectionAgents.forEach(agent => {
      console.log(`- ${agent.name}`);
      console.log(`  Prompt (primeiros 200 chars): ${agent.prompt?.substring(0, 200)}...`);
      console.log('');
    });
    
    // Mostrar todos os agentes para análise
    console.log('\n=== TODOS OS AGENTES PARA ANÁLISE ===');
    agents.forEach(agent => {
      console.log(`ID: ${agent.id} | Nome: ${agent.name} | Tipo: ${agent.agentType} | Ativo: ${agent.active}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkSDRAgents();
