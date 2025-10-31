export default function Footer() {
  return (
    <footer className="bg-[#1E2738] text-white py-16" data-testid="footer-main">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4" data-testid="footer-logo">
              <span className="iconify text-red-500 text-3xl" data-icon="mdi:home-map-marker"></span>
              <span className="text-2xl font-bold">FindHouse</span>
            </div>
            <p className="text-gray-400 text-sm mb-4" data-testid="text-footer-description">
              We're reimagining how you buy, sell and rent. It's now easier to get into a place you love. So let's do this, together.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4" data-testid="text-quick-links-title">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white" data-testid="link-about">About Us</a></li>
              <li><a href="#" className="hover:text-white" data-testid="link-terms">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white" data-testid="link-guide">User's Guide</a></li>
              <li><a href="#" className="hover:text-white" data-testid="link-support">Support Center</a></li>
              <li><a href="#" className="hover:text-white" data-testid="link-press">Press Info</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4" data-testid="text-contact-title">Contact</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start" data-testid="text-address">
                <span className="iconify mr-2 mt-1" data-icon="mdi:map-marker"></span>
                <span>329 Queensberry Street, North Melbourne VIC 3051, Australia.</span>
              </li>
              <li className="flex items-center" data-testid="text-phone">
                <span className="iconify mr-2" data-icon="mdi:phone"></span>
                <span>123 456 7890</span>
              </li>
              <li className="flex items-center" data-testid="text-email">
                <span className="iconify mr-2" data-icon="mdi:email"></span>
                <span>support@findhouse.com</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4" data-testid="text-social-title">Follow Us</h4>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="bg-gray-700 hover:bg-red-500 w-10 h-10 rounded flex items-center justify-center transition-colors"
                data-testid="link-facebook"
              >
                <span className="iconify text-xl" data-icon="mdi:facebook"></span>
              </a>
              <a 
                href="#" 
                className="bg-gray-700 hover:bg-red-500 w-10 h-10 rounded flex items-center justify-center transition-colors"
                data-testid="link-twitter"
              >
                <span className="iconify text-xl" data-icon="mdi:twitter"></span>
              </a>
              <a 
                href="#" 
                className="bg-gray-700 hover:bg-red-500 w-10 h-10 rounded flex items-center justify-center transition-colors"
                data-testid="link-instagram"
              >
                <span className="iconify text-xl" data-icon="mdi:instagram"></span>
              </a>
              <a 
                href="#" 
                className="bg-gray-700 hover:bg-red-500 w-10 h-10 rounded flex items-center justify-center transition-colors"
                data-testid="link-linkedin"
              >
                <span className="iconify text-xl" data-icon="mdi:linkedin"></span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm" data-testid="text-copyright">
          <p>&copy; 2024 FindHouse. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
