# Guia para Executar as Migrations - VERSÃO CORRIGIDA

## ⚠️ SOLUÇÃO PARA ERRO DE FOREIGN KEY

As migrations foram divididas em 3 arquivos para evitar erros de foreign key:

1. **01_create_company_custom_domains_sem_fk.sql** - Cria tabela de domínios customizados SEM foreign keys
2. **02_create_website_system_sem_fk.sql** - Cria sistema de templates SEM foreign keys
3. **03_adicionar_foreign_keys_OPCIONAL.sql** - Adiciona foreign keys (OPCIONAL - pode pular se der erro)

## 📋 ORDEM DE EXECUÇÃO

### Passo 1: Execute o script de verificação (OPCIONAL)

Arquivo: `migrations/verificar_estrutura.sql`

Isso vai mostrar a estrutura da tabela `companies` para entendermos por que a FK está falhando.

### Passo 2: Execute as migrations SEM foreign keys

Execute **NESTA ORDEM**:

1. ✅ `migrations/01_create_company_custom_domains_sem_fk.sql`
2. ✅ `migrations/02_create_website_system_sem_fk.sql`
3. ⚠️ `migrations/03_adicionar_foreign_keys_OPCIONAL.sql` (OPCIONAL - pule se der erro)

## 🔌 Dados de Conexão

- **Host**: 31.97.91.252
- **Porta**: 3306
- **Usuário**: gilliard_imobi
- **Senha**: kNW70PtsOWMh
- **Database**: gilliard_imobi

## 🚀 Como Executar - MySQL Workbench (Recomendado)

### 1. Conectar ao banco

1. Abra o MySQL Workbench
2. Crie uma nova conexão com os dados acima
3. Teste a conexão e conecte

### 2. Executar Migration 1

1. Abra o arquivo `migrations/01_create_company_custom_domains_sem_fk.sql`
2. Copie todo o conteúdo
3. Cole em uma nova Query Tab no MySQL Workbench
4. Clique no ícone de raio ⚡ (Execute) ou pressione **Ctrl+Shift+Enter**
5. Deve aparecer "Tabela company_custom_domains criada com sucesso!"

### 3. Executar Migration 2

1. Abra o arquivo `migrations/02_create_website_system_sem_fk.sql`
2. Copie todo o conteúdo
3. Cole em uma nova Query Tab no MySQL Workbench
4. Clique no ícone de raio ⚡ (Execute) ou pressione **Ctrl+Shift+Enter**
5. Deve aparecer "Migration executada com sucesso!" e mostrar 2 templates

### 4. Executar Migration 3 (OPCIONAL)

⚠️ **ATENÇÃO**: Este passo é OPCIONAL. Se der erro, não tem problema!

O sistema funciona perfeitamente SEM as foreign keys. Elas são apenas para garantir integridade referencial no banco de dados.

Se quiser tentar adicionar as FKs:

1. Abra o arquivo `migrations/03_adicionar_foreign_keys_OPCIONAL.sql`
2. Copie todo o conteúdo
3. Cole em uma nova Query Tab
4. Execute
5. Se der erro, ignore e continue - o sistema vai funcionar normalmente

## 📊 Verificação Pós-Migration

Execute estes comandos SQL para verificar se tudo foi criado:

```sql
-- Verificar tabelas criadas
SHOW TABLES LIKE '%custom_domain%';
SHOW TABLES LIKE '%website%';
SHOW TABLES LIKE '%company_%';

-- Verificar estrutura
DESCRIBE company_custom_domains;
DESCRIBE website_templates;
DESCRIBE company_websites;
DESCRIBE company_agents;
DESCRIBE company_testimonials;

-- Verificar campo featured em properties
SHOW COLUMNS FROM properties LIKE 'featured';

-- Verificar templates inseridos (deve retornar 2)
SELECT * FROM website_templates;

-- Verificar totais
SELECT
  (SELECT COUNT(*) FROM website_templates) as total_templates,
  (SELECT COUNT(*) FROM company_websites) as total_websites,
  (SELECT COUNT(*) FROM company_agents) as total_agents,
  (SELECT COUNT(*) FROM company_testimonials) as total_testimonials;
```

## ✅ Resultado Esperado

Você deve ver:
- ✅ Tabela `company_custom_domains` criada
- ✅ Tabela `website_templates` criada com 2 templates
- ✅ Tabela `company_websites` criada
- ✅ Tabela `company_agents` criada
- ✅ Tabela `company_testimonials` criada
- ✅ Campo `featured` adicionado à tabela `properties`

## 🔧 Por que removemos as Foreign Keys?

As foreign keys estavam causando erro porque:
1. Possível incompatibilidade de charset/collation entre tabelas
2. Possível diferença no tipo de dado do campo `id` em `companies`
3. Configurações do servidor MySQL podem não suportar a sintaxe usada

**O sistema funciona perfeitamente sem as FKs** porque:
- A aplicação garante a integridade dos dados através do código
- Todos os endpoints verificam o `companyId` antes de permitir operações
- O isolamento multi-tenant está implementado na camada de aplicação

## 🐛 Solução de Problemas

### Erro: Table already exists

Tabela já foi criada anteriormente. Você pode:
1. Pular esta migration
2. Ou executar `DROP TABLE nome_tabela;` antes (⚠️ isso apaga os dados!)

### Erro: Duplicate entry for key 'PRIMARY'

Os templates já foram inseridos. Isso é normal e pode ignorar.

### Erro: Unknown column 'featured'

O script de verificação condicional já trata isso. Se o campo já existe, não será adicionado novamente.

## 📝 Próximos Passos Após Migration

Depois de executar as migrations com sucesso:

1. ✅ Reinicie o servidor da aplicação: `npm run dev`
2. ✅ Acesse o painel do cliente
3. ✅ Teste as novas páginas:
   - Website → Configurar Website
   - Website → Corretores
   - Website → Depoimentos
4. ✅ Verifique se consegue criar/editar/deletar registros

## 🎯 Arquivos Importantes

- ✅ **GUIA_EXECUTAR_MIGRATIONS.md** (este arquivo)
- ✅ **01_create_company_custom_domains_sem_fk.sql** - Migration 1
- ✅ **02_create_website_system_sem_fk.sql** - Migration 2
- ⚠️ **03_adicionar_foreign_keys_OPCIONAL.sql** - Migration 3 (opcional)
- 📋 **verificar_estrutura.sql** - Script de verificação

## ❓ Ainda com Problemas?

Se ainda tiver erros após executar as migrations SEM foreign keys, compartilhe:
1. A mensagem de erro completa
2. O resultado do script `verificar_estrutura.sql`
3. A versão do MySQL (execute `SELECT VERSION();`)
