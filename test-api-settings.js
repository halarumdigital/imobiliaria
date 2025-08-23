import { getStorage } from './server/storage.js';

async function testApiSettings() {
  console.log('🔍 Testando configurações da API...');
  
  try {
    const storage = getStorage();
    const companyId = 'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2';
    
    console.log(`📋 Buscando configurações para empresa: ${companyId}`);
    
    const apiSettings = await storage.getApiSettings(companyId);
    
    if (apiSettings) {
      console.log('✅ Configurações encontradas:');
      console.log('- ID:', apiSettings.id);
      console.log('- Company ID:', apiSettings.companyId);
      console.log('- API URL:', apiSettings.apiUrl ? 'Configurada' : 'Não configurada');
      console.log('- API Token:', apiSettings.apiToken ? 'Configurado' : 'Não configurado');
      
      if (apiSettings.apiUrl && apiSettings.apiToken) {
        console.log('\n🚀 Configurações completas! O problema deve estar em outro lugar.');
      } else {
        console.log('\n❌ Configurações incompletas!');
      }
    } else {
      console.log('❌ Nenhuma configuração encontrada para esta empresa');
      console.log('📝 Sugestão: Configure a API na seção de configurações do sistema');
    }
  } catch (error) {
    console.error('❌ Erro ao testar configurações:', error.message);
  }
}

testApiSettings();
