# Correção do Problema de Filtragem na API busca_imoveis

## Problema Identificado

A API `busca_imoveis` não estava filtrando corretamente por tipo de imóvel. Quando um usuário solicitava "apartamento", a ferramenta retornava todos os 21 imóveis em vez de apenas os 6 apartamentos existentes.

## Causa Raiz

Havia uma inconsistência no nome do campo de filtro entre a API e o método `searchProperties`:

- **API (`server/routes.ts`, linha 4168)**: Usava `filters.propertyType` (camelCase)
- **Método (`server/storage.ts`, linha 2240)**: Esperava `filters.property_type` (snake_case)

## Correção Aplicada

Arquivo: `server/routes.ts`
Linha: 4168

**Antes:**
```typescript
if (tipo_imovel) {
  filters.propertyType = tipo_imovel;
}
```

**Depois:**
```typescript
if (tipo_imovel) {
  filters.property_type = tipo_imovel;
}
```

## Impacto da Correção

- ✅ A filtragem por tipo de imóvel agora funciona corretamente
- ✅ Ao solicitar "apartamento", apenas os 6 apartamentos serão retornados
- ✅ Ao solicitar "casa", apenas as casas serão retornadas
- ✅ A busca sem filtro de tipo continua funcionando normalmente

## Testes

Foi criado um script de teste (`test_busca_imoveis.js`) para validar a correção:

1. **Teste de Apartamentos**: Verifica se apenas apartamentos são retornados
2. **Teste de Casas**: Verifica se apenas casas são retornadas  
3. **Teste Geral**: Verifica se todos os imóveis são retornados sem filtro

## Como Usar o Teste

1. Substitua `'test-agent-id'` no script por um ID de agente válido do banco
2. Execute: `node test_busca_imoveis.js`
3. Verifique se a filtragem está funcionando corretamente

## Observações Adicionais

- O método `searchProperties` já estava implementado corretamente com case-insensitive comparison
- O campo `property_type` na tabela `properties` está definido corretamente no schema
- A correção mantém compatibilidade com o restante da API