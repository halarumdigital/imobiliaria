// Teste REAL com banco de dados para verificar searchProperties

import { getStorage } from './server/storage.js';

async function testRealSearch() {
  console.log('🧪 ========== TESTE REAL DE BUSCA DE IMÓVEIS ==========\n');

  try {
    const storage = getStorage();
    await storage.init();

    console.log('✅ Conexão com banco estabelecida\n');

    // CompanyId real do banco
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';

    // TESTE 1: Buscar TODOS os apartamentos (sem filtro de cidade)
    console.log('📋 TESTE 1: Buscar TODOS os apartamentos');
    console.log('Filtros:', { propertyType: 'apartamento' });

    const filters1 = {
      propertyType: 'apartamento'
    };

    console.log('\n🔍 Chamando searchProperties com filtros:', JSON.stringify(filters1, null, 2));
    const result1 = await storage.searchProperties(companyId, filters1);

    console.log(`\n✅ Resultado: ${result1.length} imóveis encontrados`);
    result1.slice(0, 5).forEach((p, idx) => {
      console.log(`  [${idx + 1}] ${p.code} - ${p.name}`);
      console.log(`      propertyType: "${p.propertyType}"`);
      console.log(`      city: "${p.city}"`);
      console.log(`      transactionType: "${p.transactionType}"`);
    });

    // TESTE 2: Buscar apartamentos em Joaçaba para locação
    console.log('\n\n📋 TESTE 2: Buscar apartamentos em Joaçaba para locação');
    const filters2 = {
      city: 'Joaçaba',
      transactionType: 'locacao',
      propertyType: 'apartamento'
    };

    console.log('Filtros:', JSON.stringify(filters2, null, 2));
    console.log('\n🔍 Chamando searchProperties...');
    const result2 = await storage.searchProperties(companyId, filters2);

    console.log(`\n✅ Resultado: ${result2.length} imóveis encontrados`);
    result2.forEach((p, idx) => {
      console.log(`  [${idx + 1}] ${p.code} - ${p.name}`);
      console.log(`      propertyType: "${p.propertyType}"`);
      console.log(`      city: "${p.city}"`);
      console.log(`      transactionType: "${p.transactionType}"`);
    });

    // TESTE 3: Buscar com propertyType UNDEFINED (deve retornar todos os tipos)
    console.log('\n\n📋 TESTE 3: Buscar SEM filtro de propertyType (deve retornar todos)');
    const filters3 = {
      city: 'Joaçaba'
    };

    console.log('Filtros:', JSON.stringify(filters3, null, 2));
    console.log('  propertyType is undefined?', filters3.propertyType === undefined);
    console.log('\n🔍 Chamando searchProperties...');
    const result3 = await storage.searchProperties(companyId, filters3);

    console.log(`\n✅ Resultado: ${result3.length} imóveis encontrados`);

    // Contar por tipo
    const typeCount = {};
    result3.forEach(p => {
      typeCount[p.propertyType] = (typeCount[p.propertyType] || 0) + 1;
    });

    console.log('\n📊 Distribuição por tipo:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} imóveis`);
    });

    // TESTE 4: Testar com null explícito
    console.log('\n\n📋 TESTE 4: Buscar com propertyType = null (explícito)');
    const filters4 = {
      city: 'Joaçaba',
      propertyType: null
    };

    console.log('Filtros:', JSON.stringify(filters4, null, 2));
    console.log('  propertyType:', filters4.propertyType);
    console.log('  propertyType === null?', filters4.propertyType === null);
    console.log('\n🔍 Chamando searchProperties...');
    const result4 = await storage.searchProperties(companyId, filters4);

    console.log(`\n✅ Resultado: ${result4.length} imóveis encontrados`);

    // TESTE 5: Testar case sensitivity
    console.log('\n\n📋 TESTE 5: Buscar com "APARTAMENTO" (uppercase)');
    const filters5 = {
      propertyType: 'APARTAMENTO'
    };

    console.log('Filtros:', JSON.stringify(filters5, null, 2));
    console.log('\n🔍 Chamando searchProperties...');
    const result5 = await storage.searchProperties(companyId, filters5);

    console.log(`\n✅ Resultado: ${result5.length} imóveis encontrados`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRealSearch();
