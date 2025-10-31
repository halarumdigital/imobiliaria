import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedProperties from "@/components/featured-properties";
import WhyChooseUs from "@/components/why-choose-us";
import RecentProperties from "@/components/recent-properties";
import TopAgents from "@/components/top-agents";
import Testimonials from "@/components/testimonials";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <div className="bg-white">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturedProperties />
        <WhyChooseUs />
        <RecentProperties />
        <TopAgents />
        <Testimonials />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
