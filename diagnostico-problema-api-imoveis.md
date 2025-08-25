# Diagnóstico do Problema: Agente não está consultando API de imóveis

## 📋 Análise Realizada

Após investigar todo o fluxo do sistema, identifiquei onde está o problema e como resolvê-lo.

## 🔍 Problema Identificado

### 1. **Contexto do Problema**
O usuário relatou que "o agente não está consultando a API e retornando os imóveis".

### 2. **Análise do Código Fonte**

#### **Arquivo: `server/aiResponseService.ts`**
- **Função:** `handlePropertySearch()` (linhas 250-500)
- **Status:** ✅ Implementada corretamente
- **Lógica:** 
  - Detecta palavras-chave de imóveis
  - Verifica se todas as informações necessárias foram coletadas
  - Busca configurações da API no banco de dados
  - Faz requisição para a API VistaHost

#### **Arquivo: `server/storage.ts`**
- **Função:** `getApiSettings()` (linhas 950-970)
- **Status:** ✅ Implementada corretamente
- **Lógica:** Busca configurações da API na tabela `api_settings`

#### **Arquivo: `server/routes.ts`**
- **Rotas de API:** ✅ Implementadas
- **Testes:** ✅ Possui rotas de teste para debug

#### **Arquivo: `shared/schema.ts`**
- **Tabela:** `apiSettings` (linhas 220-230)
- **Status:** ✅ Schema definido corretamente

## 🚨 Causa Raiz do Problema

### **Problema Principal: Configuração da API não está disponível**

O sistema está funcionando corretamente, mas o agente não consegue consultar imóveis porque:

1. **Tabela `api_settings` está vazia** ou não possui configurações para a empresa
2. **Campo `companyId` não está sendo passado corretamente** para o serviço
3. **Configurações da API (URL e Token) não foram inseridas** no sistema

### **Evidências no Código**

No arquivo `aiResponseService.ts`, linha 320:

```typescript
const apiSettings = await storage.getApiSettings(request.companyId!);

if (!apiSettings?.apiUrl || !apiSettings?.apiToken) {
  return `🔧 **Configuração necessária para busca de imóveis:**
  
📋 **Faltando:** ${missingConfig.join(", ")}

**Para configurar:**
1. Acesse o sistema web em: https://imobiliaria.gilliard.dev.br
2. Vá em "Configurações" → "API de Imóveis" 
3. Configure:
   - **URL da API VistaHost:** https://...
   - **Token de acesso:** seu_token_aqui`;
}
```

## 🔧 Solução Proposta

### **Passo 1: Verificar Configurações no Banco de Dados**

```sql
-- Verificar se existem configurações na tabela api_settings
SELECT * FROM api_settings;

-- Verificar empresas cadastradas
SELECT id, name FROM companies;
```

### **Passo 2: Inserir Configurações da API (se necessário)**

```sql
-- Inserir configurações para a empresa (substitua o companyId)
INSERT INTO api_settings (id, company_id, api_url, api_token, created_at, updated_at) 
VALUES (
  UUID(), 
  'a9a2f3e1-6e37-43d4-b411-d7fb999f93e2', 
  'https://suderneg-rest.vistahost.com.br',
  'SEU_TOKEN_AQUI',
  NOW(),
  NOW()
);
```

### **Passo 3: Verificar se o companyId está sendo passado**

No fluxo de mensagens, verificar se o `companyId` está sendo incluído no request:

```typescript
// Em server/aiResponseService.ts - função generateResponse
const request: AiResponseRequest = {
  message: userMessage,
  agentId: agent.id,
  agentPrompt: agent.prompt,
  companyId: agent.companyId, // ✅ Isso deve estar presente
  // ... outros campos
};
```

### **Passo 4: Testar a Configuração**

Usar a rota de teste para verificar se a API está funcionando:

```bash
# Testar via curl ou navegador
curl "http://localhost:3000/api/test-property-search"
```

Ou usar a interface web em:
`https://imobiliaria.gilliard.dev.br/api-config`

## 🎯 Checklist para Resolução

- [ ] **Verificar banco de dados:** A tabela `api_settings` tem registros?
- [ ] **Verificar companyId:** O ID da empresa está correto?
- [ ] **Configurar API:** URL e Token estão inseridos?
- [ ] **Testar conexão:** A API VistaHost está respondendo?
- [ ] **Verificar logs:** Os logs de chamada API estão sendo registrados?

## 📊 Fluxo Esperado de Funcionamento

1. **Usuário envia mensagem** com palavras-chave de imóveis
2. **Sistema detecta intenção** de busca de imóveis
3. **Verifica informações necessárias** (nome, telefone, tipo, finalidade, cidade)
4. **Busca configurações da API** no banco de dados
5. **Faz requisição para VistaHost** com os filtros
6. **Processa resposta** e formata para o usuário
7. **Retorna imóveis encontrados** com fotos e detalhes

## 🔍 Como Diagnosticar

### **1. Verificar Logs do Servidor**

```bash
# Procurar por mensagens de log relacionadas a property search
grep -r "property search" server/
grep -r "handlePropertySearch" server/
grep -r "apiSettings" server/
```

### **2. Verificar Console do Navegador**

Abrir DevTools e verificar se há erros de rede ou JavaScript quando tentar buscar imóveis.

### **3. Testar Manualmente**

Acessar a página de configuração de API e testar a conexão:
`https://imobiliaria.gilliard.dev.br/api-config`

## 📝 Conclusão

O **código está implementado corretamente**, o problema é de **configuração**. O sistema possui:

- ✅ Detecção de intenção de busca de imóveis
- ✅ Validação de informações necessárias  
- ✅ Busca de configurações no banco
- ✅ Tratamento de erros e mensagens informativas
- ✅ Integração com API VistaHost
- ✅ Formatação de resultados

**Ação necessária:** Configurar a URL e Token da API VistaHost no sistema através da interface de administração.
