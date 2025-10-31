export default function Header() {
  return (
    <header className="bg-white shadow-sm" data-testid="header-main">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a href="#" className="flex items-center space-x-2" data-testid="link-logo">
              <span className="iconify text-red-500 text-3xl" data-icon="mdi:home-map-marker"></span>
              <span className="text-2xl font-bold text-gray-800">FindHouse</span>
            </a>
          </div>
          <nav className="hidden lg:flex items-center space-x-8" data-testid="nav-desktop">
            <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-home">
              Home
              <span className="iconify ml-1" data-icon="mdi:chevron-down"></span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-listing">
              Listing
              <span className="iconify ml-1" data-icon="mdi:chevron-down"></span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-property">
              Property
              <span className="iconify ml-1" data-icon="mdi:chevron-down"></span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-pages">
              Pages
              <span className="iconify ml-1" data-icon="mdi:chevron-down"></span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900" data-testid="link-blog">Blog</a>
            <a href="#" className="text-gray-600 hover:text-gray-900" data-testid="link-contact">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-login">
              <span className="iconify text-2xl mr-1" data-icon="mdi:account-outline"></span>
              <span className="hidden md:inline">Login/Register</span>
            </a>
            <a 
              href="#" 
              className="bg-[#3B445A] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              data-testid="button-create-listing"
            >
              + Create Listing
            </a>
          </div>
          <div className="lg:hidden">
            <button className="text-gray-600" data-testid="button-mobile-menu">
              <span className="iconify text-3xl" data-icon="mdi:menu"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
