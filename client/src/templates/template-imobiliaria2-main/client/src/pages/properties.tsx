import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import type { Property } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Properties() {
  const searchParams = new URLSearchParams(useSearch());
  const typeParam = searchParams.get("type");
  const locationParam = searchParams.get("location") || "";
  const keywordParam = searchParams.get("keyword") || "";
  const priceRangeParam = searchParams.get("priceRange") || "all";

  const [filters, setFilters] = useState({
    type: typeParam || "all",
    location: locationParam,
    keyword: keywordParam,
    priceRange: priceRangeParam
  });

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type !== "all") params.set("type", filters.type);
      if (filters.location) params.set("location", filters.location);
      if (filters.keyword) params.set("keyword", filters.keyword);
      
      if (filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-");
        if (min) params.set("minPrice", min);
        if (max) params.set("maxPrice", max);
      }

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    }
  });

  const formatPrice = (price: number, priceType: string) => {
    return priceType === "month" 
      ? `$${price.toLocaleString()} / month` 
      : `$${price.toLocaleString()}`;
  };

  return (
    <main className="bg-white font-['Poppins',_sans-serif] text-gray-800">
      <Header />
      
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-properties-title">
            Property Listings
          </h1>
          <p className="text-gray-600" data-testid="text-properties-subtitle">
            {properties.length} properties found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-xl font-bold mb-6" data-testid="text-filters-title">Filters</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Type</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  data-testid="select-filter-type"
                >
                  <option value="all">All Types</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Location</label>
                <input 
                  type="text"
                  placeholder="Enter location..."
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  data-testid="input-filter-location"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Keyword</label>
                <input 
                  type="text"
                  placeholder="Search keyword..."
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  data-testid="input-filter-keyword"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  value={filters.priceRange}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                  data-testid="select-filter-price"
                >
                  <option value="all">All Prices</option>
                  <option value="0-100000">Under $100k</option>
                  <option value="100000-500000">$100k - $500k</option>
                  <option value="500000-1000000">$500k - $1M</option>
                  <option value="1000000-99999999">Over $1M</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ type: "all", location: "", keyword: "", priceRange: "all" })}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">No properties found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Link 
                    key={property.id} 
                    href={`/property/${property.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div className="relative">
                      <img 
                        src={property.image} 
                        alt={property.title} 
                        className="w-full h-48 object-cover"
                        data-testid={`img-property-${property.id}`}
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
                      <button 
                        className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        data-testid={`button-favorite-${property.id}`}
                      >
                        <span className="iconify text-gray-600" data-icon="mdi:heart-outline"></span>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-500 font-bold text-xl" data-testid={`text-price-${property.id}`}>
                          {formatPrice(property.price, property.priceType)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2" data-testid={`text-title-${property.id}`}>
                        {property.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 flex items-center" data-testid={`text-location-${property.id}`}>
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
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
