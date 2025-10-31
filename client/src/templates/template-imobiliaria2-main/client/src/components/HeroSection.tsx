import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SearchFormData {
  keyword: string;
  type: string;
  location: string;
  priceRange: string;
}

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [videoOpen, setVideoOpen] = useState(false);
  const [searchData, setSearchData] = useState<SearchFormData>({
    keyword: "",
    type: "all",
    location: "",
    priceRange: "all"
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.keyword) params.set("keyword", searchData.keyword);
    if (searchData.type !== "all") params.set("type", searchData.type);
    if (searchData.location) params.set("location", searchData.location);
    if (searchData.priceRange !== "all") params.set("priceRange", searchData.priceRange);
    
    setLocation(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative hero-bg h-[600px]" data-testid="section-hero">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold" data-testid="text-hero-title">
          Your Property, Our Priority.
        </h1>
        <p className="mt-4 text-lg text-gray-300" data-testid="text-hero-subtitle">
          From as low as $10 per day with limited time offer discounts
        </p>
        <div className="mt-8 flex space-x-4">
          <button 
            className="bg-red-500 px-8 py-3 rounded-md font-semibold hover:bg-red-600 transition-colors"
            data-testid="button-buy"
            onClick={() => setLocation("/properties?type=sale")}
          >
            Buy
          </button>
          <button 
            className="bg-white text-gray-800 px-8 py-3 rounded-md font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
            data-testid="button-rent"
            onClick={() => setLocation("/properties?type=rent")}
          >
            Rent
          </button>
        </div>
        <div className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2">
          <button 
            className="bg-red-500 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
            data-testid="button-play-video"
            onClick={() => setVideoOpen(true)}
          >
            <span className="iconify text-4xl" data-icon="mdi:play"></span>
          </button>
        </div>
      </div>

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Property Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
      <div className="relative z-20 container mx-auto px-4 lg:px-8 -mt-20">
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-lg" data-testid="form-search">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            <div className="lg:col-span-1">
              <input 
                type="text" 
                placeholder="Enter keyword..." 
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                data-testid="input-keyword"
                value={searchData.keyword}
                onChange={(e) => setSearchData({ ...searchData, keyword: e.target.value })}
              />
            </div>
            <div className="relative">
              <select 
                className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-red-500"
                data-testid="select-property-type"
                value={searchData.type}
                onChange={(e) => setSearchData({ ...searchData, type: e.target.value })}
              >
                <option value="all">All Types</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              <span className="iconify text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" data-icon="mdi:chevron-down"></span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Location" 
                className="w-full p-3 border border-gray-200 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                data-testid="input-location"
                value={searchData.location}
                onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
              />
              <span className="iconify text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" data-icon="mdi:map-marker-outline"></span>
            </div>
            <div className="relative">
              <select 
                className="w-full p-3 border border-gray-200 rounded-lg appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-red-500"
                data-testid="select-price"
                value={searchData.priceRange}
                onChange={(e) => setSearchData({ ...searchData, priceRange: e.target.value })}
              >
                <option value="all">All Prices</option>
                <option value="0-100000">Under $100k</option>
                <option value="100000-500000">$100k - $500k</option>
                <option value="500000-1000000">$500k - $1M</option>
                <option value="1000000-99999999">Over $1M</option>
              </select>
              <span className="iconify text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" data-icon="mdi:chevron-down"></span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <a href="#" className="text-gray-600 hover:text-gray-900 col-span-1 flex items-center" data-testid="link-advanced">
                <span className="iconify" data-icon="mdi:dots-horizontal"></span>
                <span className="ml-1 text-sm">Advanced</span>
              </a>
              <button 
                type="submit"
                className="col-span-2 bg-[#3B445A] text-white p-3 rounded-lg font-medium hover:bg-opacity-90 w-full"
                data-testid="button-search"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
