#!/bin/bash

# Script de teste para a API busca_imoveis
# Este script demonstra diferentes cenários de uso da API

BASE_URL="http://localhost:5000"
AGENT_ID="your-agent-uuid-here"

# IMPORTANTE: Antes de executar este script:
# 1. Acesse o painel administrativo
# 2. Vá em "Agentes de IA"
# 3. Copie o ID do seu agente
# 4. Substitua "your-agent-uuid-here" acima pelo ID real

echo "=========================================="
echo "Testando API busca_imoveis"
echo "=========================================="
echo ""

# Teste 1: Buscar todos os imóveis da empresa
echo "📋 Teste 1: Buscar TODOS os imóveis da empresa"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\"
  }" | jq '.'
echo ""
echo ""

# Teste 2: Buscar apartamentos para venda
echo "🏢 Teste 2: Buscar apartamentos para VENDA"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"tipo_transacao\": \"venda\",
    \"tipo_imovel\": \"apartamento\"
  }" | jq '.'
echo ""
echo ""

# Teste 3: Buscar imóveis para aluguel em São Paulo
echo "🏠 Teste 3: Buscar imóveis para ALUGUEL em São Paulo"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"tipo_transacao\": \"aluguel\",
    \"cidade\": \"São Paulo\"
  }" | jq '.'
echo ""
echo ""

# Teste 4: Buscar casas em Campinas
echo "🏘️ Teste 4: Buscar CASAS em Campinas"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"cidade\": \"Campinas\",
    \"tipo_imovel\": \"casa\"
  }" | jq '.'
echo ""
echo ""

# Teste 5: Buscar salas comerciais para venda
echo "🏢 Teste 5: Buscar SALAS COMERCIAIS para venda"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"tipo_transacao\": \"venda\",
    \"tipo_imovel\": \"sala\"
  }" | jq '.'
echo ""
echo ""

# Teste 6: Teste de erro - sem agentId
echo "❌ Teste 6: Teste de ERRO (sem agentId)"
echo "------------------------------------------"
curl -X POST "${BASE_URL}/api/tools/busca_imoveis" \
  -H "Content-Type: application/json" \
  -d "{
    \"cidade\": \"São Paulo\"
  }" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Testes concluídos!"
echo "=========================================="
