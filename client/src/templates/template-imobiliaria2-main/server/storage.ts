import { type User, type InsertUser, type Property, type InsertProperty } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getProperties(filters?: {
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
  }): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private properties: Map<string, Property>;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.seedProperties();
  }

  private seedProperties() {
    const propertiesData: InsertProperty[] = [
      {
        title: "Equestrian Family Home",
        price: 34900,
        priceType: "month",
        type: "rent",
        featured: 1,
        location: "Washington",
        address: "1234 Maple Street, Washington DC",
        beds: 4,
        baths: 2,
        sqft: 5280,
        description: "Beautiful equestrian family home with spacious rooms and modern amenities.",
        image: "https://images.unsplash.com/photo-1699852676054-a55370ac4c7a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixid=M3w3MjkzNDZ8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwaXNsYW5kfGVufDB8fHx8MTc1OTY3MDY0N3ww&ixlib=rb-4.1.0&q=80&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1699852676054-a55370ac4c7a?w=800&h=600",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600"
        ],
        amenities: ["Garage", "Garden", "Pool", "Gym"]
      },
      {
        title: "Luxury Villa in Rego Park",
        price: 540000,
        priceType: "sale",
        type: "sale",
        featured: 1,
        location: "New York",
        address: "5678 Park Avenue, Rego Park, NY",
        beds: 4,
        baths: 3,
        sqft: 6800,
        description: "Stunning luxury villa with pool and premium finishes throughout.",
        image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixid=M3w3MjkzNDZ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwb29sJTIwdmlsbGF8ZW58MHx8fHwxNzU5NjcwNjQ4fDA&ixlib=rb-4.1.0&q=80&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=600",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600",
          "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600"
        ],
        amenities: ["Pool", "Garage", "Security System", "Home Theater"]
      },
      {
        title: "Villa on Hollywood Boulevard",
        price: 13000,
        priceType: "month",
        type: "rent",
        featured: 0,
        location: "Los Angeles",
        address: "9012 Hollywood Blvd, Los Angeles, CA",
        beds: 5,
        baths: 4,
        sqft: 8200,
        description: "Iconic villa on Hollywood Boulevard with breathtaking views.",
        image: "https://images.unsplash.com/photo-1723207836878-428621c31921?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixid=M3w3MjkzNDZ8MHwxfHNlYXJjaHwyfHxsYWtlc2lkZSUyMHZpbGxhJTIwZ2FyZGVufGVufDB8fHx8MTc1OTY3MDY0NXww&ixlib=rb-4.1.0&q=80&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1723207836878-428621c31921?w=800&h=600",
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600",
          "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600"
        ],
        amenities: ["City View", "Balcony", "Modern Kitchen", "Walk-in Closet"]
      },
      {
        title: "Contemporary Apartment",
        price: 825000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "San Francisco",
        address: "3456 Market Street, San Francisco, CA",
        beds: 3,
        baths: 2,
        sqft: 4500,
        description: "Modern contemporary apartment in the heart of San Francisco.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixid=M3w3MjkzNDZ8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc1OTY3MDY0OXww&ixlib=rb-4.1.0&q=80&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600",
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600"
        ],
        amenities: ["Hardwood Floors", "Fireplace", "Bay Windows", "Updated Kitchen"]
      },
      {
        title: "Beachfront Condo",
        price: 8500,
        priceType: "month",
        type: "rent",
        featured: 1,
        location: "Miami",
        address: "7890 Ocean Drive, Miami Beach, FL",
        beds: 3,
        baths: 2,
        sqft: 3200,
        description: "Spectacular beachfront condo with ocean views and luxury amenities.",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600",
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600"
        ],
        amenities: ["Ocean View", "Balcony", "Beach Access", "Concierge"]
      },
      {
        title: "Mountain Retreat",
        price: 675000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "Colorado",
        address: "1111 Summit Road, Aspen, CO",
        beds: 4,
        baths: 3,
        sqft: 5500,
        description: "Charming mountain retreat with stunning views and ski access.",
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600",
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600",
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600"
        ],
        amenities: ["Mountain View", "Fireplace", "Ski Access", "Hot Tub"]
      },
      {
        title: "Downtown Loft",
        price: 4200,
        priceType: "month",
        type: "rent",
        featured: 0,
        location: "Chicago",
        address: "2222 State Street, Chicago, IL",
        beds: 2,
        baths: 2,
        sqft: 2800,
        description: "Industrial-chic loft in vibrant downtown Chicago.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600",
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600"
        ],
        amenities: ["High Ceilings", "Exposed Brick", "City View", "Open Floor Plan"]
      },
      {
        title: "Suburban Family House",
        price: 425000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "Texas",
        address: "3333 Elm Street, Austin, TX",
        beds: 4,
        baths: 3,
        sqft: 4200,
        description: "Perfect family home in quiet suburban neighborhood with excellent schools.",
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600",
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600",
          "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600"
        ],
        amenities: ["Backyard", "Garage", "Modern Kitchen", "Laundry Room"]
      },
      {
        title: "Penthouse Suite",
        price: 15000,
        priceType: "month",
        type: "rent",
        featured: 1,
        location: "New York",
        address: "4444 Fifth Avenue, Manhattan, NY",
        beds: 3,
        baths: 3,
        sqft: 4800,
        description: "Luxurious penthouse with panoramic city views and premium amenities.",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600",
          "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600"
        ],
        amenities: ["Rooftop Terrace", "City View", "Concierge", "Gym Access"]
      },
      {
        title: "Lakefront Cottage",
        price: 385000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "Michigan",
        address: "5555 Lake Shore Drive, Traverse City, MI",
        beds: 3,
        baths: 2,
        sqft: 3600,
        description: "Cozy lakefront cottage with private dock and serene water views.",
        image: "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800&h=600",
          "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600"
        ],
        amenities: ["Lake View", "Private Dock", "Fireplace", "Deck"]
      },
      {
        title: "Urban Studio",
        price: 2800,
        priceType: "month",
        type: "rent",
        featured: 0,
        location: "Seattle",
        address: "6666 Pine Street, Seattle, WA",
        beds: 1,
        baths: 1,
        sqft: 950,
        description: "Efficient studio apartment in trendy Seattle neighborhood.",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600",
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600"
        ],
        amenities: ["City View", "Updated Appliances", "Bike Storage", "Rooftop Access"]
      },
      {
        title: "Historic Brownstone",
        price: 1250000,
        priceType: "sale",
        type: "sale",
        featured: 1,
        location: "Boston",
        address: "7777 Beacon Street, Boston, MA",
        beds: 5,
        baths: 4,
        sqft: 6200,
        description: "Elegant historic brownstone with original details and modern updates.",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600",
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600"
        ],
        amenities: ["Historic Details", "Garden", "Parking", "Wine Cellar"]
      },
      {
        title: "Riverside Apartment",
        price: 3500,
        priceType: "month",
        type: "rent",
        featured: 0,
        location: "Portland",
        address: "8888 Riverside Drive, Portland, OR",
        beds: 2,
        baths: 2,
        sqft: 1800,
        description: "Modern apartment with stunning river views and walking trails nearby.",
        image: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600"
        ],
        amenities: ["River View", "Balcony", "Fitness Center", "Pet Friendly"]
      },
      {
        title: "Garden Townhouse",
        price: 5200,
        priceType: "month",
        type: "rent",
        featured: 0,
        location: "San Diego",
        address: "9999 Garden Lane, San Diego, CA",
        beds: 3,
        baths: 2,
        sqft: 2400,
        description: "Spacious townhouse with private garden and modern finishes throughout.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600"
        ],
        amenities: ["Private Garden", "Garage", "Updated Kitchen", "Patio"]
      },
      {
        title: "Modern City Condo",
        price: 495000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "Atlanta",
        address: "1010 Peachtree Street, Atlanta, GA",
        beds: 2,
        baths: 2,
        sqft: 1950,
        description: "Sleek modern condo in the heart of Atlanta with city skyline views.",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600",
          "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600"
        ],
        amenities: ["City View", "Concierge", "Gym", "Pool"]
      },
      {
        title: "Coastal Beach House",
        price: 1150000,
        priceType: "sale",
        type: "sale",
        featured: 0,
        location: "California",
        address: "1111 Pacific Coast Highway, Malibu, CA",
        beds: 4,
        baths: 3,
        sqft: 5800,
        description: "Stunning beachfront property with panoramic ocean views and private beach access.",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600",
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600"
        ],
        amenities: ["Beach Access", "Ocean View", "Pool", "Large Deck"]
      }
    ];

    propertiesData.forEach(prop => {
      const id = randomUUID();
      const property: Property = { ...prop, id };
      this.properties.set(id, property);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getProperties(filters?: {
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
  }): Promise<Property[]> {
    let properties = Array.from(this.properties.values());

    if (filters?.type && filters.type !== 'all') {
      properties = properties.filter(p => p.type === filters.type);
    }

    if (filters?.location) {
      properties = properties.filter(p => 
        p.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.minPrice !== undefined) {
      properties = properties.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      properties = properties.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      properties = properties.filter(p => 
        p.title.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword) ||
        p.location.toLowerCase().includes(keyword)
      );
    }

    return properties;
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = { ...insertProperty, id };
    this.properties.set(id, property);
    return property;
  }
}

export const storage = new MemStorage();
