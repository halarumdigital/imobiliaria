const testimonials = [
  {
    id: 1,
    name: "David Wilson",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop",
    text: "Excellent service! They helped me find my dream home within my budget. The team was very professional and responsive."
  },
  {
    id: 2,
    name: "Jessica Martinez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
    text: "Great experience working with Find House. They made the entire buying process smooth and stress-free. Highly recommended!"
  },
  {
    id: 3,
    name: "Robert Taylor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop",
    text: "Outstanding professionalism and expertise. They found me the perfect investment property. I will definitely use their services again."
  }
];

const partners = ["REALTOR®", "NAR", "MLS", "ZILLOW", "TRULIA"];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            What Our Clients Say
          </h2>
          <p className="text-gray-500 mt-2">Read testimonials from our satisfied customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-8" data-testid={`testimonial-${testimonial.id}`}>
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt="Client testimonial" 
                  className="w-16 h-16 rounded-full object-cover" 
                />
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                  <div className="text-yellow-400">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
        
        {/* Partner Logos */}
        <div className="mt-16">
          <h3 className="text-center text-2xl font-semibold text-gray-800 mb-8">Our Trusted Partners</h3>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {partners.map((partner) => (
              <div key={partner} className="text-gray-400 text-4xl font-bold" data-testid={`partner-${partner.toLowerCase()}`}>
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
