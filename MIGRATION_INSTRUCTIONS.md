# 📋 Instruções para Atualizar Migrações

O comando `npm run db:push` está travando devido a um constraint unique no email da tabela `users`. Aqui estão as opções para resolver:

## 🚨 Problema Atual
O Drizzle detectou que precisa adicionar um constraint unique na coluna `email` da tabela `users`, mas há 2 registros que podem ter emails duplicados.

## ✅ Solução Recomendada

### Opção 1: Execução Manual (Recomendada)
1. **Conecte-se ao seu banco MySQL** (phpMyAdmin, MySQL Workbench, etc.)
2. **Execute o arquivo**: `manual_migration_fix.sql`
3. **Siga os passos** comentados no arquivo

### Opção 2: Verificação Primeiro
1. **Execute**: `check_database_status.sql` para ver o status atual
2. **Verifique emails duplicados**:
   ```sql
   SELECT email, COUNT(*) as count 
   FROM users 
   GROUP BY email 
   HAVING COUNT(*) > 1;
   ```
3. **Se não houver duplicados**, execute apenas:
   ```sql
   ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
   ```

### Opção 3: Resolver via Drizzle (Se quiser insistir)
1. **Escolha "No"** na pergunta do Drizzle
2. **Resolva emails duplicados** manualmente primeiro
3. **Execute** `npm run db:push` novamente

## 📊 Status das Tabelas

### ✅ Já Criadas
- `funnel_stages` - ✅ (você criou manualmente)
- Todas as outras tabelas existentes

### 🔄 Pendentes (Opcionais)
- `customers` - Para funcionalidades futuras do Kanban
- Constraint unique no email dos usuários

## 🎯 O Que Funciona Agora

Mesmo sem executar as migrações, o sistema já está funcional:
- ✅ **Funil de vendas** funciona (tabela criada manualmente)
- ✅ **Kanban de atendimentos** funciona (dados mockados)
- ✅ **Drag & drop** funciona
- ✅ **Edição de clientes** funciona

## 🚀 Próximos Passos

1. **Execute** `manual_migration_fix.sql` quando conveniente
2. **Verifique** se tudo funcionou com `check_database_status.sql`
3. **Continue** desenvolvendo - o sistema já está operacional!

## ⚠️ Observações

- A tabela `customers` é opcional por enquanto (usando dados mockados)
- O constraint unique do email não afeta as funcionalidades atuais
- Todas as funcionalidades do funil já estão funcionando

---

**💡 Dica**: Se tiver dúvidas, execute primeiro `check_database_status.sql` para ver o que já existe no banco!