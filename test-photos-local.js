import fetch from 'node-fetch';

async function testPropertySearchWithPhotos() {
  console.log('🔍 Testando busca de imóveis via webhook local...');
  
  try {
    // Testa o webhook como se fosse uma mensagem do WhatsApp
    const webhookUrl = 'http://localhost:3000/api/webhook/messages';
    
    const testMessage = {
      data: {
        key: {
          remoteJid: "5511999999999@s.whatsapp.net",
          fromMe: false,
          id: "test_search_123"
        },
        message: {
          conversation: "apartamentos para alugar"
        },
        messageTimestamp: 1640995200,
        pushName: "Test User"
      }
    };
    
    console.log('🚀 Enviando mensagem de teste:', JSON.stringify(testMessage, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testMessage)
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
