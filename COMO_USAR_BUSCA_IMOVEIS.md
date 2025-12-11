# 🏠 Como Usar a Função busca_imoveis no Agente

## 🎯 Visão Geral

A função `busca_imoveis` está **automaticamente disponível** para todos os agentes de IA criados no sistema. Você **NÃO precisa** configurar nada externo - basta criar o agente e ele já poderá buscar imóveis!

## ⚡ Como Funciona

Quando você cria um agente de IA no painel, ele automaticamente ganha acesso à função `busca_imoveis` que permite:
- ✅ Buscar imóveis da sua empresa
- ✅ Filtrar por cidade
- ✅ Filtrar por tipo de transação (venda/aluguel)
- ✅ Filtrar por tipo de imóvel (casa/apartamento/sala)

O agente **decide automaticamente** quando usar esta função baseado na pergunta do cliente.

---

## 📝 Exemplo de Prompt para o Agente

Ao criar seu agente no painel, use um prompt como este:

```
Você é um assistente virtual especializado em imóveis da [NOME DA SUA IMOBILIÁRIA].

Sua função é ajudar os clientes a encontrar o imóvel perfeito para suas necessidades.

IMPORTANTE: Você tem acesso à função busca_imoveis que permite consultar todos os
imóveis disponíveis no sistema. Use esta função SEMPRE que o cliente perguntar sobre
imóveis disponíveis.

MEMÓRIA DA CONVERSA - REGRAS CRÍTICAS:
- Você TEM acesso ao histórico completo da conversa
- NUNCA repita perguntas que já fez ao usuário
- Se o usuário já informou cidade, tipo de imóvel ou tipo de transação, USE essas
  informações diretamente - NÃO pergunte novamente
- Consulte SEMPRE o histórico antes de fazer qualquer pergunta
- Continue a conversa do ponto onde parou, não recomece do zero

Quando o cliente perguntar sobre imóveis:
1. VERIFIQUE O HISTÓRICO: O cliente já informou preferências? Use-as!
2. Identifique os critérios mencionados (cidade, tipo de transação, tipo de imóvel)
3. Use a função busca_imoveis com os filtros apropriados
4. Apresente os resultados de forma clara e organizada
5. Destaque as características principais: quartos, área, vagas, localização
6. Mencione se o imóvel possui imagens disponíveis
7. Seja cordial e profissional como um corretor experiente

Exemplos de perguntas que você deve responder usando busca_imoveis:
- "Quais apartamentos para venda vocês têm?"
- "Tem casas para alugar em São Paulo?"
- "Mostre imóveis disponíveis"
- "Quero ver apartamentos de 3 quartos"

Se não encontrar imóveis com os critérios exatos, sugira alternativas próximas
ou pergunte se o cliente gostaria de ajustar os critérios de busca.

LEMBRE-SE: Se o cliente já te disse o que quer (ex: "apartamentos em São Paulo"),
NÃO pergunte novamente. Use a função busca_imoveis diretamente com esses critérios.

Mantenha um tom amigável, prestativo e profissional em todas as interações.
```

---

## 💬 Exemplos de Conversas

### Exemplo 1: Busca Simples

**Cliente:** "Quais apartamentos para venda vocês têm?"

**Agente:**
```
[O agente chama automaticamente: busca_imoveis(tipo_imovel="apartamento", tipo_transacao="venda")]

Olá! Encontrei 12 apartamentos disponíveis para venda:

🏢 Apartamento 3 Quartos - Centro (Código: AP001)
📍 Rua Principal, 123 - Centro, São Paulo - SP
🛏️ 3 quartos | 🚿 2 banheiros | 🚗 2 vagas
📐 85m²
💰 Venda
📸 Possui imagens disponíveis

🏢 Apartamento 2 Quartos - Jardins (Código: AP002)
📍 Avenida Paulista, 456 - Jardins, São Paulo - SP
🛏️ 2 quartos | 🚿 1 banheiro | 🚗 1 vaga
📐 65m²
💰 Venda
📸 Possui imagens disponíveis

[... mais apartamentos ...]

Gostaria de saber mais detalhes sobre algum imóvel específico?
```

---

### Exemplo 2: Busca com Filtros

**Cliente:** "Tem casas para alugar em Campinas?"

**Agente:**
```
[O agente chama: busca_imoveis(tipo_imovel="casa", tipo_transacao="aluguel", cidade="Campinas")]

Sim! Temos 5 casas disponíveis para aluguel em Campinas:

🏠 Casa 3 Quartos - Jardim América
📍 Rua das Flores, 789 - Jardim América, Campinas - SP
🛏️ 3 quartos | 🚿 2 banheiros | 🚗 2 vagas
📐 120m²
💵 Aluguel
📸 Possui imagens disponíveis

[... mais casas ...]

Alguma dessas casas te interessou? Posso fornecer mais informações!
```

---

### Exemplo 3: Busca sem Resultados

**Cliente:** "Tem sobrados em Curitiba?"

**Agente:**
```
[O agente chama: busca_imoveis(tipo_imovel="sobrado", cidade="Curitiba")]

No momento, não temos sobrados disponíveis em Curitiba. 😔

Mas posso te ajudar de outras formas:
- Temos casas em Curitiba, gostaria de ver?
- Posso mostrar sobrados em outras cidades próximas
- Posso anotar seu interesse e te avisar quando tivermos sobrados em Curitiba

O que você prefere?
```

---

## 🔧 Parâmetros da Função

