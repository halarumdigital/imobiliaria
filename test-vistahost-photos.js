import mysql from 'mysql2/promise';

async function testVistaHostPhotos() {
  console.log('🔍 Testando API VistaHost para fotos...');
  
  try {
    // Conectar ao banco para pegar as configurações da API
    const connection = await mysql.createConnection({
      host: '31.97.91.252',
      user: 'gilliard_imobi',
      password: 'gilliard123',
      database: 'gilliard_imobi'
    });

    console.log('✅ Conectado ao banco de dados');

    // Buscar configurações da API
    const [apiSettings] = await connection.execute(
      'SELECT api_url, api_token FROM api_settings WHERE company_id = ?',
      ['a9a2f3e1-6e37-43d4-b411-d7fb999f93e2']
    );

    if (!apiSettings || apiSettings.length === 0) {
      console.log('❌ Configurações da API não encontradas');
      return;
    }

    const { api_url, api_token } = apiSettings[0];
    console.log('✅ Configurações da API encontradas:', {
      url: api_url ? 'Configurada' : 'Não configurada',
      token: api_token ? 'Configurado' : 'Não configurado'
    });

    // Fazer busca de imóveis com fotos
    const searchParams = {
      filter: {
        "SiteSuder": "Sim"
      },
      fields: [
        "Codigo", "Categoria", "BairroComercial", "Cidade", "Suites", "DescricaoWeb", 
        "Dormitorios", "Vagas", "Endereco", "Complemento", "AreaPrivativa", 
        "ValorVenda", "ValorLocacao", "FotoDestaque",
        { "fotos": ["TipoFoto", "Url", "Descricao"] }
      ],
      paginacao: { 
        pagina: "1", 
        quantidade: "5" 
      }
    };

    const baseUrl = `${api_url}/imoveis/listar`;
    const queryParams = new URLSearchParams({
      key: api_token,
      v2: "1",
      pesquisa: JSON.stringify(searchParams),
      showtotal: "1"
    });
    
    const apiUrl = `${baseUrl}?${queryParams.toString()}`;
    console.log('🚀 Fazendo chamada para:', baseUrl);
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📡 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📊 Quantidade de imóveis retornados:', data.length || 0);

    if (data && data.length > 0) {
      const imovel = data[0];
      console.log('\n🏠 Exemplo de imóvel retornado:');
      console.log('- Código:', imovel.Codigo);
      console.log('- Localização:', imovel.Cidade, imovel.BairroComercial);
      console.log('- FotoDestaque:', imovel.FotoDestaque || 'Não disponível');
      console.log('- Array fotos:', imovel.fotos ? `${imovel.fotos.length} fotos` : 'Não disponível');
      
      if (imovel.fotos && imovel.fotos.length > 0) {
        console.log('\n📸 Primeiras fotos encontradas:');
        imovel.fotos.slice(0, 3).forEach((foto, index) => {
          console.log(`  ${index + 1}. URL: ${foto.Url || 'N/A'}, Tipo: ${foto.TipoFoto || 'N/A'}`);
        });
      } else {
        console.log('\n⚠️ Nenhuma foto encontrada no array "fotos"');
      }
    }

    await connection.end();
    console.log('\n✅ Teste concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testVistaHostPhotos();
