// Test script para verificar a correção da filtragem por tipo de imóvel
const fetch = require('node-fetch');

async function testBuscaImoveis() {
  try {
    console.log('🧪 Testando busca de imóveis por tipo...');
    
    // Teste 1: Buscar apenas apartamentos
    console.log('\n📍 Teste 1: Buscando apenas apartamentos...');
    const responseApartamentos = await fetch('http://localhost:5000/api/tools/busca_imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: 'test-agent-id', // Você precisará substituir por um ID válido
        tipo_imovel: 'apartamento'
      })
    });
    
    if (responseApartamentos.ok) {
      const dataApartamentos = await responseApartamentos.json();
      console.log(`✅ Encontrados ${dataApartamentos.total} apartamentos`);
      
      // Verificar se todos os resultados são realmente apartamentos
      const todosApartamentos = dataApartamentos.imoveis.every(imovel => 
        imovel.tipo_transacao && imovel.tipo_transacao.toLowerCase() === 'apartamento'
      );
      
      if (todosApartamentos) {
        console.log('✅ Todos os imóveis retornados são apartamentos');
      } else {
        console.log('❌ Alguns imóveis retornados não são apartamentos');
        console.log('Tipos encontrados:', [...new Set(dataApartamentos.imoveis.map(i => i.tipo_transacao))]);
      }
    } else {
      console.log('❌ Erro na busca de apartamentos:', responseApartamentos.status);
    }
    
    // Teste 2: Buscar apenas casas
    console.log('\n📍 Teste 2: Buscando apenas casas...');
    const responseCasas = await fetch('http://localhost:5000/api/tools/busca_imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: 'test-agent-id', // Você precisará substituir por um ID válido
        tipo_imovel: 'casa'
      })
    });
    
    if (responseCasas.ok) {
      const dataCasas = await responseCasas.json();
      console.log(`✅ Encontrados ${dataCasas.total} casas`);
      
      // Verificar se todos os resultados são realmente casas
      const todosCasas = dataCasas.imoveis.every(imovel => 
        imovel.tipo_transacao && imovel.tipo_transacao.toLowerCase() === 'casa'
      );
      
      if (todosCasas) {
        console.log('✅ Todos os imóveis retornados são casas');
      } else {
        console.log('❌ Alguns imóveis retornados não são casas');
        console.log('Tipos encontrados:', [...new Set(dataCasas.imoveis.map(i => i.tipo_transacao))]);
      }
    } else {
      console.log('❌ Erro na busca de casas:', responseCasas.status);
    }
    
    // Teste 3: Buscar todos os imóveis (sem filtro)
    console.log('\n📍 Teste 3: Buscando todos os imóveis (sem filtro)...');
    const responseTodos = await fetch('http://localhost:5000/api/tools/busca_imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: 'test-agent-id' // Você precisará substituir por um ID válido
      })
    });
    
    if (responseTodos.ok) {
      const dataTodos = await responseTodos.json();
      console.log(`✅ Encontrados ${dataTodos.total} imóveis no total`);
    } else {
      console.log('❌ Erro na busca de todos os imóveis:', responseTodos.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Instruccões para usar:
// 1. Substitua 'test-agent-id' por um ID de agente válido do seu banco
// 2. Execute: node test_busca_imoveis.js
// 3. Verifique se a filtragem está funcionando corretamente

console.log('📝 Script de teste para a API busca_imoveis');
console.log('⚠️  Antes de executar, substitua "test-agent-id" por um ID de agente válido!');
console.log('');
console.log('Para executar o teste:');
console.log('node test_busca_imoveis.js');