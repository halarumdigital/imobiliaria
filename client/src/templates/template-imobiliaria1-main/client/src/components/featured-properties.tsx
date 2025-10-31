const featuredProperties = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    title: "Luxury House in New York",
    price: "$230,000",
    status: "FOR SALE",
    statusColor: "bg-red-500",
    bedrooms: 6,
    bathrooms: 9,
    garages: 2,
    sqft: "3500 Sq Ft"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
    title: "Modern Villa in Los Angeles",
    price: "$450,000",
    status: "FOR SALE",
    statusColor: "bg-red-500",
    bedrooms: 5,
    bathrooms: 6,
    garages: 3,
    sqft: "4200 Sq Ft"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
    title: "Family Home in Chicago",
    price: "$3,200/mo",
    status: "FOR RENT",
    statusColor: "bg-green-500",
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    sqft: "2800 Sq Ft"
  }
];

export default function FeaturedProperties() {
  return (
    <section className="py-20 dotted-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            Featured Properties
          </h2>
          <p className="text-gray-500 mt-2">These are our featured properties</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden property-card" data-testid={`card-featured-property-${property.id}`}>
              <div className="relative">
                <img 
                  src={property.image} 
                  alt={property.title} 
                  className="w-full h-64 object-cover" 
                />
                <div className={`absolute top-4 left-4 ${property.statusColor} text-white text-xs font-bold px-3 py-1 rounded`}>
                  {property.status}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {property.title}
                </h3>
                <p className="text-red-500 font-bold text-lg mt-2">{property.price}</p>
                <div className="mt-4 flex items-center text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <i className="fas fa-bed mr-1.5 text-red-500"></i>
                    {property.bedrooms} Br
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-shower mr-1.5 text-red-500"></i>
                    {property.bathrooms} Ba
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-warehouse mr-1.5 text-red-500"></i>
                    {property.garages} Gr
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-expand mr-1.5 text-red-500"></i>
                    {property.sqft}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
