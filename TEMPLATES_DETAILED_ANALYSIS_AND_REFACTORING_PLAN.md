# 🎨 Templates - Análise Detalhada e Plano de Refatoração

**Data**: 2025-10-31
**Status**: Análise Completa
**Localização**: `E:\imobiliaria\client\src\templates`

---

## 📋 Índice

1. [Visão Geral dos Templates](#visão-geral-dos-templates)
2. [Comparação Detalhada](#comparação-detalhada)
3. [Elementos Hardcoded por Template](#elementos-hardcoded-por-template)
4. [Mapeamento para o Sistema Principal](#mapeamento-para-o-sistema-principal)
5. [Plano de Refatoração](#plano-de-refatoração)
6. [Estrutura Final de Diretórios](#estrutura-final-de-diretórios)
7. [Interfaces e Props](#interfaces-e-props)
8. [Guia de Implementação Passo a Passo](#guia-de-implementação-passo-a-passo)
9. [Estimativa de Esforço](#estimativa-de-esforço)

---

## 🎯 Visão Geral dos Templates

### Template 1: "Find House" (Classic)
**Caminho**: `template-imobiliaria1-main`
**Estilo**: Clean, moderno, com ênfase em imagens grandes
**Abordagem**: Completamente estático com dados hardcoded

**Componentes Principais**:
- Navigation (menu superior)
- HeroSection (banner com busca)
- FeaturedProperties (propriedades em destaque - 3 hardcoded)
- WhyChooseUs (benefícios)
- RecentProperties (propriedades recentes)
- TopAgents (corretores em destaque)
- Testimonials (depoimentos)
- ContactSection (formulário de contato)
- Footer (rodapé completo)

### Template 2: "FindHouse" (Dynamic)
**Caminho**: `template-imobiliaria2-main`
**Estilo**: Moderno, bold, cores escuras
**Abordagem**: Semi-dinâmico - usa React Query + API própria

**Componentes Principais**:
- Header (menu superior)
- HeroSection (banner com busca e vídeo)
- FeaturedProperties (busca via API - useQuery)
- WhyChooseUs (benefícios)
- RentalsSection (propriedades para alugar)
- SaleSection (propriedades para venda)
- WhatsApp CTA (botão de contato)
- Footer (rodapé completo)

**Diferencial**: Já possui backend próprio (server/routes.ts, server/storage.ts) e schema de banco de dados (shared/schema.ts) com estrutura de `properties` e `users`.

---

## 📊 Comparação Detalhada

| Aspecto | Template 1 (Classic) | Template 2 (Dynamic) |
|---------|---------------------|---------------------|
| **Nome da Marca** | "Find House" | "FindHouse" |
| **Ícones** | Font Awesome | Iconify (mdi) |
| **Dados de Propriedades** | Array hardcoded (3 props) | Fetched via API (React Query) |
| **Backend** | ❌ Não possui | ✅ Possui (Express + MySQL) |
| **Schema de Banco** | ❌ Não possui | ✅ Possui (properties table) |
| **Busca de Propriedades** | Form sem funcionalidade | Form com navegação |
| **Navegação** | Links vazios (#) | Links funcionais (wouter) |
| **Seções de Agentes** | ✅ TopAgents | ❌ Não possui |
| **Seções de Depoimentos** | ✅ Testimonials | ❌ Não possui |
| **Vídeo Demo** | ❌ Não possui | ✅ Modal com YouTube |
| **WhatsApp CTA** | ❌ Não possui | ✅ Botão flutuante |
| **Formulário de Contato** | ✅ ContactSection | ❌ Não possui |
| **Complexidade** | Baixa (estático) | Média (dinâmico) |
| **Pronto para Integração** | ⚠️ Precisa adaptar tudo | ✅ Estrutura já pronta |

---

## 🔍 Elementos Hardcoded por Template

### Template 1: Elementos a Tornar Dinâmicos

#### **Navigation Component**
```tsx
// Hardcoded:
- Logo/Nome: "Find House"
- Links do menu: Home, Listing, Property, Pages, Blog, Contact (todos apontam para #)
```

#### **HeroSection Component**
```tsx
// Hardcoded:
- Título: "Find Your Dream Plaza!"
- Background image: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9
- Form de busca (sem funcionalidade real)
```

#### **FeaturedProperties Component**
```tsx
// Array hardcoded com 3 propriedades:
const featuredProperties = [
  {
    id: 1,
    image: "https://images.unsplash.com/...",
    title: "Luxury House in New York",
    price: "$230,000",
    status: "FOR SALE",
    beds: 3, baths: 2, sqft: 1200
  },
  // ... mais 2 propriedades
]
```

#### **Footer Component**
```tsx
// Hardcoded:
- Nome da empresa: "Find House"
- Descrição: "Your trusted partner in finding the perfect property..."
- Endereço: "123 Main Street, New York, NY 10001"
- Telefone: "+1 (555) 123-4567"
- Email: "info@findhouse.com"
- Links de redes sociais (vazios)
- Links de menu (quickLinks, services arrays)
```

#### **TopAgents Component**
- Lista hardcoded de corretores (precisa análise adicional)

#### **Testimonials Component**
- Lista hardcoded de depoimentos (precisa análise adicional)

#### **ContactSection Component**
- Formulário sem integração com backend

---

### Template 2: Elementos a Tornar Dinâmicos

#### **Header Component**
```tsx
// Hardcoded:
- Logo/Nome: "FindHouse"
- Links do menu: Home, Listing, Property, Pages, Blog, Contact (todos com dropdown)
- Botão "Login/Register" (link vazio)
- Botão "Create Listing" (link vazio)
```

#### **HeroSection Component**
```tsx
// Hardcoded:
- Título: "Your Property, Our Priority."
- Subtítulo: "From as low as $10 per day with limited time offer discounts"
- Background CSS class: "hero-bg" (provavelmente imagem de fundo)
- Vídeo YouTube: "https://www.youtube.com/embed/dQw4w9WgXcQ"
- Form de busca (funcional, mas navega para rota interna /properties)
```

#### **FeaturedProperties Component**
```tsx
// ✅ JÁ BUSCA DE API:
const { data: properties = [], isLoading } = useQuery<Property[]>({
  queryKey: ["/api/properties"],
  select: (data) => data.filter(p => p.featured === 1).slice(0, 4),
});

// ⚠️ Mas a API é do próprio template, precisa apontar para a API do sistema principal
```

#### **Footer Component**
```tsx
// Hardcoded:
- Nome da empresa: "FindHouse"
- Descrição: "We're reimagining how you buy, sell and rent..."
- Endereço: "329 Queensberry Street, North Melbourne VIC 3051, Australia."
- Telefone: "123 456 7890"
- Email: "support@findhouse.com"
- Links de redes sociais (vazios)
```

#### **WhatsApp CTA (em home.tsx)**
```tsx
// Hardcoded:
- Link do WhatsApp: "https://wa.me/5511999999999"
- Texto: "FALE CONOSCO"
```

---

## 🗺️ Mapeamento para o Sistema Principal

### Schema de Propriedades

**Template 2 Schema** (já possui):
```typescript
export const properties = mysqlTable("properties", {
  id: varchar("id", { length: 36 }),
  title: varchar("title", { length: 500 }),
  price: int("price"),
  priceType: varchar("price_type", { length: 50 }), // "month" ou valor fixo
  type: varchar("type", { length: 50 }), // "sale" ou "rent"
  featured: int("featured").default(0),
  location: varchar("location", { length: 255 }),
  address: varchar("address", { length: 500 }),
  beds: int("beds"),
  baths: int("baths"),
  sqft: int("sqft"),
  description: text("description"),
  image: varchar("image", { length: 1000 }),
  images: text("images"),
  amenities: text("amenities"),
});
```

**Sistema Principal** - Verificar se possui tabela similar ou criar:
- Provavelmente o sistema já tem uma tabela de imóveis/propriedades
- Precisa adicionar `companyId` para multi-tenancy
- Pode precisar adicionar campo `featured` se não existir

### Dados da Empresa (Company)

Do sistema principal, cada empresa possui:
```typescript
interface Company {
  id: string;
  name: string; // Ex: "Imobiliária Silva"
  email: string | null;
  logo?: string; // URL do logo
  // ... outros campos
}
```

### WhatsApp Instance

O sistema já possui integração com WhatsApp:
```typescript
interface WhatsappInstance {
  instanceName: string;
  phoneNumber?: string;
  // ... outros campos
}
```

---

## 🔧 Plano de Refatoração

### Fase 1: Criar Base de Templates

#### 1.1 Criar Interfaces Base

**Arquivo**: `client/src/templates/types.ts`

```typescript
import type { Property, Company, WhatsappInstance } from '@/types'; // Importar do sistema principal

export interface TemplateConfig {
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    videoUrl?: string; // Para Template 2
  };

  // Branding
  branding: {
    primaryColor: string; // Ex: "#EF4444" (red-500)
    secondaryColor: string; // Ex: "#3B445A" (dark blue)
    logo?: string; // URL do logo da empresa
    companyName: string;
  };

  // Contact Information
  contact: {
    address: string;
    phone: string;
    email: string;
    whatsapp?: string; // Ex: "5511999999999"
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };

  // Sections Visibility
  sections: {
    showAgents: boolean; // Template 1 tem, Template 2 não
    showTestimonials: boolean; // Template 1 tem, Template 2 não
    showContactForm: boolean; // Template 1 tem, Template 2 não
    showWhatsappCTA: boolean; // Template 2 tem, Template 1 não
  };

  // Properties Display
  properties: {
    featuredCount: number; // Quantas propriedades mostrar em destaque (padrão: 4)
    layout: 'grid' | 'carousel'; // Template 1 usa grid, Template 2 usa carousel
  };

  // SEO
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface TemplateProps {
  config: TemplateConfig;
  company: Company;
  properties: Property[];
  whatsappInstance?: WhatsappInstance;
}

export interface TemplateMetadata {
  id: string; // "template-1", "template-2"
  name: string; // "Classic Real Estate", "Modern FindHouse"
  description: string;
  thumbnail: string; // URL da imagem de preview
  category: string; // "real-estate", "luxury", "modern"
  features: string[]; // ["Property Search", "Featured Listings", "Agent Profiles"]
}
```

---

#### 1.2 Criar Estrutura de Pastas

```
client/src/templates/
├── types.ts                          # Interfaces compartilhadas
├── registry.ts                       # Registro de templates
├── utils.ts                          # Funções auxiliares
├── Template1Classic/
│   ├── index.tsx                     # Componente principal
│   ├── metadata.ts                   # Metadados do template
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedProperties.tsx
│   │   ├── WhyChooseUs.tsx
│   │   ├── RecentProperties.tsx
│   │   ├── TopAgents.tsx
│   │   ├── Testimonials.tsx
│   │   ├── ContactSection.tsx
│   │   └── Footer.tsx
│   └── styles/
│       └── custom.css                # CSS específico (se necessário)
└── Template2Modern/
    ├── index.tsx                     # Componente principal
    ├── metadata.ts                   # Metadados do template
    ├── components/
    │   ├── Header.tsx
    │   ├── HeroSection.tsx
    │   ├── FeaturedProperties.tsx
    │   ├── WhyChooseUs.tsx
    │   ├── RentalsSection.tsx
    │   ├── SaleSection.tsx
    │   ├── WhatsappCTA.tsx
    │   └── Footer.tsx
    └── styles/
        └── hero.css                  # Para hero-bg class
```

---

### Fase 2: Refatorar Template 1 (Classic)

#### 2.1 Componente Principal

**Arquivo**: `client/src/templates/Template1Classic/index.tsx`

```tsx
import { TemplateProps } from '../types';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import FeaturedProperties from './components/FeaturedProperties';
import WhyChooseUs from './components/WhyChooseUs';
import RecentProperties from './components/RecentProperties';
import TopAgents from './components/TopAgents';
import Testimonials from './components/Testimonials';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function Template1Classic({ config, company, properties, whatsappInstance }: TemplateProps) {
  // Filtrar propriedades featured
  const featuredProperties = properties
    .filter(p => p.featured === 1)
    .slice(0, config.properties.featuredCount);

  return (
    <div className="bg-white">
      <Navigation config={config} company={company} />
      <main>
        <HeroSection config={config} />
        <FeaturedProperties properties={featuredProperties} config={config} />
        <WhyChooseUs />
        <RecentProperties properties={properties} config={config} />

        {config.sections.showAgents && <TopAgents />}
        {config.sections.showTestimonials && <Testimonials />}
        {config.sections.showContactForm && <ContactSection config={config} />}
      </main>
      <Footer config={config} company={company} />
    </div>
  );
}
```

#### 2.2 Refatorar Navigation Component

**Antes** (hardcoded):
```tsx
<span className="text-2xl font-bold text-gray-800">Find House</span>
```

**Depois** (props-driven):
```tsx
interface NavigationProps {
  config: TemplateConfig;
  company: Company;
}

export default function Navigation({ config, company }: NavigationProps) {
  return (
    // ... resto do código
    <div className="flex items-center space-x-2">
      {config.branding.logo ? (
        <img src={config.branding.logo} alt={company.name} className="h-8" />
      ) : (
        <i className="fas fa-city text-3xl" style={{ color: config.branding.primaryColor }}></i>
      )}
      <span className="text-2xl font-bold text-gray-800">{config.branding.companyName}</span>
    </div>
    // ... resto do código
  );
}
```

#### 2.3 Refatorar HeroSection Component

**Antes**:
```tsx
<h1>Find Your Dream Plaza!</h1>
<div style={{ backgroundImage: "url('https://images.unsplash.com/...')" }}>
```

**Depois**:
```tsx
interface HeroSectionProps {
  config: TemplateConfig;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const { hero, branding } = config;

  return (
    <section className="relative text-white" style={{ minHeight: "600px" }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${hero.backgroundImage || '/default-hero.jpg'}')` }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div className="relative z-10 container mx-auto px-4 h-[600px] flex flex-col justify-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          {hero.title}
        </h1>
        <p className="text-xl mb-8">
          {hero.subtitle}
        </p>
        {/* ... resto do form de busca */}
      </div>
    </section>
  );
}
```

#### 2.4 Refatorar FeaturedProperties Component

**Antes**:
```tsx
const featuredProperties = [
  { id: 1, title: "Luxury House", price: "$230,000", ... },
  // ... hardcoded
];
```

**Depois**:
```tsx
interface FeaturedPropertiesProps {
  properties: Property[];
  config: TemplateConfig;
}

export default function FeaturedProperties({ properties, config }: FeaturedPropertiesProps) {
  const formatPrice = (price: number, priceType: string) => {
    return priceType === "month"
      ? `$${price.toLocaleString()} / month`
      : `$${price.toLocaleString()}`;
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-64 object-cover"
                />
                <span
                  className="absolute top-2 left-2 px-3 py-1 text-white text-sm font-semibold rounded"
                  style={{ backgroundColor: config.branding.primaryColor }}
                >
                  {property.type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-xl mb-2">{property.title}</h3>
                <p className="text-gray-600 mb-4">{property.location}</p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: config.branding.primaryColor }}
                  >
                    {formatPrice(property.price, property.priceType)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-600">
                  <span><i className="fas fa-bed mr-1"></i>{property.beds} Beds</span>
                  <span><i className="fas fa-bath mr-1"></i>{property.baths} Baths</span>
                  <span><i className="fas fa-ruler-combined mr-1"></i>{property.sqft} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### 2.5 Refatorar Footer Component

**Antes**:
```tsx
<span>Find House</span>
<span>+1 (555) 123-4567</span>
<span>info@findhouse.com</span>
```

**Depois**:
```tsx
interface FooterProps {
  config: TemplateConfig;
  company: Company;
}

export default function Footer({ config, company }: FooterProps) {
  const { contact, branding } = config;

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {branding.logo ? (
                <img src={branding.logo} alt={company.name} className="h-8" />
              ) : (
                <i className="fas fa-city text-3xl" style={{ color: branding.primaryColor }}></i>
              )}
              <span className="text-2xl font-bold text-white">{branding.companyName}</span>
            </div>
            <p className="text-sm mb-4">
              Your trusted partner in finding the perfect property.
            </p>
            <div className="flex space-x-4">
              {contact.socialMedia.facebook && (
                <a href={contact.socialMedia.facebook} className="hover:text-red-500" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f text-xl"></i>
                </a>
              )}
              {contact.socialMedia.instagram && (
                <a href={contact.socialMedia.instagram} className="hover:text-red-500" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
              )}
              {/* ... outros social links */}
            </div>
          </div>

          {/* ... outras colunas */}

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mr-3 mt-1" style={{ color: branding.primaryColor }}></i>
                <span>{contact.address}</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone mr-3" style={{ color: branding.primaryColor }}></i>
                <span>{contact.phone}</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-3" style={{ color: branding.primaryColor }}></i>
                <span>{contact.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm mt-8">
          <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

---

### Fase 3: Refatorar Template 2 (Modern)

#### 3.1 Componente Principal

**Arquivo**: `client/src/templates/Template2Modern/index.tsx`

```tsx
import { TemplateProps } from '../types';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturedProperties from './components/FeaturedProperties';
import WhyChooseUs from './components/WhyChooseUs';
import RentalsSection from './components/RentalsSection';
import SaleSection from './components/SaleSection';
import WhatsappCTA from './components/WhatsappCTA';
import Footer from './components/Footer';

export default function Template2Modern({ config, company, properties, whatsappInstance }: TemplateProps) {
  const featuredProperties = properties
    .filter(p => p.featured === 1)
    .slice(0, config.properties.featuredCount);

  const rentalProperties = properties
    .filter(p => p.type === 'rent')
    .slice(0, 6);

  const saleProperties = properties
    .filter(p => p.type === 'sale')
    .slice(0, 6);

  return (
    <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
      <Header config={config} company={company} />
      <HeroSection config={config} />
      <FeaturedProperties properties={featuredProperties} config={config} />
      <WhyChooseUs />
      <RentalsSection properties={rentalProperties} config={config} />
      <SaleSection properties={saleProperties} config={config} />

      {config.sections.showWhatsappCTA && config.contact.whatsapp && (
        <WhatsappCTA whatsapp={config.contact.whatsapp} color={config.branding.primaryColor} />
      )}

      <Footer config={config} company={company} />
    </main>
  );
}
```

#### 3.2 Refatorar FeaturedProperties (já usa API)

**Antes**:
```tsx
const { data: properties = [] } = useQuery<Property[]>({
  queryKey: ["/api/properties"],
  select: (data) => data.filter(p => p.featured === 1).slice(0, 4),
});
```

**Depois** (recebe via props):
```tsx
interface FeaturedPropertiesProps {
  properties: Property[];
  config: TemplateConfig;
}

export default function FeaturedProperties({ properties, config }: FeaturedPropertiesProps) {
  // Não precisa mais de useQuery - recebe properties via props
  // O fetch será feito no nível superior (SSR ou client-side no parent)

  const formatPrice = (price: number, priceType: string) => {
    return priceType === "month"
      ? `$${price.toLocaleString()} / month`
      : `$${price.toLocaleString()}`;
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <p className="text-gray-500 mt-1">Handpicked properties by our team.</p>
          </div>
        </div>
        <div className="relative">
          <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
            {properties.map((property) => (
              <div key={property.id} className="flex-shrink-0 w-[300px] bg-white rounded-lg shadow-md overflow-hidden">
                {/* ... card de propriedade */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### 3.3 Criar WhatsappCTA Component

**Arquivo**: `Template2Modern/components/WhatsappCTA.tsx`

```tsx
interface WhatsappCTAProps {
  whatsapp: string; // Ex: "5511999999999"
  color?: string;
}

export default function WhatsappCTA({ whatsapp, color = "#10B981" }: WhatsappCTAProps) {
  const whatsappUrl = `https://wa.me/${whatsapp}`;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 text-white font-bold text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          style={{ backgroundColor: color }}
        >
          <span className="iconify text-3xl" data-icon="mdi:whatsapp"></span>
          FALE CONOSCO
        </a>
      </div>
    </section>
  );
}
```

---

### Fase 4: Criar Sistema de Registro

#### 4.1 Template Registry

**Arquivo**: `client/src/templates/registry.ts`

```typescript
import { ComponentType } from 'react';
import { TemplateProps, TemplateMetadata } from './types';
import Template1Classic from './Template1Classic';
import { metadata as template1Metadata } from './Template1Classic/metadata';
import Template2Modern from './Template2Modern';
import { metadata as template2Metadata } from './Template2Modern/metadata';

export interface RegisteredTemplate {
  metadata: TemplateMetadata;
  component: ComponentType<TemplateProps>;
}

export const TEMPLATE_REGISTRY: Record<string, RegisteredTemplate> = {
  'template-1': {
    metadata: template1Metadata,
    component: Template1Classic,
  },
  'template-2': {
    metadata: template2Metadata,
    component: Template2Modern,
  },
};

export function getTemplate(templateId: string): RegisteredTemplate | null {
  return TEMPLATE_REGISTRY[templateId] || null;
}

export function getAllTemplates(): RegisteredTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}
```

#### 4.2 Template Metadata

**Arquivo**: `Template1Classic/metadata.ts`

```typescript
import { TemplateMetadata } from '../types';

export const metadata: TemplateMetadata = {
  id: 'template-1',
  name: 'Classic Real Estate',
  description: 'Um template clássico e elegante para imobiliárias, com seções de propriedades em destaque, corretores, depoimentos e formulário de contato.',
  thumbnail: '/templates/template-1-preview.jpg',
  category: 'classic',
  features: [
    'Property Search',
    'Featured Listings',
    'Agent Profiles',
    'Client Testimonials',
    'Contact Form',
    'Responsive Design',
  ],
};
```

**Arquivo**: `Template2Modern/metadata.ts`

```typescript
import { TemplateMetadata } from '../types';

export const metadata: TemplateMetadata = {
  id: 'template-2',
  name: 'Modern FindHouse',
  description: 'Template moderno e dinâmico com foco em usabilidade, busca avançada, vídeo de apresentação e integração com WhatsApp.',
  thumbnail: '/templates/template-2-preview.jpg',
  category: 'modern',
  features: [
    'Advanced Property Search',
    'Video Showcase',
    'WhatsApp Integration',
    'Dynamic Property Loading',
    'Rentals & Sales Sections',
    'Mobile Optimized',
  ],
};
```

---

## 📂 Estrutura Final de Diretórios

```
e:\imobiliaria\
├── client\src\
│   ├── templates\
│   │   ├── types.ts                 # ✅ CRIAR
│   │   ├── registry.ts              # ✅ CRIAR
│   │   ├── utils.ts                 # ✅ CRIAR
│   │   │
│   │   ├── Template1Classic\        # ⚠️ REFATORAR template-imobiliaria1-main
│   │   │   ├── index.tsx
│   │   │   ├── metadata.ts
│   │   │   ├── components\
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── FeaturedProperties.tsx
│   │   │   │   ├── WhyChooseUs.tsx
│   │   │   │   ├── RecentProperties.tsx
│   │   │   │   ├── TopAgents.tsx
│   │   │   │   ├── Testimonials.tsx
│   │   │   │   ├── ContactSection.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── styles\
│   │   │       └── custom.css
│   │   │
│   │   └── Template2Modern\         # ⚠️ REFATORAR template-imobiliaria2-main
│   │       ├── index.tsx
│   │       ├── metadata.ts
│   │       ├── components\
│   │       │   ├── Header.tsx
│   │       │   ├── HeroSection.tsx
│   │       │   ├── FeaturedProperties.tsx
│   │       │   ├── WhyChooseUs.tsx
│   │       │   ├── RentalsSection.tsx
│   │       │   ├── SaleSection.tsx
│   │       │   ├── WhatsappCTA.tsx
│   │       │   └── Footer.tsx
│   │       └── styles\
│   │           └── hero.css
│   │
│   └── pages\
│       ├── admin\
│       │   └── website-templates.tsx  # ✅ CRIAR - Admin escolhe template e configura
│       └── client\
│           └── website-config.tsx     # ✅ CRIAR - Cliente personaliza template
│
├── server\
│   ├── routes.ts                    # ⚠️ ADICIONAR endpoints de templates
│   └── storage.ts                   # ⚠️ ADICIONAR métodos de templates
│
├── shared\
│   └── schema.ts                    # ⚠️ ADICIONAR tabelas:
│                                    #    - website_templates
│                                    #    - company_websites
│
└── migrations\
    └── create_website_templates.sql # ✅ CRIAR
```

---

## 🔌 Interfaces e Props

### Interface Completa: TemplateConfig

```typescript
export interface TemplateConfig {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    videoUrl?: string;
  };

  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    companyName: string;
  };

  contact: {
    address: string;
    phone: string;
    email: string;
    whatsapp?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };

  sections: {
    showAgents: boolean;
    showTestimonials: boolean;
    showContactForm: boolean;
    showWhatsappCTA: boolean;
  };

  properties: {
    featuredCount: number;
    layout: 'grid' | 'carousel';
  };

  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}
```

### Exemplo de Config (JSON) salvo no banco

```json
{
  "hero": {
    "title": "Encontre o imóvel dos seus sonhos",
    "subtitle": "As melhores propriedades de São Paulo",
    "backgroundImage": "https://storage.com/hero.jpg"
  },
  "branding": {
    "primaryColor": "#DC2626",
    "secondaryColor": "#1E293B",
    "logo": "https://storage.com/logo.png",
    "companyName": "Imobiliária Silva"
  },
  "contact": {
    "address": "Av. Paulista, 1000 - São Paulo, SP",
    "phone": "+55 11 98765-4321",
    "email": "contato@imobiliariasilva.com.br",
    "whatsapp": "5511987654321",
    "socialMedia": {
      "instagram": "https://instagram.com/imobiliariasilva",
      "facebook": "https://facebook.com/imobiliariasilva"
    }
  },
  "sections": {
    "showAgents": true,
    "showTestimonials": true,
    "showContactForm": true,
    "showWhatsappCTA": true
  },
  "properties": {
    "featuredCount": 6,
    "layout": "grid"
  },
  "seo": {
    "title": "Imobiliária Silva - Imóveis em São Paulo",
    "description": "Encontre as melhores casas e apartamentos em São Paulo",
    "keywords": ["imóveis", "casas", "apartamentos", "são paulo"]
  }
}
```

---

## 📝 Guia de Implementação Passo a Passo

### Etapa 1: Preparar Estrutura Base (2-3 horas)

1. **Criar arquivos base de templates**:
   ```bash
   # Criar diretórios
   mkdir -p client/src/templates/Template1Classic/components
   mkdir -p client/src/templates/Template1Classic/styles
   mkdir -p client/src/templates/Template2Modern/components
   mkdir -p client/src/templates/Template2Modern/styles

   # Criar arquivos de tipos
   touch client/src/templates/types.ts
   touch client/src/templates/registry.ts
   touch client/src/templates/utils.ts
   ```

2. **Copiar código das interfaces** fornecidas acima para `types.ts`

3. **Criar metadata files** para cada template

---

### Etapa 2: Refatorar Template 1 (6-8 horas)

1. **Mover componentes**:
   - Copiar de `template-imobiliaria1-main/client/src/components/` para `Template1Classic/components/`

2. **Refatorar cada componente** para aceitar props:
   - Navigation.tsx → recebe `config`, `company`
   - HeroSection.tsx → recebe `config`
   - FeaturedProperties.tsx → recebe `properties[]`, `config`
   - Footer.tsx → recebe `config`, `company`
   - ... e assim por diante

3. **Criar index.tsx principal** que monta todos os componentes

4. **Testar isoladamente** com mock data

---

### Etapa 3: Refatorar Template 2 (6-8 horas)

1. **Mover componentes**:
   - Copiar de `template-imobiliaria2-main/client/src/components/` para `Template2Modern/components/`

2. **Remover dependências de backend próprio**:
   - Remover `useQuery` de FeaturedProperties
   - Substituir por props
   - Remover importações de `@shared/schema` do template

3. **Refatorar HeroSection**:
   - Background do hero (`hero-bg` class) → passar via config
   - Vídeo do YouTube → receber URL via config

4. **Criar WhatsappCTA component**

5. **Criar index.tsx principal**

---

### Etapa 4: Implementar Backend (4-6 horas)

#### 4.1 Criar Migration SQL

**Arquivo**: `migrations/create_website_templates.sql`

```sql
-- Tabela de templates disponíveis (populada pelo sistema)
CREATE TABLE IF NOT EXISTS website_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(500),
  category VARCHAR(100),
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de configurações de site por empresa
CREATE TABLE IF NOT EXISTS company_websites (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  config JSON NOT NULL, -- Armazena o TemplateConfig completo
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES website_templates(id),

  INDEX idx_company_id (company_id),
  INDEX idx_template_id (template_id),
  UNIQUE KEY unique_company_active (company_id, is_active)
);

-- Seed dos templates disponíveis
INSERT INTO website_templates (id, name, description, category, features) VALUES
('template-1', 'Classic Real Estate', 'Template clássico e elegante para imobiliárias', 'classic', '["Property Search", "Featured Listings", "Agent Profiles", "Client Testimonials", "Contact Form"]'),
('template-2', 'Modern FindHouse', 'Template moderno e dinâmico com foco em usabilidade', 'modern', '["Advanced Property Search", "Video Showcase", "WhatsApp Integration", "Dynamic Property Loading"]');
```

#### 4.2 Adicionar ao Schema Drizzle

**Arquivo**: `shared/schema.ts`

```typescript
export const websiteTemplates = mysqlTable('website_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  thumbnail: varchar('thumbnail', { length: 500 }),
  category: varchar('category', { length: 100 }),
  features: json('features'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const companyWebsites = mysqlTable('company_websites', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  templateId: varchar('template_id', { length: 36 }).notNull(),
  config: json('config').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  companyIdx: index('idx_company_id').on(table.companyId),
  templateIdx: index('idx_template_id').on(table.templateId),
  uniqueCompanyActive: uniqueIndex('unique_company_active').on(table.companyId, table.isActive),
}));

export type WebsiteTemplate = typeof websiteTemplates.$inferSelect;
export type CompanyWebsite = typeof companyWebsites.$inferSelect;
export type InsertCompanyWebsite = typeof companyWebsites.$inferInsert;
```

#### 4.3 Adicionar Métodos ao Storage

**Arquivo**: `server/storage.ts`

```typescript
// Métodos de Website Templates

async getAllWebsiteTemplates(): Promise<WebsiteTemplate[]> {
  const db = this.getDb();
  return db.select().from(websiteTemplates);
}

async getWebsiteTemplate(id: string): Promise<WebsiteTemplate | null> {
  const db = this.getDb();
  const [template] = await db.select().from(websiteTemplates).where(eq(websiteTemplates.id, id));
  return template || null;
}

async getCompanyWebsite(companyId: string): Promise<CompanyWebsite | null> {
  const db = this.getDb();
  const [website] = await db
    .select()
    .from(companyWebsites)
    .where(and(
      eq(companyWebsites.companyId, companyId),
      eq(companyWebsites.isActive, true)
    ));
  return website || null;
}

async createCompanyWebsite(data: InsertCompanyWebsite): Promise<CompanyWebsite> {
  const db = this.getDb();

  // Desativar website anterior se existir
  await db
    .update(companyWebsites)
    .set({ isActive: false })
    .where(eq(companyWebsites.companyId, data.companyId));

  // Criar novo website
  const [website] = await db.insert(companyWebsites).values(data).$returningId();
  return this.getCompanyWebsite(data.companyId);
}

async updateCompanyWebsite(id: string, updates: Partial<InsertCompanyWebsite>): Promise<CompanyWebsite> {
  const db = this.getDb();
  await db.update(companyWebsites).set(updates).where(eq(companyWebsites.id, id));

  const [website] = await db.select().from(companyWebsites).where(eq(companyWebsites.id, id));
  return website;
}
```

#### 4.4 Criar Endpoints API

**Arquivo**: `server/routes.ts`

```typescript
// ============================================
// WEBSITE TEMPLATES ROUTES
// ============================================

// Lista todos os templates disponíveis (público ou autenticado)
app.get('/api/website-templates', async (req, res) => {
  try {
    const storage = getStorage();
    await storage.init();

    const templates = await storage.getAllWebsiteTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// Busca configuração de website da empresa (por custom domain ou companyId)
app.get('/api/website/config', async (req, res) => {
  try {
    const storage = getStorage();
    await storage.init();

    // Identificar empresa (pode ser via custom domain middleware ou query param)
    const companyId = (req as any).identifiedCompanyId || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID é obrigatório' });
    }

    const website = await storage.getCompanyWebsite(companyId);

    if (!website) {
      return res.status(404).json({ error: 'Website não configurado' });
    }

    res.json(website);
  } catch (error) {
    console.error('Erro ao buscar configuração do website:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

// Cliente: Buscar configuração de website da própria empresa
app.get('/api/client/website', requireAuth, requireCompanyAccess, async (req, res) => {
  try {
    const storage = getStorage();
    await storage.init();

    const user = (req as any).user;
    const website = await storage.getCompanyWebsite(user.companyId);

    res.json(website || null);
  } catch (error) {
    console.error('Erro ao buscar website:', error);
    res.status(500).json({ error: 'Erro ao buscar website' });
  }
});

// Cliente: Criar ou atualizar configuração de website
app.post('/api/client/website', requireAuth, requireCompanyAccess, async (req, res) => {
  try {
    const storage = getStorage();
    await storage.init();

    const user = (req as any).user;
    const { templateId, config } = req.body;

    if (!templateId || !config) {
      return res.status(400).json({ error: 'Template ID e config são obrigatórios' });
    }

    // Verificar se o template existe
    const template = await storage.getWebsiteTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Criar ou atualizar website
    const existingWebsite = await storage.getCompanyWebsite(user.companyId);

    if (existingWebsite) {
      const updated = await storage.updateCompanyWebsite(existingWebsite.id, { templateId, config });
      res.json(updated);
    } else {
      const created = await storage.createCompanyWebsite({
        companyId: user.companyId,
        templateId,
        config,
        isActive: true,
      });
      res.json(created);
    }
  } catch (error) {
    console.error('Erro ao salvar website:', error);
    res.status(500).json({ error: 'Erro ao salvar website' });
  }
});
```

---

### Etapa 5: Criar Interfaces Frontend (8-10 horas)

#### 5.1 Página Admin: Gerenciar Templates

**Arquivo**: `client/src/pages/admin/website-templates.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  features: string[];
}

export default function WebsiteTemplates() {
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/website-templates'],
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Templates de Website</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-48 object-cover"
            />
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.features.map((feature) => (
                  <Badge key={feature} variant="outline">{feature}</Badge>
                ))}
              </div>
              <Badge>{template.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 5.2 Página Cliente: Configurar Website

**Arquivo**: `client/src/pages/client/website-config.tsx`

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { TemplateConfig } from '@/templates/types';

export default function WebsiteConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({ queryKey: ['/api/website-templates'] });
  const { data: currentWebsite } = useQuery({ queryKey: ['/api/client/website'] });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [config, setConfig] = useState<Partial<TemplateConfig>>({
    hero: { title: '', subtitle: '' },
    branding: { primaryColor: '#DC2626', secondaryColor: '#1E293B', companyName: '' },
    contact: { address: '', phone: '', email: '' },
    sections: {
      showAgents: true,
      showTestimonials: true,
      showContactForm: true,
      showWhatsappCTA: false,
    },
    properties: { featuredCount: 6, layout: 'grid' },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/client/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateId: selectedTemplateId, config }),
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Website configurado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['/api/client/website'] });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Configurar Website</h1>

      {/* Seletor de Template */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Escolha um Template</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates?.map((template: any) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedTemplateId === template.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <img src={template.thumbnail} alt={template.name} className="w-full h-32 object-cover rounded mb-2" />
              <h3 className="font-semibold">{template.name}</h3>
            </div>
          ))}
        </div>
      </Card>

      {/* Formulário de Configuração */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Personalização</h2>

        <div className="space-y-4">
          <div>
            <Label>Título do Hero</Label>
            <Input
              value={config.hero?.title || ''}
              onChange={(e) => setConfig({ ...config, hero: { ...config.hero!, title: e.target.value } })}
              placeholder="Encontre o imóvel dos seus sonhos"
            />
          </div>

          <div>
            <Label>Subtítulo do Hero</Label>
            <Input
              value={config.hero?.subtitle || ''}
              onChange={(e) => setConfig({ ...config, hero: { ...config.hero!, subtitle: e.target.value } })}
              placeholder="As melhores propriedades da cidade"
            />
          </div>

          <div>
            <Label>Nome da Empresa</Label>
            <Input
              value={config.branding?.companyName || ''}
              onChange={(e) => setConfig({ ...config, branding: { ...config.branding!, companyName: e.target.value } })}
              placeholder="Imobiliária XYZ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor Primária</Label>
              <Input
                type="color"
                value={config.branding?.primaryColor || '#DC2626'}
                onChange={(e) => setConfig({ ...config, branding: { ...config.branding!, primaryColor: e.target.value } })}
              />
            </div>
            <div>
              <Label>Cor Secundária</Label>
              <Input
                type="color"
                value={config.branding?.secondaryColor || '#1E293B'}
                onChange={(e) => setConfig({ ...config, branding: { ...config.branding!, secondaryColor: e.target.value } })}
              />
            </div>
          </div>

          <div>
            <Label>Endereço</Label>
            <Input
              value={config.contact?.address || ''}
              onChange={(e) => setConfig({ ...config, contact: { ...config.contact!, address: e.target.value } })}
              placeholder="Rua Exemplo, 123 - Cidade, Estado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input
                value={config.contact?.phone || ''}
                onChange={(e) => setConfig({ ...config, contact: { ...config.contact!, phone: e.target.value } })}
                placeholder="+55 11 98765-4321"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={config.contact?.email || ''}
                onChange={(e) => setConfig({ ...config, contact: { ...config.contact!, email: e.target.value } })}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} className="w-full">
            Salvar Configurações
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

---

### Etapa 6: Criar Rota de Renderização SSR (4-6 horas)

**Arquivo**: `server/renderTemplate.ts`

```typescript
import { Request, Response } from 'express';
import { renderToString } from 'react-dom/server';
import { getTemplate } from '../client/src/templates/registry';
import { getStorage } from './storage';

export async function renderCustomDomainWebsite(req: Request, res: Response) {
  try {
    const companyId = (req as any).identifiedCompanyId;

    if (!companyId) {
      return res.status(400).send('Company not identified');
    }

    const storage = getStorage();
    await storage.init();

    // Buscar configuração do website da empresa
    const website = await storage.getCompanyWebsite(companyId);

    if (!website) {
      return res.status(404).send('Website not configured');
    }

    // Buscar dados necessários
    const company = await storage.getCompany(companyId);
    const properties = await storage.getPropertiesByCompany(companyId); // Assumindo que existe
    const whatsappInstance = await storage.getWhatsappInstancesByCompany(companyId)[0]; // Primeira instância

    // Buscar template component
    const registeredTemplate = getTemplate(website.templateId);

    if (!registeredTemplate) {
      return res.status(404).send('Template not found');
    }

    const TemplateComponent = registeredTemplate.component;

    // Renderizar template com dados
    const html = renderToString(
      <TemplateComponent
        config={website.config as any}
        company={company}
        properties={properties}
        whatsappInstance={whatsappInstance}
      />
    );

    // Enviar HTML completo
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${website.config.seo?.title || company.name}</title>
          <meta name="description" content="${website.config.seo?.description || ''}" />
          <link rel="stylesheet" href="/assets/styles.css" />
        </head>
        <body>
          <div id="root">${html}</div>
          <script src="/assets/main.js"></script>
        </body>
      </html>
    `;

    res.send(fullHtml);
  } catch (error) {
    console.error('Erro ao renderizar website:', error);
    res.status(500).send('Internal Server Error');
  }
}
```

**Adicionar rota no `server/routes.ts`**:

```typescript
import { renderCustomDomainWebsite } from './renderTemplate';

// Rota para renderizar website de custom domain
// Esta rota deve ser chamada APÓS o middleware identifyCompanyByDomain
app.get('/', identifyCompanyByDomain, async (req, res) => {
  if ((req as any).customDomainAccess) {
    // É um custom domain, renderizar o website template
    return renderCustomDomainWebsite(req, res);
  } else {
    // Não é custom domain, continuar com a aplicação normal
    // Renderizar a SPA React normal
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
});
```

---

## ⏱️ Estimativa de Esforço

| Etapa | Descrição | Tempo Estimado |
|-------|-----------|----------------|
| 1 | Preparar Estrutura Base | 2-3 horas |
| 2 | Refatorar Template 1 (Classic) | 6-8 horas |
| 3 | Refatorar Template 2 (Modern) | 6-8 horas |
| 4 | Implementar Backend (DB + API) | 4-6 horas |
| 5 | Criar Interfaces Frontend (Admin + Cliente) | 8-10 horas |
| 6 | Criar Rota de Renderização SSR | 4-6 horas |
| 7 | Testes e Ajustes | 4-6 horas |
| 8 | Integração com Custom Domains | 2-3 horas |
| 9 | Documentação e Deploy | 2-3 horas |
| **TOTAL** | | **38-53 horas** |

**Estimativa realista**: ~40-50 horas de desenvolvimento

---

## 🎯 Próximos Passos Recomendados

1. ✅ **Revisar esta análise** e validar com requisitos do projeto
2. ⏩ **Decidir qual template refatorar primeiro** (recomendo Template 2 por ser mais moderno)
3. 🏗️ **Começar pela estrutura base** (Fase 1)
4. 🔧 **Implementar backend** (Fase 4) em paralelo com refatoração de templates
5. 🎨 **Criar interface de configuração** para testar templates
6. 🚀 **Integrar com sistema de custom domains** existente

---

## 📌 Considerações Importantes

### Performance
- **SSR é recomendado** para SEO em sites públicos
- Considere cache de templates renderizados
- Use CDN para assets estáticos (imagens de propriedades)

### Segurança
- Validar e sanitizar `config` JSON antes de salvar no banco
- Implementar rate limiting nos endpoints de configuração
- Validar permissões (cliente só pode editar seu próprio website)

### Manutenção
- Versionar templates (se fizer breaking changes no futuro)
- Manter backward compatibility na estrutura de `config`
- Documentar cada campo de `TemplateConfig`

### Escalabilidade
- Considere separar renderização SSR em serviço próprio
- Use queue para regenerar HTML quando config mudar
- Implementar preview de templates antes de publicar

---

**Documento criado em**: 2025-10-31
**Autor**: Claude (Análise Automatizada)
**Versão**: 1.0

---

🎉 **Templates prontos para integração!**
