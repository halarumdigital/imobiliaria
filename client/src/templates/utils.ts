/**
 * Template Utilities
 * Funções auxiliares para o sistema de templates
 */

import { TemplateConfig } from './types';

/**
 * Configuração padrão para novos websites
 */
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  hero: {
    title: 'Encontre o Imóvel dos Seus Sonhos',
    subtitle: 'As melhores propriedades da região',
    backgroundImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=700&fit=crop',
  },
  branding: {
    primaryColor: '#EF4444', // red-500
    secondaryColor: '#1E293B', // slate-800
    companyName: 'Minha Imobiliária',
  },
  contact: {
    address: 'Rua Exemplo, 123 - Cidade, Estado',
    phone: '+55 11 98765-4321',
    email: 'contato@imobiliaria.com.br',
    socialMedia: {},
  },
  sections: {
    showAgents: true,
    showTestimonials: true,
    showContactForm: true,
    showWhatsappCTA: false,
  },
  properties: {
    featuredCount: 6,
    layout: 'grid',
  },
  seo: {
    title: 'Imobiliária - Encontre seu imóvel ideal',
    description: 'Encontre as melhores casas, apartamentos e imóveis comerciais',
    keywords: ['imóveis', 'casas', 'apartamentos', 'venda', 'aluguel'],
  },
};

/**
 * Formata preço de propriedade
 */
export function formatPrice(price: number, priceType: string): string {
  const formatted = price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (priceType === 'month' || priceType === 'rent') {
    return `${formatted} / mês`;
  }

  return formatted;
}

/**
 * Formata número de WhatsApp para link
 */
export function formatWhatsAppLink(phoneNumber: string, message?: string): string {
  // Remove todos os caracteres não numéricos
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Adiciona código do país se não tiver
  const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

  const baseUrl = `https://wa.me/${fullNumber}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
}

/**
 * Valida configuração de template
 */
export function validateTemplateConfig(config: any): config is TemplateConfig {
  if (!config || typeof config !== 'object') return false;

  // Validações básicas
  if (!config.hero || !config.hero.title) return false;
  if (!config.branding || !config.branding.companyName) return false;
  if (!config.contact || !config.contact.email) return false;
  if (!config.sections) return false;
  if (!config.properties) return false;

  return true;
}

/**
 * Mescla configuração personalizada com configuração padrão
 */
export function mergeWithDefaultConfig(customConfig: Partial<TemplateConfig>): TemplateConfig {
  return {
    hero: { ...DEFAULT_TEMPLATE_CONFIG.hero, ...customConfig.hero },
    branding: { ...DEFAULT_TEMPLATE_CONFIG.branding, ...customConfig.branding },
    contact: {
      ...DEFAULT_TEMPLATE_CONFIG.contact,
      ...customConfig.contact,
      socialMedia: {
        ...DEFAULT_TEMPLATE_CONFIG.contact.socialMedia,
        ...customConfig.contact?.socialMedia,
      },
    },
    sections: { ...DEFAULT_TEMPLATE_CONFIG.sections, ...customConfig.sections },
    properties: { ...DEFAULT_TEMPLATE_CONFIG.properties, ...customConfig.properties },
    seo: customConfig.seo ? { ...DEFAULT_TEMPLATE_CONFIG.seo, ...customConfig.seo } : DEFAULT_TEMPLATE_CONFIG.seo,
  };
}

/**
 * Gera classes CSS dinâmicas com cores personalizadas
 */
export function getCustomStyles(config: TemplateConfig): string {
  return `
    .template-primary {
      color: ${config.branding.primaryColor};
    }
    .template-primary-bg {
      background-color: ${config.branding.primaryColor};
    }
    .template-secondary {
      color: ${config.branding.secondaryColor};
    }
    .template-secondary-bg {
      background-color: ${config.branding.secondaryColor};
    }
  `;
}

/**
 * Extrai domínio de URL de rede social
 */
export function getSocialMediaIcon(url: string): string {
  if (url.includes('facebook.com')) return 'fab fa-facebook-f';
  if (url.includes('instagram.com')) return 'fab fa-instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'fab fa-twitter';
  if (url.includes('linkedin.com')) return 'fab fa-linkedin-in';
  if (url.includes('youtube.com')) return 'fab fa-youtube';
  return 'fab fa-globe';
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Gera slug a partir de texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}
