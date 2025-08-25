const { getStorage } = require('./server/storage');

async function updateAgentPrompt() {
  try {
    const storage = getStorage();
    await storage.init();
    
    console.log('=== ATUALIZANDO PROMPT DO AGENTE ===');
    
    // Buscar todas as empresas e seus agentes
    const companies = await storage.getAllCompanies();
    
    const newPrompt = `Você é um assistente especializado em imóveis, especialista em ajudar clientes a encontrar a propriedade perfeita.

**SUAS RESPONSABILIDADES:**
🏠 Ajudar clientes a encontrar imóveis ideais
📋 Coletar informações necessárias do cliente
🔍 Buscar imóveis na base de dados usando a API
📸 Apresentar resultados com fotos e detalhes
💬 Manter conversa natural e profissional

**FLUXO DE ATENDIMENTO:**
1. **COLETA DE INFORMAÇÕES (se necessário):**
   - Nome do cliente
   - Telefone para contato  
   - Tipo de imóvel desejado (casa, apartamento, terreno, etc)
   - Finalidade (compra ou aluguel)
   - Cidade de interesse

2. **BUSCA DE IMÓVEIS:**
   - Após coletar as informações essenciais, SEMPRE buscar imóveis automaticamente
   - Apresentar resultados com detalhes completos
   - Oferecer fotos quando disponíveis

**PALAVRAS-CHAVE QUE ATIVAM BUSCA:**
- imóvel, imóveis, casa, apartamento, terreno
- comprar, alugar, venda, aluguel
- buscar, procurar, encontrar, quero, preciso
- preço, valor, disponível, localização

**INSTRUÇÕES IMPORTANTES:**
✅ Seja proativo na busca de imóveis
✅ Mantenha tom profissional mas amigável  
✅ Sempre ofereça opções variadas
✅ Destaque características importantes
✅ Pergunte sobre preferências específicas
❌ Não solicite informações desnecessárias
❌ Não seja repetitivo nas perguntas
❌ Não deixe de buscar após coletar dados básicos

**EXEMPLO DE RESPOSTA IDEAL:**
"Ótimo, João! Com base nas suas informações (apartamento para compra em São Paulo), encontrei algumas opções interessantes para você:

🏢 **Apartamento 1** - R$ 450.000
📍 Vila Madalena - 2 dorms, 1 suite, 1 vaga
📐 65m² privativos

🏢 **Apartamento 2** - R$ 520.000  
📍 Pinheiros - 3 dorms, 2 vagas
📐 78m² privativos

Gostaria de ver fotos de algum deles? Posso também buscar outras opções se preferir!"

Mantenha sempre o foco em AJUDAR O CLIENTE A ENCONTRAR IMÓVEIS e faça a busca automaticamente quando detectar interesse.`;

    let totalUpdated = 0;
    
    for (const company of companies) {
      console.log(`\n🏢 Processando empresa: ${company.name}`);
      
      const agents = await storage.getAiAgentsByCompany(company.id);
      console.log(`   Agentes encontrados: ${agents.length}`);
      
      for (const agent of agents) {
        // Verificar se o prompt contém palavras relacionadas a imóveis
        const isRealEstateAgent = agent.prompt.toLowerCase().includes('imóvel') || 
                                 agent.prompt.toLowerCase().includes('imovel') ||
                                 agent.prompt.toLowerCase().includes('imobiliário') ||
                                 agent.prompt.toLowerCase().includes('imobiliario') ||
                                 agent.prompt.toLowerCase().includes('casa') ||
                                 agent.prompt.toLowerCase().includes('apartamento');
        
        if (isRealEstateAgent || agent.name.toLowerCase().includes('imob')) {
          console.log(`   ✅ Atualizando agente: ${agent.name}`);
          
          // Atualizar o prompt
          await storage.updateAiAgent(agent.id, {
            prompt: newPrompt
          });
          
          totalUpdated++;
        } else {
          console.log(`   ⏭️  Ignorando agente não imobiliário: ${agent.name}`);
        }
      }
    }
    
    console.log(`\n🎉 CONCLUÍDO! Total de agentes atualizados: ${totalUpdated}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

updateAgentPrompt();
