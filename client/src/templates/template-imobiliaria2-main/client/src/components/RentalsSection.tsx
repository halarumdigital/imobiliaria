import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Property } from "@shared/schema";

export default function RentalsSection() {
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    select: (data) => data.filter(p => p.type === 'rent').slice(0, 8),
  });

  const formatPrice = (price: number, priceType: string) => {
    return priceType === "month" 
      ? `$${price.toLocaleString()} / month` 
      : `$${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <section className="py-20" data-testid="section-rentals">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Rentals</h2>
              <p className="text-gray-500 mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" data-testid="section-rentals">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold" data-testid="text-rentals-title">Rentals</h2>
            <p className="text-gray-500 mt-1" data-testid="text-rentals-subtitle">
              Handpicked properties by our team.
            </p>
          </div>
          <Link href="/properties?type=rent" className="text-gray-800 font-medium flex items-center" data-testid="link-view-all-rentals">
            View All
            <span className="iconify ml-1" data-icon="mdi:arrow-right"></span>
          </Link>
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link key={property.id} href={`/property/${property.id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-rental-${property.id}`}>
                <div className="relative">
                  <img 
                    src={property.image} 
                    alt={property.title} 
                    className="w-full h-48 object-cover"
                    data-testid={`img-rental-${property.id}`}
                  />
                  <div className="absolute top-2 left-2 flex space-x-1">
                    <span className={`${property.type === 'sale' ? 'bg-red-500' : 'bg-[#3B445A]'} text-white text-xs font-semibold px-2 py-1 rounded`}>
                      For {property.type === 'sale' ? 'Sale' : 'Rent'}
                    </span>
                    {property.featured === 1 && (
                      <span className={`${property.type === 'sale' ? 'bg-[#3B445A]' : 'bg-red-500'} text-white text-xs font-semibold px-2 py-1 rounded`}>
                        Featured
                      </span>
                    )}
                  </div>
                  <button className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-full" data-testid={`button-favorite-rental-${property.id}`}>
                    <span className="iconify text-gray-600" data-icon="mdi:heart-outline"></span>
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-500 font-bold text-xl" data-testid={`text-rental-price-${property.id}`}>
                      {formatPrice(property.price, property.priceType)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2" data-testid={`text-rental-title-${property.id}`}>{property.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 flex items-center" data-testid={`text-rental-location-${property.id}`}>
                    <span className="iconify mr-1" data-icon="mdi:map-marker"></span>
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                    <div className="flex items-center">
                      <span className="iconify mr-1" data-icon="mdi:bed"></span>
                      <span>{property.beds} Bed</span>
                    </div>
                    <div className="flex items-center">
                      <span className="iconify mr-1" data-icon="mdi:shower"></span>
                      <span>{property.baths} Bath</span>
                    </div>
                    <div className="flex items-center">
                      <span className="iconify mr-1" data-icon="mdi:ruler-square"></span>
                      <span>{property.sqft} sqft</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
