import mysql from 'mysql2/promise';
import { 
  User, InsertUser, Company, InsertCompany, GlobalConfiguration, 
  InsertGlobalConfiguration, EvolutionApiConfiguration, InsertEvolutionApiConfiguration,
  AiConfiguration, InsertAiConfiguration, WhatsappInstance, InsertWhatsappInstance,
  AiAgent, InsertAiAgent, Conversation, InsertConversation, Message, InsertMessage,
  ContactList, InsertContactList, ContactListItem, InsertContactListItem,
  ScheduledMessage, InsertScheduledMessage, FunnelStage, InsertFunnelStage,
  Customer, InsertCustomer
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompaniesByUserId(userId: string): Promise<Company[]>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  
  // Global Configurations
  getGlobalConfiguration(): Promise<GlobalConfiguration | undefined>;
  saveGlobalConfiguration(config: InsertGlobalConfiguration): Promise<GlobalConfiguration>;
  
  // Evolution API Configuration
  getEvolutionApiConfiguration(): Promise<EvolutionApiConfiguration | undefined>;
  saveEvolutionApiConfiguration(config: InsertEvolutionApiConfiguration): Promise<EvolutionApiConfiguration>;
  
  // AI Configuration
  getAiConfiguration(): Promise<AiConfiguration | undefined>;
  saveAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration>;
  
  // WhatsApp Instances
  getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstancesByCompany(companyId: string): Promise<WhatsappInstance[]>;
  createWhatsappInstance(instance: InsertWhatsappInstance): Promise<WhatsappInstance>;
  updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance>;
  deleteWhatsappInstance(id: string): Promise<void>;
  
  // AI Agents
  getAiAgent(id: string): Promise<AiAgent | undefined>;
  getAiAgentsByCompany(companyId: string): Promise<AiAgent[]>;
  getMainAgentsByCompany(companyId: string): Promise<AiAgent[]>;
  getSecondaryAgentsByParent(parentAgentId: string): Promise<AiAgent[]>;
  getSecondaryAgentsByCompany(companyId: string): Promise<AiAgent[]>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent>;
  deleteAiAgent(id: string): Promise<void>;
  
  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByInstance(instanceId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  
  // Messages
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Contact Lists
  getContactList(id: string): Promise<ContactList | undefined>;
  getContactListsByCompany(companyId: string): Promise<ContactList[]>;
  createContactList(list: InsertContactList): Promise<ContactList>;
  updateContactList(id: string, updates: Partial<ContactList>): Promise<ContactList>;
  deleteContactList(id: string): Promise<void>;
  
  // Contact List Items
  getContactListItems(contactListId: string): Promise<ContactListItem[]>;
  createContactListItem(item: InsertContactListItem): Promise<ContactListItem>;
  deleteContactListItems(contactListId: string): Promise<void>;
  
  // Scheduled Messages
  getScheduledMessage(id: string): Promise<ScheduledMessage | undefined>;
  getScheduledMessagesByCompany(companyId: string): Promise<ScheduledMessage[]>;
  getScheduledMessagesByStatus(status: string): Promise<ScheduledMessage[]>;
  getPendingScheduledMessages(): Promise<ScheduledMessage[]>;
  createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage>;
  updateScheduledMessage(id: string, updates: Partial<ScheduledMessage>): Promise<ScheduledMessage>;
  deleteScheduledMessage(id: string): Promise<void>;
  
  // Additional methods for scheduled message processing
  getWhatsappInstancesByIds(ids: string[]): Promise<WhatsappInstance[]>;
  
  // Funnel Stages
  getFunnelStage(id: string): Promise<FunnelStage | undefined>;
  getFunnelStagesByCompany(companyId: string): Promise<FunnelStage[]>;
  createFunnelStage(stage: InsertFunnelStage): Promise<FunnelStage>;
  updateFunnelStage(id: string, updates: Partial<FunnelStage>): Promise<FunnelStage>;
  deleteFunnelStage(id: string): Promise<void>;
  reorderFunnelStage(id: string, direction: 'up' | 'down', companyId: string): Promise<{ success: boolean }>;
  
  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByCompany(companyId: string): Promise<Customer[]>;
  getCustomerByPhone(phone: string, companyId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
}

export class MySQLStorage implements IStorage {
  private connection: mysql.Connection | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Don't connect immediately, wait for init
  }

  async init(): Promise<void> {
    if (this.isConnected) return;
    await this.connect();
    this.isConnected = true;
  }

  private async connect(): Promise<void> {
    try {
      const config = {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'sistema_multiempresa',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        charset: 'utf8mb4',
      };
      
      console.log('Database config:', {
        host: config.host,
        user: config.user,
        database: config.database,
        port: config.port
      });
      
      this.connection = await mysql.createConnection(config);
      
      // Create tables if they don't exist
      await this.createTables();
      
      // Fix charset for existing tables
      await this.fixTableCharsets();
    } catch (error) {
      console.error('MySQL connection error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'client',
        company_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        cnpj VARCHAR(18),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        cep VARCHAR(10),
        avatar TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS global_configurations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        logo TEXT,
        favicon TEXT,
        cores_primaria VARCHAR(7) DEFAULT '#3B82F6',
        cores_secundaria VARCHAR(7) DEFAULT '#6366F1',
        cores_fundo VARCHAR(7) DEFAULT '#F8FAFC',
        nome_sistema VARCHAR(255) DEFAULT 'Sistema Multi-Empresa',
        nome_rodape VARCHAR(255) DEFAULT '© 2024 Multi-Empresa System',
        nome_aba_navegador VARCHAR(255) DEFAULT 'Multi-Empresa Dashboard',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS evolution_api_configurations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        evolution_url TEXT NOT NULL,
        evolution_token TEXT NOT NULL,
        url_global_sistema TEXT,
        status VARCHAR(20) DEFAULT 'disconnected',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_configurations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        api_key TEXT NOT NULL,
        modelo VARCHAR(50) DEFAULT 'gpt-4o',
        temperatura DECIMAL(3,2) DEFAULT 0.7,
        numero_tokens INT DEFAULT 1000,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS whatsapp_instances (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        evolution_instance_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'disconnected',
        qr_code TEXT,
        ai_agent_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_agents (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        prompt TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        temperatura DECIMAL(3,2) DEFAULT 0.7,
        numero_tokens INT DEFAULT 1000,
        modelo VARCHAR(50) DEFAULT 'gpt-4o',
        training_files JSON,
        training_content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        agent_type VARCHAR(20) DEFAULT 'main',
        parent_agent_id VARCHAR(36),
        specialization VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        delegation_keywords JSON,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        whatsapp_instance_id VARCHAR(36) NOT NULL,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(20) NOT NULL,
        last_message TEXT,
        last_message_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        conversation_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        sender VARCHAR(20) NOT NULL,
        agent_id VARCHAR(36),
        message_type VARCHAR(20) DEFAULT 'text',
        evolution_message_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS contact_lists (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        total_contacts INT DEFAULT 0,
        valid_contacts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS contact_list_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        contact_list_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        valid BOOLEAN DEFAULT true,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE IF NOT EXISTS scheduled_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        contact_list_id VARCHAR(36) NOT NULL,
        instance_ids JSON NOT NULL,
        message_type VARCHAR(20) NOT NULL,
        message_content TEXT NOT NULL,
        messages JSON,
        use_multiple_messages BOOLEAN DEFAULT FALSE,
        file_name VARCHAR(255),
        file_base64 LONGTEXT,
        scheduled_date_time TIMESTAMP NOT NULL,
        interval_min INT DEFAULT 60,
        interval_max INT DEFAULT 120,
        use_multiple_instances BOOLEAN DEFAULT FALSE,
        randomize_instances BOOLEAN DEFAULT TRUE,
        status VARCHAR(20) DEFAULT 'scheduled',
        total_messages INT DEFAULT 0,
        sent_messages INT DEFAULT 0,
        failed_messages INT DEFAULT 0,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS funnel_stages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        \`order\` INT NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        company VARCHAR(255),
        funnel_stage_id VARCHAR(36) NOT NULL,
        last_contact TIMESTAMP,
        notes TEXT,
        value DECIMAL(10,2),
        source VARCHAR(255) DEFAULT 'WhatsApp',
        conversation_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY customers_phone_company_unique (phone, company_id)
      )`
    ];

    for (const table of tables) {
      await this.connection.execute(table);
    }

    // Add agent_id column to existing messages table if it doesn't exist
    try {
      await this.connection.execute(`
        ALTER TABLE messages ADD COLUMN agent_id VARCHAR(36)
      `);
      console.log('✅ Added agent_id column to messages table');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ agent_id column already exists in messages table');
      } else {
        console.error('❌ Error adding agent_id column:', error);
      }
    }

    // Add image support columns to messages table
    const imageColumns = [
      { name: 'media_url', type: 'TEXT' },
      { name: 'media_base64', type: 'LONGTEXT' },
      { name: 'caption', type: 'TEXT' }
    ];

    for (const column of imageColumns) {
      try {
        await this.connection.execute(`
          ALTER TABLE messages ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`✅ Added ${column.name} column to messages table`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✅ ${column.name} column already exists in messages table`);
          
          // Se a coluna media_base64 já existe, vamos garantir que seja LONGTEXT
          if (column.name === 'media_base64' && column.type === 'LONGTEXT') {
            try {
              await this.connection.execute(`
                ALTER TABLE messages MODIFY COLUMN media_base64 LONGTEXT
              `);
              console.log(`✅ media_base64 column updated to LONGTEXT`);
            } catch (modifyError: any) {
              console.error(`❌ Error modifying media_base64 column:`, modifyError);
            }
          }
        } else {
          console.error(`❌ Error adding ${column.name} column:`, error);
        }
      }
    }

    // Insert default configurations if they don't exist
    await this.insertDefaultConfigurations();
  }

  private async fixTableCharsets(): Promise<void> {
    if (!this.connection) return;
    
    try {
      // Fix ai_agents table charset and add hierarchy columns
      await this.connection.execute(`
        ALTER TABLE ai_agents 
        MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        MODIFY prompt TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        ADD COLUMN IF NOT EXISTS training_content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        ADD COLUMN IF NOT EXISTS agent_type VARCHAR(20) DEFAULT 'main',
        ADD COLUMN IF NOT EXISTS parent_agent_id VARCHAR(36),
        ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        ADD COLUMN IF NOT EXISTS delegation_keywords JSON
      `);
      console.log('Fixed ai_agents table charset');
    } catch (error: any) {
      console.log('Table charset fix not needed or already applied:', error.message);
    }
  }

  private async insertDefaultConfigurations(): Promise<void> {
    if (!this.connection) return;

    // Check and insert default global configuration
    const [globalRows] = await this.connection.execute(
      'SELECT COUNT(*) as count FROM global_configurations'
    );
    if ((globalRows as any)[0].count === 0) {
      await this.connection.execute(
        'INSERT INTO global_configurations (id) VALUES (UUID())'
      );
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT id, email, password, role, company_id as companyId, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?',
      [id]
    );
    return (rows as User[])[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT id, email, password, role, company_id as companyId, created_at as createdAt, updated_at as updatedAt FROM users WHERE email = ?',
      [email]
    );
    return (rows as User[])[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO users (id, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [id, user.email, user.password, user.role || 'client', user.companyId || null]
    );
    return this.getUser(id) as Promise<User>;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.connection) throw new Error('No database connection');
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof User] !== undefined);
    const values = fields.map(key => updates[key as keyof User]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getUser(id) as Promise<User>;
  }

  // Company methods
  async getCompany(id: string): Promise<Company | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    return (rows as Company[])[0];
  }

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT c.* FROM companies c JOIN users u ON c.id = u.company_id WHERE u.id = ?',
      [userId]
    );
    return rows as Company[];
  }

  async getAllCompanies(): Promise<Company[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute('SELECT * FROM companies ORDER BY created_at DESC');
    return rows as Company[];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    
    // Garantir que valores undefined sejam convertidos para null
    const email = company.email || null;
    const cnpj = company.cnpj || null;
    const phone = company.phone || null;
    const address = company.address || null;
    const city = company.city || null;
    const cep = company.cep || null;
    const avatar = company.avatar || null;
    
    await this.connection.execute(
      'INSERT INTO companies (id, name, email, cnpj, phone, address, city, cep, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, company.name, email, cnpj, phone, address, city, cep, avatar]
    );
    return this.getCompany(id) as Promise<Company>;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    if (!this.connection) throw new Error('No database connection');
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof Company] !== undefined);
    const values = fields.map(key => updates[key as keyof Company]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE companies SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getCompany(id) as Promise<Company>;
  }

  async deleteCompany(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM companies WHERE id = ?', [id]);
  }

  // Global Configuration methods
  async getGlobalConfiguration(): Promise<GlobalConfiguration | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute('SELECT * FROM global_configurations LIMIT 1');
    return (rows as GlobalConfiguration[])[0];
  }

  async saveGlobalConfiguration(config: InsertGlobalConfiguration): Promise<GlobalConfiguration> {
    if (!this.connection) throw new Error('No database connection');
    
    const existing = await this.getGlobalConfiguration();
    
    if (existing) {
      const fields = Object.keys(config).filter(key => config[key as keyof InsertGlobalConfiguration] !== undefined);
      const values = fields.map(key => config[key as keyof InsertGlobalConfiguration]);
      
      if (fields.length > 0) {
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        await this.connection.execute(
          `UPDATE global_configurations SET ${setClause} WHERE id = ?`,
          [...values, existing.id]
        );
      }
      
      return this.getGlobalConfiguration() as Promise<GlobalConfiguration>;
    } else {
      const id = randomUUID();
      await this.connection.execute(
        'INSERT INTO global_configurations (id, logo, favicon, cores_primaria, cores_secundaria, cores_fundo, nome_sistema, nome_rodape, nome_aba_navegador, webshare_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, config.logo, config.favicon, config.cores_primaria, config.cores_secundaria, config.cores_fundo, config.nome_sistema, config.nome_rodape, config.nome_aba_navegador, config.webshare_token]
      );
      return this.getGlobalConfiguration() as Promise<GlobalConfiguration>;
    }
  }

  // Evolution API Configuration methods
  async getEvolutionApiConfiguration(): Promise<EvolutionApiConfiguration | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    console.log('🔍 [DEBUG] Getting Evolution API configuration from database...');
    const [rows] = await this.connection.execute('SELECT * FROM evolution_api_configurations LIMIT 1') as any;
    console.log(`🔍 [DEBUG] Evolution API config query returned ${rows.length} rows`);
    
    const rawData = rows[0];
    if (!rawData) {
      console.log('❌ [DEBUG] No Evolution API configuration found in database');
      return undefined;
    }
    
    console.log('✅ [DEBUG] Evolution API config found:', {
      id: rawData.id,
      evolution_url: rawData.evolution_url ? 'SET' : 'NULL',
      evolution_token: rawData.evolution_token ? 'SET' : 'NULL'
    });
    
    // Mapeamento dos campos do banco para o frontend
    const mappedConfig = {
      id: rawData.id,
      evolutionURL: rawData.evolution_url,
      evolutionToken: rawData.evolution_token,
      urlGlobalSistema: rawData.url_global_sistema,
      updatedAt: rawData.updated_at,
    } as EvolutionApiConfiguration;
    
    console.log('🔧 [DEBUG] Mapped Evolution API config:', {
      evolutionURL: mappedConfig.evolutionURL ? 'SET' : 'NULL',
      evolutionToken: mappedConfig.evolutionToken ? 'SET' : 'NULL',
      baseURL: mappedConfig.evolutionURL,
      token: mappedConfig.evolutionToken
    });
    
    return mappedConfig;
  }

  async saveEvolutionApiConfiguration(config: InsertEvolutionApiConfiguration): Promise<EvolutionApiConfiguration> {
    if (!this.connection) throw new Error('No database connection');
    
    console.log('Save evolution config:', config);
    
    const existing = await this.getEvolutionApiConfiguration();
    
    // Garantir que os valores não sejam undefined
    const evolutionURL = config.evolutionURL || null;
    const evolutionToken = config.evolutionToken || null;
    const urlGlobalSistema = config.urlGlobalSistema || null;
    
    if (existing) {
      await this.connection.execute(
        'UPDATE evolution_api_configurations SET evolution_url = ?, evolution_token = ?, url_global_sistema = ? WHERE id = ?',
        [evolutionURL, evolutionToken, urlGlobalSistema, existing.id]
      );
    } else {
      const id = randomUUID();
      await this.connection.execute(
        'INSERT INTO evolution_api_configurations (id, evolution_url, evolution_token, url_global_sistema) VALUES (?, ?, ?, ?)',
        [id, evolutionURL, evolutionToken, urlGlobalSistema]
      );
    }
    
    return this.getEvolutionApiConfiguration() as Promise<EvolutionApiConfiguration>;
  }

  // AI Configuration methods
  async getAiConfiguration(): Promise<AiConfiguration | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute('SELECT * FROM ai_configurations LIMIT 1') as any;
    const rawData = rows[0];
    if (!rawData) return undefined;
    
    // Mapeamento dos campos do banco para o frontend
    const config = {
      id: rawData.id,
      apiKey: rawData.api_key,
      modelo: rawData.modelo,
      temperatura: rawData.temperatura?.toString() || "0.7",
      numeroTokens: parseInt(rawData.numero_tokens?.toString() || "1000"),
      updatedAt: rawData.updated_at,
    } as AiConfiguration;
    
    console.log(`📊 Storage returning AI config:`, config);
    return config;
  }

  async saveAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    if (!this.connection) throw new Error('No database connection');
    
    console.log('Save AI config:', config);
    
    const existing = await this.getAiConfiguration();
    
    // Garantir que os valores não sejam undefined
    const apiKey = config.apiKey || null;
    const modelo = config.modelo || 'gpt-4o';
    const temperatura = config.temperatura ? parseFloat(config.temperatura.toString()) : 0.7;
    const numeroTokens = config.numeroTokens ? parseInt(config.numeroTokens.toString()) : 1000;
    
    if (existing) {
      await this.connection.execute(
        'UPDATE ai_configurations SET api_key = ?, modelo = ?, temperatura = ?, numero_tokens = ? WHERE id = ?',
        [apiKey, modelo, temperatura, numeroTokens, existing.id]
      );
    } else {
      const id = randomUUID();
      await this.connection.execute(
        'INSERT INTO ai_configurations (id, api_key, modelo, temperatura, numero_tokens) VALUES (?, ?, ?, ?, ?)',
        [id, apiKey, modelo, temperatura, numeroTokens]
      );
    }
    
    return this.getAiConfiguration() as Promise<AiConfiguration>;
  }

  // WhatsApp Instance methods
  async getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM whatsapp_instances WHERE id = ?',
      [id]
    );
    const row = (rows as any[])[0];
    if (!row) return undefined;
    
    // Convert snake_case to camelCase
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      status: row.status, // Explicitly map status field
      companyId: row.company_id,
      evolutionInstanceId: row.evolution_instance_id,
      qrCode: row.qr_code,
      aiAgentId: row.ai_agent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as WhatsappInstance;
  }

  async getWhatsappInstancesByCompany(companyId: string): Promise<WhatsappInstance[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM whatsapp_instances WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    
    // Convert snake_case to camelCase for all rows
    return (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      status: row.status, // Explicitly map status field
      companyId: row.company_id,
      evolutionInstanceId: row.evolution_instance_id,
      qrCode: row.qr_code,
      aiAgentId: row.ai_agent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as WhatsappInstance[];
  }

  async createWhatsappInstance(instance: InsertWhatsappInstance): Promise<WhatsappInstance> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO whatsapp_instances (id, company_id, name, phone, evolution_instance_id, status, ai_agent_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        instance.companyId || null, 
        instance.name || null, 
        instance.phone || null, 
        instance.evolutionInstanceId || null,
        instance.status || 'disconnected',
        instance.aiAgentId || null
      ]
    );
    
    const createdInstance = await this.getWhatsappInstance(id);
    return createdInstance as WhatsappInstance;
  }

  async updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance> {
    if (!this.connection) throw new Error('No database connection');
    
    // Map camelCase to snake_case for MySQL columns
    const fieldMapping: Record<string, string> = {
      companyId: 'company_id',
      aiAgentId: 'ai_agent_id',
      evolutionInstanceId: 'evolution_instance_id',
      qrCode: 'qr_code',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof WhatsappInstance] !== undefined);
    const values = fields.map(key => updates[key as keyof WhatsappInstance]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${fieldMapping[field] || field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE whatsapp_instances SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getWhatsappInstance(id) as Promise<WhatsappInstance>;
  }

  async deleteWhatsappInstance(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM whatsapp_instances WHERE id = ?', [id]);
  }

  // AI Agent methods
  async getAiAgent(id: string): Promise<AiAgent | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM ai_agents WHERE id = ?',
      [id]
    );
    const parsedAgents = this.parseAiAgents(rows as any[]);
    return parsedAgents[0];
  }

  async getAiAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM ai_agents WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    return this.parseAiAgents(rows as any[]);
  }

  private parseAiAgents(rows: any[]): AiAgent[] {
    return rows.map(row => ({
      ...row,
      trainingFiles: row.training_files ? JSON.parse(row.training_files) : [],
      delegationKeywords: row.delegation_keywords ? JSON.parse(row.delegation_keywords) : [],
      agentType: row.agent_type,
      parentAgentId: row.parent_agent_id,
      trainingContent: row.training_content,
      companyId: row.company_id,
      numeroTokens: row.numero_tokens,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO ai_agents (id, company_id, name, prompt, temperatura, numero_tokens, modelo, training_files, training_content, agent_type, parent_agent_id, specialization, delegation_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        agent.companyId, 
        agent.name, 
        agent.prompt, 
        agent.temperatura, 
        agent.numeroTokens, 
        agent.modelo, 
        JSON.stringify(agent.trainingFiles || []), 
        agent.trainingContent || null,
        agent.agentType || 'main',
        agent.parentAgentId || null,
        agent.specialization || null,
        JSON.stringify(agent.delegationKeywords || [])
      ]
    );
    return this.getAiAgent(id) as Promise<AiAgent>;
  }

  async updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent> {
    if (!this.connection) throw new Error('No database connection');
    
    const fieldMapping: Record<string, string> = {
      companyId: 'company_id',
      numeroTokens: 'numero_tokens',
      trainingFiles: 'training_files',
      trainingContent: 'training_content',
      agentType: 'agent_type',
      parentAgentId: 'parent_agent_id',
      delegationKeywords: 'delegation_keywords',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof AiAgent] !== undefined);
    const values = fields.map(key => {
      const value = updates[key as keyof AiAgent];
      if (key === 'trainingFiles' || key === 'delegationKeywords') {
        return JSON.stringify(value);
      }
      return value;
    });
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${fieldMapping[field] || field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE ai_agents SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getAiAgent(id) as Promise<AiAgent>;
  }

  async getMainAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM ai_agents WHERE company_id = ? AND (agent_type = "main" OR agent_type IS NULL) ORDER BY created_at DESC',
      [companyId]
    );
    return this.parseAiAgents(rows as any[]);
  }

  async getSecondaryAgentsByParent(parentAgentId: string): Promise<AiAgent[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM ai_agents WHERE parent_agent_id = ? AND agent_type = "secondary" ORDER BY created_at DESC',
      [parentAgentId]
    );
    return this.parseAiAgents(rows as any[]);
  }

  async getSecondaryAgentsByCompany(companyId: string): Promise<AiAgent[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM ai_agents WHERE company_id = ? AND agent_type = "secondary" ORDER BY created_at DESC',
      [companyId]
    );
    return this.parseAiAgents(rows as any[]);
  }

  async deleteAiAgent(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    // First delete all secondary agents that have this agent as parent
    await this.connection.execute('DELETE FROM ai_agents WHERE parent_agent_id = ?', [id]);
    // Then delete the agent itself
    await this.connection.execute('DELETE FROM ai_agents WHERE id = ?', [id]);
  }

  // Conversation methods
  async getConversation(id: string): Promise<Conversation | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );
    return (rows as Conversation[])[0];
  }

  async getConversationsByInstance(instanceId: string): Promise<Conversation[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM conversations WHERE whatsapp_instance_id = ? ORDER BY last_message_at DESC',
      [instanceId]
    );
    
    // Debug: verificar o que está sendo retornado do MySQL
    const rawResults = rows as any[];
    console.log(`🔍 [STORAGE] Raw MySQL results for instance ${instanceId}:`, 
      rawResults.map(r => ({ 
        id: r.id, 
        contact_phone: r.contact_phone, 
        contactPhone: r.contactPhone,
        raw_keys: Object.keys(r)
      }))
    );
    
    // Mapear manualmente se necessário (corrigir snake_case para camelCase)
    const mappedRows = rawResults.map(row => ({
      id: row.id,
      whatsappInstanceId: row.whatsapp_instance_id,
      contactName: row.contact_name,
      contactPhone: row.contact_phone, // Mapear explicitamente
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      status: row.status,
      createdAt: row.created_at
    }));
    
    console.log(`🔍 [STORAGE] Mapped results:`, 
      mappedRows.map(r => ({ id: r.id, contactPhone: r.contactPhone }))
    );
    
    return mappedRows as Conversation[];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO conversations (id, whatsapp_instance_id, contact_name, contact_phone, last_message) VALUES (?, ?, ?, ?, ?)',
      [id, conversation.whatsappInstanceId || null, conversation.contactName || null, conversation.contactPhone || null, conversation.lastMessage || null]
    );
    return this.getConversation(id) as Promise<Conversation>;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    if (!this.connection) throw new Error('No database connection');
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof Conversation] !== undefined);
    const values = fields.map(key => updates[key as keyof Conversation]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE conversations SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getConversation(id) as Promise<Conversation>;
  }

  // Message methods
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
    
    // Mapear manualmente campos snake_case para camelCase
    const rawResults = rows as any[];
    const mappedRows = rawResults.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      content: row.content,
      sender: row.sender,
      agentId: row.agent_id, // ✅ Mapear agent_id para agentId
      messageType: row.message_type,
      evolutionMessageId: row.evolution_message_id,
      mediaUrl: row.media_url,
      mediaBase64: row.media_base64,
      caption: row.caption,
      createdAt: row.created_at
    }));
    
    return mappedRows as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO messages (id, conversation_id, content, sender, agent_id, message_type, evolution_message_id, media_url, media_base64, caption) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        message.conversationId, 
        message.content, 
        message.sender, 
        message.agentId || null, // Incluir o agentId
        message.messageType || 'text', 
        message.evolutionMessageId || null,
        message.mediaUrl || null,
        message.mediaBase64 || null,
        message.caption || null
      ]
    );
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );
    
    // Mapear campos snake_case para camelCase também no createMessage
    const rawRow = (rows as any[])[0];
    return {
      id: rawRow.id,
      conversationId: rawRow.conversation_id,
      content: rawRow.content,
      sender: rawRow.sender,
      agentId: rawRow.agent_id,
      messageType: rawRow.message_type,
      evolutionMessageId: rawRow.evolution_message_id,
      mediaUrl: rawRow.media_url,
      mediaBase64: rawRow.media_base64,
      caption: rawRow.caption,
      createdAt: rawRow.created_at
    } as Message;
  }

  // Contact Lists methods
  async getContactList(id: string): Promise<ContactList | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM contact_lists WHERE id = ?',
      [id]
    );
    const row = (rows as any[])[0];
    if (!row) return undefined;
    
    return {
      ...row,
      companyId: row.company_id,
      totalContacts: row.total_contacts,
      validContacts: row.valid_contacts,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as ContactList;
  }

  async getContactListsByCompany(companyId: string): Promise<ContactList[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM contact_lists WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    
    return (rows as any[]).map(row => ({
      ...row,
      companyId: row.company_id,
      totalContacts: row.total_contacts,
      validContacts: row.valid_contacts,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as ContactList[];
  }

  async createContactList(list: InsertContactList): Promise<ContactList> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO contact_lists (id, company_id, name, total_contacts, valid_contacts) VALUES (?, ?, ?, ?, ?)',
      [id, list.companyId, list.name, list.totalContacts || 0, list.validContacts || 0]
    );
    
    return this.getContactList(id) as Promise<ContactList>;
  }

  async updateContactList(id: string, updates: Partial<ContactList>): Promise<ContactList> {
    if (!this.connection) throw new Error('No database connection');
    
    const fieldMapping: Record<string, string> = {
      companyId: 'company_id',
      totalContacts: 'total_contacts',
      validContacts: 'valid_contacts',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof ContactList] !== undefined);
    const values = fields.map(key => updates[key as keyof ContactList]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${fieldMapping[field] || field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE contact_lists SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
    
    return this.getContactList(id) as Promise<ContactList>;
  }

  async deleteContactList(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    // Items will be deleted automatically due to CASCADE foreign key
    await this.connection.execute('DELETE FROM contact_lists WHERE id = ?', [id]);
  }

  // Contact List Items methods
  async getContactListItems(contactListId: string): Promise<ContactListItem[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM contact_list_items WHERE contact_list_id = ? ORDER BY created_at ASC',
      [contactListId]
    );
    
    return (rows as any[]).map(row => ({
      ...row,
      contactListId: row.contact_list_id,
      createdAt: row.created_at
    })) as ContactListItem[];
  }

  async createContactListItem(item: InsertContactListItem): Promise<ContactListItem> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO contact_list_items (id, contact_list_id, name, phone, valid, error) VALUES (?, ?, ?, ?, ?, ?)',
      [id, item.contactListId, item.name, item.phone, item.valid ?? true, item.error || null]
    );
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM contact_list_items WHERE id = ?',
      [id]
    );
    
    const row = (rows as any[])[0];
    return {
      ...row,
      contactListId: row.contact_list_id,
      createdAt: row.created_at
    } as ContactListItem;
  }

  async deleteContactListItems(contactListId: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM contact_list_items WHERE contact_list_id = ?', [contactListId]);
  }

  // Scheduled Messages Methods
  // Helper to format MySQL datetime for local timezone
  private formatDateTimeForLocal(mysqlDateTime: any): string {
    if (!mysqlDateTime) return mysqlDateTime;
    
    // MySQL returns datetime without timezone info
    // We need to ensure it's treated as local time
    const dateStr = mysqlDateTime.toString();
    
    // If it's already in ISO format with Z, remove the Z
    if (dateStr.endsWith('Z')) {
      return dateStr.slice(0, -1);
    }
    
    // If it's in MySQL format (YYYY-MM-DD HH:MM:SS), return as is
    // The frontend will parse it as local time
    return dateStr;
  }

  async getScheduledMessage(id: string): Promise<ScheduledMessage | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM scheduled_messages WHERE id = ?',
      [id]
    );
    
    const messages = rows as any[];
    if (messages.length === 0) return undefined;
    
    const message = messages[0];
    return {
      id: message.id,
      companyId: message.company_id,
      contactListId: message.contact_list_id,
      instanceIds: JSON.parse(message.instance_ids || '[]'),
      messageType: message.message_type,
      messageContent: message.message_content,
      messages: message.messages ? JSON.parse(message.messages) : null,
      useMultipleMessages: !!message.use_multiple_messages,
      fileName: message.file_name,
      fileBase64: message.file_base64,
      scheduledDateTime: this.formatDateTimeForLocal(message.scheduled_date_time),
      intervalMin: message.interval_min,
      intervalMax: message.interval_max,
      useMultipleInstances: !!message.use_multiple_instances,
      randomizeInstances: !!message.randomize_instances,
      status: message.status,
      totalMessages: message.total_messages,
      sentMessages: message.sent_messages,
      failedMessages: message.failed_messages,
      startedAt: message.started_at,
      completedAt: message.completed_at,
      errorMessage: message.error_message,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    };
  }

  async getScheduledMessagesByCompany(companyId: string): Promise<ScheduledMessage[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM scheduled_messages WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    
    const messages = rows as any[];
    return messages.map(message => ({
      id: message.id,
      companyId: message.company_id,
      contactListId: message.contact_list_id,
      instanceIds: JSON.parse(message.instance_ids || '[]'),
      messageType: message.message_type,
      messageContent: message.message_content,
      messages: message.messages ? JSON.parse(message.messages) : null,
      useMultipleMessages: !!message.use_multiple_messages,
      fileName: message.file_name,
      fileBase64: message.file_base64,
      scheduledDateTime: this.formatDateTimeForLocal(message.scheduled_date_time),
      intervalMin: message.interval_min,
      intervalMax: message.interval_max,
      useMultipleInstances: !!message.use_multiple_instances,
      randomizeInstances: !!message.randomize_instances,
      status: message.status,
      totalMessages: message.total_messages,
      sentMessages: message.sent_messages,
      failedMessages: message.failed_messages,
      startedAt: message.started_at,
      completedAt: message.completed_at,
      errorMessage: message.error_message,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    }));
  }

  async getPendingScheduledMessages(): Promise<ScheduledMessage[]> {
    if (!this.connection) throw new Error('No database connection');
    
    // Use local time for comparison, not UTC
    // Convert current local time to MySQL format
    const now = new Date();
    const mysqlNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    console.log(`🕐 [Storage] Checking for messages scheduled before: ${mysqlNow}`);
    
    // First, let's see all scheduled messages regardless of time (for debugging)
    const [debugRows] = await this.connection.execute(
      'SELECT id, status, scheduled_date_time FROM scheduled_messages WHERE status = "scheduled" ORDER BY scheduled_date_time DESC LIMIT 10',
      []
    );
    console.log(`🔍 [Storage DEBUG] All scheduled messages:`, debugRows);
    
    // Also check recently completed messages (might have been processed already)
    const [recentRows] = await this.connection.execute(
      'SELECT id, status, scheduled_date_time, completed_at, sent_messages, failed_messages FROM scheduled_messages WHERE status IN ("completed", "processing", "failed") AND scheduled_date_time >= CURDATE() ORDER BY updated_at DESC LIMIT 5',
      []
    );
    console.log(`🔍 [Storage DEBUG] Recent non-scheduled messages:`, recentRows);
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM scheduled_messages WHERE status = "scheduled" AND scheduled_date_time <= ? ORDER BY scheduled_date_time ASC',
      [mysqlNow]
    );
    
    const messages = rows as any[];
    return messages.map(message => ({
      id: message.id,
      companyId: message.company_id,
      contactListId: message.contact_list_id,
      instanceIds: JSON.parse(message.instance_ids || '[]'),
      messageType: message.message_type,
      messageContent: message.message_content,
      messages: message.messages ? JSON.parse(message.messages) : null,
      useMultipleMessages: !!message.use_multiple_messages,
      fileName: message.file_name,
      fileBase64: message.file_base64,
      scheduledDateTime: this.formatDateTimeForLocal(message.scheduled_date_time),
      intervalMin: message.interval_min,
      intervalMax: message.interval_max,
      useMultipleInstances: !!message.use_multiple_instances,
      randomizeInstances: !!message.randomize_instances,
      status: message.status,
      totalMessages: message.total_messages,
      sentMessages: message.sent_messages,
      failedMessages: message.failed_messages,
      startedAt: message.started_at,
      completedAt: message.completed_at,
      errorMessage: message.error_message,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    }));
  }

  async createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    
    await this.connection.execute(
      `INSERT INTO scheduled_messages (
        id, company_id, contact_list_id, instance_ids, message_type, message_content, 
        messages, use_multiple_messages, file_name, file_base64, scheduled_date_time, 
        interval_min, interval_max, use_multiple_instances, randomize_instances, 
        total_messages, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        message.companyId,
        message.contactListId,
        JSON.stringify(message.instanceIds),
        message.messageType,
        message.messageContent,
        message.messages ? JSON.stringify(message.messages) : null,
        message.useMultipleMessages ? 1 : 0,
        message.fileName || null,
        message.fileBase64 || null,
        message.scheduledDateTime,
        message.intervalMin,
        message.intervalMax,
        message.useMultipleInstances ? 1 : 0,
        message.randomizeInstances ? 1 : 0,
        message.totalMessages,
        'scheduled'
      ]
    );
    
    const createdMessage = await this.getScheduledMessage(id);
    if (!createdMessage) throw new Error('Failed to create scheduled message');
    
    return createdMessage;
  }

  async updateScheduledMessage(id: string, updates: Partial<ScheduledMessage>): Promise<ScheduledMessage> {
    if (!this.connection) throw new Error('No database connection');
    
    console.log(`📝 [Storage] Updating scheduled message ${id} with:`, updates);
    
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.status !== undefined) {
      setParts.push('status = ?');
      values.push(updates.status);
      console.log(`📝 [Storage] Setting status to: ${updates.status}`);
    }
    
    if (updates.sentMessages !== undefined) {
      setParts.push('sent_messages = ?');
      values.push(updates.sentMessages);
    }
    
    if (updates.failedMessages !== undefined) {
      setParts.push('failed_messages = ?');
      values.push(updates.failedMessages);
    }
    
    if (updates.startedAt !== undefined) {
      setParts.push('started_at = ?');
      // Convert startedAt to local time format for MySQL
      const startedAt = updates.startedAt instanceof Date ? updates.startedAt : new Date(updates.startedAt);
      const mysqlDateTime = `${startedAt.getFullYear()}-${String(startedAt.getMonth() + 1).padStart(2, '0')}-${String(startedAt.getDate()).padStart(2, '0')} ${String(startedAt.getHours()).padStart(2, '0')}:${String(startedAt.getMinutes()).padStart(2, '0')}:${String(startedAt.getSeconds()).padStart(2, '0')}`;
      values.push(mysqlDateTime);
      console.log(`📝 [Storage] Setting startedAt to local time: ${mysqlDateTime}`);
    }
    
    if (updates.completedAt !== undefined) {
      setParts.push('completed_at = ?');
      // Convert completedAt to local time format for MySQL
      const completedAt = updates.completedAt instanceof Date ? updates.completedAt : new Date(updates.completedAt);
      const mysqlDateTime = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')} ${String(completedAt.getHours()).padStart(2, '0')}:${String(completedAt.getMinutes()).padStart(2, '0')}:${String(completedAt.getSeconds()).padStart(2, '0')}`;
      values.push(mysqlDateTime);
      console.log(`📝 [Storage] Setting completedAt to local time: ${mysqlDateTime}`);
    }
    
    if (updates.errorMessage !== undefined) {
      setParts.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    
    if (setParts.length === 0) {
      const message = await this.getScheduledMessage(id);
      if (!message) throw new Error('Scheduled message not found');
      return message;
    }
    
    values.push(id);
    
    const query = `UPDATE scheduled_messages SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = ?`;
    console.log(`📝 [Storage] Executing query: ${query}`);
    console.log(`📝 [Storage] With values:`, values);
    
    await this.connection.execute(query, values);
    
    const updatedMessage = await this.getScheduledMessage(id);
    if (!updatedMessage) throw new Error('Failed to update scheduled message');
    
    console.log(`✅ [Storage] Updated message status: ${updatedMessage.status}, sent: ${updatedMessage.sentMessages}, failed: ${updatedMessage.failedMessages}`);
    
    return updatedMessage;
  }

  async deleteScheduledMessage(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM scheduled_messages WHERE id = ?', [id]);
  }

  async getScheduledMessagesByStatus(status: string): Promise<ScheduledMessage[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM scheduled_messages WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    
    const messages = rows as any[];
    return messages.map(message => ({
      id: message.id,
      companyId: message.company_id,
      contactListId: message.contact_list_id,
      instanceIds: JSON.parse(message.instance_ids || '[]'),
      messageType: message.message_type,
      messageContent: message.message_content,
      messages: message.messages ? JSON.parse(message.messages) : null,
      useMultipleMessages: !!message.use_multiple_messages,
      fileName: message.file_name,
      fileBase64: message.file_base64,
      scheduledDateTime: this.formatDateTimeForLocal(message.scheduled_date_time),
      intervalMin: message.interval_min,
      intervalMax: message.interval_max,
      useMultipleInstances: !!message.use_multiple_instances,
      randomizeInstances: !!message.randomize_instances,
      status: message.status,
      totalMessages: message.total_messages,
      sentMessages: message.sent_messages,
      failedMessages: message.failed_messages,
      startedAt: message.started_at,
      completedAt: message.completed_at,
      errorMessage: message.error_message,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    }));
  }

  async getWhatsappInstancesByIds(ids: string[]): Promise<WhatsappInstance[]> {
    if (!this.connection) throw new Error('No database connection');
    
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await this.connection.execute(
      `SELECT * FROM whatsapp_instances WHERE id IN (${placeholders})`,
      ids
    );
    
    const instances = rows as any[];
    console.log(`🔍 [Storage] Raw instances from DB:`, instances.map(i => ({ 
      id: i.id, 
      name: i.name, 
      evolution_id: i.evolution_id, 
      status: i.status 
    })));
    
    const mappedInstances = instances.map(instance => ({
      ...instance,
      companyId: instance.company_id,
      evolutionId: instance.evolution_instance_id,
      aiAgentId: instance.ai_agent_id,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at
    }));
    
    console.log(`📋 [Storage] Mapped instances:`, mappedInstances.map(i => ({ 
      id: i.id, 
      name: i.name, 
      evolutionId: i.evolutionId, 
      status: i.status 
    })));
    
    return mappedInstances;
  }

  // Funnel Stages
  async getFunnelStage(id: string): Promise<FunnelStage | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM funnel_stages WHERE id = ?',
      [id]
    );
    
    const stages = rows as any[];
    if (stages.length === 0) return undefined;
    
    const stage = stages[0];
    return {
      ...stage,
      companyId: stage.company_id,
      isActive: Boolean(stage.is_active),
      createdAt: stage.created_at,
      updatedAt: stage.updated_at
    } as FunnelStage;
  }

  async getFunnelStagesByCompany(companyId: string): Promise<FunnelStage[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM funnel_stages WHERE company_id = ? ORDER BY `order` ASC',
      [companyId]
    );
    
    const stages = rows as any[];
    return stages.map(stage => ({
      ...stage,
      companyId: stage.company_id,
      isActive: Boolean(stage.is_active),
      createdAt: stage.created_at,
      updatedAt: stage.updated_at
    })) as FunnelStage[];
  }

  async createFunnelStage(stage: InsertFunnelStage): Promise<FunnelStage> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO funnel_stages (id, company_id, name, description, color, `order`, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, stage.companyId, stage.name, stage.description || null, stage.color || '#3B82F6', stage.order || 1, stage.isActive !== false]
    );
    
    const createdStage = await this.getFunnelStage(id);
    if (!createdStage) throw new Error('Failed to create funnel stage');
    return createdStage;
  }

  async updateFunnelStage(id: string, updates: Partial<FunnelStage>): Promise<FunnelStage> {
    if (!this.connection) throw new Error('No database connection');
    
    const fieldMapping: Record<string, string> = {
      companyId: 'company_id',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof FunnelStage] !== undefined);
    const values = fields.map(key => updates[key as keyof FunnelStage]);
    
    if (fields.length > 0) {
      const setClause = fields.map(field => `${fieldMapping[field] || field} = ?`).join(', ');
      await this.connection.execute(
        `UPDATE funnel_stages SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        [...values, id]
      );
    }
    
    const updatedStage = await this.getFunnelStage(id);
    if (!updatedStage) throw new Error('Failed to update funnel stage');
    return updatedStage;
  }

  async deleteFunnelStage(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM funnel_stages WHERE id = ?', [id]);
  }

  async reorderFunnelStage(id: string, direction: 'up' | 'down', companyId: string): Promise<{ success: boolean }> {
    if (!this.connection) throw new Error('No database connection');
    
    // Get the current stage
    const currentStage = await this.getFunnelStage(id);
    if (!currentStage) {
      throw new Error('Funnel stage not found');
    }
    
    // Get all stages for this company ordered by order
    const allStages = await this.getFunnelStagesByCompany(companyId);
    const currentIndex = allStages.findIndex(stage => stage.id === id);
    
    if (currentIndex === -1) {
      throw new Error('Stage not found in company stages');
    }
    
    let swapIndex: number;
    if (direction === 'up') {
      swapIndex = currentIndex - 1;
      if (swapIndex < 0) {
        return { success: false }; // Already at the top
      }
    } else {
      swapIndex = currentIndex + 1;
      if (swapIndex >= allStages.length) {
        return { success: false }; // Already at the bottom
      }
    }
    
    // Swap the order values
    const currentOrder = allStages[currentIndex].order;
    const swapOrder = allStages[swapIndex].order;
    
    await this.connection.beginTransaction();
    
    try {
      // Update both stages' order
      await this.connection.execute(
        'UPDATE funnel_stages SET `order` = ? WHERE id = ?',
        [swapOrder, currentStage.id]
      );
      
      await this.connection.execute(
        'UPDATE funnel_stages SET `order` = ? WHERE id = ?',
        [currentOrder, allStages[swapIndex].id]
      );
      
      await this.connection.commit();
      return { success: true };
    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    const customers = rows as any[];
    if (customers.length === 0) return undefined;
    
    return this.parseCustomer(customers[0]);
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM customers WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    
    const customers = rows as any[];
    return customers.map(row => this.parseCustomer(row));
  }

  async getCustomerByPhone(phone: string, companyId: string): Promise<Customer | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM customers WHERE phone = ? AND company_id = ?',
      [phone, companyId]
    );
    
    const customers = rows as any[];
    if (customers.length === 0) return undefined;
    
    return this.parseCustomer(customers[0]);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    
    console.log('🔍 [STORAGE] Attempting to create customer:', {
      id,
      companyId: customer.companyId,
      name: customer.name,
      phone: customer.phone,
      funnelStageId: customer.funnelStageId,
      lastContact: customer.lastContact,
      source: customer.source,
      conversationId: customer.conversationId
    });
    
    try {
      await this.connection.execute(
        `INSERT INTO customers (id, company_id, name, phone, email, company, funnel_stage_id, last_contact, notes, value, source, conversation_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          customer.companyId,
          customer.name,
          customer.phone,
          customer.email || null,
          customer.company || null,
          customer.funnelStageId,
          customer.lastContact || null,
          customer.notes || null,
          customer.value || null,
          customer.source || 'WhatsApp',
          customer.conversationId || null
        ]
      );
      
      console.log('✅ [STORAGE] Customer insert successful, fetching created customer...');
      
      const newCustomer = await this.getCustomer(id);
      if (!newCustomer) {
        console.error('❌ [STORAGE] Customer was inserted but could not be retrieved');
        throw new Error('Failed to create customer');
      }
      
      console.log('✅ [STORAGE] Customer created successfully:', newCustomer.id);
      return newCustomer;
      
    } catch (error) {
      console.error('❌ [STORAGE] Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (!this.connection) throw new Error('No database connection');
    
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.company !== undefined) {
      fields.push('company = ?');
      values.push(updates.company);
    }
    if (updates.funnelStageId !== undefined) {
      fields.push('funnel_stage_id = ?');
      values.push(updates.funnelStageId);
    }
    if (updates.lastContact !== undefined) {
      fields.push('last_contact = ?');
      values.push(updates.lastContact);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.value !== undefined) {
      fields.push('value = ?');
      values.push(updates.value);
    }
    if (updates.source !== undefined) {
      fields.push('source = ?');
      values.push(updates.source);
    }
    if (updates.conversationId !== undefined) {
      fields.push('conversation_id = ?');
      values.push(updates.conversationId);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(id);
    
    await this.connection.execute(
      `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    const updatedCustomer = await this.getCustomer(id);
    if (!updatedCustomer) throw new Error('Customer not found after update');
    
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!this.connection) throw new Error('No database connection');
    
    await this.connection.execute('DELETE FROM customers WHERE id = ?', [id]);
  }

  private parseCustomer(row: any): Customer {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      company: row.company,
      funnelStageId: row.funnel_stage_id,
      lastContact: row.last_contact,
      notes: row.notes,
      value: row.value ? parseFloat(row.value) : undefined,
      source: row.source,
      conversationId: row.conversation_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

let storageInstance: MySQLStorage | null = null;

export function getStorage(): MySQLStorage {
  if (!storageInstance) {
    storageInstance = new MySQLStorage();
  }
  return storageInstance;
}
