export default function WhyChooseUs() {
  const features = [
    {
      icon: "mdi:check-decagram",
      title: "Trusted By Thousands",
      description: "With over 1 million+ homes for sale available on the website, FindHouse can match you with a house you will want to call home."
    },
    {
      icon: "mdi:home-city",
      title: "Wide Range Of Properties",
      description: "With over 1 million+ homes for sale available on the website, FindHouse can match you with a house you will want to call home."
    },
    {
      icon: "mdi:currency-usd",
      title: "Financing Made Easy",
      description: "With over 1 million+ homes for sale available on the website, FindHouse can match you with a house you will want to call home."
    }
  ];

  return (
    <section className="py-20 bg-gray-50" data-testid="section-why-choose-us">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold" data-testid="text-why-choose-title">Why Choose Us?</h2>
          <p className="text-gray-500 mt-2" data-testid="text-why-choose-subtitle">We provide full service at every step.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-lg text-center shadow-sm" data-testid={`card-feature-${index}`}>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="iconify text-red-500 text-3xl" data-icon={feature.icon}></span>
              </div>
              <h3 className="font-semibold text-xl mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
              <p className="text-gray-600 text-sm" data-testid={`text-feature-description-${index}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
