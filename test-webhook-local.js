import fetch from 'node-fetch';

async function testWebhookLocally() {
  console.log('🔍 Simulando webhook local com busca de imóveis...');
  
  // Simula exatamente o webhook que vimos nos logs do Evolution API
  const webhookData = {
    "event": "messages.upsert",
    "instance": "deploy2",
    "data": {
      "key": {
        "remoteJid": "554999214230@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST_MESSAGE_ID_123"
      },
      "pushName": "Gilliard",
      "message": {
        "conversation": "apartamentos"
      },
      "messageType": "conversation",
      "messageTimestamp": Math.floor(Date.now() / 1000),
      "instanceId": "e5b71c35-276b-417e-a1c3-267f904b2b98",
      "source": "unknown"
    },
    "destination": "http://localhost:5000/api/webhook/messages",
    "date_time": new Date().toISOString(),
    "sender": "554999214230@s.whatsapp.net",
    "server_url": "https://apizap.halarum.com.br",
    "apikey": "94eff8b9da7b6c86e50b5c43334f6f69"
  };

  try {
    console.log('📤 Enviando webhook simulado para localhost:5000...');
    console.log('💬 Mensagem: "apartamentos" (para testar busca de imóveis)');
    
    // Aguarda um pouco para o servidor estar pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:5000/api/webhook/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Evolution-API/2.3.1'
      },
      body: JSON.stringify(webhookData)
    });

    console.log('📡 Status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Resposta:', result);
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    
    // Se falhar, tenta testar apenas se o servidor está acessível
    try {
      console.log('🔄 Testando se servidor está acessível...');
      const testResponse = await fetch('http://localhost:5000/api/webhook/test');
      console.log('🧪 Teste básico:', testResponse.status);
    } catch (testError) {
      console.log('❌ Servidor não acessível:', testError.message);
    }
  }
}

testWebhookLocally();
