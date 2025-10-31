# 📖 Documentação Completa: Sistema de Domínios Customizados

**Sistema Multi-Tenant de Domínios Personalizados**
Versão: 1.0
Data: 2025-10-31

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Fluxo Completo](#fluxo-completo)
5. [Componentes do Sistema](#componentes-do-sistema)
6. [Funções Helper](#funções-helper)
7. [Roteamento](#roteamento)
8. [Permissões e Pacotes](#permissões-e-pacotes)
9. [Notificações por E-mail](#notificações-por-e-mail)
10. [Configuração DNS](#configuração-dns)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### O Que É?

O sistema permite que **tenants** (usuários que assinam planos) conectem seus **próprios domínios** aos seus sites de imóveis, substituindo o domínio padrão do sistema.

### Tipos de URL Suportados

1. **Path-Based URL** (Padrão)
   - Formato: `example.com/{username}`
   - Exemplo: `alugamais.com/joaosilva`

2. **Subdomain** (Subdomínio)
   - Formato: `{username}.example.com`
   - Exemplo: `joaosilva.alugamais.com`

3. **Custom Domain** (Domínio Customizado) ⭐
   - Formato: `qualquerdominio.com`
   - Exemplo: `imoveisjoao.com.br`

---

## 🏗️ Arquitetura do Sistema

### Estados de um Domínio Customizado

```
┌─────────────────┐
│ 0 - PENDING     │ → Aguardando aprovação do admin
│ (Pendente)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 1 - CONNECTED   │ → Aprovado e funcionando
│ (Conectado)     │ → DOMÍNIO ATIVO DO TENANT
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 2 - REJECTED    │ → Rejeitado pelo admin
│ (Rejeitado)     │
└─────────────────┘

┌─────────────────┐
│ 3 - REMOVED     │ → Removido pelo admin
│ (Removido)      │
└─────────────────┘
```

### Diagrama de Fluxo

```
┌──────────────┐
│   TENANT     │
│  Solicita    │
│   Domínio    │
└──────┬───────┘
       │
       │ Preenche: "meusite.com"
       │
       ↓
┌──────────────────────────────────┐
│ DomainController::domainrequest  │
│                                   │
│ 1. Valida formato                │
│ 2. Verifica se não é atual       │
│ 3. Cria registro (status=0)      │
└──────────────┬───────────────────┘
               │
               │ Salva no banco
               │
               ↓
┌──────────────────────────────┐
│  user_custom_domains         │
│  ├─ user_id: 123             │
│  ├─ requested_domain: ...    │
│  ├─ current_domain: ...      │
│  └─ status: 0 (PENDING)      │
└──────────────┬───────────────┘
               │
               │ Admin visualiza
               │
               ↓
┌──────────────────────────────────┐
│         ADMIN PANEL              │
│  /admin/domains                  │
│                                  │
│  [Aprovar] [Rejeitar] [Remover] │
└──────────────┬───────────────────┘
               │
               │ Aprova: status = 1
               │
               ↓
┌──────────────────────────────────┐
│ CustomDomainController::status   │
│                                   │
│ 1. Atualiza status                │
│ 2. Envia e-mail ao tenant        │
│ 3. Domínio passa a ser usado     │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│   🌐 DOMÍNIO ATIVO               │
│   meusite.com → Tenant #123      │
└──────────────────────────────────┘
```

---

## 💾 Estrutura do Banco de Dados

### Tabela: `user_custom_domains`

```sql
CREATE TABLE `user_custom_domains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `requested_domain` varchar(255) DEFAULT NULL,
  `current_domain` varchar(255) DEFAULT NULL,
  `status` tinyint(4) NOT NULL COMMENT '0-Pending, 1-Connected, 2-Rejected, 3-Removed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | Identificador único |
| `user_id` | int | ID do tenant (relacionamento com `users.id`) |
| `requested_domain` | varchar(255) | Domínio solicitado pelo tenant |
| `current_domain` | varchar(255) | Domínio atual do tenant (antes da solicitação) |
| `status` | tinyint | 0=Pendente, 1=Conectado, 2=Rejeitado, 3=Removido |
| `created_at` | timestamp | Data da solicitação |
| `updated_at` | timestamp | Última atualização |

### Exemplo de Registro

```sql
INSERT INTO `user_custom_domains` VALUES
(21, 148, 'residia.xyz', '0', 1, '2025-05-09 07:00:38', '2025-05-09 07:00:53');
```

**Interpretação:**
- Tenant ID 148 solicitou o domínio `residia.xyz`
- Status 1 = Conectado (aprovado)
- Agora o site do tenant é acessível em `residia.xyz`

---

## 🔄 Fluxo Completo

### 📝 Etapa 1: Tenant Solicita Domínio

**Localização:** `/user/domains`

#### View
**Arquivo:** [resources/views/user/domains.blade.php](resources/views/user/domains.blade.php)

**Elementos Principais:**

1. **Botão de Solicitação** (linha 115):
```blade
@if (empty($rcDomain) || $rcDomain->status != 0)
    <button class="btn btn-primary" data-toggle="modal" data-target="#customDomainModal">
        {{ __('Request Custom Domain') }}
    </button>
@endif
```

2. **Modal de Solicitação** (linha 35-92):
```blade
<form action="{{ route('user-domain-request') }}" method="POST">
    @csrf
    <div class="form-group">
        <label>{{ __('Custom Domain') }}</label>
        <input type="text" class="form-control" name="custom_domain"
            placeholder="example.com" required>
        <p class="text-secondary">
            <i class="fas fa-exclamation-circle"></i>
            {{ __('Do not use') }} <strong>http://</strong> {{ __('or') }} <strong>https://</strong>
        </p>
    </div>
</form>
```

3. **Aviso de Domínio Existente** (linha 47-60):
```blade
@if (Auth::user()->custom_domains()->where('status', 1)->count() > 0)
    <div class="alert alert-warning">
        {{ __('You already have a custom domain') }}
        (<a href="//{{ getCdomain(Auth::user()) }}">{{ getCdomain(Auth::user()) }}</a>)
        {{ __('connected with your portfolio website') }}
    </div>
@endif
```

4. **Tabela de Domínios** (linha 130-164):
```blade
<table class="table table-striped mt-3">
    <thead>
        <tr>
            <th>{{ __('Requested Domain') }}</th>
            <th>{{ __('Current Domain') }}</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                @if ($rcDomain->status == 0)
                    <a href="//{{ $rcDomain->requested_domain }}">
                        {{ $rcDomain->requested_domain }}
                    </a>
                @else
                    -
                @endif
            </td>
            <td>
                @if (getCdomain(Auth::user()))
                    <a href="//{{ getCdomain(Auth::user()) }}">
                        {{ getCdomain(Auth::user()) }}
                    </a>
                @else
                    -
                @endif
            </td>
        </tr>
    </tbody>
</table>
```

#### Controller
**Arquivo:** [app/Http/Controllers/User/DomainController.php](app/Http/Controllers/User/DomainController.php)

**Método 1: `domains()`** - Exibe a página (linha 14-19)
```php
public function domains(Request $request)
{
    // Busca o último domínio solicitado ou conectado
    $rcDomain = UserCustomDomain::where('status', '<>', 2) // Status diferente de "rejeitado"
        ->where('user_id', Auth::user()->id)
        ->orderBy('id', 'DESC')
        ->first();

    $data['rcDomain'] = $rcDomain;
    return view('user.domains', $data);
}
```

**Método 2: `domainrequest()`** - Processa a solicitação (linha 29-55)
```php
public function domainrequest(Request $request)
{
    // Busca mensagens configuradas pelo admin
    $be = BasicExtended::select('domain_request_success_message', 'cname_record_section_title')->first();

    // Validação
    $rules = [
        'custom_domain' => [
            'required',
            function ($attribute, $value, $fail) use ($be) {
                // Verifica se não está solicitando o domínio atual
                if (getCdomain(Auth::user()) == $value) {
                    $fail('You cannot request your current domain.');
                }
            }
        ]
    ];

    $request->validate($rules);

    // Cria o registro
    $cdomain = new UserCustomDomain;
    $cdomain->user_id = Auth::user()->id;
    $cdomain->requested_domain = $request->custom_domain;
    $cdomain->current_domain = getCdomain(Auth::user());
    $cdomain->status = 0; // PENDING
    $cdomain->save();

    Session::flash('domain-success', $be->domain_request_success_message);
    return back();
}
```

**Método Helper: `isValidDomain()`** (linha 21-26)
```php
public function isValidDomain($domain_name)
{
    return (preg_match("/^([a-zd](-*[a-zd])*)(.([a-zd](-*[a-zd])*))*$/i", $domain_name) // valid chars
        && preg_match("/^.{1,253}$/", $domain_name) // overall length check
        && preg_match("/^[^.]{1,63}(.[^.]{1,63})*$/", $domain_name)); // label length
}
```

---

### 👨‍💼 Etapa 2: Admin Visualiza Solicitações

**Localização:** `/admin/domains`

#### View
**Arquivo:** [resources/views/admin/domains/custom.blade.php](resources/views/admin/domains/custom.blade.php)

**Elementos Principais:**

1. **Filtros de Busca** (linha 40-52):
```blade
<form action="{{ request()->url() }}" class="float-right d-flex">
    <input name="username" class="form-control" type="text"
        placeholder="{{ __('Search by Username') }}"
        value="{{ request()->input('username') }}">
    <input name="domain" class="form-control" type="text"
        placeholder="{{ __('Search by Domain') }}"
        value="{{ request()->input('domain') }}">
</form>
```

2. **Tabela de Solicitações** (linha 63-164):
```blade
<table class="table table-striped mt-3">
    <thead>
        <tr>
            <th><input type="checkbox" class="bulk-check" data-val="all"></th>
            <th>{{ __('Username') }}</th>
            <th>{{ __('Requested Domain') }}</th>
            <th>{{ __('Current Domain') }}</th>
            <th>{{ __('Status') }}</th>
            <th>{{ __('Action') }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($rcDomains as $rcDomain)
            <tr>
                <td>
                    <input type="checkbox" class="bulk-check" data-val="{{ $rcDomain->id }}">
                </td>
                <td>
                    <a href="{{ route('register.user.view', $rcDomain->user->id) }}">
                        {{ $rcDomain->user->username }}
                    </a>
                </td>
                <td>
                    <a href="//{{ $rcDomain->requested_domain }}">
                        {{ $rcDomain->requested_domain }}
                    </a>
                </td>
                <td>
                    <a href="//{{ $rcDomain->current_domain }}">
                        {{ $rcDomain->current_domain }}
                    </a>
                </td>
                <td>
                    <!-- DROPDOWN DE STATUS -->
                    <form id="statusForm{{ $rcDomain->id }}"
                          action="{{ route('admin.custom-domain.status') }}"
                          method="POST">
                        @csrf
                        <input type="hidden" name="domain_id" value="{{ $rcDomain->id }}">
                        <select name="status"
                            class="form-control
                            @if ($rcDomain->status == 0) bg-warning text-white
                            @elseif($rcDomain->status == 1) bg-success text-white
                            @elseif($rcDomain->status == 2) bg-danger text-white
                            @elseif($rcDomain->status == 3) bg-dark text-white @endif"
                            onchange="document.getElementById('statusForm{{ $rcDomain->id }}').submit();">
                            <option value="0" {{ $rcDomain->status == 0 ? 'selected' : '' }}>
                                {{ __('Pending') }}
                            </option>
                            <option value="1" {{ $rcDomain->status == 1 ? 'selected' : '' }}>
                                {{ __('Connected') }}
                            </option>
                            <option value="2" {{ $rcDomain->status == 2 ? 'selected' : '' }}>
                                {{ __('Rejected') }}
                            </option>
                            <option value="3" {{ $rcDomain->status == 3 ? 'selected' : '' }}>
                                {{ __('Removed') }}
                            </option>
                        </select>
                    </form>
                </td>
                <td>
                    <!-- Botão de E-mail -->
                    <button class="btn btn-secondary btn-sm" data-toggle="modal"
                        data-target="#mailModal"
                        data-email="{{ $rcDomain->user->email }}">
                        {{ __('Mail') }}
                    </button>

                    <!-- Botão de Delete -->
                    <form class="d-inline-block deleteform"
                          action="{{ route('admin.custom-domain.delete') }}"
                          method="post">
                        @csrf
                        <input type="hidden" name="domain_id" value="{{ $rcDomain->id }}">
                        <button type="submit" class="btn btn-danger btn-sm deletebtn">
                            <i class="fas fa-trash"></i> {{ __('Delete') }}
                        </button>
                    </form>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
```

3. **Modal de Envio de E-mail** (linha 176-221):
```blade
<div class="modal fade" id="mailModal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5>{{ __('Send Mail') }}</h5>
            </div>
            <div class="modal-body">
                <form id="ajaxEditForm" action="{{ route('admin.custom-domain.mail') }}" method="POST">
                    @csrf
                    <div class="form-group">
                        <label>{{ __('Email Address') }}</label>
                        <input id="inemail" type="text" class="form-control" name="email">
                    </div>
                    <div class="form-group">
                        <label>{{ __('Subject') }}</label>
                        <input id="insubject" type="text" class="form-control" name="subject">
                    </div>
                    <div class="form-group">
                        <label>{{ __('Message') }}</label>
                        <textarea id="inmessage" class="form-control summernote" name="message"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ __('Close') }}</button>
                <button id="updateBtn" type="button" class="btn btn-primary">{{ __('Send Mail') }}</button>
            </div>
        </div>
    </div>
</div>
```

#### Controller
**Arquivo:** [app/Http/Controllers/Admin/CustomDomainController.php](app/Http/Controllers/Admin/CustomDomainController.php)

**Método 1: `index()`** - Lista domínios (linha 42-70)
```php
public function index(Request $request)
{
    $rcDomains = UserCustomDomain::orderBy('id', 'DESC')
        // Filtro por domínio
        ->when($request->domain, function ($query) use ($request) {
            return $query->where(function ($query) use ($request) {
                $query->where('current_domain', 'LIKE', '%' . $request->domain . '%')
                    ->orWhere('requested_domain', 'LIKE', '%' . $request->domain . '%');
            });
        })
        // Filtro por username
        ->when($request->username, function ($query) use ($request) {
            return $query->whereHas('user', function ($query) use ($request) {
                $query->where('username', $request->username);
            });
        });

    // Filtro por tipo
    if (empty($request->type)) {
        $rcDomains = $rcDomains->paginate(10);
    } elseif ($request->type == 'pending') {
        $rcDomains = $rcDomains->where('status', 0)->paginate(10);
    } elseif ($request->type == 'connected') {
        $rcDomains = $rcDomains->where('status', 1)->paginate(10);
    } elseif ($request->type == 'rejected') {
        $rcDomains = $rcDomains->where('status', 2)->paginate(10);
    }

    $data['rcDomains'] = $rcDomains;
    return view('admin.domains.custom', $data);
}
```

---

### ✅ Etapa 3: Admin Aprova/Rejeita Domínio

#### Controller
**Arquivo:** [app/Http/Controllers/Admin/CustomDomainController.php](app/Http/Controllers/Admin/CustomDomainController.php)

**Método: `status()`** - Atualiza status (linha 72-133)
```php
public function status(Request $request)
{
    // Busca o domínio
    $rcDomain = UserCustomDomain::findOrFail($request->domain_id);

    // Atualiza o status
    $rcDomain->status = $request->status;
    $rcDomain->save();

    // Se foi APROVADO (status = 1)
    if ($request->status == 1) {
        if (!empty($rcDomain->user)) {
            $user = $rcDomain->user;
            $bs = BasicSetting::firstOrFail();

            // Envia e-mail de aprovação
            $mailer = new MegaMailer();
            $data = [
                'toMail' => $user->email,
                'toName' => $user->fname,
                'username' => $user->username,
                'requested_domain' => $rcDomain->requested_domain,
                'previous_domain' => !empty($rcDomain->current_domain) ? $rcDomain->current_domain : 'Not Available',
                'website_title' => $bs->website_title,
                'templateType' => 'custom_domain_connected',
                'type' => 'customDomainConnected'
            ];
            $mailer->mailFromAdmin($data);
        }
    }
    // Se foi REJEITADO (status = 2)
    elseif ($request->status == 2) {
        if (!empty($rcDomain->user)) {
            $user = $rcDomain->user;

            // Verifica se há outro domínio conectado
            $currDomCount = $user->custom_domains()->where('status', 1)->count();
            if ($currDomCount > 0) {
                $currDom = $user->custom_domains()->where('status', 1)->orderBy('id', 'DESC')->first()->requested_domain;
            }

            $bs = BasicSetting::firstOrFail();

            // Envia e-mail de rejeição
            $mailer = new MegaMailer();
            $data = [
                'toMail' => $user->email,
                'toName' => $user->fname,
                'username' => $user->username,
                'requested_domain' => $rcDomain->requested_domain,
                'current_domain' => !empty($currDom) ? $currDom : 'Not Available',
                'website_title' => $bs->website_title,
                'templateType' => 'custom_domain_rejected',
                'type' => 'customDomainRejected'
            ];
            $mailer->mailFromAdmin($data);
        }
    }

    $request->session()->flash('success', __('Updated successfully!'));
    return back();
}
```

**Método: `mail()`** - Envia e-mail customizado (linha 136-201)
```php
public function mail(Request $request)
{
    $rules = [
        'email' => 'required',
        'subject' => 'required',
        'message' => 'required'
    ];

    $validator = Validator::make($request->all(), $rules);
    if ($validator->fails()) {
        $validator->getMessageBag()->add('error', 'true');
        return response()->json($validator->errors());
    }

    $be = BasicExtended::first();
    $from = $be->from_mail;
    $sub = $request->subject;
    $msg = $request->message;
    $to = $request->email;

    // Configuração do PHPMailer
    $mail = new PHPMailer(true);

    if ($be->is_smtp == 1) {
        try {
            $mail->isSMTP();
            $mail->Host       = $be->smtp_host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $be->smtp_username;
            $mail->Password   = $be->smtp_password;
            $mail->SMTPSecure = $be->encryption;
            $mail->Port       = $be->smtp_port;

            $mail->setFrom($from);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $sub;
            $mail->Body    = $msg;

            $mail->send();
        } catch (\Exception $e) {
            // Log error
        }
    } else {
        try {
            $mail->setFrom($from);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $sub;
            $mail->Body    = $msg;

            $mail->send();
        } catch (\Exception $e) {
            // Log error
        }
    }

    Session::flash('success', __('Mail sent successfully!'));
    return "success";
}
```

**Método: `delete()`** - Deleta domínio (linha 203-208)
```php
public function delete(Request $request)
{
    UserCustomDomain::findOrFail($request->domain_id)->delete();
    $request->session()->flash('success', __('Deleted successfully!'));
    return redirect()->back();
}
```

**Método: `bulkDelete()`** - Deleta múltiplos (linha 210-219)
```php
public function bulkDelete(Request $request)
{
    $ids = $request->ids;

    foreach ($ids as $id) {
        UserCustomDomain::findOrFail($id)->delete();
    }

    $request->session()->flash('success', __('Deleted successfully!'));
    return "success";
}
```

---

## 🔧 Componentes do Sistema

### Model
**Arquivo:** [app/Models/User/UserCustomDomain.php](app/Models/User/UserCustomDomain.php)

```php
<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCustomDomain extends Model
{
    use HasFactory;

    protected $table = 'user_custom_domains';

    public function user()
    {
        return $this->belongsTo('App\Models\User');
    }
}
```

### Relationship no User Model
**Arquivo:** [app/Models/User.php](app/Models/User.php)

```php
public function custom_domains(): HasMany
{
    return $this->hasMany(UserCustomDomain::class);
}

public function user_custom_domains()
{
    return $this->hasMany(UserCustomDomain::class, 'user_id');
}
```

---

## 🛠️ Funções Helper

**Arquivo:** [app/Http/Helpers/Helper.php](app/Http/Helpers/Helper.php)

### 1. `getCdomain()` - Busca Domínio Conectado

```php
if (!function_exists('getCdomain')) {
    function getCdomain($user)
    {
        // Busca domínios com status "Connected" (1)
        $cdomains = $user->custom_domains()->where('status', 1);

        // Retorna o último domínio conectado ou false
        return $cdomains->count() > 0
            ? $cdomains->orderBy('id', 'DESC')->first()->requested_domain
            : false;
    }
}
```

**Uso:**
```php
$domain = getCdomain(Auth::user()); // Retorna: "meusite.com" ou false
```

---

### 2. `getUser()` - Identifica Tenant pela URL

```php
if (!function_exists('getUser')) {
    function getUser()
    {
        $parsedUrl = parse_url(url()->current());
        $host = $parsedUrl['host'];

        // Se a URL contém o domínio principal do sistema
        if (strpos($host, env('WEBSITE_HOST')) !== false) {
            $host = str_replace('www.', '', $host);

            // Se é URL baseada em path
            if ($host == env('WEBSITE_HOST')) {
                $path = explode('/', $parsedUrl['path']);
                $username = $path[1];
            }
            // Se é subdomain
            else {
                $hostArr = explode('.', $host);
                $username = $hostArr[0];
            }

            // Verifica se é subdomain ou path-based
            if (($host == $username . '.' . env('WEBSITE_HOST')) ||
                ($host . '/' . $username == env('WEBSITE_HOST') . '/' . $username)) {

                $user = User::where('username', $username)
                    ->where('online_status', 1)
                    ->where('status', 1)
                    ->whereHas('memberships', function ($q) {
                        $q->where('status', '=', 1)
                            ->where('start_date', '<=', Carbon::now()->format('Y-m-d'))
                            ->where('expire_date', '>=', Carbon::now()->format('Y-m-d'));
                    })
                    ->first();

                if (!empty($user)) {
                    return $user;
                }
            }
        }

        // ⭐ SE NÃO É SUBDOMAIN, VERIFICA SE É CUSTOM DOMAIN
        $customDomain = UserCustomDomain::where('requested_domain', $host)
            ->where('status', 1)
            ->first();

        if (!empty($customDomain)) {
            $user = $customDomain->user;

            // Valida status do usuário
            if ($user->online_status == 1 && $user->status == 1) {
                $hasMembership = $user->memberships()
                    ->where('status', 1)
                    ->where('start_date', '<=', Carbon::now()->format('Y-m-d'))
                    ->where('expire_date', '>=', Carbon::now()->format('Y-m-d'))
                    ->exists();

                if ($hasMembership && cPackageHasCdomain($user)) {
                    return $user;
                }
            }
        }

        return view('errors.404');
    }
}
```

**Fluxo de Identificação:**

```
URL: meusite.com
       ↓
getUser() chamado
       ↓
Não contém WEBSITE_HOST?
       ↓ SIM
Busca em user_custom_domains
WHERE requested_domain = 'meusite.com'
AND status = 1
       ↓
Encontrou? → Retorna User
Não encontrou? → 404
```

---

### 3. `getParam()` - Retorna Parâmetro de Rota

```php
if (!function_exists('getParam')) {
    function getParam()
    {
        $currentUrl = url()->current();
        $parsedUrl = parse_url($currentUrl);

        $host = isset($parsedUrl['host']) ? str_replace("www.", "", $parsedUrl['host']) : '';
        $path = isset($parsedUrl['path']) ? explode('/', trim($parsedUrl['path'], '/')) : [];

        $websiteHost = env('WEBSITE_HOST', '');

        // Se é path-based (example.com/{username})
        if (!empty($websiteHost) && $host === $websiteHost) {
            return isset($path[0]) ? $path[0] : null;
        }

        // Se é subdomain ou custom domain
        return $host ?: null;
    }
}
```

**Uso em Rotas:**
```php
Route::get('/properties', [PropertyController::class, 'index'])
    ->name('frontend.properties');

// URL: joaosilva.alugamais.com/properties
// getParam() → "joaosilva.alugamais.com"

// URL: meusite.com/properties
// getParam() → "meusite.com"

// URL: alugamais.com/joaosilva/properties
// getParam() → "joaosilva"
```

---

### 4. `cPackageHasCdomain()` - Verifica Permissão

```php
if (!function_exists('cPackageHasCdomain')) {
    function cPackageHasCdomain($user): bool
    {
        // Busca features do pacote atual
        $currPackageFeatures = UserPermissionHelper::packagePermission($user->id);
        $currPackageFeatures = json_decode($currPackageFeatures, true);

        // Verifica se inclui "Custom Domain"
        if (empty($currPackageFeatures) ||
            !is_array($currPackageFeatures) ||
            !in_array('Custom Domain', $currPackageFeatures)) {
            return false;
        }

        return true;
    }
}
```

**Uso:**
```blade
@if (cPackageHasCdomain(Auth::user()))
    <button>Request Custom Domain</button>
@else
    <p>Upgrade your plan to use custom domains</p>
@endif
```

---

## 🌐 Roteamento

### Arquivo de Rotas Tenant Frontend
**Arquivo:** [routes/tenant_frontend.php](routes/tenant_frontend.php) (linhas 1-35)

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserFrontend\HomePageController;
// ...outros imports

$domain = env('WEBSITE_HOST');
$parsedUrl = parse_url(url()->current());

$host = str_replace("www.", "", $parsedUrl['host']);

if (array_key_exists('host', $parsedUrl)) {
    // ⭐ Se é URL baseada em path
    if ($host == env('WEBSITE_HOST')) {
        $domain = $domain;
        $prefix = '/{username}'; // Adiciona /{username} nas rotas
    }
    // ⭐ Se é subdomain ou custom domain
    else {
        if (!app()->runningInConsole()) {
            if (substr($_SERVER['HTTP_HOST'], 0, 4) === 'www.') {
                $domain = 'www.{domain}';
            } else {
                $domain = '{domain}';
            }
        }
        $prefix = ''; // Sem prefix nas rotas
    }
}

// Registra as rotas com domain e prefix dinâmicos
Route::group(['domain' => $domain, 'prefix' => $prefix, 'middleware' => 'userMaintenance'], function () {
    Route::middleware(['frontend.language'])->name('frontend.')->group(function () {

        Route::get('/', [HomePageController::class, 'index'])->name('user.index');
        Route::get('/properties', [PropertyController::class, 'index'])->name('properties');
        // ...outras rotas

    });
});
```

### Como Funciona

#### Exemplo 1: Path-Based URL
```
URL: alugamais.com/joaosilva
       ↓
$host = "alugamais.com"
$host == WEBSITE_HOST? → SIM
       ↓
$domain = "alugamais.com"
$prefix = "/{username}"
       ↓
Rotas geradas:
- alugamais.com/{username}/
- alugamais.com/{username}/properties
- alugamais.com/{username}/contact
```

#### Exemplo 2: Subdomain
```
URL: joaosilva.alugamais.com
       ↓
$host = "joaosilva.alugamais.com"
$host == WEBSITE_HOST? → NÃO
       ↓
$domain = "{domain}"
$prefix = ""
       ↓
Rotas geradas:
- {domain}/
- {domain}/properties
- {domain}/contact
       ↓
Laravel resolve {domain} = "joaosilva.alugamais.com"
```

#### Exemplo 3: Custom Domain ⭐
```
URL: meusite.com
       ↓
$host = "meusite.com"
$host == WEBSITE_HOST? → NÃO
       ↓
$domain = "{domain}"
$prefix = ""
       ↓
Rotas geradas:
- {domain}/
- {domain}/properties
- {domain}/contact
       ↓
Laravel resolve {domain} = "meusite.com"
       ↓
getUser() identifica tenant via custom_domains
```

---

## 🔐 Permissões e Pacotes

### Verificação de Permissão

O sistema verifica se o pacote do tenant inclui "Custom Domain":

```php
// Helper: cPackageHasCdomain()
$currPackageFeatures = UserPermissionHelper::packagePermission($user->id);
$currPackageFeatures = json_decode($currPackageFeatures, true);

// Exemplo de $currPackageFeatures:
[
    "Custom Domain",
    "Subdomain",
    "Advertisement",
    "Property Management",
    // ...
]
```

### Middleware de Verificação

**Arquivo:** `app/Http/Middleware/CheckUserPackageLimits.php`

```php
public function handle($request, Closure $next)
{
    $user = Auth::user();

    if (!cPackageHasCdomain($user)) {
        return redirect()->route('user-dashboard')
            ->with('error', 'Your package does not include Custom Domain feature.');
    }

    return $next($request);
}
```

### Rotas Protegidas

**Arquivo:** [routes/tenant.php:442-445](routes/tenant.php#L442-L445)

```php
Route::controller(DomainController::class)
    ->middleware('checkUserPermission:Custom Domain')
    ->group(function () {
        Route::get('/domains', 'domains')->name('user-domains');
        Route::post('/request/domain', 'domainrequest')->name('user-domain-request');
    });
```

---

## 📧 Notificações por E-mail

### Templates de E-mail

**Localização:** `app/Services/Mail/MegaMailer.php`

#### 1. E-mail de Aprovação (status = 1)
```php
$data = [
    'toMail' => $user->email,
    'toName' => $user->fname,
    'username' => $user->username,
    'requested_domain' => 'meusite.com',
    'previous_domain' => 'joaosilva.alugamais.com',
    'website_title' => 'AlugaMais',
    'templateType' => 'custom_domain_connected',
    'type' => 'customDomainConnected'
];
```

**Conteúdo do E-mail:**
```
Subject: Custom Domain Connected

Dear João,

Your custom domain "meusite.com" has been successfully connected to your website!

Previous domain: joaosilva.alugamais.com
New domain: meusite.com

Your website is now accessible at https://meusite.com

Best regards,
AlugaMais Team
```

#### 2. E-mail de Rejeição (status = 2)
```php
$data = [
    'toMail' => $user->email,
    'toName' => $user->fname,
    'username' => $user->username,
    'requested_domain' => 'meusite.com',
    'current_domain' => 'joaosilva.alugamais.com',
    'website_title' => 'AlugaMais',
    'templateType' => 'custom_domain_rejected',
    'type' => 'customDomainRejected'
];
```

**Conteúdo do E-mail:**
```
Subject: Custom Domain Request Rejected

Dear João,

Unfortunately, your custom domain request for "meusite.com" has been rejected.

Your current domain remains: joaosilva.alugamais.com

If you have questions, please contact our support team.

Best regards,
AlugaMais Team
```

---

## ⚙️ Configuração DNS

### O Que o Tenant Precisa Fazer

Quando um tenant solicita um domínio customizado, ele precisa configurar registros DNS:

#### Opção 1: CNAME Record (Recomendado)
```
Type: CNAME
Name: @  (ou www)
Value: alugamais.com
TTL: 3600
```

#### Opção 2: A Record
```
Type: A
Name: @
Value: [IP do servidor AlugaMais]
TTL: 3600
```

### Instruções Exibidas ao Tenant

**Arquivo:** [resources/views/user/domains.blade.php:171-178](resources/views/user/domains.blade.php#L171-L178)

```blade
<div class="card">
    <div class="card-header">
        <h4>{{ $be->cname_record_section_title }}</h4>
    </div>
    <div class="card-body">
        {!! $be->cname_record_section_text !!}
    </div>
</div>
```

### Configuração Admin

**Localização:** `/admin/custom-domain/texts`

**Arquivo:** [resources/views/admin/domains/custom-texts.blade.php](resources/views/admin/domains/custom-texts.blade.php)

```blade
<form action="{{ route('admin.custom-domain.texts') }}" method="POST">
    @csrf

    <div class="form-group">
        <label>Domain Request Success Message</label>
        <textarea name="success_message" class="form-control">
            {{ $abe->domain_request_success_message }}
        </textarea>
    </div>

    <div class="form-group">
        <label>CNAME Record Section Title</label>
        <input type="text" name="cname_record_section_title" class="form-control"
            value="{{ $abe->cname_record_section_title }}">
    </div>

    <div class="form-group">
        <label>CNAME Record Section Text</label>
        <textarea name="cname_record_section_text" class="form-control summernote">
            {{ $abe->cname_record_section_text }}
        </textarea>
    </div>

    <button type="submit" class="btn btn-primary">Update</button>
</form>
```

**Exemplo de Texto CNAME:**
```html
<h4>How to Connect Your Custom Domain</h4>
<ol>
    <li>Go to your domain registrar (GoDaddy, Namecheap, etc.)</li>
    <li>Access DNS settings</li>
    <li>Add a CNAME record:
        <ul>
            <li>Type: CNAME</li>
            <li>Name: @ or www</li>
            <li>Value: alugamais.com</li>
            <li>TTL: 3600</li>
        </ul>
    </li>
    <li>Wait 24-48 hours for DNS propagation</li>
    <li>After configuration, wait for admin approval</li>
</ol>

<p><strong>Note:</strong> DNS changes can take up to 48 hours to propagate globally.</p>
```

---

## 🐛 Troubleshooting

### Problema 1: Domínio Não Funciona Após Aprovação

**Sintomas:**
- Admin aprovou o domínio (status = 1)
- Tenant acessa `meusite.com` mas vê erro 404

**Causas Possíveis:**
1. DNS não propagado
2. Domínio não configurado corretamente
3. Servidor não aponta para o domínio

**Solução:**
```bash
# 1. Verificar DNS
nslookup meusite.com
# Deve retornar o IP correto ou CNAME

# 2. Verificar na tabela
SELECT * FROM user_custom_domains WHERE requested_domain = 'meusite.com';
# status deve ser 1

# 3. Verificar getUser()
// Adicionar log no Helper.php
Log::info('Custom Domain Check', [
    'host' => $host,
    'customDomain' => $customDomain
]);
```

---

### Problema 2: Tenant Não Consegue Solicitar Domínio

**Sintomas:**
- Botão "Request Custom Domain" não aparece
- Erro ao acessar `/user/domains`

**Causas Possíveis:**
1. Pacote não inclui "Custom Domain"
2. Middleware bloqueando acesso

**Solução:**
```php
// 1. Verificar pacote do tenant
$user = User::find($userId);
$hasPermission = cPackageHasCdomain($user);
// Deve retornar true

// 2. Verificar membership
$membership = $user->memberships()
    ->where('status', 1)
    ->where('start_date', '<=', now())
    ->where('expire_date', '>=', now())
    ->first();

if (!$membership) {
    // Tenant sem plano ativo
}

// 3. Verificar features do pacote
$package = Package::find($membership->package_id);
$features = json_decode($package->features, true);
// Deve conter "Custom Domain"
```

---

### Problema 3: E-mail Não Enviado

**Sintomas:**
- Admin aprova/rejeita domínio
- Tenant não recebe e-mail

**Causas Possíveis:**
1. SMTP mal configurado
2. Template de e-mail não existe
3. E-mail do tenant inválido

**Solução:**
```php
// 1. Testar SMTP
$be = BasicExtended::first();
// Verificar: smtp_host, smtp_username, smtp_password, smtp_port

// 2. Verificar template
// Arquivo: app/Services/Mail/MegaMailer.php
// Método: mailFromAdmin()

// 3. Testar manualmente
use App\Http\Helpers\MegaMailer;

$mailer = new MegaMailer();
$data = [
    'toMail' => 'teste@example.com',
    'toName' => 'Teste',
    'templateType' => 'custom_domain_connected',
    'type' => 'customDomainConnected'
];
$mailer->mailFromAdmin($data);
```

---

### Problema 4: Múltiplos Domínios Conectados

**Sintomas:**
- Tenant tem mais de um domínio com status = 1
- Comportamento inconsistente

**Causas:**
- Bug no sistema ou manipulação manual do banco

**Solução:**
```sql
-- Verificar domínios do tenant
SELECT * FROM user_custom_domains
WHERE user_id = 123 AND status = 1;

-- Se houver mais de 1, manter apenas o último
UPDATE user_custom_domains
SET status = 3
WHERE user_id = 123 AND status = 1 AND id NOT IN (
    SELECT MAX(id) FROM user_custom_domains
    WHERE user_id = 123 AND status = 1
);
```

---

## 📊 Resumo do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

1. TENANT:
   ├─ Acessa: /user/domains
   ├─ Preenche formulário: "meusite.com"
   ├─ Configura DNS (CNAME ou A Record)
   └─ Aguarda aprovação

2. SISTEMA:
   ├─ DomainController::domainrequest()
   ├─ Valida formato do domínio
   ├─ Cria registro (status = 0 - Pending)
   └─ Salva em: user_custom_domains

3. ADMIN:
   ├─ Acessa: /admin/domains
   ├─ Visualiza solicitação pendente
   ├─ Verifica configuração DNS
   └─ Altera status para:
       ├─ 1 (Connected) → Aprova
       ├─ 2 (Rejected) → Rejeita
       └─ 3 (Removed) → Remove

4. APROVAÇÃO (status = 1):
   ├─ CustomDomainController::status()
   ├─ Atualiza status no banco
   ├─ Envia e-mail ao tenant
   └─ Domínio passa a funcionar

5. FUNCIONAMENTO:
   ├─ Usuário acessa: meusite.com
   ├─ Routes: tenant_frontend.php
   │   └─ Domain: {domain} (wildcard)
   ├─ Helper: getUser()
   │   └─ Busca em custom_domains (status=1)
   └─ Retorna tenant correto
       └─ Site carrega normalmente

6. TENANT VISUALIZA:
   ├─ Acessa: /user/domains
   └─ Vê domínio conectado em "Current Domain"
```

---

## 🔒 Segurança

### Validações Implementadas

1. **Formato de Domínio:**
```php
public function isValidDomain($domain_name)
{
    return (preg_match("/^([a-zd](-*[a-zd])*)(.([a-zd](-*[a-zd])*))*$/i", $domain_name)
        && preg_match("/^.{1,253}$/", $domain_name)
        && preg_match("/^[^.]{1,63}(.[^.]{1,63})*$/", $domain_name));
}
```

2. **Domínio Duplicado:**
```php
function ($attribute, $value, $fail) use ($be) {
    if (getCdomain(Auth::user()) == $value) {
        $fail('You cannot request your current domain.');
    }
}
```

3. **Verificação de Pacote:**
```php
if (!cPackageHasCdomain($user)) {
    return redirect()->back()->with('error', 'Your package does not support custom domains');
}
```

4. **Status do Tenant:**
```php
if ($user->online_status == 1 && $user->status == 1) {
    // Tenant ativo
}
```

5. **Membership Válida:**
```php
$hasMembership = $user->memberships()
    ->where('status', 1)
    ->where('start_date', '<=', Carbon::now())
    ->where('expire_date', '>=', Carbon::now())
    ->exists();
```

---

## 📝 Checklist de Implementação

Para configurar um domínio customizado:

### Tenant
- [ ] Verificar se o pacote inclui "Custom Domain"
- [ ] Acessar `/user/domains`
- [ ] Solicitar domínio (formato: `domain.com` ou `www.domain.com`)
- [ ] Configurar DNS no registrador:
  - [ ] CNAME: @ → `alugamais.com`
  - [ ] OU A Record: @ → `[IP do servidor]`
- [ ] Aguardar propagação DNS (24-48h)
- [ ] Aguardar aprovação do admin

### Admin
- [ ] Acessar `/admin/domains`
- [ ] Verificar solicitação pendente
- [ ] Testar DNS: `nslookup domain.com`
- [ ] Aprovar (status = 1) ou Rejeitar (status = 2)
- [ ] Verificar se e-mail foi enviado
- [ ] Testar acesso ao domínio

### Sistema
- [ ] Verificar logs: `getUser()` identifica o tenant
- [ ] Testar roteamento: todas as páginas funcionam
- [ ] Validar SSL (se aplicável)
- [ ] Monitorar erros 404

---

## 🎓 Conclusão

O sistema de domínios customizados permite que tenants personalizem completamente suas URLs, oferecendo:

✅ **Profissionalismo:** Domínio próprio (meusite.com)
✅ **Branding:** Marca própria ao invés de subdomain
✅ **SEO:** Melhor posicionamento nos buscadores
✅ **Controle:** Tenant gerencia seu próprio DNS
✅ **Flexibilidade:** Aprovação manual pelo admin

### Arquivos Principais

| Tipo | Arquivo | Descrição |
|------|---------|-----------|
| **Controller (Tenant)** | `app/Http/Controllers/User/DomainController.php` | Solicitação de domínios |
| **Controller (Admin)** | `app/Http/Controllers/Admin/CustomDomainController.php` | Aprovação/rejeição |
| **Model** | `app/Models/User/UserCustomDomain.php` | Modelo de dados |
| **View (Tenant)** | `resources/views/user/domains.blade.php` | Interface do tenant |
| **View (Admin)** | `resources/views/admin/domains/custom.blade.php` | Interface do admin |
| **Helper** | `app/Http/Helpers/Helper.php` | Funções auxiliares |
| **Routes** | `routes/tenant_frontend.php` | Roteamento dinâmico |
| **Routes** | `routes/tenant.php` | Rotas do dashboard |
| **Migration** | `user_custom_domains` | Estrutura do banco |

---

**Documentação criada em:** 2025-10-31
**Versão do Laravel:** 11.x
**Versão do Sistema:** Multi-Tenant Real Estate SaaS
