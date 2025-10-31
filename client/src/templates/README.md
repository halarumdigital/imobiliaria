# Sistema de Templates - Imobiliária

Sistema completo para criação e personalização de websites de imobiliárias usando templates React.

## 📁 Estrutura de Arquivos

```
client/src/templates/
├── index.ts                    # Exportações principais
├── types.ts                    # Interfaces TypeScript
├── utils.ts                    # Funções utilitárias
├── registry.ts                 # Registro de templates disponíveis
├── Template1Classic.tsx        # Template Clássico
├── Template2Modern.tsx         # Template Moderno
└── README.md                   # Esta documentação
```

## 🎨 Templates Disponíveis

### Template 1: Classic Real Estate
- **ID**: `template-1`
- **Categoria**: Classic
- **Características**:
  - Design clássico e elegante
  - Seção hero com imagem de fundo
  - Propriedades em destaque em grid
  - Seção de corretores
  - Depoimentos de clientes
  - Formulário de contato
  - Design totalmente responsivo

### Template 2: Modern FindHouse
- **ID**: `template-2`
- **Categoria**: Modern
- **Características**:
  - Design moderno e dinâmico
  - Hero com vídeo de apresentação
  - Busca avançada de propriedades
  - Seções separadas para venda e aluguel
  - Integração com WhatsApp CTA
  - Carregamento dinâmico
  - Otimizado para mobile

## 🔧 Como Usar

### 1. Configurar Template

```typescript
import { TemplateConfig } from '@/templates/types';

const config: TemplateConfig = {
  hero: {
    title: 'Encontre o Imóvel dos Seus Sonhos',
    subtitle: 'As melhores propriedades da região',
    backgroundImage: 'https://...',
    videoUrl: 'https://youtube.com/...' // Opcional
  },
  branding: {
    primaryColor: '#EF4444',
    secondaryColor: '#1E293B',
    logo: 'https://...',
    companyName: 'Minha Imobiliária'
  },
  contact: {
    address: 'Rua Exemplo, 123',
    phone: '+55 11 98765-4321',
    email: 'contato@imobiliaria.com',
    whatsapp: '+5511987654321',
    socialMedia: {
      facebook: 'https://facebook.com/...',
      instagram: 'https://instagram.com/...'
    }
  },
  sections: {
    showAgents: true,
    showTestimonials: true,
    showContactForm: true,
    showWhatsappCTA: true
  },
  properties: {
    featuredCount: 6,
    layout: 'grid'
  },
  seo: {
    title: 'Imobiliária - Encontre seu imóvel ideal',
    description: 'As melhores casas e apartamentos',
    keywords: ['imóveis', 'casas', 'apartamentos']
  }
};
```

### 2. Renderizar Template

```typescript
import { Template1Classic } from '@/templates';
import { TemplateProps } from '@/templates/types';

function MyWebsite(props: TemplateProps) {
  return <Template1Classic {...props} />;
}
```

### 3. Usar Template Registry

```typescript
import { getTemplate } from '@/templates/registry';

const template = getTemplate('template-1');
if (template) {
  const TemplateComponent = template.component;
  return <TemplateComponent {...props} />;
}
```

## 📦 Props do Template

Todos os templates recebem as mesmas props (`TemplateProps`):

```typescript
interface TemplateProps {
  config: TemplateConfig;           // Configurações do template
  company: Company;                  // Dados da empresa
  properties?: Property[];           // Lista de imóveis
  agents?: CompanyAgent[];           // Lista de corretores
  testimonials?: CompanyTestimonial[]; // Lista de depoimentos
  whatsappInstance?: WhatsappInstance; // Instância do WhatsApp
}
```

## 🛠️ Funções Utilitárias

### formatPrice
Formata preço de propriedade com moeda e tipo (venda/aluguel):
```typescript
import { formatPrice } from '@/templates/utils';

formatPrice(1500, 'locacao'); // "R$ 1.500 / mês"
formatPrice(350000, 'venda');  // "R$ 350.000"
```

