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
  vapi_public_key: text("vapi_public_key"),
  vapi_private_key: text("vapi_private_key"),
  elevenlabs_api_key: text("elevenlabs_api_key"),
  // Default AI Model Configuration
  default_ai_model: varchar("default_ai_model", { length: 100 }).default("gpt-4o"),
  default_ai_temperature: decimal("default_ai_temperature", { precision: 3, scale: 2 }).default("0.7"),
  default_ai_max_tokens: int("default_ai_max_tokens").default(500),
  default_ai_top_p: decimal("default_ai_top_p", { precision: 3, scale: 2 }).default("1.0"),
  default_ai_frequency_penalty: decimal("default_ai_frequency_penalty", { precision: 3, scale: 2 }).default("0.0"),
  default_ai_presence_penalty: decimal("default_ai_presence_penalty", { precision: 3, scale: 2 }).default("0.0"),
  // Default Voice Configuration (ElevenLabs)
  default_voice_id: varchar("default_voice_id", { length: 100 }),
  default_voice_model: varchar("default_voice_model", { length: 50 }).default("eleven_multilingual_v2"),
  default_voice_stability: decimal("default_voice_stability", { precision: 3, scale: 2 }).default("0.5"),
  default_voice_similarity_boost: decimal("default_voice_similarity_boost", { precision: 3, scale: 2 }).default("0.75"),
  default_voice_style: decimal("default_voice_style", { precision: 3, scale: 2 }).default("0.0"),
  default_voice_use_speaker_boost: boolean("default_voice_use_speaker_boost").default(false),
  // Default Transcriber Configuration
  default_transcriber_model: varchar("default_transcriber_model", { length: 50 }).default("whisper-1"),
  default_transcriber_language: varchar("default_transcriber_language", { length: 10 }),
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

