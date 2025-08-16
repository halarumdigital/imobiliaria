import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { 
  authenticate, requireAdmin, requireClient, requireCompanyAccess, 
  generateToken, hashPassword, comparePassword, AuthRequest 
} from "./auth";
import { EvolutionApiService } from "./services/evolutionApi";
import { OpenAiService } from "./services/openai";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertUserSchema, insertCompanySchema, insertGlobalConfigSchema, 
  insertEvolutionConfigSchema, insertAiConfigSchema, insertWhatsappInstanceSchema,
  insertAiAgentSchema, insertConversationSchema, insertMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage connection
  const storage = getStorage();
  await storage.init();
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = generateToken(user);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email já está em uso" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = generateToken(user);
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // Global configurations (Admin only)
  app.get("/api/global-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getGlobalConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Get global config error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/global-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const configData = insertGlobalConfigSchema.parse(req.body);
      const config = await storage.saveGlobalConfiguration(configData);
      res.json(config);
    } catch (error) {
      console.error("Save global config error:", error);
      res.status(500).json({ error: "Erro ao salvar configurações" });
    }
  });

  // Evolution API configurations (Admin only)
  app.get("/api/evolution-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getEvolutionApiConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Get evolution config error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/evolution-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const configData = insertEvolutionConfigSchema.parse(req.body);
      const config = await storage.saveEvolutionApiConfiguration(configData);
      
      // Test connection
      const evolutionService = new EvolutionApiService({
        baseURL: config.evolutionURL,
        token: config.evolutionToken
      });
      
      const isConnected = await evolutionService.testConnection();
      
      res.json({ ...config, status: isConnected ? 'connected' : 'disconnected' });
    } catch (error) {
      console.error("Save evolution config error:", error);
      res.status(500).json({ error: "Erro ao salvar configurações" });
    }
  });

  app.post("/api/evolution-config/test", authenticate, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getEvolutionApiConfiguration();
      if (!config) {
        return res.status(404).json({ error: "Configuração não encontrada" });
      }

      const evolutionService = new EvolutionApiService({
        baseURL: config.evolutionURL,
        token: config.evolutionToken
      });
      
      const isConnected = await evolutionService.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Test evolution connection error:", error);
      res.status(500).json({ error: "Erro ao testar conexão" });
    }
  });

  // AI configurations (Admin only)
  app.get("/api/ai-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getAiConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Get AI config error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/ai-config", authenticate, requireAdmin, async (req, res) => {
    try {
      const configData = insertAiConfigSchema.parse(req.body);
      const config = await storage.saveAiConfiguration(configData);
      res.json(config);
    } catch (error) {
      console.error("Save AI config error:", error);
      res.status(500).json({ error: "Erro ao salvar configurações" });
    }
  });

  app.post("/api/ai-config/test", authenticate, requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      const config = await storage.getAiConfiguration();
      
      if (!config) {
        return res.status(404).json({ error: "Configuração de IA não encontrada" });
      }

      const openAiService = new OpenAiService(config.apiKey);
      const response = await openAiService.generateResponse(
        prompt || "Hello, this is a test.",
        "You are a helpful assistant.",
        {
          model: config.modelo || 'gpt-4o',
          temperature: parseFloat((config.temperatura || 0.7).toString()),
          maxTokens: config.numeroTokens || 1000
        }
      );
      
      res.json({ response: response.content, usage: response.usage });
    } catch (error) {
      console.error("Test AI error:", error);
      res.status(500).json({ error: "Erro ao testar IA" });
    }
  });

  // Companies (Admin only)
  app.get("/api/companies", authenticate, requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ error: "Erro ao buscar empresas" });
    }
  });

  app.post("/api/companies", authenticate, requireAdmin, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Create company error:", error);
      res.status(500).json({ error: "Erro ao criar empresa" });
    }
  });

  app.put("/api/companies/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      res.json(company);
    } catch (error) {
      console.error("Update company error:", error);
      res.status(500).json({ error: "Erro ao atualizar empresa" });
    }
  });

  app.delete("/api/companies/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete company error:", error);
      res.status(500).json({ error: "Erro ao excluir empresa" });
    }
  });

  // Company profile (Client)
  app.get("/api/profile", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const company = await storage.getCompany(req.user.companyId);
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      res.json(company);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Erro ao buscar perfil" });
    }
  });

  app.put("/api/profile", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.user.companyId, companyData);
      res.json(company);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  });

  // WhatsApp instances
  app.get("/api/whatsapp-instances", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const instances = await storage.getWhatsappInstancesByCompany(req.user.companyId);
      res.json(instances);
    } catch (error) {
      console.error("Get WhatsApp instances error:", error);
      res.status(500).json({ error: "Erro ao buscar instâncias" });
    }
  });

  app.post("/api/whatsapp-instances", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const instanceData = insertWhatsappInstanceSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const instance = await storage.createWhatsappInstance(instanceData);

      // Create instance in Evolution API
      try {
        const evolutionConfig = await storage.getEvolutionApiConfiguration();
        if (evolutionConfig) {
          const evolutionService = new EvolutionApiService({
            baseURL: evolutionConfig.evolutionURL,
            token: evolutionConfig.evolutionToken
          });

          const evolutionResponse = await evolutionService.createInstance({
            instanceName: instance.id,
            qrcode: true
          });

          // Update instance with Evolution data
          await storage.updateWhatsappInstance(instance.id, {
            evolutionInstanceId: evolutionResponse.instance?.instanceName || instance.id
          });
        }
      } catch (evolutionError) {
        console.error("Evolution API error:", evolutionError);
      }

      res.status(201).json(instance);
    } catch (error) {
      console.error("Create WhatsApp instance error:", error);
      res.status(500).json({ error: "Erro ao criar instância" });
    }
  });

  app.get("/api/whatsapp-instances/:id/qr", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        return res.status(404).json({ error: "Configuração Evolution API não encontrada" });
      }

      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      const qrResponse = await evolutionService.generateQRCode(instance.evolutionInstanceId || instance.id);
      
      // Update instance with QR code
      await storage.updateWhatsappInstance(id, {
        qrCode: qrResponse.qrcode.base64
      });

      res.json({ qrCode: qrResponse.qrcode.base64 });
    } catch (error) {
      console.error("Generate QR code error:", error);
      res.status(500).json({ error: "Erro ao gerar QR Code" });
    }
  });

  app.delete("/api/whatsapp-instances/:id", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Delete from Evolution API
      try {
        const evolutionConfig = await storage.getEvolutionApiConfiguration();
        if (evolutionConfig) {
          const evolutionService = new EvolutionApiService({
            baseURL: evolutionConfig.evolutionURL,
            token: evolutionConfig.evolutionToken
          });

          await evolutionService.deleteInstance(instance.evolutionInstanceId || instance.id);
        }
      } catch (evolutionError) {
        console.error("Evolution API delete error:", evolutionError);
      }

      await storage.deleteWhatsappInstance(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete WhatsApp instance error:", error);
      res.status(500).json({ error: "Erro ao excluir instância" });
    }
  });

  // AI Agents
  app.get("/api/ai-agents", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const agents = await storage.getAiAgentsByCompany(req.user.companyId);
      res.json(agents);
    } catch (error) {
      console.error("Get AI agents error:", error);
      res.status(500).json({ error: "Erro ao buscar agentes" });
    }
  });

  app.post("/api/ai-agents", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const agentData = insertAiAgentSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const agent = await storage.createAiAgent(agentData);
      res.status(201).json(agent);
    } catch (error) {
      console.error("Create AI agent error:", error);
      res.status(500).json({ error: "Erro ao criar agente" });
    }
  });

  app.put("/api/ai-agents/:id", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const agentData = insertAiAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAiAgent(id, agentData);
      res.json(agent);
    } catch (error) {
      console.error("Update AI agent error:", error);
      res.status(500).json({ error: "Erro ao atualizar agente" });
    }
  });

  app.delete("/api/ai-agents/:id", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAiAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete AI agent error:", error);
      res.status(500).json({ error: "Erro ao excluir agente" });
    }
  });

  // Link AI agent to WhatsApp instance
  app.post("/api/whatsapp-instances/:instanceId/link-agent", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { instanceId } = req.params;
      const { agentId } = req.body;

      const instance = await storage.updateWhatsappInstance(instanceId, {
        aiAgentId: agentId
      });

      res.json(instance);
    } catch (error) {
      console.error("Link agent error:", error);
      res.status(500).json({ error: "Erro ao vincular agente" });
    }
  });

  // Conversations
  app.get("/api/conversations", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.query;
      
      if (!instanceId) {
        return res.status(400).json({ error: "ID da instância é obrigatório" });
      }

      const conversations = await storage.getConversationsByInstance(instanceId as string);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Erro ao buscar conversas" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticate, requireClient, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticate, requireClient, async (req, res) => {
    try {
      const { id } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId: id
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Erro ao criar mensagem" });
    }
  });

  // Object storage endpoints for file uploads
  const objectStorageService = new ObjectStorageService();

  app.post("/api/objects/upload", authenticate, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ error: "Erro ao obter URL de upload" });
    }
  });

  app.put("/api/avatar", authenticate, async (req: AuthRequest, res) => {
    try {
      const { avatarURL } = req.body;
      
      if (!avatarURL) {
        return res.status(400).json({ error: "URL do avatar é obrigatória" });
      }

      const objectPath = objectStorageService.normalizeObjectEntityPath(avatarURL);
      
      if (req.user?.companyId) {
        await storage.updateCompany(req.user.companyId, { avatar: objectPath });
      }

      res.json({ objectPath });
    } catch (error) {
      console.error("Update avatar error:", error);
      res.status(500).json({ error: "Erro ao atualizar avatar" });
    }
  });

  // Admin statistics endpoints
  app.get("/api/admin/stats", authenticate, requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      
      // Count instances and agents for all companies
      let totalInstances = 0;
      let totalAgents = 0;
      
      for (const company of companies) {
        const instances = await storage.getWhatsappInstancesByCompany(company.id);
        const agents = await storage.getAiAgentsByCompany(company.id);
        totalInstances += instances.length;
        totalAgents += agents.length;
      }

      res.json({
        activeCompanies: companies.filter(c => c.status === 'active').length,
        whatsappInstances: totalInstances,
        aiAgents: totalAgents,
        todayConversations: 0 // This would need more complex querying
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/client/stats", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const instances = await storage.getWhatsappInstancesByCompany(req.user.companyId);
      const agents = await storage.getAiAgentsByCompany(req.user.companyId);

      res.json({
        activeInstances: instances.filter(i => i.status === 'connected').length,
        aiAgents: agents.length,
        todayConversations: 0 // This would need more complex querying
      });
    } catch (error) {
      console.error("Get client stats error:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
