const features = [
  {
    id: 1,
    icon: "fas fa-home",
    title: "Wide Range of Properties",
    description: "We offer expert legal help for all related property items in Dubai."
  },
  {
    id: 2,
    icon: "fas fa-dollar-sign",
    title: "Trusted By Thousands",
    description: "We offer you free consultancy to get a loan for your new home."
  },
  {
    id: 3,
    icon: "fas fa-chart-line",
    title: "Financing Made Easy",
    description: "Our experts are available 24/7 to help you with your property needs."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            Why Choose Us
          </h2>
          <p className="text-gray-500 mt-2">We provide full service at every step</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.id} className="text-center p-6" data-testid={`feature-${feature.id}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <i className={`${feature.icon} text-red-500 text-3xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
