import mysql from 'mysql2/promise';
import { 
  User, InsertUser, Company, InsertCompany, GlobalConfiguration, 
  InsertGlobalConfiguration, EvolutionApiConfiguration, InsertEvolutionApiConfiguration,
  AiConfiguration, InsertAiConfiguration, WhatsappInstance, InsertWhatsappInstance,
  AiAgent, InsertAiAgent, Conversation, InsertConversation, Message, InsertMessage
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
        message_type VARCHAR(20) DEFAULT 'text',
        evolution_message_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.connection.execute(table);
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
        'INSERT INTO global_configurations (id, logo, favicon, cores_primaria, cores_secundaria, cores_fundo, nome_sistema, nome_rodape, nome_aba_navegador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, config.logo, config.favicon, config.cores_primaria, config.cores_secundaria, config.cores_fundo, config.nome_sistema, config.nome_rodape, config.nome_aba_navegador]
      );
      return this.getGlobalConfiguration() as Promise<GlobalConfiguration>;
    }
  }

  // Evolution API Configuration methods
  async getEvolutionApiConfiguration(): Promise<EvolutionApiConfiguration | undefined> {
    if (!this.connection) throw new Error('No database connection');
    
    const [rows] = await this.connection.execute('SELECT * FROM evolution_api_configurations LIMIT 1') as any;
    const rawData = rows[0];
    if (!rawData) return undefined;
    
    // Mapeamento dos campos do banco para o frontend
    return {
      id: rawData.id,
      evolutionURL: rawData.evolution_url,
      evolutionToken: rawData.evolution_token,
      urlGlobalSistema: rawData.url_global_sistema,
      updatedAt: rawData.updated_at,
    } as EvolutionApiConfiguration;
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
    return {
      id: rawData.id,
      apiKey: rawData.api_key,
      modelo: rawData.modelo,
      temperatura: rawData.temperatura,
      numeroTokens: rawData.numero_tokens,
      updatedAt: rawData.updated_at,
    } as AiConfiguration;
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
      ...row,
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
      ...row,
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
    return rows as Conversation[];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO conversations (id, whatsapp_instance_id, contact_name, contact_phone, last_message) VALUES (?, ?, ?, ?, ?)',
      [id, conversation.whatsappInstanceId, conversation.contactName, conversation.contactPhone, conversation.lastMessage]
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
    return rows as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    if (!this.connection) throw new Error('No database connection');
    
    const id = randomUUID();
    await this.connection.execute(
      'INSERT INTO messages (id, conversation_id, content, sender, message_type, evolution_message_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, message.conversationId, message.content, message.sender, message.messageType, message.evolutionMessageId]
    );
    
    const [rows] = await this.connection.execute(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );
    return (rows as Message[])[0];
  }
}

let storageInstance: MySQLStorage | null = null;

export function getStorage(): MySQLStorage {
  if (!storageInstance) {
    storageInstance = new MySQLStorage();
  }
  return storageInstance;
}
