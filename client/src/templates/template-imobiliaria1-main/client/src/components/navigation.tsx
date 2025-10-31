import { useState } from "react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <i className="fas fa-city text-red-500 text-4xl"></i>
            <span className="text-2xl font-bold text-gray-800">Find House</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-home">
              Home <i className="fas fa-chevron-down text-xs ml-1"></i>
            </a>
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-listing">
              Listing <i className="fas fa-chevron-down text-xs ml-1"></i>
            </a>
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-property">
              Property <i className="fas fa-chevron-down text-xs ml-1"></i>
            </a>
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-pages">
              Pages <i className="fas fa-chevron-down text-xs ml-1"></i>
            </a>
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-blog">
              Blog <i className="fas fa-chevron-down text-xs ml-1"></i>
            </a>
            <a href="#" className="nav-link text-gray-600 font-medium" data-testid="nav-contact">
              Contact
            </a>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              className="text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars text-3xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
