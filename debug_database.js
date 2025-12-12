const mysql = require('mysql2/promise');

async function debugDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      port: 3306,
      user: 'alugamai_dev',
      password: 'MbRWU14S5D9b',
      database: 'alugamai_dev'
    });

    console.log('🔍 Conectado ao banco de dados');

    // Verificar estrutura da tabela
    console.log('\n📋 Estrutura da tabela properties:');
    const [structure] = await connection.execute('DESCRIBE properties');
    console.table(structure);

    // Verificar todos os imóveis ativos
    console.log('\n📊 Todos os imóveis ativos (primeiros 10):');
    const [allProperties] = await connection.execute(`
      SELECT id, name, property_type, transaction_type, city, status, company_id, created_at
      FROM properties 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(allProperties);

    // Verificar especificamente os apartamentos
    console.log('\n🏢 Verificando apartamentos:');
    const [apartments] = await connection.execute(`
      SELECT COUNT(*) as total_apartamentos, property_type
      FROM properties 
      WHERE property_type = 'apartamento' AND status = 'active'
      GROUP BY property_type
    `);
    console.table(apartments);

    // Verificar todos os tipos de imóveis
    console.log('\n🏠 Tipos de imóveis cadastrados:');
    const [propertyTypes] = await connection.execute(`
      SELECT property_type, COUNT(*) as quantidade
      FROM properties 
      WHERE status = 'active'
      GROUP BY property_type
      ORDER BY quantidade DESC
    `);
    console.table(propertyTypes);

    // Verificar o total de imóveis ativos
    const [totalActive] = await connection.execute(`
      SELECT COUNT(*) as total FROM properties WHERE status = 'active'
    `);
    console.log(`\n📈 Total de imóveis ativos: ${totalActive[0].total}`);

    // Testar a query de busca exata usada no método searchProperties
    console.log('\n🔍 Testando query de busca por apartamentos:');
    const [searchTest] = await connection.execute(`
      SELECT * FROM properties 
      WHERE company_id = ? AND status = ? AND LOWER(property_type) = ?
      ORDER BY created_at DESC
    `, ['98e0230d-0c09-4395-aace-f851731255ea', 'active', 'apartamento']);
    
    console.log(`Encontrados ${searchTest.length} apartamentos com a query exata:`);
    if (searchTest.length > 0) {
      console.table(searchTest.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        property_type: p.property_type,
        transaction_type: p.transaction_type
      })));
    }

    await connection.end();
    console.log('\n✅ Conexão encerrada');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
  }
}

debugDatabase();