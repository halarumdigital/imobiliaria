const recentProperties = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop",
    title: "Downtown Apartment",
    price: "$180,000",
    status: "FOR SALE",
    bedrooms: 3,
    bathrooms: 2,
    sqft: "1800 Sq Ft"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&h=200&fit=crop",
    title: "Beach House",
    price: "$650,000",
    status: "FOR SALE",
    bedrooms: 5,
    bathrooms: 4,
    sqft: "3200 Sq Ft"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=300&h=200&fit=crop",
    title: "Modern Townhouse",
    price: "$2,800/mo",
    status: "FOR RENT",
    bedrooms: 3,
    bathrooms: 2,
    sqft: "2200 Sq Ft"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop",
    title: "Luxury Penthouse",
    price: "$890,000",
    status: "FOR SALE",
    bedrooms: 4,
    bathrooms: 3,
    sqft: "2800 Sq Ft"
  }
];

export default function RecentProperties() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            Recent Properties
          </h2>
          <p className="text-gray-500 mt-2">These are our newest properties</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden property-card" data-testid={`card-recent-property-${property.id}`}>
              <div className="relative">
                <img 
                  src={property.image} 
                  alt={property.title} 
                  className="w-full h-48 object-cover" 
                />
                <div className={`absolute top-4 left-4 ${property.status === "FOR RENT" ? "bg-green-500" : "bg-red-500"} text-white text-xs font-bold px-3 py-1 rounded`}>
                  {property.status}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{property.title}</h3>
                <p className="text-red-500 font-bold mt-2">{property.price}</p>
                <div className="mt-3 flex items-center text-gray-500 text-sm space-x-3">
                  <span className="flex items-center">
                    <i className="fas fa-bed mr-1 text-red-500"></i>
                    {property.bedrooms}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-shower mr-1 text-red-500"></i>
                    {property.bathrooms}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-expand mr-1 text-red-500"></i>
                    {property.sqft}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <button 
            className="bg-red-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-red-600 transition-colors"
            data-testid="button-view-all-properties"
          >
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
}
