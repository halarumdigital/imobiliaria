/**
 * Template 2: Modern FindHouse
 * Template moderno e dinâmico com foco em usabilidade
 */

import { useState } from 'react';
import { TemplateProps } from './types';
import { formatPrice, formatWhatsAppLink } from './utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function Template2Modern({
  config,
  company,
  properties = [],
  agents = [],
  testimonials = [],
  whatsappInstance,
}: TemplateProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const featuredProperties = properties.filter(p => p.featured).slice(0, config.properties.featuredCount);
  const saleProperties = properties.filter(p => p.transactionType === 'venda').slice(0, 3);
  const rentProperties = properties.filter(p => p.transactionType === 'locacao').slice(0, 3);
  const activeAgents = config.sections.showAgents ? agents.filter(a => a.isActive) : [];
  const activeTestimonials = config.sections.showTestimonials ? testimonials.filter(t => t.isActive) : [];

  return (
    <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {config.branding.logo && (
                <img
                  src={config.branding.logo}
                  alt={config.branding.companyName}
                  className="h-10 w-auto mr-3"
                />
              )}
              <span className="text-xl font-bold" style={{ color: config.branding.primaryColor }}>
                {config.branding.companyName}
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#home" className="text-gray-700 hover:text-red-500">Home</a>
              <a href="#featured" className="text-gray-700 hover:text-red-500">Destaques</a>
              {config.sections.showAgents && <a href="#agents" className="text-gray-700 hover:text-red-500">Corretores</a>}
              {config.sections.showTestimonials && <a href="#testimonials" className="text-gray-700 hover:text-red-500">Depoimentos</a>}
              {config.sections.showContactForm && <a href="#contact" className="text-gray-700 hover:text-red-500">Contato</a>}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative h-[600px]"
        style={{
          backgroundImage: `url('${config.hero.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold">
            {config.hero.title}
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            {config.hero.subtitle}
          </p>

          {/* Video Button (if video URL is configured) */}
          {config.hero.videoUrl && (
            <div className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2">
              <button
                className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.branding.primaryColor }}
                onClick={() => setVideoOpen(true)}
              >
                <i className="fas fa-play text-3xl ml-1"></i>
              </button>
            </div>
          )}
        </div>

        {/* Video Dialog */}
        {config.hero.videoUrl && (
          <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
            <DialogContent className="max-w-4xl">
              <iframe
                src={config.hero.videoUrl}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </DialogContent>
          </Dialog>
        )}
      </section>

      {/* Featured Properties */}
      <section id="featured" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Propriedades em Destaque</h2>
              <p className="text-gray-500 mt-1">Selecionadas especialmente para você</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property) => {
              const images = Array.isArray(property.images) ? property.images : [];
              const firstImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';

              return (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={firstImage}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 flex space-x-1">
                      <span
                        className="text-white text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          backgroundColor: property.transactionType === 'locacao' ? '#3B445A' : config.branding.primaryColor
                        }}
                      >
                        {property.transactionType === 'locacao' ? 'Para Alugar' : 'Para Venda'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xl" style={{ color: config.branding.primaryColor }}>
                        {formatPrice(property.price, property.transactionType)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    {property.neighborhood && (
                      <p className="text-gray-500 text-sm mb-4 flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {property.neighborhood}, {property.city}
                      </p>
                    )}
                    <div className="flex items-center text-gray-500 text-sm space-x-4">
                      {property.bedrooms && (
                        <span className="flex items-center">
                          <i className="fas fa-bed mr-1"></i>
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center">
                          <i className="fas fa-bath mr-1"></i>
                          {property.bathrooms}
                        </span>
                      )}
                      {property.privateArea && (
                        <span className="flex items-center">
                          <i className="fas fa-ruler-combined mr-1"></i>
                          {property.privateArea}m²
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sale Properties Section */}
      {saleProperties.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Imóveis à Venda</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {saleProperties.map((property) => {
                const images = Array.isArray(property.images) ? property.images : [];
                const firstImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';

                return (
                  <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={firstImage}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                      <p className="font-bold text-xl mb-2" style={{ color: config.branding.primaryColor }}>
                        {formatPrice(property.price, property.transactionType)}
                      </p>
                      <div className="flex items-center text-gray-500 text-sm space-x-4">
                        {property.bedrooms && <span><i className="fas fa-bed mr-1"></i>{property.bedrooms}</span>}
                        {property.bathrooms && <span><i className="fas fa-bath mr-1"></i>{property.bathrooms}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Rental Properties Section */}
      {rentProperties.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Imóveis para Alugar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rentProperties.map((property) => {
                const images = Array.isArray(property.images) ? property.images : [];
                const firstImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';

                return (
                  <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={firstImage}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                      <p className="font-bold text-xl mb-2" style={{ color: config.branding.primaryColor }}>
                        {formatPrice(property.price, property.transactionType)}
                      </p>
                      <div className="flex items-center text-gray-500 text-sm space-x-4">
                        {property.bedrooms && <span><i className="fas fa-bed mr-1"></i>{property.bedrooms}</span>}
                        {property.bathrooms && <span><i className="fas fa-bath mr-1"></i>{property.bathrooms}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      {config.sections.showWhatsappCTA && config.contact.whatsapp && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <a
              href={formatWhatsAppLink(config.contact.whatsapp, `Olá! Vim pelo site ${config.branding.companyName}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <i className="fab fa-whatsapp text-3xl"></i>
              FALE CONOSCO
            </a>
          </div>
        </section>
      )}

      {/* Agents Section */}
      {config.sections.showAgents && activeAgents.length > 0 && (
        <section id="agents" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800">Nossos Corretores</h2>
              <p className="text-gray-500 mt-2">Equipe especializada para atender você</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeAgents.map((agent) => (
                <div key={agent.id} className="text-center bg-white p-6 rounded-lg shadow-md">
                  <img
                    src={agent.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(agent.name)}
                    alt={agent.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-800">{agent.name}</h3>
                  {agent.role && <p className="text-gray-500 text-sm">{agent.role}</p>}
                  {agent.propertiesSold > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{agent.propertiesSold} imóveis vendidos</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {config.sections.showTestimonials && activeTestimonials.length > 0 && (
        <section id="testimonials" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800">Depoimentos</h2>
              <p className="text-gray-500 mt-2">O que dizem nossos clientes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activeTestimonials.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.clientAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.clientName)}
                      alt={testimonial.clientName}
                      className="w-14 h-14 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">{testimonial.clientName}</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star text-sm ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: config.branding.primaryColor }}>
                {config.branding.companyName}
              </h3>
              <p className="text-gray-400">{config.contact.address}</p>
              <p className="text-gray-400 mt-2">{config.contact.phone}</p>
              <p className="text-gray-400">{config.contact.email}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="text-gray-400 space-y-2">
                <li><a href="#featured" className="hover:text-white">Imóveis</a></li>
                {config.sections.showAgents && <li><a href="#agents" className="hover:text-white">Corretores</a></li>}
                {config.sections.showTestimonials && <li><a href="#testimonials" className="hover:text-white">Depoimentos</a></li>}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Redes Sociais</h4>
              <div className="flex space-x-4">
                {config.contact.socialMedia?.facebook && (
                  <a href={config.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <i className="fab fa-facebook text-2xl"></i>
                  </a>
                )}
                {config.contact.socialMedia?.instagram && (
                  <a href={config.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <i className="fab fa-instagram text-2xl"></i>
                  </a>
                )}
                {config.contact.socialMedia?.linkedin && (
                  <a href={config.contact.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <i className="fab fa-linkedin text-2xl"></i>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {config.branding.companyName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Font Awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </main>
  );
}
