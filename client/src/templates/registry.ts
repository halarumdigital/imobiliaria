/**
 * Template Registry
 * Centraliza o registro de todos os templates disponíveis no sistema
 */

import { ComponentType, lazy } from 'react';
import { TemplateProps, TemplateMetadata } from './types';

// Lazy load dos templates para otimizar bundle
const Template1Classic = lazy(() => import('./Template1Classic'));
const Template2Modern = lazy(() => import('./Template2Modern'));

export interface RegisteredTemplate {
  metadata: TemplateMetadata;
  component: ComponentType<TemplateProps>;
}

// Metadados dos templates
const template1Metadata: TemplateMetadata = {
  id: 'template-1',
  name: 'Classic Real Estate',
  description: 'Template clássico e elegante para imobiliárias, com seções de propriedades em destaque, corretores, depoimentos e formulário de contato.',
  thumbnail: '/templates/template-1-preview.jpg',
  category: 'classic',
  features: [
    'Busca de Propriedades',
    'Propriedades em Destaque',
    'Perfis de Corretores',
    'Depoimentos de Clientes',
    'Formulário de Contato',
    'Design Responsivo',
  ],
};

const template2Metadata: TemplateMetadata = {
  id: 'template-2',
  name: 'Modern FindHouse',
  description: 'Template moderno e dinâmico com foco em usabilidade, busca avançada, vídeo de apresentação e integração com WhatsApp.',
  thumbnail: '/templates/template-2-preview.jpg',
  category: 'modern',
  features: [
    'Busca Avançada de Propriedades',
    'Vídeo de Apresentação',
    'Integração com WhatsApp',
    'Carregamento Dinâmico',
    'Seções de Venda e Aluguel',
    'Otimizado para Mobile',
  ],
};

// Registro de templates
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

/**
 * Retorna um template registrado pelo ID
 */
export function getTemplate(templateId: string): RegisteredTemplate | null {
  return TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * Retorna todos os templates disponíveis
 */
export function getAllTemplates(): RegisteredTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Retorna apenas os metadados dos templates (para listagem)
 */
export function getTemplatesMetadata(): TemplateMetadata[] {
  return Object.values(TEMPLATE_REGISTRY).map(t => t.metadata);
}

/**
 * Verifica se um template existe
 */
export function templateExists(templateId: string): boolean {
  return !!TEMPLATE_REGISTRY[templateId];
}
