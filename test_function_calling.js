// Teste completo para verificar se o function calling está funcionando

import fetch from 'node-fetch';

async function testFunctionCalling() {
  console.log('🧪 Iniciando teste de function calling...');
  
  try {
    // 1. Testar se a API está respondendo
    console.log('\n1. Testando conexão com a API...');
    const healthResponse = await fetch('http://localhost:5000/api/webhook/messages', {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      console.log('✅ API está respondendo');
    } else {
      console.log('❌ API não está respondendo');
      return;
    }

    // 2. Simular uma chamada completa ao webhook como se fosse do WhatsApp
    console.log('\n2. Simulando mensagem do WhatsApp...');
    
    const webhookPayload = {
      event: "messages.upsert",
      data: {
        instanceId: "deploy10",
        instanceName: "deploy10",
        messageType: "text",
        key: {
          remoteJid: "554899999999@s.whatsapp.net",
          fromMe: false,
          id: "TEST-" + Date.now()
        },
        pushName: "Teste Function Calling",
        message: {
          conversation: "Olá, estou procurando um apartamento em Joaçaba"
        }
      }
    };

    const webhookResponse = await fetch('http://localhost:5000/api/webhook/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (webhookResponse.ok) {
      console.log('✅ Webhook processado com sucesso');
      const result = await webhookResponse.json();
      console.log('📋 Resposta do webhook:', result);
    } else {
      console.log('❌ Erro ao processar webhook');
      console.log('Status:', webhookResponse.status);
      console.log('Texto:', await webhookResponse.text());
    }

    // 3. Aguardar um pouco e verificar logs
    console.log('\n3. Aguardando 5 segundos para processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Verificar se há conversas criadas
    console.log('\n4. Verificando conversas criadas...');
    try {
      const conversationsResponse = await fetch('http://localhost:5000/api/conversations/by-instance/deploy10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token-for-test'
        }
      });
      
      if (conversationsResponse.ok) {
        const conversations = await conversationsResponse.json();
        console.log(`📚 Encontradas ${conversations.length} conversas`);
        
        if (conversations.length > 0) {
          const latestConversation = conversations[0];
          console.log(`📝 Última conversa: ${latestConversation.contactPhone} (${latestConversation.contactName || 'sem nome'})`);
          
          // 5. Verificar mensagens da conversa
          console.log('\n5. Verificando mensagens da conversa...');
          const messagesResponse = await fetch(`http://localhost:5000/api/conversations/${latestConversation.id}/messages`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer fake-token-for-test'
            }
          });
          
          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            console.log(`💬 Encontradas ${messages.length} mensagens`);
            
            messages.forEach((msg, idx) => {
              console.log(`  [${idx + 1}] ${msg.sender}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
            });
            
            // 6. Verificar se há alguma menção sobre function calling nos logs
            console.log('\n6. Verificando se function calling foi acionado...');
            const hasFunctionCalling = messages.some(msg => 
              msg.content.includes('tool_calls') || 
              msg.content.includes('busca_imoveis') ||
              msg.sender === 'assistant' && msg.content.toLowerCase().includes('apartamento')
            );
            
            if (hasFunctionCalling) {
              console.log('✅ Function calling parece ter sido acionado!');
            } else {
              console.log('❌ Function calling NÃO foi acionado');
              console.log('🔍 Verifique os logs do servidor para mais detalhes');
            }
          } else {
            console.log('❌ Erro ao buscar mensagens');
          }
        }
      } else {
        console.log('❌ Erro ao buscar conversas');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar conversas (pode ser necessário autenticação real)');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testFunctionCalling();