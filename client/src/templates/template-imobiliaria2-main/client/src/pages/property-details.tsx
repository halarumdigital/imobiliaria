import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Property } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${params.id}`);
      if (!response.ok) throw new Error("Property not found");
      return response.json();
    },
    enabled: !!params.id
  });

  const formatPrice = (price: number, priceType: string) => {
    return priceType === "month" 
      ? `$${price.toLocaleString()} / month` 
      : `$${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
        <Header />
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <p className="text-center text-gray-500">Loading property...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!property) {
    return (
      <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
        <Header />
        <div className="container mx-auto px-4 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
          <Link href="/properties" className="text-red-500 hover:underline">
            Back to Properties
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const allImages = [property.image, ...property.images.slice(1)];

  return (
    <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
      <Header />

      <div className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <Link href="/properties" className="text-gray-600 hover:text-gray-900 flex items-center" data-testid="link-back">
            <span className="iconify mr-1" data-icon="mdi:arrow-left"></span>
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="relative">
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={property.title}
                  className="w-full h-[500px] object-cover"
                  data-testid="img-main-property"
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className={`${property.type === 'sale' ? 'bg-red-500' : 'bg-[#3B445A]'} text-white px-4 py-2 rounded font-semibold`}>
                    For {property.type === 'sale' ? 'Sale' : 'Rent'}
                  </span>
                  {property.featured === 1 && (
                    <span className={`${property.type === 'sale' ? 'bg-[#3B445A]' : 'bg-red-500'} text-white px-4 py-2 rounded font-semibold`}>
                      Featured
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 ${currentImageIndex === index ? 'ring-2 ring-red-500' : ''}`}
                    data-testid={`button-gallery-${index}`}
                  >
                    <img 
                      src={img} 
                      alt={`View ${index + 1}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-property-title">{property.title}</h1>
              <p className="text-gray-600 mb-4 flex items-center" data-testid="text-property-address">
                <span className="iconify mr-2" data-icon="mdi:map-marker"></span>
                {property.address}
              </p>
              
              <div className="flex items-center space-x-8 mb-6 pb-6 border-b">
                <div className="flex items-center text-gray-700">
                  <span className="iconify mr-2 text-2xl" data-icon="mdi:bed"></span>
                  <span className="font-semibold">{property.beds} Bedrooms</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="iconify mr-2 text-2xl" data-icon="mdi:shower"></span>
                  <span className="font-semibold">{property.baths} Bathrooms</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="iconify mr-2 text-2xl" data-icon="mdi:ruler-square"></span>
                  <span className="font-semibold">{property.sqft} sqft</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed" data-testid="text-property-description">
                  {property.description}
                </p>
              </div>

              {property.amenities.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center bg-gray-50 p-3 rounded"
                        data-testid={`amenity-${index}`}
                      >
                        <span className="iconify mr-2 text-red-500" data-icon="mdi:check-circle"></span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold text-red-500" data-testid="text-property-price">
                  {formatPrice(property.price, property.priceType)}
                </p>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600" data-testid="button-contact">
                  Contact Agent
                </button>
                <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200" data-testid="button-schedule">
                  Schedule Tour
                </button>
                <button className="w-full border border-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center" data-testid="button-save">
                  <span className="iconify mr-2" data-icon="mdi:heart-outline"></span>
                  Save Property
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Property Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="font-medium">{property.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{property.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{property.sqft} sqft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrooms:</span>
                    <span className="font-medium">{property.beds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bathrooms:</span>
                    <span className="font-medium">{property.baths}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
