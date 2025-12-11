# API Tool: busca_imoveis

## Descrição
Esta API foi criada especificamente para ser utilizada como uma **tool** (função) em agentes do ChatGPT. Ela permite buscar imóveis cadastrados no banco de dados com filtros por cidade, tipo de transação e tipo de imóvel.

## Endpoint
```
POST /api/tools/busca_imoveis
```

## Autenticação
**Não requer autenticação** - Esta API é pública e pode ser chamada diretamente pelo ChatGPT.

## Parâmetros de Entrada

Enviar no corpo da requisição (JSON):

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `agentId` | string | Sim | ID do agente de IA que está fazendo a busca (fornecido automaticamente no prompt) |
| `cidade` | string | Não | Nome da cidade para filtrar os imóveis |
| `tipo_transacao` | string | Não | Tipo de transação: "venda", "aluguel" ou "locacao" |
| `tipo_imovel` | string | Não | Tipo de imóvel: "casa", "apartamento", "sala", etc. |

### Observações:
- O `agentId` identifica automaticamente a empresa através do relacionamento do agente
- O parâmetro `tipo_transacao` aceita tanto "aluguel" quanto "locacao" (normalizado automaticamente)
- O parâmetro `tipo_imovel` faz uma busca parcial no campo `name` do imóvel (ex: "apartamento" encontra "Apartamento 3 Quartos")
- Todos os filtros são opcionais, exceto `agentId`
- Se nenhum filtro for informado, retorna todos os imóveis ativos da empresa do agente

## Formato de Resposta

```json
{
  "total": 2,
  "imoveis": [
    {
      "id": "uuid-aqui",
      "codigo": "AP001",
      "nome": "Apartamento 3 Quartos Centro",
      "endereco": {
        "rua": "Rua Principal",
        "numero": "123",
        "proximidade": "Próximo ao shopping",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234-567",
        "localizacao_mapa": "https://maps.google.com/..."
      },
      "caracteristicas": {
        "area_privada": 85.5,
        "vagas_garagem": 2,
        "banheiros": 2,
        "quartos": 3,
        "comodidades": ["amenity-id-1", "amenity-id-2"]
      },
      "descricao": "Apartamento amplo com 3 quartos...",
      "tipo_transacao": "venda",
      "imagens": [
        "/uploads/properties/image1.jpg",
        "/uploads/properties/image2.jpg"
      ],
      "video_youtube": "https://youtube.com/...",
      "destaque": true,
      "status": "active",
      "criado_em": "2024-01-15T10:30:00.000Z",
      "atualizado_em": "2024-01-20T15:45:00.000Z"
    }
  ]
}
```

## Exemplos de Uso

### Exemplo 1: Buscar apartamentos para venda em São Paulo
```json
{
  "agentId": "agent-uuid-aqui",
  "cidade": "São Paulo",
  "tipo_transacao": "venda",
  "tipo_imovel": "apartamento"
}
```

### Exemplo 2: Buscar todos os imóveis para aluguel
```json
{
  "agentId": "agent-uuid-aqui",
  "tipo_transacao": "aluguel"
}
```

### Exemplo 3: Buscar casas em uma cidade específica
```json
{
  "agentId": "agent-uuid-aqui",
  "cidade": "Campinas",
  "tipo_imovel": "casa"
}
```

### Exemplo 4: Buscar todos os imóveis ativos da empresa
```json
{
  "agentId": "agent-uuid-aqui"
}
```

## Schema para ChatGPT Custom GPT Actions

Para configurar esta API como uma action em um Custom GPT no ChatGPT, use o seguinte schema OpenAPI:

```yaml
openapi: 3.0.0
info:
  title: Busca de Imóveis API
  description: API para buscar imóveis com filtros
  version: 1.0.0
servers:
  - url: https://seu-dominio.com
    description: Servidor de produção
paths:
  /api/tools/busca_imoveis:
    post:
      operationId: buscarImoveis
      summary: Buscar imóveis cadastrados
      description: |
        Busca imóveis no banco de dados da empresa com filtros opcionais por cidade,
        tipo de transação (venda/aluguel) e tipo de imóvel (casa/apartamento/sala).
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
                  description: ID do agente de IA (fornecido automaticamente no prompt)
                  example: "agent-uuid-here"
                cidade:
                  type: string
                  description: Nome da cidade para filtrar
                  example: "São Paulo"
                tipo_transacao:
                  type: string
                  description: Tipo de transação (venda, aluguel ou locacao)
                  enum: [venda, aluguel, locacao]
                  example: "venda"
                tipo_imovel:
                  type: string
                  description: Tipo do imóvel (casa, apartamento, sala, etc)
                  example: "apartamento"
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
                    description: Quantidade total de imóveis encontrados
                  imoveis:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        codigo:
                          type: string
                        nome:
                          type: string
                        endereco:
                          type: object
                          properties:
                            rua:
                              type: string
                            numero:
                              type: string
                            proximidade:
                              type: string
                            bairro:
                              type: string
                            cidade:
                              type: string
                            estado:
                              type: string
                            cep:
                              type: string
                            localizacao_mapa:
                              type: string
                        caracteristicas:
                          type: object
                          properties:
                            area_privada:
                              type: number
                            vagas_garagem:
                              type: integer
                            banheiros:
                              type: integer
                            quartos:
                              type: integer
                            comodidades:
                              type: array
                              items:
                                type: string
                        descricao:
                          type: string
                        tipo_transacao:
                          type: string
                        imagens:
                          type: array
                          items:
                            type: string
                        video_youtube:
                          type: string
                        destaque:
                          type: boolean
                        status:
                          type: string
                        criado_em:
                          type: string
                          format: date-time
                        atualizado_em:
                          type: string
                          format: date-time
        '400':
          description: Erro de validação (companyId ausente)
        '500':
          description: Erro interno do servidor
```

