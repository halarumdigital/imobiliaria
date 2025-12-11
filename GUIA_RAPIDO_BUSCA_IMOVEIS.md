# 🏠 Guia Rápido: Configurar Busca de Imóveis no ChatGPT

Este guia mostra como configurar a função `busca_imoveis` para que seu agente de IA do ChatGPT possa consultar os imóveis cadastrados no sistema.

## ⚡ Configuração em 5 Passos

### 1️⃣ Obter o ID do Agente

1. Acesse o painel administrativo do sistema
2. Vá em **"Agentes de IA"**
3. Localize o agente que você criou
4. **Copie o ID** do agente (formato: `uuid-xxxx-xxxx-xxxx`)

💡 **Dica**: O ID do agente geralmente aparece na URL ou em uma coluna da tabela.

---

### 2️⃣ Criar Custom GPT no ChatGPT

1. Acesse: https://chat.openai.com/gpts/editor
2. Clique em **"Create a GPT"**
3. Dê um nome para o GPT (ex: "Consultor Imobiliário [Nome da Imobiliária]")

---

### 3️⃣ Configurar as Instruções

Cole estas instruções no campo **"Instructions"** (substitua os valores entre colchetes):

```
Você é um assistente especializado em imóveis da [NOME DA IMOBILIÁRIA].

SEU ID DE AGENTE: [SEU-AGENT-ID-AQUI]

Você ajuda clientes a encontrar imóveis perfeitos para suas necessidades usando
a base de dados da imobiliária.

Quando o usuário perguntar sobre imóveis:
1. Identifique os filtros: cidade, tipo de transação (venda/aluguel), tipo de imóvel
2. SEMPRE use o agentId acima em todas as buscas
3. Chame a função buscarImoveis com os parâmetros apropriados
4. Apresente os resultados de forma organizada e atraente
5. Destaque: quartos, área, vagas de garagem, localização
6. Mencione se há imagens disponíveis
7. Seja cordial e profissional como um corretor experiente

Tipos de transação: "venda" ou "aluguel"
Tipos de imóvel: "casa", "apartamento", "sala", "terreno", "sobrado", "chácara"

IMPORTANTE: Sempre inclua "agentId": "[SEU-AGENT-ID-AQUI]" nas chamadas.
```

---

### 4️⃣ Adicionar a Action

1. Vá na aba **"Configure"**
2. Role até **"Actions"**
3. Clique em **"Create new action"**
4. Cole o schema OpenAPI abaixo:

<details>
<summary>📋 Clique para ver o schema OpenAPI (copie tudo)</summary>

```yaml
openapi: 3.0.0
info:
  title: Busca de Imóveis API
  description: API para buscar imóveis cadastrados
  version: 1.0.0
servers:
  - url: https://SEU-DOMINIO.com
    description: Servidor de produção
paths:
  /api/tools/busca_imoveis:
    post:
      operationId: buscarImoveis
      summary: Buscar imóveis cadastrados
      description: Busca imóveis com filtros por cidade, tipo de transação e tipo de imóvel
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - agentId
              properties:
                agentId:
                  type: string
                  description: ID do agente de IA
                cidade:
                  type: string
                  description: Nome da cidade
                tipo_transacao:
                  type: string
                  enum: [venda, aluguel, locacao]
                tipo_imovel:
                  type: string
                  description: Tipo do imóvel (casa, apartamento, sala)
      responses:
        '200':
          description: Lista de imóveis encontrados
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                  imoveis:
                    type: array
                    items:
                      type: object
```

</details>

5. **IMPORTANTE**: Substitua `https://SEU-DOMINIO.com` pela URL real do seu servidor
6. Clique em **"Test"** para verificar se a conexão funciona

---

### 5️⃣ Testar a Integração

Agora teste conversando com seu GPT:

**Você:** "Quais apartamentos para venda vocês têm?"

**GPT:** *[Vai buscar automaticamente usando a função e mostrar os resultados]*

**Você:** "E casas para aluguel em Campinas?"

**GPT:** *[Busca casas em Campinas]*

---

## 🎯 Exemplos de Perguntas

Seu GPT agora pode responder perguntas como:

- ✅ "Mostre apartamentos para venda em São Paulo"
- ✅ "Quais casas vocês têm para alugar?"
- ✅ "Tem alguma sala comercial disponível?"
- ✅ "Quero ver imóveis em Campinas"
- ✅ "Apartamentos de 3 quartos para venda"

---

## 🔍 Como Funciona Internamente

```
Usuário pergunta
      ↓
ChatGPT identifica filtros
      ↓
Chama API /api/tools/busca_imoveis
      ↓
API consulta: agentId → companyId → imóveis da empresa
      ↓
Retorna JSON com imóveis
      ↓
ChatGPT formata e apresenta
```

---

## 🛠️ Troubleshooting

### Erro: "agentId é obrigatório"
**Solução**: Verifique se você colocou o ID do agente nas instruções do GPT

### Erro: "Agente não encontrado"
**Solução**: O ID do agente está incorreto. Copie novamente do painel administrativo

### GPT não chama a função
**Solução**:
1. Verifique se a Action foi salva corretamente
2. Teste a conexão na seção Actions
3. Certifique-se de que a URL do servidor está correta

### Retorna imóveis vazios
**Solução**:
1. Verifique se há imóveis cadastrados no sistema
2. Confirme que os imóveis estão com status "active"
3. Teste os filtros (cidade, tipo) com dados que existem no banco

---

## 📱 Compartilhando o GPT

Depois de configurado:

1. Clique em **"Save"** no editor do GPT
2. Escolha **"Anyone with the link"** ou **"Public"**
3. Copie o link
4. Compartilhe com sua equipe ou clientes

---

## 🔐 Segurança

- A API valida o `agentId` antes de buscar
- Cada agente só acessa imóveis da sua própria empresa
- Não há necessidade de tokens de autenticação (segurança por agentId)

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor (busque por `[BUSCA_IMOVEIS]`)
2. Teste a API diretamente com curl (veja TESTE_BUSCA_IMOVEIS.sh)
3. Confirme que o agente existe no banco de dados

---

## ✨ Próximos Passos

Após configurar a busca básica, você pode:
- [ ] Adicionar mais filtros (preço, número de quartos)
- [ ] Criar agentes especializados por região
- [ ] Integrar com outros sistemas (CRM, etc)

---

**Versão**: 1.0
**Atualizado em**: 2024