### formatWhatsAppLink
Gera link do WhatsApp com mensagem pré-configurada:
```typescript
import { formatWhatsAppLink } from '@/templates/utils';

const link = formatWhatsAppLink(
  '+5511987654321',
  'Olá! Gostaria de mais informações'
);
// https://wa.me/5511987654321?text=...
```

### mergeWithDefaultConfig
Mescla configuração personalizada com padrão:
```typescript
import { mergeWithDefaultConfig } from '@/templates/utils';

const config = mergeWithDefaultConfig({
  hero: {
    title: 'Meu Título Personalizado'
  }
  // Outros campos serão preenchidos com valores padrão
});
```

## 🎯 Personalização Avançada

### Cores Personalizadas

Os templates aplicam automaticamente as cores configuradas:
- `config.branding.primaryColor` - Cor principal (botões, links, destaques)
- `config.branding.secondaryColor` - Cor secundária (rodapé, elementos)

### Seções Opcionais

Controle quais seções aparecem no template:
```typescript
config.sections = {
  showAgents: true,           // Mostrar seção de corretores
  showTestimonials: true,     // Mostrar depoimentos
  showContactForm: true,      // Mostrar formulário de contato
  showWhatsappCTA: true       // Mostrar botão WhatsApp
};
```

### Propriedades em Destaque

```typescript
// Apenas propriedades com featured=true serão exibidas
config.properties.featuredCount = 6; // Máximo de 6 propriedades
```

## 📱 SEO e Metadados

Configure metadados para otimização em buscadores:
```typescript
config.seo = {
  title: 'Imobiliária XYZ - Imóveis em São Paulo',
  description: 'Encontre casas, apartamentos e imóveis comerciais',
  keywords: ['imóveis sp', 'apartamentos', 'casas']
};
```

## 🚀 Criando Novos Templates

### 1. Criar Componente

```typescript
// Template3.tsx
import { TemplateProps } from './types';

export default function Template3(props: TemplateProps) {
  const { config, properties } = props;

  return (
    <div>
      <h1 style={{ color: config.branding.primaryColor }}>
        {config.branding.companyName}
      </h1>
      {/* Sua estrutura personalizada */}
    </div>
  );
}
```

### 2. Registrar no Registry

```typescript
// registry.ts
const Template3 = lazy(() => import('./Template3'));

export const TEMPLATE_REGISTRY = {
  // ... templates existentes
  'template-3': {
    metadata: {
      id: 'template-3',
      name: 'Meu Template',
      description: 'Descrição do template',
      category: 'modern',
      features: ['Feature 1', 'Feature 2']
    },
    component: Template3
  }
};
```

### 3. Inserir no Banco de Dados

```sql
INSERT INTO website_templates (id, name, description, category, features)
VALUES (
  'template-3',
  'Meu Template',
  'Descrição do template',
  'modern',
  JSON_ARRAY('Feature 1', 'Feature 2')
);
```

## 🔍 Troubleshooting

### Template não carrega
- Verifique se o template está registrado no `TEMPLATE_REGISTRY`
- Confirme se o `templateId` no banco corresponde ao ID do registro
- Veja o console do navegador para erros de importação

### Cores não aplicam
- Confirme que `config.branding.primaryColor` tem um valor válido (ex: `#FF0000`)
- Verifique se está usando `style={{ color: config.branding.primaryColor }}`

### Propriedades não aparecem
- Certifique-se que `properties` tem o campo `featured: true`
- Verifique se `config.properties.featuredCount` não é zero
- Confirme que a propriedade tem `images` (array de URLs)

## 📚 Referências

- [Documentação de Tipos](./types.ts)
- [Funções Utilitárias](./utils.ts)
- [Registry de Templates](./registry.ts)
- [Schema do Banco](../../../shared/schema.ts)
