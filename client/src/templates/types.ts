/**
 * Types and Interfaces for Website Templates System
 */

export interface TemplateConfig {
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    videoUrl?: string; // Para Template 2 - YouTube embed URL
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
    whatsapp?: string; // Ex: "5511999999999" (sem + e sem espaços)
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };

  // Sections Visibility (controla quais seções aparecem)
  sections: {
    showAgents: boolean; // Template 1 tem, Template 2 não
    showTestimonials: boolean; // Template 1 tem, Template 2 não
    showContactForm: boolean; // Template 1 tem, Template 2 não
    showWhatsappCTA: boolean; // Template 2 tem, Template 1 não
  };

  // Properties Display
  properties: {
    featuredCount: number; // Quantas propriedades mostrar em destaque
    layout: 'grid' | 'carousel'; // Template 1 usa grid, Template 2 pode usar carousel
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
  agents?: Agent[];
  testimonials?: Testimonial[];
  whatsappInstance?: WhatsappInstance;
}

export interface TemplateMetadata {
  id: string; // "template-1", "template-2"
  name: string; // "Classic Real Estate", "Modern FindHouse"
  description: string;
  thumbnail: string; // URL da imagem de preview
  category: string; // "classic", "modern", "luxury"
  features: string[]; // ["Property Search", "Featured Listings", "Agent Profiles"]
}

// Types importados do sistema principal
export interface Company {
  id: string;
  name: string;
  email: string | null;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  companyId: string;
  title: string;
  description: string;
  price: number;
  priceType: string; // "sale" | "rent" | "month"
  type: string; // "house" | "apartment" | "commercial"
  status: string; // "available" | "sold" | "rented"
  featured: number; // 0 ou 1
  location: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string; // URL da imagem principal
  images?: string; // JSON array de URLs
  amenities?: string; // JSON array de amenities
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string; // "Senior Agent", "Property Specialist"
  bio?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
  };
  propertiesSold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  companyId: string;
  clientName: string;
  clientAvatar?: string;
  rating: number; // 1-5
  comment: string;
  propertyType?: string; // "House", "Apartment"
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappInstance {
  id: string;
  companyId: string;
  instanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}
