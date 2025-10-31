# 🌐 Sistema de Domínios Customizados - Guia de Implementação

**Status**: ✅ IMPLEMENTADO
**Data**: 2025-10-31
**Versão**: 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquivos Criados](#arquivos-criados)
3. [Configuração Inicial](#configuração-inicial)
4. [Executar Migration](#executar-migration)
5. [Configurar SMTP](#configurar-smtp)
6. [Como Usar - Cliente](#como-usar---cliente)
7. [Como Usar - Admin](#como-usar---admin)
8. [Configuração de Infraestrutura](#configuração-de-infraestrutura)
9. [Testes](#testes)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema permite que cada empresa (tenant) use seu próprio domínio personalizado para acessar o sistema, ao invés de usar subdomínios ou URLs baseadas em path.

### Exemplo
- **Antes**: `app.seuservidor.com/empresa1` ou `empresa1.app.seuservidor.com`
- **Depois**: `minhaempresa.com.br`

### Fluxo de Estados
```
PENDING (0)    → Aguardando aprovação do admin
CONNECTED (1)  → Aprovado e funcionando ✅
REJECTED (2)   → Rejeitado pelo admin
REMOVED (3)    → Removido pelo admin
```

---

## 📁 Arquivos Criados

### Backend

#### 1. Schema Drizzle
- **`shared/schema.ts`** - Adicionado:
  - Tabela `companyCustomDomains`
  - Type `CompanyCustomDomain`
  - Type `InsertCompanyCustomDomain`

#### 2. Migration SQL
- **`migrations/create_company_custom_domains.sql`**
  - Criar tabela no banco de dados
  - Índices para performance
  - Foreign keys para integridade

#### 3. Storage Methods
- **`server/storage.ts`** - Adicionados métodos:
  - `getCustomDomain(id)`
  - `getCustomDomainByHost(host)`
  - `getCustomDomainsByCompany(companyId)`
  - `getLatestCustomDomainByCompany(companyId)`
  - `getAllCustomDomains()`
  - `getCustomDomainsByStatus(status)`
  - `createCustomDomain(domain)`
  - `updateCustomDomain(id, updates)`
  - `deleteCustomDomain(id)`

#### 4. Serviço de Email
- **`server/services/emailService.ts`**
  - Templates HTML para aprovação e rejeição
  - Integração com nodemailer
  - Configuração via variáveis de ambiente

#### 5. Middleware
- **`server/middleware/identifyCompanyByDomain.ts`**
  - Identificação automática da empresa pelo domínio
  - Validação de acesso

#### 6. Endpoints API
- **`server/routes.ts`** - Adicionados:
  - `GET /api/client/domains` - Listar domínios da empresa
  - `POST /api/client/domains/request` - Solicitar domínio
  - `GET /api/admin/custom-domains` - Listar todos (admin)
  - `PUT /api/admin/custom-domains/:id/status` - Atualizar status
  - `DELETE /api/admin/custom-domains/:id` - Deletar domínio
  - `POST /api/admin/custom-domains/:id/send-email` - Enviar email customizado

### Frontend

#### 7. Página do Cliente
- **`client/src/pages/client/domains.tsx`**
  - Interface para solicitar domínio
  - Ver status da solicitação
  - Histórico de solicitações
  - Instruções DNS

#### 8. Página do Admin
- **`client/src/pages/admin/custom-domains.tsx`**
  - Listar todas as solicitações
  - Aprovar/Rejeitar domínios
  - Enviar emails para empresas
  - Filtrar por status
  - Deletar solicitações

#### 9. Rotas e Sidebar
- **`client/src/App.tsx`** - Adicionadas rotas:
  - `/client/domains` - Página do cliente
  - `/admin/custom-domains` - Página do admin

- **`client/src/components/layout/sidebar.tsx`** - Adicionados links:
  - Menu admin: "Domínios Customizados"
  - Menu cliente: "Domínio Customizado"

---

## ⚙️ Configuração Inicial

### 1. Instalar Dependências
O nodemailer já foi instalado durante a implementação, mas se precisar reinstalar:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Variáveis de Ambiente
O arquivo `.env` já foi atualizado com as seguintes variáveis:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=seu-email@example.com
SMTP_PASSWORD=sua-senha-aqui
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME=Sistema Multi-Empresa

# Main Domain
MAIN_DOMAIN=localhost:5000
```

**⚠️ IMPORTANTE**: Você precisa configurar estas variáveis com seus dados reais!

---

## 🗄️ Executar Migration

### Opção 1: Via MySQL Client
```bash
mysql -u gilliard_imobi -p gilliard_imobi < migrations/create_company_custom_domains.sql
```

### Opção 2: Via Drizzle (Recomendado)
```bash
npm run db:push
```

### Verificar se a tabela foi criada
```sql
DESCRIBE company_custom_domains;
```

Resultado esperado:
```
+-------------------+--------------+------+-----+---------+-------+
| Field             | Type         | Null | Key | Default | Extra |
+-------------------+--------------+------+-----+---------+-------+
| id                | varchar(36)  | NO   | PRI | NULL    |       |
| company_id        | varchar(36)  | NO   | MUL | NULL    |       |
| requested_domain  | varchar(255) | YES  | MUL | NULL    |       |
| current_domain    | varchar(255) | YES  |     | NULL    |       |
| status            | int          | NO   | MUL | 0       |       |
| created_at        | timestamp    | NO   |     | NOW()   |       |
| updated_at        | timestamp    | NO   |     | NOW()   |       |
+-------------------+--------------+------+-----+---------+-------+
```

---

## 📧 Configurar SMTP

### Provedores Recomendados

#### 1. Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASSWORD=sua-senha-de-aplicativo
SMTP_SECURE=false
SMTP_FROM_EMAIL=seuemail@gmail.com
SMTP_FROM_NAME=Sistema Multi-Empresa
```

**Nota**: Use "Senha de App" do Google, não a senha normal.

#### 2. SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@seudominio.com
SMTP_FROM_NAME=Sistema Multi-Empresa
```

#### 3. Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seudominio.com
SMTP_PASSWORD=sua-senha-mailgun
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@seudominio.com
SMTP_FROM_NAME=Sistema Multi-Empresa
```

### Testar Configuração
Após configurar, teste enviando uma aprovação de domínio e verifique se o email chega.

---

## 👥 Como Usar - Cliente

### 1. Acessar Página de Domínios
1. Fazer login como **cliente**
2. No menu lateral, clicar em **"Domínio Customizado"**
3. Você verá a interface de solicitação

### 2. Configurar DNS do Domínio

**ANTES** de solicitar, configure o DNS no seu provedor de domínio:

#### Opção A: Registro A
```
Tipo: A
Nome: @ (ou deixe vazio)
Valor: [IP do servidor]
TTL: 3600
```

#### Opção B: Registro CNAME
```
Tipo: CNAME
Nome: @ ou www
Valor: seuservidor.com (domínio principal)
TTL: 3600
```

**Provedores Comuns:**
- GoDaddy: Painel de Controle → DNS
- HostGator: cPanel → Zona DNS
- Registro.br: Painel → DNS
- Cloudflare: DNS Management

### 3. Solicitar Domínio
1. Digite o domínio no campo (exemplo: `minhaempresa.com.br`)
2. **NÃO** use `http://` ou `https://`
3. Clique em **"Solicitar"**
4. Aguarde aprovação do administrador

### 4. Status da Solicitação
- **🟡 Pendente**: Aguardando aprovação
- **🟢 Conectado**: Domínio ativo e funcionando!
- **🔴 Rejeitado**: Solicitação foi rejeitada
- **⚫ Removido**: Domínio foi removido

---

## 👨‍💼 Como Usar - Admin

### 1. Acessar Gerenciamento
1. Fazer login como **admin**
2. No menu lateral, clicar em **"Domínios Customizados"**

### 2. Visualizar Solicitações
- Ver todas as solicitações
- Filtrar por status: Todos, Pendentes, Conectados, Rejeitados
- Ver contadores de pendentes e conectados

### 3. Aprovar Domínio
1. Na lista, localizar o domínio pendente
2. No dropdown de status, selecionar **"Conectado"**
3. Sistema automaticamente:
   - Atualiza status para 1 (Connected)
   - Envia email de aprovação para a empresa
   - Domínio passa a funcionar

### 4. Rejeitar Domínio
1. No dropdown de status, selecionar **"Rejeitado"**
2. Sistema automaticamente:
   - Atualiza status para 2 (Rejected)
   - Envia email de rejeição para a empresa

### 5. Enviar Email Customizado
1. Clicar no ícone de **"Mail"** ao lado do domínio
2. Preencher assunto e mensagem
3. Clicar em **"Enviar Email"**

### 6. Deletar Domínio
1. Clicar no ícone de **"Lixeira"**
2. Confirmar exclusão
3. Domínio será permanentemente removido

---

## 🏗️ Configuração de Infraestrutura

### DNS Wildcard (Opcional para Subdomínios)
Se quiser suportar subdomínios também:
```
*.seudominio.com → IP do servidor
```

### Nginx/Apache
Configurar o servidor web para aceitar qualquer domínio:

#### Nginx
```nginx
server {
    listen 80;
    server_name _ ;  # Aceita qualquer domínio

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerAlias *
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    ProxyPreserveHost On
</VirtualHost>
```

### SSL/TLS (HTTPS)
Para certificados SSL automáticos em custom domains:

#### Certbot com DNS Challenge
```bash
certbot certonly --manual --preferred-challenges dns -d *.seudominio.com
```

Ou use um serviço como **Cloudflare** que fornece SSL automático para qualquer domínio apontado.

---

## 🧪 Testes

### 1. Testar Solicitação (Cliente)
```bash
curl -X POST http://localhost:5000/api/client/domains/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"requestedDomain": "teste.com.br"}'
```

### 2. Testar Listagem (Admin)
```bash
curl http://localhost:5000/api/admin/custom-domains \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

### 3. Testar Aprovação (Admin)
```bash
curl -X PUT http://localhost:5000/api/admin/custom-domains/ID_DO_DOMINIO/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{"status": 1}'
```

### 4. Testar Identificação por Domínio
1. Adicione um domínio aprovado (status=1) para uma empresa
2. Acesse o domínio no navegador
3. O sistema deve identificar a empresa automaticamente

---

## 🐛 Troubleshooting

### Problema: Email não está sendo enviado
**Solução:**
1. Verificar configurações SMTP no `.env`
2. Ver logs do console: `⚠️ [EMAIL] SMTP não configurado`
3. Testar credenciais SMTP manualmente
4. Verificar se a porta SMTP está aberta no firewall

### Problema: Domínio não funciona após aprovação
**Solução:**
1. Verificar DNS: `nslookup dominio.com`
2. Confirmar que status = 1 no banco de dados
3. Ver logs: `🌐 [DOMAIN-MIDDLEWARE]`
4. Aguardar propagação DNS (até 48h)

### Problema: Erro ao criar tabela
**Solução:**
```sql
-- Verificar se a tabela existe
SHOW TABLES LIKE 'company_custom_domains';

-- Se não existir, executar migration manualmente
SOURCE migrations/create_company_custom_domains.sql;
```

### Problema: Frontend não carrega páginas
**Solução:**
1. Verificar se as rotas foram adicionadas no `App.tsx`
2. Verificar se os links foram adicionados no `sidebar.tsx`
3. Limpar cache do navegador
4. Rebuild do frontend: `npm run build`

---

## 📊 Status dos Domínios

| Status | Valor | Nome | Descrição |
|--------|-------|------|-----------|
| 🟡 | 0 | Pending | Aguardando aprovação do admin |
| 🟢 | 1 | Connected | Aprovado e funcionando |
| 🔴 | 2 | Rejected | Rejeitado pelo admin |
| ⚫ | 3 | Removed | Removido pelo admin |

---

## 🚀 Próximos Passos Recomendados

1. **Executar a migration** do banco de dados
2. **Configurar SMTP** no `.env`
3. **Testar solicitação** de domínio como cliente
4. **Testar aprovação** como admin
5. **Configurar DNS** wildcard ou por domínio
6. **Implementar SSL** automático (opcional)

---

## 📝 Checklist de Implementação

- [x] Schema Drizzle criado
- [x] Migration SQL criada
- [x] Métodos no storage.ts
- [x] Serviço de email implementado
- [x] Middleware de identificação por domínio
- [x] Endpoints API (cliente e admin)
- [x] Interface frontend cliente
- [x] Interface frontend admin
- [x] Rotas adicionadas
- [x] Links no sidebar
- [ ] Migration executada no banco
- [ ] SMTP configurado
- [ ] Testado em ambiente local
- [ ] DNS configurado em produção
- [ ] SSL configurado (opcional)

---

## 📞 Suporte

Se você encontrar problemas:
1. Verifique os logs do servidor
2. Verifique o console do navegador
3. Consulte este guia de troubleshooting
4. Revise os arquivos criados

---

**Implementado com sucesso! 🎉**

Data: 2025-10-31
Versão: 1.0
