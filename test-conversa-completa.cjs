// Teste para simular conversa completa do agente SDR
const http = require('http');

function enviarMensagem(mensagem, historico = []) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: mensagem,
      agentId: "test-agent",
      companyId: "a9a2f3e1-6e37-43d4-b411-d7fb999f93e2",
      conversationHistory: historico
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai-response',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({ response: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testarConversaCompleta() {
  console.log('🧪 TESTANDO CONVERSA COMPLETA COM AGENTE SDR');
  console.log('=============================================\n');

  let historico = [];

  try {
    // 1. Primeira mensagem sobre imóveis
    console.log('👤 Usuário: Procuro apartamento');
    const resposta1 = await enviarMensagem('Procuro apartamento', historico);
    console.log('🤖 Agente:', resposta1.response);
    historico.push(
      { role: 'user', content: 'Procuro apartamento' },
      { role: 'assistant', content: resposta1.response }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Nome
    console.log('\n👤 Usuário: João Silva');
    const resposta2 = await enviarMensagem('João Silva', historico);
    console.log('🤖 Agente:', resposta2.response);
    historico.push(
      { role: 'user', content: 'João Silva' },
      { role: 'assistant', content: resposta2.response }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Telefone
    console.log('\n👤 Usuário: 11999887766');
    const resposta3 = await enviarMensagem('11999887766', historico);
    console.log('🤖 Agente:', resposta3.response);
    historico.push(
      { role: 'user', content: '11999887766' },
      { role: 'assistant', content: resposta3.response }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Tipo de imóvel
    console.log('\n👤 Usuário: apartamento');
    const resposta4 = await enviarMensagem('apartamento', historico);
    console.log('🤖 Agente:', resposta4.response);
    historico.push(
      { role: 'user', content: 'apartamento' },
      { role: 'assistant', content: resposta4.response }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Finalidade
    console.log('\n👤 Usuário: comprar');
    const resposta5 = await enviarMensagem('comprar', historico);
    console.log('🤖 Agente:', resposta5.response);
    historico.push(
      { role: 'user', content: 'comprar' },
      { role: 'assistant', content: resposta5.response }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Cidade - AQUI DEVERIA ACIONAR A API
    console.log('\n👤 Usuário: São Paulo');
    const resposta6 = await enviarMensagem('São Paulo', historico);
    console.log('🤖 Agente:', resposta6.response);
    
    // Verificar se a resposta contém resultados de imóveis ou erro de configuração
    if (resposta6.response.includes('Configuração necessária')) {
      console.log('\n❌ PROBLEMA: API não configurada');
    } else if (resposta6.response.includes('imóvel') || resposta6.response.includes('encontr')) {
      console.log('\n✅ SUCESSO: API foi consultada!');
    } else {
      console.log('\n⚠️  RESPOSTA INESPERADA - pode estar pedindo mais informações');
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
  }
}

// Aguardar servidor estar pronto
setTimeout(testarConversaCompleta, 3000);
