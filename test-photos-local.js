import fetch from 'node-fetch';

async function testPropertySearchWithPhotos() {
  console.log('🔍 Testando busca de imóveis com fotos via servidor local...');
  
  try {
    // Faz uma chamada direta para o endpoint de teste do servidor
    const testUrl = 'http://localhost:5000/api/test-property-search/a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    
    console.log('🚀 Fazendo chamada para:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📡 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na chamada:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📊 Resposta recebida:', JSON.stringify(data, null, 2));

    // Analisa se há fotos nos dados retornados
    if (data.properties && data.properties.length > 0) {
      const firstProperty = data.properties[0];
      console.log('\n🏠 Analisando primeiro imóvel:');
      console.log('- Código:', firstProperty.Codigo);
      console.log('- FotoDestaque:', firstProperty.FotoDestaque || 'Não disponível');
      console.log('- Array fotos:', firstProperty.fotos ? `${firstProperty.fotos.length} fotos` : 'Não disponível');
      
      if (firstProperty.fotos && firstProperty.fotos.length > 0) {
        console.log('\n📸 Fotos encontradas:');
        firstProperty.fotos.forEach((foto, index) => {
          console.log(`  ${index + 1}. URL: ${foto.Url || 'N/A'}, Tipo: ${foto.TipoFoto || 'N/A'}`);
        });
      } else {
        console.log('\n⚠️ Nenhuma foto encontrada');
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testPropertySearchWithPhotos();
