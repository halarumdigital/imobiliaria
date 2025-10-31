import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="relative py-20 text-white" style={{ minHeight: "500px" }}>
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=600&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold">
              Get In Touch
            </h2>
            <p className="mt-2">Have questions? We'd love to hear from you</p>
          </div>
          
          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your Name" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  value={formData.name}
                  onChange={handleChange}
                  data-testid="input-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your Email" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="input-email"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input 
                type="text" 
                name="subject"
                placeholder="Subject" 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                value={formData.subject}
                onChange={handleChange}
                data-testid="input-subject"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea 
                name="message"
                rows={5}
                placeholder="Your Message" 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                value={formData.message}
                onChange={handleChange}
                data-testid="textarea-message"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-red-500 text-white font-semibold py-3 px-6 rounded-md hover:bg-red-600 transition-colors"
              data-testid="button-send-message"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
