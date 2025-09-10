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
  webshare_token: text("webshare_token"),
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
  evolutionToken: varchar("evolution_token", { length: 500 }), // Token específico da instância
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
  mediaBase64: text("media_base64"), // Base64 encoded image data
  caption: text("caption"), // Image caption/description from user
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactLists = mysqlTable("contact_lists", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalContacts: int("total_contacts").default(0),
  validContacts: int("valid_contacts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const contactListItems = mysqlTable("contact_list_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  contactListId: varchar("contact_list_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  valid: boolean("valid").default(true),
  error: text("error"), // Validation error message if invalid
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduledMessages = mysqlTable("scheduled_messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  contactListId: varchar("contact_list_id", { length: 36 }).notNull(),
  instanceIds: json("instance_ids").notNull(), // Array of whatsapp instance IDs
  messageType: varchar("message_type", { length: 20 }).notNull(), // 'text' | 'audio' | 'image' | 'video'
  messageContent: text("message_content").notNull(),
  messages: json("messages"), // Array of multiple text messages (for text type only)
  useMultipleMessages: boolean("use_multiple_messages").default(false), // Whether to send multiple text messages
  fileName: varchar("file_name", { length: 255 }), // For media messages
  fileBase64: text("file_base64"), // Base64 encoded file for media messages
  scheduledDateTime: timestamp("scheduled_date_time").notNull(),
  intervalMin: int("interval_min").default(60), // Minimum interval between messages in seconds
  intervalMax: int("interval_max").default(120), // Maximum interval between messages in seconds
  useMultipleInstances: boolean("use_multiple_instances").default(false),
  randomizeInstances: boolean("randomize_instances").default(true),
  status: varchar("status", { length: 20 }).default("scheduled"), // 'scheduled' | 'processing' | 'completed' | 'cancelled' | 'failed'
  totalMessages: int("total_messages").default(0),
  sentMessages: int("sent_messages").default(0),
  failedMessages: int("failed_messages").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"), // Error details if failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const funnelStages = mysqlTable("funnel_stages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#3B82F6"),
  order: int("order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  webshare_token: true,
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

export const insertContactListSchema = createInsertSchema(contactLists).pick({
  companyId: true,
  name: true,
  totalContacts: true,
  validContacts: true,
});

export const insertContactListItemSchema = createInsertSchema(contactListItems).pick({
  contactListId: true,
  name: true,
  phone: true,
  valid: true,
  error: true,
});

export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).pick({
  companyId: true,
  contactListId: true,
  instanceIds: true,
  messageType: true,
  messageContent: true,
  messages: true,
  useMultipleMessages: true,
  fileName: true,
  fileBase64: true,
  scheduledDateTime: true,
  intervalMin: true,
  intervalMax: true,
  useMultipleInstances: true,
  randomizeInstances: true,
  totalMessages: true,
});

export const insertFunnelStageSchema = createInsertSchema(funnelStages).pick({
  companyId: true,
  name: true,
  description: true,
  color: true,
  order: true,
  isActive: true,
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
export type ContactList = typeof contactLists.$inferSelect;
export type InsertContactList = z.infer<typeof insertContactListSchema>;
export type ContactListItem = typeof contactListItems.$inferSelect;
export type InsertContactListItem = z.infer<typeof insertContactListItemSchema>;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = z.infer<typeof insertScheduledMessageSchema>;
export type FunnelStage = typeof funnelStages.$inferSelect;
export type InsertFunnelStage = z.infer<typeof insertFunnelStageSchema>;