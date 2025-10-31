export default function CTASection() {
  return (
    <section className="relative cta-bg h-[450px]" data-testid="section-cta">
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-cta-title">
          Let's find the right selling option for you
        </h2>
        <p className="text-lg text-gray-200 mb-8" data-testid="text-cta-subtitle">
          Properties are available at great prices for you
        </p>
        <button 
          className="bg-red-500 px-10 py-4 rounded-lg font-semibold text-lg hover:bg-red-600 transition-colors"
          data-testid="button-get-started"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}