export const callAgents = mysqlTable("call_agents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // OpenAI Transcriber settings
  transcriberModel: varchar("transcriber_model", { length: 50 }).default("whisper-1"),
  transcriberLanguage: varchar("transcriber_language", { length: 10 }), // e.g., "pt", "en"
  // OpenAI Model settings
  model: varchar("model", { length: 50 }).default("gpt-4o"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: int("max_tokens").default(500),
  topP: decimal("top_p", { precision: 3, scale: 2 }).default("1.0"),
  frequencyPenalty: decimal("frequency_penalty", { precision: 3, scale: 2 }).default("0.0"),
  presencePenalty: decimal("presence_penalty", { precision: 3, scale: 2 }).default("0.0"),
  // ElevenLabs Voice settings
  voiceId: varchar("voice_id", { length: 100 }).notNull(),
  voiceModel: varchar("voice_model", { length: 50 }).default("eleven_multilingual_v2"),
  stability: decimal("stability", { precision: 3, scale: 2 }).default("0.5"),
  similarityBoost: decimal("similarity_boost", { precision: 3, scale: 2 }).default("0.75"),
  style: decimal("style", { precision: 3, scale: 2 }).default("0.0"),
  useSpeakerBoost: boolean("use_speaker_boost").default(false),
  // Call behavior settings
  firstMessage: text("first_message"),
  systemMessage: text("system_message"),
  endCallMessage: text("end_call_message"),
  maxDurationSeconds: int("max_duration_seconds").default(600),
  interruptible: boolean("interruptible").default(true),
  recordingEnabled: boolean("recording_enabled").default(false),
  responseDelaySeconds: decimal("response_delay_seconds", { precision: 3, scale: 2 }).default("0.4"),
  llmRequestDelaySeconds: decimal("llm_request_delay_seconds", { precision: 3, scale: 2 }).default("0.1"),
  numWordsToInterruptAssistant: int("num_words_to_interrupt_assistant"),
  maxDurationSecondsBeforeInterrupt: int("max_duration_seconds_before_interrupt"),
  backgroundSound: varchar("background_sound", { length: 100 }),
  voicemailMessage: text("voicemail_message"),
  endCallPhrases: json("end_call_phrases"), // Array of phrases that end the call
  endCallFunctionEnabled: boolean("end_call_function_enabled").default(false),
  dialKeypadFunctionEnabled: boolean("dial_keypad_function_enabled").default(false),
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
  vapi_public_key: true,
  vapi_private_key: true,
  elevenlabs_api_key: true,
  // Default AI Model Configuration
  default_ai_model: true,
  default_ai_temperature: true,
  default_ai_max_tokens: true,
  default_ai_top_p: true,
  default_ai_frequency_penalty: true,
  default_ai_presence_penalty: true,
  // Default Voice Configuration
  default_voice_id: true,
  default_voice_model: true,
  default_voice_stability: true,
  default_voice_similarity_boost: true,
  default_voice_style: true,
  default_voice_use_speaker_boost: true,
  // Default Transcriber Configuration
  default_transcriber_model: true,
  default_transcriber_language: true,
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

export const insertCallAgentSchema = createInsertSchema(callAgents).pick({
  companyId: true,
  name: true,
  transcriberModel: true,
  transcriberLanguage: true,
  model: true,
  temperature: true,
  maxTokens: true,
  topP: true,
  frequencyPenalty: true,
  presencePenalty: true,
  voiceId: true,
  voiceModel: true,
  stability: true,
  similarityBoost: true,
  style: true,
  useSpeakerBoost: true,
  firstMessage: true,
  systemMessage: true,
  endCallMessage: true,
  maxDurationSeconds: true,
  interruptible: true,
  recordingEnabled: true,
  responseDelaySeconds: true,
  llmRequestDelaySeconds: true,
  numWordsToInterruptAssistant: true,
  maxDurationSecondsBeforeInterrupt: true,
  backgroundSound: true,
  voicemailMessage: true,
  endCallPhrases: true,
  endCallFunctionEnabled: true,
  dialKeypadFunctionEnabled: true,
}).extend({
  temperature: z.union([z.number(), z.string()]).transform(val => String(val)),
  stability: z.union([z.number(), z.string()]).transform(val => String(val)),
  similarityBoost: z.union([z.number(), z.string()]).transform(val => String(val)),
  style: z.union([z.number(), z.string()]).transform(val => String(val)),
  responseDelaySeconds: z.union([z.number(), z.string()]).transform(val => String(val)),
  llmRequestDelaySeconds: z.union([z.number(), z.string()]).transform(val => String(val)).optional(),
  topP: z.union([z.number(), z.string()]).transform(val => String(val)).optional(),
  frequencyPenalty: z.union([z.number(), z.string()]).transform(val => String(val)).optional(),
  presencePenalty: z.union([z.number(), z.string()]).transform(val => String(val)).optional(),
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

export const callCampaigns = mysqlTable("call_campaigns", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contactListId: varchar("contact_list_id", { length: 36 }).notNull(),
  contactListName: varchar("contact_list_name", { length: 255 }).notNull(),
  assistantId: varchar("assistant_id", { length: 36 }), // Call agent ID
  assistantName: varchar("assistant_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft"), // 'draft' | 'running' | 'completed' | 'paused' | 'failed'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalContacts: int("total_contacts").default(0),
  completedCalls: int("completed_calls").default(0),
  answeredCalls: int("answered_calls").default(0),
  notAnsweredCalls: int("not_answered_calls").default(0),
  failedCalls: int("failed_calls").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const calls = mysqlTable("calls", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  campaignId: varchar("campaign_id", { length: 36 }).notNull(),
  contactId: varchar("contact_id", { length: 36 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  customerNumber: varchar("customer_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("queued"), // 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer'
  endReason: varchar("end_reason", { length: 50 }), // 'customer-ended-call' | 'customer-did-not-answer' | etc
  duration: int("duration"), // Duration in seconds
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  assistantName: varchar("assistant_name", { length: 255 }).notNull(),
  recordingUrl: text("recording_url"), // URL to call recording
  transcript: text("transcript"), // Full call transcript
  analysis: json("analysis"), // AI analysis of the call {summary, successEvaluation, structuredData}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
export type CallAgent = typeof callAgents.$inferSelect;
export type InsertCallAgent = z.infer<typeof insertCallAgentSchema>;
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

export const insertCallCampaignSchema = createInsertSchema(callCampaigns).pick({
  companyId: true,
  name: true,
  contactListId: true,
  contactListName: true,
  assistantId: true,
  assistantName: true,
  phoneNumber: true,
  status: true,
  totalContacts: true,
});

export const insertCallSchema = createInsertSchema(calls).pick({
  campaignId: true,
  contactId: true,
  contactName: true,
  customerNumber: true,
  status: true,
  endReason: true,
  duration: true,
  assistantName: true,
  recordingUrl: true,
  transcript: true,
  analysis: true,
});

export type CallCampaign = typeof callCampaigns.$inferSelect;
export type InsertCallCampaign = z.infer<typeof insertCallCampaignSchema>;
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;