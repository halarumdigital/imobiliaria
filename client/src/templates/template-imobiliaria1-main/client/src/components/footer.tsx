const quickLinks = [
  { name: "About Us", href: "#" },
  { name: "Properties", href: "#" },
  { name: "Agents", href: "#" },
  { name: "Blog", href: "#" },
  { name: "Contact", href: "#" }
];

const services = [
  { name: "Property Management", href: "#" },
  { name: "Mortgage Services", href: "#" },
  { name: "Consulting", href: "#" },
  { name: "Home Evaluation", href: "#" },
  { name: "Property Insurance", href: "#" }
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-city text-red-500 text-3xl"></i>
              <span className="text-2xl font-bold text-white">Find House</span>
            </div>
            <p className="text-sm mb-4">Your trusted partner in finding the perfect property. We have over a million properties to choose from.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid="link-facebook">
                <i className="fab fa-facebook-f text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid="link-twitter">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid="link-instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid="link-linkedin">
                <i className="fab fa-linkedin-in text-xl"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-red-500 transition-colors" data-testid={`footer-link-${link.name.toLowerCase().replace(' ', '-')}`}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Our Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <a href={service.href} className="hover:text-red-500 transition-colors" data-testid={`footer-service-${service.name.toLowerCase().replace(' ', '-')}`}>
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt text-red-500 mt-1 mr-3"></i>
                <span>123 Main Street, New York, NY 10001</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone text-red-500 mr-3"></i>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope text-red-500 mr-3"></i>
                <span>info@findhouse.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2024 Find House. All rights reserved. | <a href="#" className="hover:text-red-500 transition-colors" data-testid="link-privacy">Privacy Policy</a> | <a href="#" className="hover:text-red-500 transition-colors" data-testid="link-terms">Terms of Service</a></p>
        </div>
      </div>
    </footer>
  );
}