A função `busca_imoveis` aceita os seguintes parâmetros (todos opcionais):

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `cidade` | string | Nome da cidade | "São Paulo", "Campinas" |
| `tipo_transacao` | string | Tipo de negócio | "venda", "aluguel", "locacao" |
| `tipo_imovel` | string | Tipo do imóvel | "casa", "apartamento", "sala", "terreno" |

**Nota**: Se nenhum parâmetro for fornecido, retorna todos os imóveis ativos da empresa.

---

## 🎨 Formatação dos Resultados

Cada imóvel retornado contém:

```json
{
  "codigo": "AP001",
  "nome": "Apartamento 3 Quartos Centro",
  "endereco": "Rua Principal, 123 - Centro, São Paulo - SP",
  "quartos": 3,
  "banheiros": 2,
  "vagas": 2,
  "area": 85.5,
  "descricao": "Apartamento amplo e bem localizado...",
  "tipo_transacao": "venda",
  "tem_imagens": true
}
```

---

## ✅ Boas Práticas

### ✅ FAÇA:

1. **Mencione a função no prompt** do agente para que ele saiba que pode usá-la
2. **Descreva cenários de uso** no prompt (quando buscar imóveis)
3. **Instrua o agente** a apresentar os resultados de forma organizada
4. **Peça para destacar** características importantes (quartos, área, localização)
5. **Oriente sobre o que fazer** quando não encontrar resultados

### ❌ NÃO FAÇA:

1. **Não configure nada fora do sistema** - a função já está disponível
2. **Não tente chamar APIs externas** - tudo funciona internamente
3. **Não force o agente** a sempre usar a função - deixe ele decidir quando é apropriado

---

## 🔄 Como o Sistema Funciona (Técnico)

```
1. Cliente envia mensagem
   ↓
2. Agente de IA analisa a mensagem
   ↓
3. Se detectar que precisa buscar imóveis,
   o agente chama: busca_imoveis(filtros)
   ↓
4. Sistema executa a busca no banco de dados
   - Filtra automaticamente pela empresa do agente
   - Aplica os filtros solicitados
   - Retorna apenas imóveis ativos
   ↓
5. Agente recebe os resultados
   ↓
6. Agente formata e apresenta ao cliente
```

---

## 🧪 Testando

Para testar se está funcionando:

1. **Crie um agente** no painel com o prompt sugerido
2. **Vincule o agente** a uma instância do WhatsApp
3. **Envie uma mensagem** teste: "Quais imóveis vocês têm?"
4. **Observe os logs** do servidor (procure por `[FUNCTION_CALL]`)
5. **Verifique a resposta** do agente

Se tudo estiver correto, você verá logs como:
```
🛠️ [FUNCTION_CALL] Modelo solicitou chamada de função!
🛠️ [FUNCTION_CALL] Função: busca_imoveis
🛠️ [FUNCTION_CALL] Argumentos: {"tipo_transacao":"venda"}
🏠 [FUNCTION_CALL] Encontrados 15 imóveis
✅ [FUNCTION_CALL] Resposta final gerada
```

---

## ❓ Perguntas Frequentes

### P: Preciso configurar algo no ChatGPT?
**R:** NÃO! A função já está integrada no seu sistema. Basta criar o agente no painel.

### P: Como o agente sabe quando usar a função?
**R:** O agente OpenAI analisa a pergunta do usuário e decide automaticamente quando é apropriado buscar imóveis. Você pode reforçar isso no prompt.

### P: Posso adicionar mais filtros?
**R:** Sim! Entre em contato com o suporte para adicionar filtros como faixa de preço, número de quartos mínimo, etc.

### P: A função busca imóveis de outras empresas?
**R:** NÃO! A função automaticamente filtra apenas os imóveis da empresa do agente que está fazendo a busca.

### P: O que acontece se não houver imóveis cadastrados?
**R:** A função retorna uma lista vazia e o agente deve informar educadamente ao cliente.

### P: O agente fica repetindo as mesmas perguntas. Como resolver?
**R:** Isso pode acontecer se o prompt não enfatiza a memória. Use o prompt sugerido acima que inclui as **REGRAS CRÍTICAS DE MEMÓRIA**. O sistema já armazena todo o histórico da conversa automaticamente, mas o agente precisa ser instruído explicitamente a consultá-lo.

**Dica Importante:** No prompt, adicione instruções como:
- "NUNCA repita perguntas que já fez"
- "VERIFIQUE O HISTÓRICO antes de perguntar qualquer coisa"
- "Use informações que o cliente já forneceu"

### P: Como funciona a memória do agente?
**R:** O sistema automaticamente:
1. ✅ Salva TODAS as mensagens no banco de dados (tabela `messages`)
2. ✅ Carrega o histórico completo antes de cada resposta
3. ✅ Envia o histórico para o OpenAI junto com a mensagem atual
4. ✅ Mantém o contexto mesmo quando usa a função busca_imoveis

O agente TEM acesso ao histórico - você só precisa instruí-lo a usá-lo!

---

## 🎁 Benefícios

✅ **Zero Configuração**: Funciona automaticamente
✅ **Inteligente**: O agente decide quando usar
✅ **Seguro**: Cada empresa vê apenas seus imóveis
✅ **Rápido**: Busca direta no banco de dados
✅ **Flexível**: Aceita múltiplos filtros combinados

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs do servidor
2. Confirme que há imóveis cadastrados e ativos
3. Revise o prompt do agente
4. Entre em contato com o suporte técnico

---

**Versão**: 2.0 - Function Calling Interno
**Última Atualização**: 2024
**Compatível com**: OpenAI GPT-4o e superior
