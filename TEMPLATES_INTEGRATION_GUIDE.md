# 🎨 Guia de Integração: Templates Existentes no Sistema

**Objetivo**: Integrar seus 2 templates existentes no sistema de domínios customizados
**Tecnologia**: React + TailwindCSS (mesma stack do sistema)

---

## 📋 Índice

1. [Visão Geral da Integração](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Adaptação dos Templates](#adaptação-dos-templates)
4. [Interface de Props](#interface-de-props)
5. [Registro dos Templates](#registro-dos-templates)
6. [Mapeamento Template → Componente](#mapeamento)
7. [Renderização SSR](#renderização-ssr)
8. [Exemplo Prático](#exemplo-prático)
9. [Checklist de Integração](#checklist)

---

## 🎯 Visão Geral da Integração

### Como Funciona
```
Templates Existentes (2 sites React)
            ↓
Copiar para: client/src/templates/
            ↓
Adaptar para receber props dinâmicas
            ↓
Admin cadastra no banco (metadados)
            ↓
Sistema mapeia template_id → componente
            ↓
Cliente escolhe template e personaliza
            ↓
Visitante acessa domínio customizado
            ↓
Sistema renderiza template com dados da empresa
```

---

## 📁 Estrutura de Diretórios

### Criar Pasta de Templates
```
client/src/
├── templates/                    ← CRIAR
│   ├── index.ts                  ← Registro de todos os templates
│   ├── TemplateBase.tsx          ← Interface base (props comuns)
│   │
│   ├── Template01Premium/        ← Seu template 1
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── Hero.tsx
│   │   │   ├── Properties.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Contact.tsx
│   │   │   └── Footer.tsx
│   │   └── styles.css (se necessário)
│   │
│   └── Template02Modern/         ← Seu template 2
│       ├── index.tsx
│       └── components/
│           └── ...
```

---

## 🔧 Adaptação dos Templates

### Passo 1: Interface Base de Props

Crie `client/src/templates/TemplateBase.tsx`:

```typescript
import { Property, Company, WhatsappInstance } from "@shared/schema";

// Configuração que a empresa pode personalizar
export interface TemplateConfig {
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    showSearchBar?: boolean;
  };

  // Identidade Visual
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };

  // Sobre Section
  about: {
    show: boolean;
    title: string;
    text: string;
    image?: string;
  };

  // Imóveis Section
  properties: {
    show: boolean;
    title: string;
    maxDisplay: number;  // 6, 9, 12
    layout: "grid" | "list";
  };

  // Contato Section
  contact: {
    show: boolean;
    title: string;
    showForm: boolean;
    showMap: boolean;
    mapLatitude?: number;
    mapLongitude?: number;
  };

  // WhatsApp
  whatsapp: {
    show: boolean;
    message: string;  // Mensagem pré-preenchida
  };

  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// Props que TODO template recebe
export interface TemplateProps {
  config: TemplateConfig;
  company: Company;
  properties: Property[];
  whatsappInstance?: WhatsappInstance;
}

// Componente base que outros templates podem estender
export interface TemplateComponent extends React.FC<TemplateProps> {
  displayName: string;
  thumbnail: string;  // URL do preview
  description: string;
}
```

---

### Passo 2: Adaptar Seu Template Existente

**ANTES (template fixo):**
```tsx
// Seu template original
function MeuTemplatePremium() {
  return (
    <div className="min-h-screen">
      {/* Hero fixo */}
      <section
        className="h-screen bg-blue-600"
        style={{backgroundImage: "url('/hero-bg.jpg')"}}
      >
        <h1 className="text-5xl">Imóveis Premium</h1>
        <p className="text-xl">Encontre seu lar ideal</p>
      </section>

      {/* Imóveis fixos */}
      <section className="py-20">
        <h2>Nossos Imóveis</h2>
        {/* Lista hardcoded de imóveis */}
      </section>

      {/* Contato fixo */}
      <section>
        <h2>Contato</h2>
        <p>Email: contato@exemplo.com</p>
      </section>
    </div>
  );
}
```

**DEPOIS (template dinâmico):**
```tsx
// client/src/templates/Template01Premium/index.tsx
import { TemplateProps } from "../TemplateBase";
import Hero from "./components/Hero";
import Properties from "./components/Properties";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

export default function Template01Premium({
  config,
  company,
  properties,
  whatsappInstance
}: TemplateProps) {
  return (
    <div className="min-h-screen">
      {/* Hero dinâmico */}
      <Hero
        title={config.hero.title}
        subtitle={config.hero.subtitle}
        backgroundImage={config.hero.backgroundImage}
        primaryColor={config.branding.primaryColor}
      />

      {/* Sobre (se habilitado) */}
      {config.about.show && (
        <About
          title={config.about.title}
          text={config.about.text}
          image={config.about.image}
        />
      )}

      {/* Imóveis (se habilitado) */}
      {config.properties.show && (
        <Properties
          title={config.properties.title}
          properties={properties.slice(0, config.properties.maxDisplay)}
          layout={config.properties.layout}
          primaryColor={config.branding.primaryColor}
        />
      )}

      {/* Contato (se habilitado) */}
      {config.contact.show && (
        <Contact
          title={config.contact.title}
          company={company}
          showForm={config.contact.showForm}
          showMap={config.contact.showMap}
          mapLatitude={config.contact.mapLatitude}
          mapLongitude={config.contact.mapLongitude}
        />
      )}

      {/* Footer */}
      <Footer
        company={company}
        primaryColor={config.branding.primaryColor}
      />

      {/* WhatsApp flutuante (se habilitado) */}
      {config.whatsapp.show && whatsappInstance && (
        <WhatsAppButton
          phone={whatsappInstance.phone}
          message={config.whatsapp.message}
          primaryColor={config.branding.primaryColor}
        />
      )}
    </div>
  );
}

// Metadados do template
Template01Premium.displayName = "Imobiliária Premium";
Template01Premium.thumbnail = "/templates/thumbs/premium.jpg";
Template01Premium.description = "Template moderno com foco em conversão e captura de leads";
```

---

### Passo 3: Componentes Reutilizáveis

**Exemplo: Hero Component**
```tsx
// client/src/templates/Template01Premium/components/Hero.tsx
interface HeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  primaryColor: string;
}

export default function Hero({ title, subtitle, backgroundImage, primaryColor }: HeroProps) {
  return (
    <section
      className="relative h-screen flex items-center justify-center"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        style={{ backgroundColor: `${primaryColor}80` }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          {subtitle}
        </p>
        <button
          className="px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
          style={{ backgroundColor: primaryColor }}
        >
          Ver Imóveis
        </button>
      </div>
    </section>
  );
}
```

**Exemplo: Properties Component**
```tsx
// client/src/templates/Template01Premium/components/Properties.tsx
import { Property } from "@shared/schema";

interface PropertiesProps {
  title: string;
  properties: Property[];
  layout: "grid" | "list";
  primaryColor: string;
}

export default function Properties({ title, properties, layout, primaryColor }: PropertiesProps) {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl font-bold text-center mb-12">{title}</h2>

        <div className={layout === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          : "space-y-8"
        }>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertyCard({ property, primaryColor }: { property: Property; primaryColor: string }) {
  const mainImage = Array.isArray(property.images) && property.images.length > 0
    ? property.images[0]
    : '/placeholder-property.jpg';

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
      {/* Imagem */}
      <div className="h-64 overflow-hidden">
        <img
          src={mainImage}
          alt={property.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-300"
        />
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{property.name}</h3>
        <p className="text-gray-600 mb-4">
          {property.neighborhood}, {property.city} - {property.state}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span>🛏️ {property.bedrooms} quartos</span>
          <span>🚿 {property.bathrooms} banheiros</span>
          <span>📐 {property.privateArea}m²</span>
        </div>

        <button
          className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition"
          style={{ backgroundColor: primaryColor }}
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
```

**Exemplo: WhatsApp Button**
```tsx
// client/src/templates/Template01Premium/components/WhatsAppButton.tsx
interface WhatsAppButtonProps {
  phone?: string;
  message: string;
  primaryColor: string;
}

export default function WhatsAppButton({ phone, message, primaryColor }: WhatsAppButtonProps) {
  if (!phone) return null;

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition flex items-center justify-center z-50"
      style={{ backgroundColor: primaryColor }}
      aria-label="Falar no WhatsApp"
    >
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </button>
  );
}
```

---

## 📝 Registro dos Templates

### Arquivo: `client/src/templates/index.ts`

```typescript
import { TemplateComponent } from "./TemplateBase";
import Template01Premium from "./Template01Premium";
import Template02Modern from "./Template02Modern";

// Mapeamento: component_name → Componente React
export const TEMPLATES_MAP: Record<string, TemplateComponent> = {
  "Template01Premium": Template01Premium,
  "Template02Modern": Template02Modern,
};

// Lista de templates disponíveis (para exibir na galeria)
export const AVAILABLE_TEMPLATES: Array<{
  componentName: string;
  displayName: string;
  thumbnail: string;
  description: string;
}> = [
  {
    componentName: "Template01Premium",
    displayName: Template01Premium.displayName,
    thumbnail: Template01Premium.thumbnail,
    description: Template01Premium.description,
  },
  {
    componentName: "Template02Modern",
    displayName: Template02Modern.displayName,
    thumbnail: Template02Modern.thumbnail,
    description: Template02Modern.description,
  },
];

// Função helper para buscar template pelo nome
export function getTemplateByName(componentName: string): TemplateComponent | undefined {
  return TEMPLATES_MAP[componentName];
}
```

---

## 🗄️ Banco de Dados

### Cadastro Manual dos Templates

Como você já tem os templates, o admin não precisa "criar" os templates - ele só precisa **cadastrá-los no banco**.

**SQL para inserir seus 2 templates:**
```sql
INSERT INTO website_templates (id, name, description, thumbnail, component_name, category, is_active) VALUES
('template-01-uuid', 'Imobiliária Premium', 'Template moderno com foco em conversão e captura de leads', '/templates/thumbs/premium.jpg', 'Template01Premium', 'imobiliaria', true),
('template-02-uuid', 'Imobiliária Modern', 'Template minimalista e elegante', '/templates/thumbs/modern.jpg', 'Template02Modern', 'imobiliaria', true);
```

---

## 🎨 Renderização no Sistema

### Quando visitante acessa o domínio customizado

**Backend (server/routes.ts):**
```typescript
import { getTemplateByName } from "../client/src/templates";
import { renderToString } from "react-dom/server";

// Rota pública para sites customizados
app.get("*", async (req, res) => {
  const host = req.hostname;

  // Identifica empresa
  const customDomain = await storage.getCustomDomainByHost(host);
  if (!customDomain || customDomain.status !== 1) {
    return next();
  }

  // Busca configuração do site
  const website = await storage.getCompanyWebsite(customDomain.companyId);
  if (!website || !website.isPublished) {
    return res.send("<h1>Site em construção</h1>");
  }

  // Busca template
  const template = await storage.getWebsiteTemplate(website.templateId);
  if (!template) {
    return res.status(404).send("Template não encontrado");
  }

  // Pega componente React do template
  const TemplateComponent = getTemplateByName(template.componentName);
  if (!TemplateComponent) {
    return res.status(404).send("Template não implementado");
  }

  // Busca dados
  const company = await storage.getCompany(customDomain.companyId);
  const properties = await storage.getPropertiesByCompany(customDomain.companyId);
  const whatsappInstance = website.whatsappInstanceId
    ? await storage.getWhatsappInstance(website.whatsappInstanceId)
    : undefined;

  // Parse config (JSON do banco → objeto)
  const config = JSON.parse(website.config || "{}");

  // Renderiza React para HTML
  const htmlContent = renderToString(
    <TemplateComponent
      config={config}
      company={company}
      properties={properties}
      whatsappInstance={whatsappInstance}
    />
  );

  // Injeta no HTML completo
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.seo?.title || company.name}</title>
      <meta name="description" content="${config.seo?.description || ''}">
      <link rel="icon" href="${config.branding?.favicon || '/favicon.ico'}">
      <link rel="stylesheet" href="/templates/styles.css">
    </head>
    <body>
      <div id="root">${htmlContent}</div>
    </body>
    </html>
  `;

  res.send(fullHtml);
});
```

---

## ✅ Checklist de Integração

### Passo 1: Preparar Templates
- [ ] Criar pasta `client/src/templates/`
- [ ] Copiar seus 2 templates para as pastas respectivas
- [ ] Criar `TemplateBase.tsx` com interfaces
- [ ] Criar `index.ts` com mapeamento

### Passo 2: Adaptar Templates
- [ ] **Template 1**: Refatorar para receber props
- [ ] **Template 1**: Criar componentes (Hero, Properties, etc)
- [ ] **Template 1**: Adicionar metadados (displayName, thumbnail)
- [ ] **Template 2**: Repetir o processo

### Passo 3: Banco de Dados
- [ ] Executar SQL de criação das tabelas (do guia anterior)
- [ ] Inserir registros dos 2 templates em `website_templates`

### Passo 4: Backend
- [ ] Adicionar métodos no storage.ts
- [ ] Criar endpoints API
- [ ] Implementar SSR (renderização)

### Passo 5: Interfaces
- [ ] Interface Admin: gerenciar templates
- [ ] Interface Cliente: escolher template + editor
- [ ] Preview em tempo real

### Passo 6: Teste
- [ ] Criar configuração de teste para empresa
- [ ] Acessar via domínio customizado
- [ ] Verificar se renderiza corretamente

---

## 🎯 Exemplo Prático Completo

### Seu Template Original (antes)
```
meu-template-premium/
├── index.html
├── App.jsx          ← Hero, Properties, Contact tudo junto
├── styles.css
└── assets/
```

### Após Integração (depois)
```
client/src/templates/Template01Premium/
├── index.tsx        ← Componente principal que recebe props
├── components/
│   ├── Hero.tsx     ← Seção do hero (dinâmica)
│   ├── Properties.tsx
│   ├── About.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   └── WhatsAppButton.tsx
└── README.md        ← Documentação do template
```

---

## 🚀 Próximos Passos

1. **Me mostre seus templates** (estrutura de arquivos)
2. **Vou adaptar o primeiro** como exemplo
3. **Você replica para o segundo**
4. **Implementamos o backend** (tabelas + endpoints)
5. **Criamos as interfaces** (admin + cliente)
6. **Testamos** com uma empresa

---

**Perguntas para você:**
1. Seus templates já são componentes React ou são HTML/CSS puro?
2. Eles já usam TailwindCSS?
3. Posso ver a estrutura de pastas de um dos templates?
4. Eles têm imagens hardcoded ou já são dinâmicos parcialmente?

Com essas respostas, consigo adaptar o guia especificamente para seus templates!
