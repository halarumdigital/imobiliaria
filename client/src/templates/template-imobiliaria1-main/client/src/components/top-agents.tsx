const agents = [
  {
    id: 1,
    name: "John Smith",
    role: "Senior Agent",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Real Estate Consultant",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Michael Brown",
    role: "Property Specialist",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=300&h=300&fit=crop"
  },
  {
    id: 4,
    name: "Emily Davis",
    role: "Luxury Property Agent",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop"
  }
];

export default function TopAgents() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">
            Top Real Estate Agents
          </h2>
          <p className="text-gray-500 mt-2">Meet our expert agents ready to help you</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-lg overflow-hidden text-center" data-testid={`card-agent-${agent.id}`}>
              <img 
                src={agent.image} 
                alt={`Agent ${agent.name}`} 
                className="w-full h-64 object-cover" 
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">{agent.name}</h3>
                <p className="text-gray-500 text-sm">{agent.role}</p>
                <div className="mt-4 flex justify-center space-x-3">
                  <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid={`link-facebook-${agent.id}`}>
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid={`link-twitter-${agent.id}`}>
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" data-testid={`link-linkedin-${agent.id}`}>
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
                <button 
                  className="mt-4 bg-red-500 text-white px-6 py-2 rounded-md font-medium hover:bg-red-600 transition-colors w-full"
                  data-testid={`button-contact-agent-${agent.id}`}
                >
                  Contact Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
