# 🚀 Guia Para Executar a Migration

**IMPORTANTE**: Execute esta migration antes de usar o sistema de templates!

---

## Opção 1: Via MySQL Workbench (Recomendado para Windows)

1. **Abra o MySQL Workbench**

2. **Crie uma nova conexão** com os seguintes dados:
   - **Hostname**: `31.97.91.252`
   - **Port**: `3306`
   - **Username**: `gilliard_imobi`
   - **Password**: `kNW70PtsOWMh`
   - **Default Schema**: `gilliard_imobi`

3. **Conecte-se** e clique em "Test Connection" para verificar

4. **Abra o arquivo SQL**:
   - File → Open SQL Script
   - Navegue até: `E:\imobiliaria\migrations\create_website_system.sql`

5. **Execute o script**:
   - Clique no botão "Execute" (⚡) ou pressione `Ctrl+Shift+Enter`

6. **Verifique se funcionou**:
   - Execute esta query:
   ```sql
   SHOW TABLES LIKE '%website%';
   SHOW TABLES LIKE '%company_agents%';
   SHOW TABLES LIKE '%company_testimonials%';
   ```
   - Você deve ver as 3 novas tabelas

---

## Opção 2: Via phpMyAdmin

1. **Acesse phpMyAdmin** do seu servidor
2. **Selecione o banco** `gilliard_imobi` no menu lateral
3. **Clique na aba "SQL"** no topo
4. **Copie TODO o conteúdo** do arquivo `migrations/create_website_system.sql`
5. **Cole no campo SQL** e clique em "Go" ou "Executar"

---

## Opção 3: Via Linha de Comando (se tiver mysql client instalado)

```bash
# No terminal/cmd, execute:
mysql -h 31.97.91.252 -u gilliard_imobi -p gilliard_imobi < E:\imobiliaria\migrations\create_website_system.sql

# Quando pedir senha, digite: kNW70PtsOWMh
```

---

## Verificação Pós-Migration

Após executar a migration, execute estas queries para verificar:

```sql
-- Verificar tabelas criadas
SHOW TABLES LIKE '%website%';
SHOW TABLES LIKE '%company_agents%';
SHOW TABLES LIKE '%company_testimonials%';

-- Verificar estrutura das tabelas
DESCRIBE website_templates;
DESCRIBE company_websites;
DESCRIBE company_agents;
DESCRIBE company_testimonials;

-- Verificar se campo 'featured' foi adicionado à tabela properties
SHOW COLUMNS FROM properties LIKE 'featured';

-- Verificar templates seed
SELECT * FROM website_templates;
```

**Resultado Esperado**:
- ✅ 3 novas tabelas criadas: `website_templates`, `company_websites`, `company_agents`, `company_testimonials`
- ✅ Campo `featured` adicionado à tabela `properties`
- ✅ 2 templates inseridos: "Classic Real Estate" e "Modern FindHouse"

---

## ⚠️ Em Caso de Erro

### Erro: "Table already exists"
Se alguma tabela já existir, a migration vai pular essa tabela (usa `CREATE TABLE IF NOT EXISTS`).

### Erro: "Column already exists"
O script verifica se o campo `featured` já existe antes de adicionar. Se já existir, não faz nada.

### Erro de conexão
Verifique se o servidor MySQL está acessível:
```sql
-- Teste de ping
ping 31.97.91.252
```

---

## 🎉 Próximo Passo

Após executar a migration com sucesso:
1. ✅ Tabelas criadas
2. ✅ Endpoints API funcionando
3. ✅ Frontend pronto para uso

Você pode começar a usar o sistema de personalização de templates!

Acesse: **Menu Cliente → Configurar Website**

---

**Criado em**: 2025-10-31
**Banco**: gilliard_imobi @ 31.97.91.252
