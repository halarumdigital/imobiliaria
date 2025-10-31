/**
 * Template 1: Classic Real Estate
 * Template clássico e elegante para imobiliárias
 */

import { TemplateProps } from './types';
import { formatPrice, formatWhatsAppLink } from './utils';

export default function Template1Classic({
  config,
  company,
  properties = [],
  agents = [],
  testimonials = [],
  whatsappInstance,
}: TemplateProps) {
  const featuredProperties = properties.filter(p => p.featured).slice(0, config.properties.featuredCount);
  const activeAgents = config.sections.showAgents ? agents.filter(a => a.isActive) : [];
  const activeTestimonials = config.sections.showTestimonials ? testimonials.filter(t => t.isActive) : [];

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {config.branding.logo && (
                <img
                  src={config.branding.logo}
                  alt={config.branding.companyName}
                  className="h-12 w-auto mr-4"
                />
              )}
              <span className="text-2xl font-bold" style={{ color: config.branding.primaryColor }}>
                {config.branding.companyName}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#home" className="text-gray-700 hover:text-red-500">Home</a>
              <a href="#properties" className="text-gray-700 hover:text-red-500">Propriedades</a>
              {config.sections.showAgents && <a href="#agents" className="text-gray-700 hover:text-red-500">Corretores</a>}
              {config.sections.showTestimonials && <a href="#testimonials" className="text-gray-700 hover:text-red-500">Depoimentos</a>}
              {config.sections.showContactForm && <a href="#contact" className="text-gray-700 hover:text-red-500">Contato</a>}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section
          id="home"
          className="relative text-white"
          style={{ minHeight: "600px" }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${config.hero.backgroundImage}')` }}
          ></div>
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>

          <div className="relative container mx-auto px-4 py-32 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                {config.hero.title}
              </h1>
              <p className="mt-4 text-lg">{config.hero.subtitle}</p>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section id="properties" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800">
                Propriedades em Destaque
              </h2>
              <p className="text-gray-500 mt-2">Confira nossos imóveis selecionados</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => {
                const images = Array.isArray(property.images) ? property.images : [];
                const firstImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop';

                return (
                  <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative">
                      <img
                        src={firstImage}
                        alt={property.title}
                        className="w-full h-64 object-cover"
                      />
                      <div
                        className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded"
                        style={{ backgroundColor: property.transactionType === 'locacao' ? '#10b981' : config.branding.primaryColor }}
                      >
                        {property.transactionType === 'locacao' ? 'PARA ALUGAR' : 'PARA VENDA'}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {property.title}
                      </h3>
                      <p
                        className="font-bold text-lg mt-2"
                        style={{ color: config.branding.primaryColor }}
                      >
                        {formatPrice(property.price, property.transactionType)}
                      </p>
                      <div className="mt-4 flex items-center text-gray-500 space-x-4 text-sm">
                        {property.bedrooms && (
                          <span className="flex items-center">
                            <i className="fas fa-bed mr-1.5" style={{ color: config.branding.primaryColor }}></i>
                            {property.bedrooms} Quartos
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center">
                            <i className="fas fa-shower mr-1.5" style={{ color: config.branding.primaryColor }}></i>
                            {property.bathrooms} Banh.
                          </span>
                        )}
                        {property.parkingSpaces && (
                          <span className="flex items-center">
                            <i className="fas fa-warehouse mr-1.5" style={{ color: config.branding.primaryColor }}></i>
                            {property.parkingSpaces} Vaga
                          </span>
                        )}
                      </div>
                      {property.privateArea && (
                        <div className="mt-2 text-gray-500 text-sm">
                          <i className="fas fa-ruler-combined mr-1.5" style={{ color: config.branding.primaryColor }}></i>
                          {property.privateArea} m²
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Agents Section */}
        {config.sections.showAgents && activeAgents.length > 0 && (
          <section id="agents" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800">
                  Nossos Corretores
                </h2>
                <p className="text-gray-500 mt-2">Conheça nossa equipe especializada</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {activeAgents.map((agent) => (
                  <div key={agent.id} className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={agent.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(agent.name)}
                        alt={agent.name}
                        className="w-48 h-48 rounded-full mx-auto object-cover"
                      />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-800">{agent.name}</h3>
                    {agent.role && <p className="text-gray-500">{agent.role}</p>}
                    {agent.propertiesSold > 0 && (
                      <p className="text-sm text-gray-400 mt-1">{agent.propertiesSold} imóveis vendidos</p>
                    )}
                    <div className="mt-3 flex justify-center space-x-3">
                      {agent.socialMedia?.linkedin && (
                        <a href={agent.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                          <i className="fab fa-linkedin text-xl"></i>
                        </a>
                      )}
                      {agent.socialMedia?.instagram && (
                        <a href={agent.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">
                          <i className="fab fa-instagram text-xl"></i>
                        </a>
                      )}
                    </div>
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
                <h2 className="text-4xl font-bold text-gray-800">
                  Depoimentos
                </h2>
                <p className="text-gray-500 mt-2">O que nossos clientes dizem</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {activeTestimonials.slice(0, 3).map((testimonial) => (
                  <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center mb-4">
                      <img
                        src={testimonial.clientAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.clientName)}
                        alt={testimonial.clientName}
                        className="w-16 h-16 rounded-full mr-4 object-cover"
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
                    {testimonial.propertyType && (
                      <p className="text-sm text-gray-400 mt-3">Tipo: {testimonial.propertyType}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {config.sections.showContactForm && (
          <section id="contact" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Entre em Contato
                </h2>
                <p className="text-gray-500 mb-8">Estamos prontos para ajudar você a encontrar o imóvel perfeito</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6">
                    <i className="fas fa-map-marker-alt text-3xl mb-3" style={{ color: config.branding.primaryColor }}></i>
                    <h3 className="font-semibold text-gray-800 mb-2">Endereço</h3>
                    <p className="text-gray-600">{config.contact.address}</p>
                  </div>
                  <div className="p-6">
                    <i className="fas fa-phone text-3xl mb-3" style={{ color: config.branding.primaryColor }}></i>
                    <h3 className="font-semibold text-gray-800 mb-2">Telefone</h3>
                    <p className="text-gray-600">{config.contact.phone}</p>
                  </div>
                  <div className="p-6">
                    <i className="fas fa-envelope text-3xl mb-3" style={{ color: config.branding.primaryColor }}></i>
                    <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-600">{config.contact.email}</p>
                  </div>
                </div>

                {config.sections.showWhatsappCTA && config.contact.whatsapp && (
                  <a
                    href={formatWhatsAppLink(config.contact.whatsapp, `Olá! Vim pelo site ${config.branding.companyName}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 text-white font-bold text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <i className="fab fa-whatsapp text-3xl"></i>
                    FALE CONOSCO NO WHATSAPP
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: config.branding.primaryColor }}>
                {config.branding.companyName}
              </h3>
              <p className="text-gray-400">{config.contact.address}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <p className="text-gray-400 mb-2">{config.contact.phone}</p>
              <p className="text-gray-400">{config.contact.email}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="text-gray-400 space-y-2">
                <li><a href="#properties" className="hover:text-white">Propriedades</a></li>
                {config.sections.showAgents && <li><a href="#agents" className="hover:text-white">Corretores</a></li>}
                {config.sections.showTestimonials && <li><a href="#testimonials" className="hover:text-white">Depoimentos</a></li>}
                {config.sections.showContactForm && <li><a href="#contact" className="hover:text-white">Contato</a></li>}
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
    </div>
  );
}
