import { 
  User, InsertUser, Company, InsertCompany, GlobalConfiguration, 
  InsertGlobalConfiguration, EvolutionApiConfiguration, InsertEvolutionApiConfiguration,
  AiConfiguration, InsertAiConfiguration, WhatsappInstance, InsertWhatsappInstance,
  AiAgent, InsertAiAgent, Conversation, InsertConversation, Message, InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { 
  users, companies, globalConfigurations, evolutionApiConfigurations, 
  aiConfigurations, whatsappInstances, aiAgents, conversations, messages 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IStorage } from "./storage";

export class DrizzleStorage implements IStorage {
  constructor() {}

  async init(): Promise<void> {
    // Initialize default configurations if they don't exist
    await this.insertDefaultConfigurations();
  }

  private async insertDefaultConfigurations(): Promise<void> {
    // Check and insert default global configuration
    const existingGlobal = await this.getGlobalConfiguration();
    if (!existingGlobal) {
      await db.insert(globalConfigurations).values({});
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Company methods
  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    const user = await this.getUser(userId);
    if (!user?.companyId) return [];
    
    const result = await db.select().from(companies).where(eq(companies.id, user.companyId));
    return result;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const result = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Global Configuration methods
  async getGlobalConfiguration(): Promise<GlobalConfiguration | undefined> {
    const result = await db.select().from(globalConfigurations).limit(1);
    return result[0];
  }

  async saveGlobalConfiguration(config: InsertGlobalConfiguration): Promise<GlobalConfiguration> {
    const existing = await this.getGlobalConfiguration();
    
    if (existing) {
      const result = await db.update(globalConfigurations)
        .set(config)
        .where(eq(globalConfigurations.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(globalConfigurations).values(config).returning();
      return result[0];
    }
  }

  // Evolution API Configuration methods
  async getEvolutionApiConfiguration(): Promise<EvolutionApiConfiguration | undefined> {
    const result = await db.select().from(evolutionApiConfigurations).limit(1);
    return result[0];
  }

  async saveEvolutionApiConfiguration(config: InsertEvolutionApiConfiguration): Promise<EvolutionApiConfiguration> {
    const existing = await this.getEvolutionApiConfiguration();
    
    if (existing) {
      const result = await db.update(evolutionApiConfigurations)
        .set(config)
        .where(eq(evolutionApiConfigurations.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(evolutionApiConfigurations).values(config).returning();
      return result[0];
    }
  }

  // AI Configuration methods
  async getAiConfiguration(): Promise<AiConfiguration | undefined> {
    const result = await db.select().from(aiConfigurations).limit(1);
    return result[0];
  }

  async saveAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const existing = await this.getAiConfiguration();
    
    if (existing) {
      const result = await db.update(aiConfigurations)
        .set(config)
        .where(eq(aiConfigurations.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(aiConfigurations).values(config).returning();
      return result[0];
    }
  }

  // WhatsApp Instance methods
  async getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined> {
    const result = await db.select().from(whatsappInstances).where(eq(whatsappInstances.id, id)).limit(1);
    return result[0];
  }

  async getWhatsappInstancesByCompany(companyId: string): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances).where(eq(whatsappInstances.companyId, companyId));
  }

  async createWhatsappInstance(instance: InsertWhatsappInstance): Promise<WhatsappInstance> {
    const result = await db.insert(whatsappInstances).values(instance).returning();
    return result[0];
  }

  async updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance> {
    const result = await db.update(whatsappInstances).set(updates).where(eq(whatsappInstances.id, id)).returning();
    return result[0];
  }

  async deleteWhatsappInstance(id: string): Promise<void> {
    await db.delete(whatsappInstances).where(eq(whatsappInstances.id, id));
  }

  // AI Agents methods
  async getAiAgent(id: string): Promise<AiAgent | undefined> {
    const result = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).limit(1);
    return result[0];
  }

  async getAiAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.companyId, companyId));
  }

  async getMainAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(
      and(eq(aiAgents.companyId, companyId), eq(aiAgents.agentType, "main"))
    );
  }

  async getSecondaryAgentsByParent(parentAgentId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.parentAgentId, parentAgentId));
  }

  async getSecondaryAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(
      and(eq(aiAgents.companyId, companyId), eq(aiAgents.agentType, "secondary"))
    );
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    const result = await db.insert(aiAgents).values(agent).returning();
    return result[0];
  }

  async updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent> {
    const result = await db.update(aiAgents).set(updates).where(eq(aiAgents.id, id)).returning();
    return result[0];
  }

  async deleteAiAgent(id: string): Promise<void> {
    await db.delete(aiAgents).where(eq(aiAgents.id, id));
  }

  // Conversations methods
  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }

  async getConversationsByInstance(instanceId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.whatsappInstanceId, instanceId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const result = await db.update(conversations).set(updates).where(eq(conversations.id, id)).returning();
    return result[0];
  }

  // Messages methods
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
}