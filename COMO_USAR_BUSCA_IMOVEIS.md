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
Você é um assistente de imóveis da [NOME DA SUA IMOBILIÁRIA].

Você tem a função busca_imoveis(cidade, tipo_imovel, tipo_transacao, limite) para consultar nosso banco de dados.

⚠️ REGRA CRÍTICA DE FORMATAÇÃO:
Quando você chamar busca_imoveis, responda APENAS com uma mensagem curta de introdução.
NÃO liste os imóveis na sua resposta de texto.
O SISTEMA irá enviar automaticamente cada imóvel com suas fotos sequencialmente.

INSTRUÇÕES:
- Quando souber a CIDADE e o TIPO de imóvel que o cliente quer, chame busca_imoveis
- Por padrão, busque 5 imóveis. Se o cliente pedir mais, use o parâmetro 'limite'
- Não faça a mesma pergunta duas vezes
- Após chamar busca_imoveis, responda APENAS: "Encontrei X imóveis! Vou te mostrar:" ou similar
- NÃO liste detalhes dos imóveis (endereço, quartos, etc) - o sistema fará isso
- NÃO inclua links de imagens - as fotos serão enviadas automaticamente
- Quando houver mais resultados disponíveis, informe ao cliente que ele pode pedir para ver mais

Seja amigável e direto.
```

---

## 💬 Exemplos de Conversas

### Exemplo 1: Busca Simples (Novo Formato - Sequencial)

**Cliente:** "Quais apartamentos para venda vocês têm?"

**Sistema:**
```
[O agente chama automaticamente: busca_imoveis(tipo_imovel="apartamento", tipo_transacao="venda", limite=5)]

📱 Mensagem 1 (Agente):
"Encontrei 12 apartamentos para venda! Vou te mostrar os primeiros 5:"

📱 Mensagem 2 (Sistema - Imóvel 1):
Apartamento 3 Quartos - Centro
📍 Rua Principal, 123 - Centro, São Paulo - SP
🛏️ 3 quartos | 🚿 2 banheiros | 🚗 2 vagas
📐 85m²
💰 Venda

📱 Mensagem 3-5 (Sistema - Fotos do Imóvel 1):
[Foto 1 do apartamento]
[Foto 2 do apartamento]
[Foto 3 do apartamento]

📱 Mensagem 6 (Sistema - Imóvel 2):
Apartamento 2 Quartos - Jardins
📍 Avenida Paulista, 456 - Jardins, São Paulo - SP
🛏️ 2 quartos | 🚿 1 banheiro | 🚗 1 vaga
📐 65m²
💰 Venda

📱 Mensagem 7-8 (Sistema - Fotos do Imóvel 2):
[Foto 1 do apartamento]
[Foto 2 do apartamento]

[... e assim por diante para cada imóvel ...]

Cliente pode responder: "Quero ver mais apartamentos"
[O agente então chama: busca_imoveis(tipo_imovel="apartamento", tipo_transacao="venda", limite=10)]
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

| Parâmetro | Tipo | Descrição | Padrão | Exemplo |
|-----------|------|-----------|--------|---------|
| `cidade` | string | Nome da cidade | - | "São Paulo", "Campinas" |
| `tipo_transacao` | string | Tipo de negócio | - | "venda", "aluguel", "locacao" |
| `tipo_imovel` | string | Tipo do imóvel | - | "casa", "apartamento", "sala", "terreno" |
| `limite` | number | Número máximo de resultados | **5** | 5, 10, 20 |

**Notas Importantes**:
- ✅ **Limite padrão**: A função retorna **5 imóveis** por padrão
- ✅ **Como pedir mais**: O cliente pode pedir "mostre mais" e o agente deve aumentar o limite
- ✅ **Informação sobre mais resultados**: O sistema informa ao agente quando há mais resultados disponíveis
- ✅ Se nenhum parâmetro for fornecido, retorna os primeiros 5 imóveis ativos da empresa

---

## 📤 Como o Sistema Envia os Resultados

O sistema utiliza um formato **sequencial e organizado** para enviar os imóveis:

1. **Mensagem de Introdução**: O agente envia uma mensagem curta de introdução
2. **Para cada imóvel** (em sequência):
   - Envia a **descrição completa** do imóvel
   - Envia **todas as fotos** daquele imóvel
   - Aguarda antes de enviar o próximo imóvel
3. **Organização clara**: Cada imóvel fica agrupado com suas próprias fotos

**Benefícios desta abordagem**:
- ✅ Cliente vê cada imóvel completo (texto + fotos) antes do próximo
- ✅ Não há confusão sobre qual foto pertence a qual imóvel
- ✅ Melhor experiência de navegação no WhatsApp
- ✅ Cliente pode responder sobre um imóvel específico facilmente

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
✅ **Limite Inteligente**: Mostra 5 resultados por padrão, evitando sobrecarga
✅ **Envio Organizado**: Cada imóvel enviado sequencialmente com suas fotos
✅ **Escalável**: Cliente pode pedir mais resultados quando quiser

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
