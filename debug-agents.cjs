const { getStorage } = require('./server/storage');

async function debugAgents() {
  try {
    const storage = getStorage();
    await storage.init();
    
    console.log('=== DEBUGGING AGENTE ===');
    
    // 1. Verificar todas as instâncias
    const companies = await storage.getAllCompanies();
    console.log('Empresas encontradas:', companies.length);
    
    for (const company of companies) {
      console.log(`\n🏢 Empresa: ${company.name} (${company.id})`);
      const instances = await storage.getWhatsappInstancesByCompany(company.id);
      console.log(`Instâncias: ${instances.length}`);
      
      for (const instance of instances) {
        console.log(`  - ${instance.name}: agentId=${instance.aiAgentId}, evolutionId=${instance.evolutionInstanceId}`);
        
        if (instance.aiAgentId) {
          const agent = await storage.getAiAgent(instance.aiAgentId);
          if (agent) {
            console.log(`    Agente: ${agent.name}`);
            console.log(`    Prompt: ${agent.prompt.substring(0, 100)}...`);
            console.log(`    Contém "imóvel": ${agent.prompt.includes('imóvel') || agent.prompt.includes('imovel')}`);
          } else {
            console.log(`    ❌ Agente não encontrado!`);
          }
        } else {
          console.log(`    ⚠️ Nenhum agente vinculado`);
        }
      }
      
      // Verificar agentes da empresa
      const agents = await storage.getAiAgentsByCompany(company.id);
      console.log(`\nAgentes disponíveis na empresa: ${agents.length}`);
      for (const agent of agents) {
        console.log(`  - ${agent.name}: ID=${agent.id}`);
        console.log(`    Prompt contém imóvel: ${agent.prompt.includes('imóvel') || agent.prompt.includes('imovel')}`);
        console.log(`    Tipo: ${agent.agentType || 'main'}`);
      }
      
      // Verificar configurações de API
      const apiSettings = await storage.getApiSettings(company.id);
      console.log(`\nAPI Settings:`, {
        hasUrl: !!apiSettings?.apiUrl,
        hasToken: !!apiSettings?.apiToken,
        url: apiSettings?.apiUrl || 'NÃO CONFIGURADA'
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

debugAgents();
