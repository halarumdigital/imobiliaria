import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, json, timestamp, int, boolean, decimal } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"), // 'admin' | 'client'
  companyId: varchar("company_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const companies = mysqlTable("companies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  avatar: text("avatar"), // Object storage path
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const globalConfigurations = mysqlTable("global_configurations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  logo: text("logo"),
  favicon: text("favicon"),
  cores_primaria: varchar("cores_primaria", { length: 7 }).default("#3B82F6"),
  cores_secundaria: varchar("cores_secundaria", { length: 7 }).default("#6366F1"),
  cores_fundo: varchar("cores_fundo", { length: 7 }).default("#F8FAFC"),
  nome_sistema: varchar("nome_sistema", { length: 255 }).default("Sistema Multi-Empresa"),
  nome_rodape: varchar("nome_rodape", { length: 255 }).default("© 2024 Multi-Empresa System"),
  nome_aba_navegador: varchar("nome_aba_navegador", { length: 255 }).default("Multi-Empresa Dashboard"),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const evolutionApiConfigurations = mysqlTable("evolution_api_configurations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  evolutionURL: text("evolution_url").notNull(),
  evolutionToken: text("evolution_token").notNull(),
  urlGlobalSistema: text("url_global_sistema"),
  status: varchar("status", { length: 20 }).default("disconnected"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const aiConfigurations = mysqlTable("ai_configurations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  apiKey: text("api_key").notNull(),
  modelo: varchar("modelo", { length: 50 }).default("gpt-4o"),
  temperatura: decimal("temperatura", { precision: 3, scale: 2 }).default("0.7"),
  numeroTokens: int("numero_tokens").default(1000),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const whatsappInstances = mysqlTable("whatsapp_instances", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  evolutionInstanceId: varchar("evolution_instance_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("disconnected"), // 'connected' | 'disconnected'
  qrCode: text("qr_code"),
  aiAgentId: varchar("ai_agent_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const aiAgents = mysqlTable("ai_agents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  temperatura: decimal("temperatura", { precision: 3, scale: 2 }).default("0.7"),
  numeroTokens: int("numero_tokens").default(1000),
  modelo: varchar("modelo", { length: 50 }).default("gpt-4o"),
  trainingFiles: json("training_files"), // Array of file paths
  trainingContent: text("training_content"), // Extracted content from PDFs
  agentType: varchar("agent_type", { length: 20 }).default("main"), // 'main' | 'secondary'
  parentAgentId: varchar("parent_agent_id", { length: 36 }), // References another agent
  specialization: varchar("specialization", { length: 255 }), // What this secondary agent specializes in
  delegationKeywords: json("delegation_keywords"), // Array of keywords that trigger this agent
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  whatsappInstanceId: varchar("whatsapp_instance_id", { length: 36 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  conversationId: varchar("conversation_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  sender: varchar("sender", { length: 20 }).notNull(), // 'user' | 'ai' | 'agent'
  agentId: varchar("agent_id", { length: 36 }), // Which AI agent responded (if sender is 'ai')
  messageType: varchar("message_type", { length: 20 }).default("text"), // 'text' | 'image' | 'document'
  evolutionMessageId: varchar("evolution_message_id", { length: 255 }),
  mediaUrl: text("media_url"), // URL to download the image from Evolution API
  mediaBase64: text("media_base64", { mode: "longtext" }), // Base64 encoded image data
  caption: text("caption"), // Image caption/description from user
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  companyId: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  email: true,
  cnpj: true,
  phone: true,
  address: true,
  city: true,
  cep: true,
  avatar: true,
});

export const insertGlobalConfigSchema = createInsertSchema(globalConfigurations).pick({
  logo: true,
  favicon: true,
  cores_primaria: true,
  cores_secundaria: true,
  cores_fundo: true,
  nome_sistema: true,
  nome_rodape: true,
  nome_aba_navegador: true,
});

export const insertEvolutionConfigSchema = createInsertSchema(evolutionApiConfigurations).pick({
  evolutionURL: true,
  evolutionToken: true,
  urlGlobalSistema: true,
});

export const insertAiConfigSchema = createInsertSchema(aiConfigurations).pick({
  apiKey: true,
  modelo: true,
  temperatura: true,
  numeroTokens: true,
});

export const insertWhatsappInstanceSchema = createInsertSchema(whatsappInstances).pick({
  companyId: true,
  name: true,
  phone: true,
  evolutionInstanceId: true,
  status: true,
  aiAgentId: true,
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).pick({
  companyId: true,
  name: true,
  prompt: true,
  temperatura: true,
  numeroTokens: true,
  modelo: true,
  trainingFiles: true,
  trainingContent: true,
  agentType: true,
  parentAgentId: true,
  specialization: true,
  delegationKeywords: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  whatsappInstanceId: true,
  contactName: true,
  contactPhone: true,
  lastMessage: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  sender: true,
  agentId: true,
  messageType: true,
  evolutionMessageId: true,
  mediaUrl: true,
  mediaBase64: true,
  caption: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type GlobalConfiguration = typeof globalConfigurations.$inferSelect;
export type InsertGlobalConfiguration = z.infer<typeof insertGlobalConfigSchema>;
export type EvolutionApiConfiguration = typeof evolutionApiConfigurations.$inferSelect;
export type InsertEvolutionApiConfiguration = z.infer<typeof insertEvolutionConfigSchema>;
export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigSchema>;
export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;