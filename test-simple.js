const http = require('http');

// Teste simples para verificar se o servidor está acessível
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Servidor respondeu! Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`📄 Resposta: ${chunk}`);
  });
});

req.on('error', (err) => {
  console.error(`❌ Erro: ${err.message}`);
});

req.end();
