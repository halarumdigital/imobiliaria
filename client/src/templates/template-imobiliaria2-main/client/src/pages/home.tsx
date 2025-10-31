import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import WhyChooseUs from "@/components/WhyChooseUs";
import RentalsSection from "@/components/RentalsSection";
import SaleSection from "@/components/SaleSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
      <Header />
      <HeroSection />
      <FeaturedProperties />
      <WhyChooseUs />
      <RentalsSection />
      <SaleSection />
      
      <section className="py-16 bg-gray-50" data-testid="section-whatsapp-cta">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <a 
            href="https://wa.me/5511999999999" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            data-testid="button-whatsapp-cta"
          >
            <span className="iconify text-3xl" data-icon="mdi:whatsapp"></span>
            FALE CONOSCO
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
