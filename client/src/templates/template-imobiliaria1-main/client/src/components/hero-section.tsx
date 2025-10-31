import { useState } from "react";

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState("sale");
  const [searchData, setSearchData] = useState({
    keyword: "",
    propertyType: "",
    location: ""
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted:", searchData);
  };

  return (
    <section className="relative text-white" style={{ minHeight: "600px" }}>
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=700&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="relative container mx-auto px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Find Your Dream Plaza!
          </h1>
          <p className="mt-4 text-lg">We Have Over Million Properties For You.</p>
          
          {/* Tab Buttons */}
          <div className="mt-8 flex justify-center space-x-2">
            <button 
              className={`px-8 py-3 rounded-t-lg font-semibold transition-colors ${
                activeTab === "sale" 
                  ? "bg-red-500 text-white" 
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("sale")}
              data-testid="tab-for-sale"
            >
              For Sale
            </button>
            <button 
              className={`px-8 py-3 rounded-t-lg font-semibold transition-colors ${
                activeTab === "rent" 
                  ? "bg-red-500 text-white" 
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("rent")}
              data-testid="tab-for-rent"
            >
              For Rent
            </button>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white p-4 rounded-b-lg rounded-tr-lg shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <input 
                type="text" 
                placeholder="Enter Keyword..." 
                className="col-span-1 md:col-span-1 border-r border-gray-200 py-3 px-4 text-gray-700 outline-none"
                value={searchData.keyword}
                onChange={(e) => setSearchData({...searchData, keyword: e.target.value})}
                data-testid="input-keyword"
              />
              <select 
                className="col-span-1 md:col-span-1 border-r border-gray-200 py-3 px-4 text-gray-500 outline-none bg-white"
                value={searchData.propertyType}
                onChange={(e) => setSearchData({...searchData, propertyType: e.target.value})}
                data-testid="select-property-type"
              >
                <option value="">Property Type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
              </select>
              <select 
                className="col-span-1 md:col-span-1 border-r border-gray-200 py-3 px-4 text-gray-500 outline-none bg-white"
                value={searchData.location}
                onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                data-testid="select-location"
              >
                <option value="">Location</option>
                <option value="newyork">New York</option>
                <option value="losangeles">Los Angeles</option>
                <option value="chicago">Chicago</option>
              </select>
              <div className="col-span-1 md:col-span-1 flex items-center justify-center py-3 px-4">
                <a href="#" className="text-gray-500 flex items-center hover:text-red-500 transition-colors" data-testid="link-advanced-search">
                  <i className="fas fa-sliders-h mr-2 text-red-500"></i>
                  Advanced Search
                </a>
              </div>
              <button 
                type="submit"
                className="col-span-1 md:col-span-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-md hover:bg-red-600 transition-colors"
                data-testid="button-search"
              >
                Search Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
