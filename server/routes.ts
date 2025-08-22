import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getStorage } from "./storage";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import { 
  authenticate, requireAdmin, requireClient, requireCompanyAccess, 
  generateToken, hashPassword, comparePassword, AuthRequest 
} from "./auth";
import { EvolutionApiService } from "./services/evolutionApi";
import { OpenAiService } from "./services/openai";
import { ObjectStorageService } from "./objectStorage";
import { extractTextFromMultiplePDFs } from "./pdfProcessor";
import { AiResponseService } from "./aiResponseService";
import { 
  insertUserSchema, insertCompanySchema, insertGlobalConfigSchema, 
  insertEvolutionConfigSchema, insertAiConfigSchema, insertWhatsappInstanceSchema,
  insertAiAgentSchema, insertConversationSchema, insertMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage connection
  const storage = getStorage();
  await storage.init();

  // Configure multer for file uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadType = req.path.includes('logo') ? 'logos' : 'favicons';
      const uploadPath = path.join(process.cwd(), 'uploads', uploadType);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uploadType = req.path.includes('logo') ? 'logo' : 'favicon';
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `${uploadType}-${timestamp}${ext}`);
    }
  });

  const upload = multer({ 
    storage: storage_config,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não permitido'));
      }
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
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
    try {
      // Buscar dados completos do usuário no banco
      const fullUser = await storage.getUser(req.user!.id);
      
      if (fullUser && fullUser.company_id && !req.user!.companyId) {
        // Se o usuário tem companyId no banco mas não no token, gerar novo token
        const userWithMappedFields = {
          ...fullUser,
          companyId: fullUser.company_id
        };
        const newToken = generateToken(userWithMappedFields);
        res.header('X-New-Token', newToken);
        res.json({ 
          user: userWithMappedFields,
          needsTokenRefresh: true,
          newToken
        });
      } else {
        res.json({ user: req.user });
      }
    } catch (error) {
      console.error('Auth me error:', error);
      res.json({ user: req.user });
    }
  });

  // Global configurations - Public view for branding
  app.get("/api/global-config/public", async (req, res) => {
    try {
      const config = await storage.getGlobalConfiguration();
      if (config) {
        // Return only visual/branding information
        const publicConfig = {
          logo: config.logo,
          favicon: config.favicon,
          coresPrimaria: config.cores_primaria,
          coresSecundaria: config.cores_secundaria,
          coresFundo: config.cores_fundo,
          nomeSistema: config.nome_sistema,
          nomeRodape: config.nome_rodape,
          nomeAbaNavegador: config.nome_aba_navegador
        };
        res.json(publicConfig);
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Get public global config error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
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

  // File upload endpoints for global configuration
  app.post("/api/upload/logo", authenticate, requireAdmin, upload.single('logo'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      const filePath = `/uploads/logos/${req.file.filename}`;
      res.json({ 
        success: true, 
        filePath,
        message: "Logo enviado com sucesso"
      });
    } catch (error) {
      console.error("Upload logo error:", error);
      res.status(500).json({ error: "Erro ao fazer upload do logo" });
    }
  });

  app.post("/api/upload/favicon", authenticate, requireAdmin, upload.single('favicon'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      const filePath = `/uploads/favicons/${req.file.filename}`;
      res.json({ 
        success: true, 
        filePath,
        message: "Favicon enviado com sucesso"
      });
    } catch (error) {
      console.error("Upload favicon error:", error);
      res.status(500).json({ error: "Erro ao fazer upload do favicon" });
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

  // Endpoint público para clientes acessarem configurações de IA (sem chave da API)
  app.get("/api/ai-config/public", authenticate, async (req, res) => {
    try {
      const config = await storage.getAiConfiguration();
      if (!config) {
        return res.json({ modelo: "gpt-4o", numeroTokens: 1000, temperatura: 0.7 });
      }
      
      // Retornar apenas campos seguros (sem a chave da API)
      res.json({
        modelo: config.modelo || "gpt-4o",
        numeroTokens: config.numeroTokens || 1000,
        temperatura: config.temperatura || 0.7
      });
    } catch (error) {
      console.error("Get public AI config error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/ai-config/test", authenticate, requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      const config = await storage.getAiConfiguration();
      
      console.log("AI test config:", config);
      
      if (!config) {
        return res.status(404).json({ error: "Configuração de IA não encontrada" });
      }

      if (!config.apiKey) {
        return res.status(400).json({ error: "Chave da API OpenAI não configurada" });
      }

      const openAiService = new OpenAiService(config.apiKey);
      const response = await openAiService.generateResponse(
        prompt || "Olá! Este é um teste de funcionamento.",
        "Você é um assistente útil. Responda de forma breve e educada em português.",
        {
          model: config.modelo || 'gpt-4o',
          temperature: parseFloat((config.temperatura || 0.7).toString()),
          maxTokens: config.numeroTokens || 1000
        }
      );
      
      res.json({ response: response.content, usage: response.usage });
    } catch (error) {
      console.error("Test AI error:", error);
      res.status(500).json({ 
        error: "Erro ao testar IA",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
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
      const { userEmail, userPassword, ...companyData } = req.body;
      
      // Validar dados da empresa
      const validatedCompanyData = insertCompanySchema.parse(companyData);
      
      // Criar empresa
      const company = await storage.createCompany(validatedCompanyData);
      
      // Criar usuário administrador da empresa (se fornecido)
      if (userEmail && userPassword) {
        const hashedPassword = await hashPassword(userPassword);
        const userData = {
          email: userEmail,
          password: hashedPassword,
          role: 'client' as const,
          companyId: company.id
        };
        
        await storage.createUser(userData);
      }
      
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
      
      // Debug: Verificar o que está sendo retornado para o frontend
      console.log("📋 Instances being returned to frontend:");
      instances.forEach(instance => {
        console.log(`  - ID: ${instance.id}, Name: ${instance.name}, EvolutionID: ${instance.evolutionInstanceId}`);
      });
      
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

  app.get("/api/whatsapp-instances/:id/qr", (req, res, next) => {
    console.log("ROUTE HIT - QR endpoint called!");
    next();
  }, authenticate, requireClient, async (req: AuthRequest, res) => {
    console.log("=== QR CODE REQUEST DEBUG ===");
    console.log("URL requested:", req.originalUrl);
    console.log("Method:", req.method);
    console.log("Headers:", JSON.stringify({
      authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
      contentType: req.headers['content-type']
    }));
    console.log("User from token:", req.user ? {
      id: req.user.id,
      companyId: req.user.companyId,
      role: req.user.role
    } : 'null');
    
    try {
      const { id } = req.params;
      console.log("QR Code request for instance ID:", id);
      console.log("User company ID:", req.user?.companyId);
      
      if (!req.user?.companyId) {
        console.log("No company ID found for user");
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const instance = await storage.getWhatsappInstance(id);
      console.log("Found instance:", instance ? {
        id: instance.id,
        companyId: instance.companyId,
        name: instance.name
      } : null);
      
      if (!instance) {
        console.log("Instance not found in database");
        return res.status(404).json({ error: "Instância não encontrada" });
      }
      
      // Fix for existing instances without companyId
      if (!instance.companyId && req.user.companyId) {
        console.log("Fixing missing companyId for instance");
        await storage.updateWhatsappInstance(id, { companyId: req.user.companyId });
        instance.companyId = req.user.companyId;
      }
      
      if (instance.companyId !== req.user.companyId) {
        console.log("Company mismatch - Instance:", instance.companyId, "User:", req.user.companyId);
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

      const instanceNameToUse = instance.evolutionInstanceId || instance.name?.replace(/\s+/g, '_').toLowerCase() || instance.id;
      console.log("🔍 Generating QR for instance:", instanceNameToUse);
      console.log("📋 Instance details:", { 
        evolutionInstanceId: instance.evolutionInstanceId, 
        name: instance.name,
        id: instance.id,
        nameToUse: instanceNameToUse
      });
      
      try {
        // First check if instance is already connected
        console.log(`🔍 Checking instance status: ${instanceNameToUse}`);
        const statusResponse = await evolutionService.getInstanceStatus(instanceNameToUse);
        console.log("Status Response from Evolution API:", JSON.stringify(statusResponse, null, 2));
        
        if (statusResponse?.instance?.state === 'open') {
          console.log("⚠️ Instance is already connected, cannot generate QR code");
          return res.status(400).json({ 
            error: "Instância já está conectada",
            details: "Para gerar um novo QR code, primeiro desconecte a instância",
            connected: true
          });
        }
        
        // If not connected, try to get QR Code
        console.log(`📱 Requesting QR Code for disconnected instance: ${instanceNameToUse}`);
        const qrResponse = await evolutionService.generateQRCode(instanceNameToUse);
        console.log("QR Response from Evolution API:", JSON.stringify(qrResponse, null, 2));
        
        // Check if QR code was actually returned
        const qrCodeData = qrResponse.qrcode?.base64 || qrResponse.base64 || qrResponse.qr;
        if (!qrCodeData) {
          console.log("⚠️ No QR code in response, instance may already be connected");
          return res.status(400).json({ 
            error: "QR Code não disponível",
            details: "A instância pode já estar conectada ou em processo de conexão",
            response: qrResponse
          });
        }
        
        // Update instance with QR code
        await storage.updateWhatsappInstance(id, {
          qrCode: qrCodeData
        });

        res.json({ qrCode: qrCodeData });
      } catch (qrError) {
        console.log("❌ QR generation failed, trying recovery steps...");
        console.error("QR Error:", qrError);
        
        const newInstanceName = instance.name?.replace(/\s+/g, '_').toLowerCase() || instance.id;
        
        try {
          // Step 1: Try to list instances to see what exists
          console.log("🔍 Listing all instances...");
          const allInstances = await evolutionService.listInstances();
          console.log("📋 All instances:", JSON.stringify(allInstances, null, 2));
          
          // Step 2: Try to disconnect/logout the instance first
          console.log(`🔌 Trying to disconnect instance: ${instanceNameToUse}`);
          try {
            await evolutionService.disconnectInstance(instanceNameToUse);
            console.log("✅ Instance disconnected successfully");
          } catch (disconnectError) {
            console.log("⚠️  Disconnect failed (instance may not be connected):", disconnectError);
          }
          
          // Step 3: Try to delete the existing instance
          console.log(`🗑️  Trying to delete instance: ${instanceNameToUse}`);
          try {
            await evolutionService.deleteInstance(instanceNameToUse);
            console.log("✅ Instance deleted successfully");
          } catch (deleteError) {
            console.log("⚠️  Delete failed:", deleteError);
          }
          
          // Step 4: Create a fresh instance
          console.log(`🆕 Creating fresh instance: ${newInstanceName}`);
          const evolutionResponse = await evolutionService.createInstance({
            instanceName: newInstanceName,
            qrcode: true
          });
          
          console.log("✅ Fresh instance created:", evolutionResponse);
          
          // Update database with new Evolution instance ID
          await storage.updateWhatsappInstance(id, {
            evolutionInstanceId: newInstanceName
          });
          
          // Step 5: Get QR Code from fresh instance
          console.log(`📱 Getting QR from fresh instance: ${newInstanceName}`);
          const newQrResponse = await evolutionService.generateQRCode(newInstanceName);
          console.log("✅ Fresh QR Response:", JSON.stringify(newQrResponse, null, 2));
          
          res.json({ qrCode: newQrResponse.qrcode?.base64 || newQrResponse.base64 });
        } catch (recoveryError) {
          console.error("❌ All recovery steps failed:", recoveryError);
          res.status(500).json({ 
            error: "Erro ao gerar QR Code. Tente criar uma nova instância.",
            details: "A instância pode estar em um estado inconsistente na Evolution API"
          });
        }
      }
    } catch (error) {
      console.error("Generate QR code error:", error);
      res.status(500).json({ error: "Erro ao gerar QR Code" });
    }
  });

  app.delete("/api/whatsapp-instances/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Fix for existing instances without companyId
      if (!instance.companyId && req.user?.companyId) {
        console.log("Fixing missing companyId for delete operation");
        await storage.updateWhatsappInstance(id, { companyId: req.user.companyId });
        instance.companyId = req.user.companyId;
      }
      
      // Check company access manually
      if (instance.companyId !== req.user?.companyId) {
        console.log("Company mismatch for delete - Instance:", instance.companyId, "User:", req.user?.companyId);
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      console.log("Deleting WhatsApp instance:", instance.name, "ID:", instance.id);

      // Delete from Evolution API first
      try {
        const evolutionConfig = await storage.getEvolutionApiConfiguration();
        if (evolutionConfig) {
          const evolutionService = new EvolutionApiService({
            baseURL: evolutionConfig.evolutionURL,
            token: evolutionConfig.evolutionToken
          });

          const instanceNameToDelete = instance.evolutionInstanceId || instance.name;
          console.log("Deleting from Evolution API:", instanceNameToDelete);
          
          // First, list all instances to debug
          const allInstances = await evolutionService.listInstances();
          console.log("All Evolution API instances:", JSON.stringify(allInstances, null, 2));
          
          await evolutionService.deleteInstance(instanceNameToDelete);
          console.log("Successfully deleted from Evolution API");
        }
      } catch (evolutionError) {
        console.error("Evolution API delete error:", evolutionError);
        // Continue with database deletion even if Evolution API fails
      }

      // Delete from database
      await storage.deleteWhatsappInstance(id);
      console.log("Successfully deleted from database");
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete WhatsApp instance error:", error);
      res.status(500).json({ error: "Erro ao excluir instância" });
    }
  });

  // Get connection status for WhatsApp instance
  app.get("/api/whatsapp-instances/:id/status", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Fix for existing instances without companyId (similar to other routes)
      if (!instance.companyId && req.user?.companyId) {
        console.log("🔧 Corrigindo companyId ausente para instância");
        await storage.updateWhatsappInstance(id, { companyId: req.user.companyId });
        instance.companyId = req.user.companyId;
      }

      // Fix for existing instances without evolutionInstanceId
      if (!instance.evolutionInstanceId && instance.name) {
        const evolutionInstanceId = instance.name.replace(/\s+/g, '_').toLowerCase();
        console.log(`🔧 Corrigindo evolutionInstanceId ausente automaticamente: ${instance.name} -> ${evolutionInstanceId}`);
        await storage.updateWhatsappInstance(id, { evolutionInstanceId });
        instance.evolutionInstanceId = evolutionInstanceId;
      }

      // Se ainda não tem evolutionInstanceId, não pode verificar status
      if (!instance.evolutionInstanceId) {
        console.log(`⚠️ Instância sem evolutionInstanceId: ${instance.name} - não pode verificar status`);
        return res.status(400).json({ 
          error: "Instância não tem evolutionInstanceId configurado",
          details: "Use o botão 'Corrigir Nomes' para corrigir esta instância"
        });
      }

      // Check company access
      console.log(`🔒 Verificando acesso da empresa:`);
      console.log(`   - User role: ${req.user?.role}`);
      console.log(`   - User companyId: ${req.user?.companyId}`);
      console.log(`   - Instance companyId: ${instance.companyId}`);
      
      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        console.log(`❌ Acesso negado: companyId não confere`);
        return res.status(403).json({ error: "Acesso negado: instância não pertence à sua empresa" });
      }
      
      console.log(`✅ Acesso liberado para status`);
      

      console.log(`🔍 Buscando status da instância: ${instance.name} (${instance.evolutionInstanceId})`);

      // Get Evolution API configuration
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        return res.status(500).json({ error: "Configuração da Evolution API não encontrada" });
      }

      // Check if instance has evolutionInstanceId
      if (!instance.evolutionInstanceId) {
        console.log(`❌ Instância não tem evolutionInstanceId definido`);
        return res.status(400).json({ error: "Instância não está configurada na Evolution API" });
      }

      // Check connection status from Evolution API
      const statusUrl = `${evolutionConfig.evolutionURL}/instance/connectionState/${instance.evolutionInstanceId}`;
      console.log(`📡 Consultando status em: ${statusUrl}`);

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.evolutionToken,
        },
      });

      if (!response.ok) {
        console.error(`❌ Erro ao buscar status: ${response.status} ${response.statusText}`);
        return res.status(500).json({ 
          error: "Erro ao consultar status na Evolution API",
          details: `${response.status} ${response.statusText}`
        });
      }

      const statusData = await response.json();
      console.log(`✅ Status obtido:`, statusData);

      // Return the status data with additional instance info
      res.json({
        ...statusData,
        instance: {
          ...statusData.instance,
          instanceName: instance.name,
          phone: instance.phone,
          serverUrl: evolutionConfig.evolutionURL
        }
      });
    } catch (error) {
      console.error("❌ Erro ao buscar status da instância:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Configure WhatsApp settings
  app.post("/api/whatsapp-instances/:id/settings", authenticate, requireClient, async (req: AuthRequest, res) => {
    console.log("🚀 INÍCIO DA ROTA SETTINGS - ID:", req.params.id);
    try {
      const { id } = req.params;
      console.log("📋 Buscando instância no banco...");
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        console.log("❌ Instância não encontrada no banco");
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      console.log(`🔍 DEBUG - Estado da instância antes das correções:`);
      console.log(`   - ID: ${instance.id}`);
      console.log(`   - Name: "${instance.name}"`);
      console.log(`   - CompanyId: "${instance.companyId}"`);
      console.log(`   - EvolutionInstanceId: "${instance.evolutionInstanceId}"`);

      // Fix for existing instances without companyId
      if (!instance.companyId && req.user?.companyId) {
        console.log("🔧 Corrigindo companyId ausente para configuração");
        await storage.updateWhatsappInstance(id, { companyId: req.user.companyId });
        instance.companyId = req.user.companyId;
      }

      // Fix for existing instances without evolutionInstanceId
      if (!instance.evolutionInstanceId && instance.name) {
        const evolutionInstanceId = instance.name.replace(/\s+/g, '_').toLowerCase();
        console.log(`🔧 Corrigindo evolutionInstanceId ausente para configuração: ${evolutionInstanceId}`);
        await storage.updateWhatsappInstance(id, { evolutionInstanceId });
        instance.evolutionInstanceId = evolutionInstanceId;
        console.log(`✅ evolutionInstanceId atualizado para: "${instance.evolutionInstanceId}"`);
      } else if (!instance.evolutionInstanceId) {
        console.log(`❌ Não foi possível corrigir evolutionInstanceId - name: "${instance.name}"`);
      } else {
        console.log(`✅ evolutionInstanceId já existe: "${instance.evolutionInstanceId}"`);
      }

      console.log(`🔍 DEBUG - Estado da instância após correções:`);
      console.log(`   - EvolutionInstanceId: "${instance.evolutionInstanceId}"`);
      console.log(`   - CompanyId: "${instance.companyId}"`);
      console.log(`   - Name: "${instance.name}"`);
      

      // Check company access
      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        console.log(`❌ Acesso negado para configuração: companyId não confere`);
        return res.status(403).json({ error: "Acesso negado: instância não pertence à sua empresa" });
      }

      // Get Evolution API configuration
      console.log("🔧 Buscando configuração da Evolution API...");
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        console.log("❌ Configuração da Evolution API não encontrada");
        return res.status(500).json({ error: "Configuração da Evolution API não encontrada" });
      }

      // Check if instance has evolutionInstanceId
      if (!instance.evolutionInstanceId) {
        console.log(`❌ Instância AINDA não tem evolutionInstanceId definido para configuração após correções`);
        return res.status(400).json({ error: "Instância não está configurada na Evolution API" });
      }

      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      // Default settings payload
      const settings = {
        rejectCall: true,
        msgCall: "I do not accept calls",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        syncFullHistory: false,
        readStatus: true
      };

      console.log(`⚙️ Configurando settings da instância: ${instance.evolutionInstanceId}`);
      console.log(`📋 Settings:`, JSON.stringify(settings, null, 2));
      
      // First check if instance exists in Evolution API
      try {
        console.log(`🔍 Verificando se instância existe na Evolution API: ${instance.evolutionInstanceId}`);
        const statusCheck = await evolutionService.getInstanceStatus(instance.evolutionInstanceId);
        console.log(`✅ Instância encontrada na Evolution API:`, JSON.stringify(statusCheck, null, 2));
      } catch (statusError) {
        console.error(`❌ Instância não encontrada na Evolution API:`, statusError);
        return res.status(400).json({ 
          error: "Instância não encontrada na Evolution API",
          details: `A instância '${instance.evolutionInstanceId}' não existe na Evolution API`
        });
      }
      
      const result = await evolutionService.setSettings(instance.evolutionInstanceId, settings);
      
      console.log("✅ Settings configuradas com sucesso:", JSON.stringify(result, null, 2));
      
      res.json({ success: true, result });
    } catch (error) {
      console.error("❌ Erro ao configurar settings:", error);
      res.status(500).json({ error: "Erro ao configurar WhatsApp" });
    }
  });

  // Configure AI webhook
  app.post("/api/whatsapp-instances/:id/webhook", authenticate, requireClient, async (req: AuthRequest, res) => {
    console.log("🚀 INÍCIO DA ROTA WEBHOOK - ID:", req.params.id);
    try {
      const { id } = req.params;
      console.log("📋 Buscando instância no banco...");
      const instance = await storage.getWhatsappInstance(id);
      
      if (!instance) {
        console.log("❌ Instância não encontrada no banco");
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      console.log(`🔍 DEBUG - Estado da instância para webhook:`);
      console.log(`   - ID: ${instance.id}`);
      console.log(`   - Name: "${instance.name}"`);
      console.log(`   - CompanyId: "${instance.companyId}"`);
      console.log(`   - EvolutionInstanceId: "${instance.evolutionInstanceId}"`);

      // Fix for existing instances without companyId
      if (!instance.companyId && req.user?.companyId) {
        console.log("🔧 Corrigindo companyId ausente para webhook");
        await storage.updateWhatsappInstance(id, { companyId: req.user.companyId });
        instance.companyId = req.user.companyId;
      }

      // Fix for existing instances without evolutionInstanceId
      if (!instance.evolutionInstanceId && instance.name) {
        const evolutionInstanceId = instance.name.replace(/\s+/g, '_').toLowerCase();
        console.log(`🔧 Corrigindo evolutionInstanceId ausente para webhook: ${evolutionInstanceId}`);
        await storage.updateWhatsappInstance(id, { evolutionInstanceId });
        instance.evolutionInstanceId = evolutionInstanceId;
        console.log(`✅ evolutionInstanceId atualizado para: "${instance.evolutionInstanceId}"`);
      }

      // Check company access
      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        console.log(`❌ Acesso negado para webhook: companyId não confere`);
        return res.status(403).json({ error: "Acesso negado: instância não pertence à sua empresa" });
      }

      // Get Evolution API configuration
      console.log("🔧 Buscando configuração da Evolution API...");
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        console.log("❌ Configuração da Evolution API não encontrada");
        return res.status(500).json({ error: "Configuração da Evolution API não encontrada" });
      }

      // Use correct system URL for webhook
      console.log("🔧 Configurando URL do webhook para servidor correto...");
      const systemUrl = "https://apizap.halarum.com.br"; // Our server URL
      console.log("✅ URL do webhook configurada:", systemUrl);

      // Check if instance has evolutionInstanceId
      if (!instance.evolutionInstanceId) {
        console.log(`❌ Instância AINDA não tem evolutionInstanceId definido para webhook após correções`);
        return res.status(400).json({ error: "Instância não está configurada na Evolution API" });
      }

      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      // Default webhook payload - wrapped in webhook property as required by Evolution API
      const webhookUrl = `${systemUrl}/api/webhook/messages`;
      const webhook = {
        webhook: {
          enabled: true,
          url: webhookUrl,
          headers: {
            autorization: "Bearer TOKEN",
            "Content-Type": "application/json"
          },
          byEvents: false,
          base64: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE", 
            "MESSAGES_DELETE",
            "SEND_MESSAGE",
            "CHATS_SET",
            "CHATS_UPSERT",
            "CHATS_UPDATE",
            "CHATS_DELETE"
          ]
        }
      };

      console.log(`🤖 Configurando webhook da instância: ${instance.evolutionInstanceId}`);
      console.log(`🌐 URL do webhook: ${webhookUrl}`);
      console.log(`📋 Webhook:`, JSON.stringify(webhook, null, 2));
      
      // First check if instance exists in Evolution API
      try {
        console.log(`🔍 Verificando se instância existe na Evolution API: ${instance.evolutionInstanceId}`);
        const statusCheck = await evolutionService.getInstanceStatus(instance.evolutionInstanceId);
        console.log(`✅ Instância encontrada na Evolution API:`, JSON.stringify(statusCheck, null, 2));
      } catch (statusError) {
        console.error(`❌ Instância não encontrada na Evolution API:`, statusError);
        return res.status(400).json({ 
          error: "Instância não encontrada na Evolution API",
          details: `A instância '${instance.evolutionInstanceId}' não existe na Evolution API`
        });
      }
      
      const result = await evolutionService.setWebhook(instance.evolutionInstanceId, webhook);
      
      console.log("✅ Webhook configurado com sucesso:", JSON.stringify(result, null, 2));
      
      res.json({ success: true, result });
    } catch (error) {
      console.error("❌ Erro ao configurar webhook:", error);
      res.status(500).json({ error: "Erro ao configurar IA" });
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

  // Get main agents only
  app.get("/api/ai-agents/main", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const mainAgents = await storage.getMainAgentsByCompany(req.user.companyId);
      res.json(mainAgents);
    } catch (error) {
      console.error("Get main AI agents error:", error);
      res.status(500).json({ error: "Erro ao buscar agentes principais" });
    }
  });

  // Get secondary agents by parent
  app.get("/api/ai-agents/:parentId/secondary", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { parentId } = req.params;
      const secondaryAgents = await storage.getSecondaryAgentsByParent(parentId);
      res.json(secondaryAgents);
    } catch (error) {
      console.error("Get secondary AI agents error:", error);
      res.status(500).json({ error: "Erro ao buscar agentes secundários" });
    }
  });

  // Get all secondary agents for company
  app.get("/api/ai-agents/secondary", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const secondaryAgents = await storage.getSecondaryAgentsByCompany(req.user.companyId);
      res.json(secondaryAgents);
    } catch (error) {
      console.error("Get secondary AI agents error:", error);
      res.status(500).json({ error: "Erro ao buscar agentes secundários" });
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

      // Process PDFs if training files are provided
      let trainingContent = '';
      if (agentData.trainingFiles && Array.isArray(agentData.trainingFiles) && agentData.trainingFiles.length > 0) {
        try {
          console.log(`🤖 Processando ${agentData.trainingFiles.length} PDFs para o agente: ${agentData.name}`);
          trainingContent = await extractTextFromMultiplePDFs(agentData.trainingFiles);
          console.log(`✅ Conteúdo extraído com sucesso para o agente: ${agentData.name}`);
        } catch (pdfError) {
          console.error('❌ Erro ao processar PDFs:', pdfError);
          // Continue without training content but log the error
          trainingContent = `Erro ao processar PDFs: ${pdfError.message}`;
        }
      }

      const agentWithContent = {
        ...agentData,
        trainingContent
      };

      const agent = await storage.createAiAgent(agentWithContent);
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

      // Process PDFs if training files are updated
      let updateData = { ...agentData };
      if (agentData.trainingFiles && Array.isArray(agentData.trainingFiles)) {
        try {
          console.log(`🤖 Atualizando PDFs para o agente ID: ${id}`);
          const trainingContent = await extractTextFromMultiplePDFs(agentData.trainingFiles);
          updateData.trainingContent = trainingContent;
          console.log(`✅ Conteúdo atualizado com sucesso para o agente ID: ${id}`);
        } catch (pdfError) {
          console.error('❌ Erro ao processar PDFs na atualização:', pdfError);
          updateData.trainingContent = `Erro ao processar PDFs: ${pdfError.message}`;
        }
      }

      const agent = await storage.updateAiAgent(id, updateData);
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

  // Generate AI agent response
  app.post("/api/ai-agents/:id/chat", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }

      // Get agent data
      const agent = await storage.getAiAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }

      // Get AI configuration
      const aiConfig = await storage.getAiConfiguration();
      if (!aiConfig || !aiConfig.apiKey) {
        return res.status(404).json({ error: "Configuração de IA não encontrada" });
      }

      // Create AI response service
      const aiResponseService = new AiResponseService(aiConfig.apiKey);

      // Generate response using agent's prompt and training content with hierarchy support
      const response = await aiResponseService.generateResponse({
        message,
        agentId: agent.id,
        agentPrompt: agent.prompt,
        agentTrainingContent: agent.trainingContent,
        temperatura: Number(agent.temperatura) || Number(aiConfig.temperatura) || 0.7,
        modelo: agent.modelo || aiConfig.modelo || "gpt-4o",
        numeroTokens: Number(agent.numeroTokens) || Number(aiConfig.numeroTokens) || 1000,
        agentType: agent.agentType || 'main',
        delegationKeywords: agent.delegationKeywords || [],
        companyId: agent.companyId,
      });

      res.json({ response });
    } catch (error) {
      console.error("AI agent chat error:", error);
      res.status(500).json({ error: "Erro ao gerar resposta" });
    }
  });

  // Test AI agent
  app.post("/api/ai-agents/:id/test", authenticate, requireClient, requireCompanyAccess, async (req, res) => {
    try {
      const { id } = req.params;

      // Get agent data
      const agent = await storage.getAiAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }

      // Get AI configuration
      const aiConfig = await storage.getAiConfiguration();
      if (!aiConfig || !aiConfig.apiKey) {
        return res.status(404).json({ error: "Configuração de IA não encontrada" });
      }

      // Create AI response service
      const aiResponseService = new AiResponseService(aiConfig.apiKey);

      // Test agent
      const testResult = await aiResponseService.testAgent({
        agentId: agent.id,
        agentPrompt: agent.prompt,
        agentTrainingContent: agent.trainingContent,
        temperatura: agent.temperatura || aiConfig.temperatura,
        modelo: agent.modelo || aiConfig.modelo,
        numeroTokens: agent.numeroTokens || aiConfig.numeroTokens,
      });

      res.json(testResult);
    } catch (error) {
      console.error("AI agent test error:", error);
      res.status(500).json({ error: "Erro ao testar agente" });
    }
  });


  // Criar instância via Evolution API
  app.post("/api/whatsapp-instances/create-evolution", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const { name, phone } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
      }

      // Check if instance with same name already exists for this company
      const existingInstances = await storage.getWhatsappInstancesByCompany(req.user.companyId);
      const nameExists = existingInstances.some(instance => 
        instance.name.toLowerCase() === name.toLowerCase()
      );
      
      if (nameExists) {
        return res.status(400).json({ 
          error: "Já existe uma instância com este nome",
          details: "Escolha um nome diferente para a instância"
        });
      }

      // Buscar configurações da Evolution API
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig || !evolutionConfig.evolutionURL || !evolutionConfig.evolutionToken) {
        return res.status(404).json({ error: "Configurações da Evolution API não encontradas" });
      }

      // Criar instância na Evolution API
      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      // Nome da instância será exatamente igual ao nome fornecido (sem timestamp)
      const instanceName = name.replace(/\s+/g, '_').toLowerCase();
      
      console.log(`🚀 Creating Evolution instance with name: ${instanceName}`);
      
      // Primeiro tenta deletar se já existir (para evitar conflitos)
      try {
        await evolutionService.deleteInstance(instanceName);
        console.log(`🗑️ Instância antiga ${instanceName} deletada`);
      } catch (deleteError) {
        console.log(`ℹ️ Instância ${instanceName} não existia (normal para nova instância)`);
      }
      
      const evolutionResponse = await evolutionService.createInstance({
        instanceName
      });

      // Salvar instância no banco de dados local
      const instanceData = {
        name, // Nome original sem timestamp 
        phone,
        companyId: req.user.companyId,
        evolutionInstanceId: name.replace(/\s+/g, '_').toLowerCase(), // Mesmo nome sem timestamp
        status: 'disconnected' as const
      };
      
      console.log(`💾 DADOS SENDO SALVOS NO BANCO:`);
      console.log(`  - name (display): "${name}"`);
      console.log(`  - evolutionInstanceId (DB): "${name.replace(/\s+/g, '_').toLowerCase()}"`);
      console.log(`  - evolutionAPIName (API): "${instanceName}" (IGUAL AO DB - SEM TIMESTAMP)`);
      console.log(`  - phone: "${phone}"`);
      console.log(`  - companyId: "${req.user.companyId}"`);
      
      const savedInstance = await storage.createWhatsappInstance(instanceData);
      
      console.log(`✅ INSTÂNCIA SALVA NO BANCO:`);
      console.log(`  - id: ${savedInstance.id}`);
      console.log(`  - name: "${savedInstance.name}"`);
      console.log(`  - evolutionInstanceId: "${savedInstance.evolutionInstanceId}"`);
      console.log(`  - phone: "${savedInstance.phone}"`);
      
      res.json({
        success: true,
        instance: savedInstance,
        evolutionResponse,
        message: "Instância criada com sucesso na Evolution API!"
      });
    } catch (error) {
      console.error("Create evolution instance error:", error);
      res.status(500).json({ 
        error: "Erro ao criar instância na Evolution API",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Link AI agent to WhatsApp instance
  app.post("/api/whatsapp-instances/:instanceId/link-agent", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;
      const { agentId } = req.body;

      // Verificar se a instância pertence à empresa do usuário
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
      }

      // Verificar se o agente pertence à empresa do usuário
      const agent = await storage.getAiAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }

      if (req.user?.role !== 'admin' && agent.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: agente não pertence à sua empresa" });
      }

      const updatedInstance = await storage.updateWhatsappInstance(instanceId, {
        aiAgentId: agentId
      });

      res.json(updatedInstance);
    } catch (error) {
      console.error("Link agent error:", error);
      res.status(500).json({ error: "Erro ao vincular agente" });
    }
  });

  // Unlink AI agent from WhatsApp instance
  app.post("/api/whatsapp-instances/:instanceId/unlink-agent", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;

      // Verificar se a instância pertence à empresa do usuário
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
      }

      const updatedInstance = await storage.updateWhatsappInstance(instanceId, {
        aiAgentId: null
      });

      res.json(updatedInstance);
    } catch (error) {
      console.error("Unlink agent error:", error);
      res.status(500).json({ error: "Erro ao remover vinculação" });
    }
  });

  // WhatsApp Webhook para receber mensagens (Evolution API)
  app.post("/webhook/whatsapp", async (req, res) => {
    try {
      const { whatsappWebhookService } = await import("./services/whatsappWebhook");
      await whatsappWebhookService.handleMessage(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Erro ao processar webhook" });
    }
  });

  // Endpoint adicional para Evolution API (formato padrão)
  app.post("/api/webhook/messages", async (req, res) => {
    try {
      console.log("🔥 WEBHOOK DEBUG - Full request body:", JSON.stringify(req.body, null, 2));
      
      // Verificar se temos dados válidos
      if (!req.body.data || !req.body.sender) {
        console.log("❌ Invalid webhook format - missing data or sender");
        return res.status(400).json({ error: "Invalid webhook format" });
      }
      
      // Verificar se é uma atualização de status de mensagem (nossa mensagem enviada)
      if (req.body.data && req.body.data.fromMe === true) {
        console.log("📤 Message status update received (message sent by us), ignoring");
        return res.status(200).json({ 
          success: true, 
          type: "status_update", 
          ignored: true,
          timestamp: new Date().toISOString() 
        });
      }
      
      // Verificar se tem conteúdo de mensagem (para evitar processar status updates)
      if (!req.body.data.message || (!req.body.data.message.conversation && !req.body.data.message.extendedTextMessage)) {
        console.log("📊 Non-message event received, ignoring");
        return res.status(200).json({ 
          success: true, 
          type: "non_message_event", 
          ignored: true,
          timestamp: new Date().toISOString() 
        });
      }
      
      // Processar apenas mensagens recebidas (não enviadas por nós)
      console.log("📨 Processing incoming message");
      const { whatsappWebhookService } = await import("./services/whatsappWebhook");
      await whatsappWebhookService.handleEvolutionMessage(req.body);
      res.status(200).json({ 
        success: true, 
        processed: true,
        type: "incoming_message",
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error("❌ Evolution webhook error:", error);
      res.status(500).json({ error: "Erro ao processar webhook" });
    }
  });

  // Endpoint de teste para simular mensagem
  app.post("/api/test-message", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId, phone, message } = req.body;
      
      if (!instanceId || !phone || !message) {
        return res.status(400).json({ error: "instanceId, phone e message são obrigatórios" });
      }

      const { messageProcessorService } = await import("./services/messageProcessor");
      const result = await messageProcessorService.testMessage(instanceId, phone, message);
      
      res.json(result);
    } catch (error) {
      console.error("Test message error:", error);
      res.status(500).json({ error: "Erro ao testar mensagem" });
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

  app.post("/api/objects/upload", authenticate, requireClient, async (req, res) => {
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