## Configuração no ChatGPT

### Passo 1: Criar Custom GPT
1. Acesse https://chat.openai.com/gpts/editor
2. Crie um novo GPT

### Passo 2: Adicionar Action
1. Vá em "Configure" → "Actions"
2. Clique em "Create new action"
3. Cole o schema OpenAPI acima
4. Ajuste a URL do servidor para o seu domínio

### Passo 3: Instruções para o GPT
Adicione estas instruções no campo "Instructions":

```
Você é um assistente especializado em imóveis da [NOME DA IMOBILIÁRIA].

SEU ID DE AGENTE: [AGENT_UUID_AQUI]

Use a função buscarImoveis para encontrar propriedades quando o usuário perguntar
sobre imóveis disponíveis.

Sempre que buscar imóveis:
1. Identifique os filtros mencionados pelo usuário (cidade, tipo de transação, tipo de imóvel)
2. SEMPRE use o seu agentId fornecido acima: [AGENT_UUID_AQUI]
3. Chame a função buscarImoveis com os parâmetros apropriados
4. Apresente os resultados de forma clara e organizada ao usuário
5. Destaque as características principais de cada imóvel (quartos, área, garagem)
6. Se houver imagens, mencione que o imóvel possui fotos disponíveis
7. Seja cordial e prestativo, como um corretor de imóveis profissional

Tipos de transação aceitos: "venda" ou "aluguel"
Tipos de imóvel comuns: "casa", "apartamento", "sala", "terreno", "sobrado"

IMPORTANTE: Sempre inclua o parâmetro "agentId" com o valor [AGENT_UUID_AQUI]
em todas as chamadas da função buscarImoveis.
```

### Passo 4: Obter o Agent ID
Para configurar corretamente:
1. Acesse o painel administrativo do sistema
2. Vá em "Agentes de IA"
3. Copie o ID do agente que você criou
4. Substitua `[AGENT_UUID_AQUI]` nas instruções acima pelo ID real

## Exemplos de Conversação com ChatGPT

**Usuário:** "Quero ver apartamentos para venda em São Paulo"

**ChatGPT:**
```
[Chama buscarImoveis com:
{
  "agentId": "agent-uuid",
  "cidade": "São Paulo",
  "tipo_transacao": "venda",
  "tipo_imovel": "apartamento"
}]

Encontrei X apartamentos para venda em São Paulo:

1. Apartamento 3 Quartos Centro (Código: AP001)
   - Endereço: Rua Principal, 123 - Centro, São Paulo/SP
   - 3 quartos, 2 banheiros, 2 vagas
   - Área: 85.5m²
   - Destaque ⭐
   - Descrição: Apartamento amplo com 3 quartos...
   [Possui fotos disponíveis]

...
```

## Tratamento de Erros

### Erro 400: agentId ausente
```json
{
  "error": "agentId é obrigatório",
  "description": "O campo agentId identifica o agente de IA que está fazendo a busca. Este ID é fornecido automaticamente no prompt do agente."
}
```

### Erro 404: Agente não encontrado
```json
{
  "error": "Agente não encontrado",
  "description": "Nenhum agente encontrado com o ID: agent-uuid"
}
```

### Erro 500: Erro interno
```json
{
  "error": "Erro ao buscar imóveis",
  "details": "Mensagem de erro técnico"
}
```

## Logs

A API gera logs no servidor para debug:
- `🔍 [BUSCA_IMOVEIS]` - Quando uma busca é iniciada
- `✅ [BUSCA_IMOVEIS]` - Quando a busca é concluída com sucesso
- `❌ [BUSCA_IMOVEIS]` - Quando ocorre um erro

## Notas Técnicas

- A API retorna apenas imóveis com `status = 'active'`
- A busca por tipo de imóvel usa `LIKE` case-insensitive no campo `name`
- As imagens retornam caminhos relativos que devem ser concatenados com a URL base
- O campo `comodidades` retorna IDs que podem ser resolvidos com a API `/api/amenities`
- A ordenação padrão é por `created_at DESC` (mais recentes primeiro)

## Integração com Outras APIs

Para obter informações completas sobre comodidades:
```
GET /api/amenities
Headers: Authorization: Bearer {token}
```

Para obter lista de cidades cadastradas:
```
GET /api/cities
Headers: Authorization: Bearer {token}
```

---

**Versão:** 1.0.0
**Data:** 2024
**Autor:** Sistema Multi-Empresa
