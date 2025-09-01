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
import { whatsappWebhookService } from "./services/whatsappWebhook";
import { 
  insertUserSchema, insertCompanySchema, insertGlobalConfigSchema, 
  insertEvolutionConfigSchema, insertAiConfigSchema, insertWhatsappInstanceSchema,
  insertAiAgentSchema, insertConversationSchema, insertMessageSchema,
  insertContactListSchema, insertContactListItemSchema, insertScheduledMessageSchema
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
      
      // Get Evolution API configuration to check real status
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      
      // If we have Evolution API config, update the status of each instance
      const updatedInstances = [];
      
      for (const instance of instances) {
        let currentStatus = instance.status;
        
        // Only check status if we have Evolution config and instance has evolutionInstanceId
        if (evolutionConfig && instance.evolutionInstanceId) {
          try {
            const statusUrl = `${evolutionConfig.evolutionURL}/instance/connectionState/${instance.evolutionInstanceId}`;
            console.log(`🔍 Checking status for ${instance.name} at: ${statusUrl}`);
            
            const response = await fetch(statusUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionConfig.evolutionToken,
              },
            });

            if (response.ok) {
              const statusData = await response.json();
              console.log(`📡 Evolution API response for ${instance.name}:`, statusData);
              
              // Check if instance is connected based on Evolution API response
              const evolutionState = statusData.instance?.state || statusData.state;
              const isConnected = evolutionState === 'open' || evolutionState === 'connected';
              const newStatus = isConnected ? 'connected' : 'disconnected';
              
              console.log(`🔄 Instance ${instance.name}: Evolution state="${evolutionState}", DB status="${instance.status}", New status="${newStatus}"`);
              
              // Update status in database if it changed
              if (newStatus !== instance.status) {
                console.log(`🔄 Updating ${instance.name} status from "${instance.status}" to "${newStatus}"`);
                await storage.updateWhatsappInstance(instance.id, { status: newStatus });
                currentStatus = newStatus;
              }
            } else {
              console.log(`❌ Failed to check status for ${instance.name}: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Error checking status for ${instance.name}:`, error);
          }
        }
        
        updatedInstances.push({
          ...instance,
          status: currentStatus
        });
      }
      
      console.log("📋 Final instances being returned to frontend:");
      updatedInstances.forEach(instance => {
        console.log(`  - ID: ${instance.id}, Name: ${instance.name}, Status: ${instance.status}, EvolutionID: ${instance.evolutionInstanceId}`);
      });
      
      res.json(updatedInstances);
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

          // Update instance with Evolution data and save instance-specific token
          await storage.updateWhatsappInstance(instance.id, {
            evolutionInstanceId: evolutionResponse.instance?.instanceName || instance.id,
            evolutionToken: evolutionResponse.hash?.apikey || evolutionResponse.apikey
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

  app.put("/api/whatsapp-instances/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      console.log(`🔧 PUT request for instance ${id} with data:`, req.body);
      
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      // Verificar se a instância pertence à empresa do usuário
      const existingInstance = await storage.getWhatsappInstance(id);
      console.log(`🔍 Existing instance:`, existingInstance);
      
      if (!existingInstance || existingInstance.companyId !== req.user.companyId) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      const instanceData = insertWhatsappInstanceSchema.partial().parse(req.body);
      console.log(`📝 Parsed instance data:`, instanceData);
      
      const updatedInstance = await storage.updateWhatsappInstance(id, instanceData);
      
      console.log(`✅ Instance updated: ${id}`, updatedInstance);
      res.json(updatedInstance);
    } catch (error) {
      console.error("Update WhatsApp instance error:", error);
      res.status(500).json({ error: "Erro ao atualizar instância", details: error.message });
    }
  });

  // Endpoint debug temporário - REMOVER APÓS TESTES
  // app.post("/api/debug-noauth/fix-instance", async (req, res) => { ... });

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
          
          // Update database with new Evolution instance ID and token
          await storage.updateWhatsappInstance(id, {
            evolutionInstanceId: newInstanceName,
            evolutionToken: evolutionResponse.hash?.apikey || evolutionResponse.apikey
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

      // Check if instance is connected based on Evolution API response
      const evolutionState = statusData.instance?.state || statusData.state;
      const isConnected = evolutionState === 'open' || evolutionState === 'connected';
      const newStatus = isConnected ? 'connected' : 'disconnected';
      
      console.log(`🔄 Instance ${instance.name}: Evolution state="${evolutionState}", DB status="${instance.status}", New status="${newStatus}"`);
      
      // Update status in database if it changed
      if (newStatus !== instance.status) {
        console.log(`🔄 Updating ${instance.name} status from "${instance.status}" to "${newStatus}"`);
        await storage.updateWhatsappInstance(instance.id, { status: newStatus });
        // Update instance object for response
        instance.status = newStatus;
      }

      // Return the status data with additional instance info
      res.json({
        ...statusData,
        instance: {
          ...statusData.instance,
          instanceName: instance.name,
          phone: instance.phone,
          serverUrl: evolutionConfig.evolutionURL,
          dbStatus: instance.status // Include updated status from database
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

      // Use configured system URL from admin settings
      console.log("🔧 Buscando URL global do sistema das configurações do administrador...");
      const systemUrl = evolutionConfig.urlGlobalSistema;
      
      if (!systemUrl) {
        console.log("❌ URL global do sistema não configurada pelo administrador");
        return res.status(400).json({ 
          error: "URL global do sistema não configurada", 
          details: "O administrador precisa configurar a URL global do sistema nas configurações da Evolution API" 
        });
      }
      console.log("✅ URL global do sistema encontrada:", systemUrl);

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
      console.log(`🔗 [WEBHOOK] Configurando webhook URL: ${webhookUrl}`);
      const webhook = {
        webhook: {
          enabled: true,
          url: webhookUrl,
          headers: {
            autorization: "Bearer TOKEN",
            "Content-Type": "application/json"
          },
          byEvents: true,
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

  // Rota para reconfigurar webhook automaticamente
  app.post("/api/reconfigure-webhook/:instanceId", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;
      console.log(`🔄 Reconfigurando webhook automaticamente para instância: ${instanceId}`);
      
      // Buscar a instância
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Verificar acesso da empresa
      if (req.user?.role !== 'admin' && instance.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Buscar configuração da Evolution API
      const evolutionConfig = await storage.getEvolutionApiConfiguration();
      if (!evolutionConfig) {
        return res.status(500).json({ error: "Configuração da Evolution API não encontrada" });
      }

      // Usar URL global do sistema ou URL atual do Replit
      let systemUrl = evolutionConfig.urlGlobalSistema;
      if (!systemUrl && process.env.REPLIT_DEV_DOMAIN) {
        systemUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
      }

      if (!systemUrl) {
        return res.status(400).json({ error: "URL do sistema não configurada" });
      }

      const evolutionService = new EvolutionApiService({
        baseURL: evolutionConfig.evolutionURL,
        token: evolutionConfig.evolutionToken
      });

      const webhookUrl = `${systemUrl}/api/webhook/messages`;
      console.log(`🔗 [WEBHOOK] Configurando webhook URL: ${webhookUrl}`);
      const webhook = {
        webhook: {
          enabled: true,
          url: webhookUrl,
          headers: {
            "Content-Type": "application/json"
          },
          byEvents: true,
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

      console.log(`🔧 Reconfigurando webhook para: ${webhookUrl}`);
      const result = await evolutionService.setWebhook(instance.evolutionInstanceId, webhook);
      
      console.log("✅ Webhook reconfigurado com sucesso:", JSON.stringify(result, null, 2));
      res.json({ success: true, webhookUrl, result });
      
    } catch (error) {
      console.error("❌ Erro ao reconfigurar webhook:", error);
      res.status(500).json({ error: "Erro ao reconfigurar webhook" });
    }
  });


  // Conversations with agent tracking routes
  app.get('/api/conversations/by-instance/:instanceId', authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;
      
      const conversations = await storage.getConversationsByInstance(instanceId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/conversations/:conversationId/messages-with-agents', authenticate, requireClient, async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      // Buscar mensagens com informações dos agentes
      const messages = await storage.getMessagesByConversation(conversationId);
      
      // Para cada mensagem de AI, buscar informações do agente
      const messagesWithAgents = await Promise.all(
        messages.map(async (message) => {
          if (message.sender === 'assistant' && message.agentId) {
            try {
              const agent = await storage.getAiAgent(message.agentId);
              return {
                ...message,
                agent: agent ? {
                  id: agent.id,
                  name: agent.name,
                  agentType: agent.agentType || 'main',
                  specialization: agent.specialization
                } : null
              };
            } catch (error) {
              console.error(`Error fetching agent ${message.agentId}:`, error);
              return { ...message, agent: null };
            }
          }
          return { ...message, agent: null };
        })
      );
      
      res.json(messagesWithAgents);
    } catch (error) {
      console.error('Error fetching messages with agents:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/agents/usage-stats', authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      console.log(`🔍 [DEBUG] Buscando stats para empresa: ${user.companyId}`);
      
      // Buscar todas as instâncias da empresa
      const instances = await storage.getWhatsappInstancesByCompany(user.companyId);
      console.log(`🔍 [DEBUG] Instâncias encontradas: ${instances.length}`, instances.map(i => ({ id: i.id, name: i.name })));
      
      let totalStats: any = {};
      let totalMessages = 0;
      let assistantMessages = 0;
      let messagesWithAgent = 0;
      
      for (const instance of instances) {
        // Buscar conversas da instância
        const conversations = await storage.getConversationsByInstance(instance.id);
        console.log(`🔍 [DEBUG] Conversas para instância ${instance.name}: ${conversations.length}`);
        
        for (const conversation of conversations) {
          // Buscar mensagens da conversa
          const messages = await storage.getMessagesByConversation(conversation.id);
          console.log(`🔍 [DEBUG] Mensagens na conversa ${conversation.id}: ${messages.length}`);
          totalMessages += messages.length;
          
          // Contar uso de agentes
          for (const message of messages) {
            if (message.sender === 'assistant') {
              assistantMessages++;
              console.log(`🔍 [DEBUG] Mensagem assistant encontrada - AgentId: ${message.agentId}, Content: ${message.content?.substring(0, 50)}...`);
              
              if (message.agentId) {
                messagesWithAgent++;
                try {
                  const agent = await storage.getAiAgent(message.agentId);
                  if (agent) {
                    const agentKey = `${agent.id}|${agent.name}|${agent.agentType || 'main'}`;
                    if (!totalStats[agentKey]) {
                      totalStats[agentKey] = {
                        agentId: agent.id,
                        agentName: agent.name,
                        agentType: agent.agentType || 'main',
                        specialization: agent.specialization,
                        messageCount: 0,
                        conversationCount: new Set()
                      };
                    }
                    totalStats[agentKey].messageCount++;
                    totalStats[agentKey].conversationCount.add(conversation.id);
                  }
                } catch (error) {
                  console.error(`Error processing agent ${message.agentId}:`, error);
                }
              }
            }
          }
        }
      }
      
      console.log(`🔍 [DEBUG] Totais: ${totalMessages} mensagens, ${assistantMessages} de assistant, ${messagesWithAgent} com agentId`);
      console.log(`🔍 [DEBUG] Stats processadas:`, Object.keys(totalStats).length, 'agentes');
      
      // DEBUG: Contar diretamente via MySQL todas as mensagens com agentId
      try {
        console.log(`🔍 [DEBUG EXTRA] Contando mensagens com agentId diretamente no MySQL...`);
        const storageInstance = storage as any; // Cast para acessar connection
        if (storageInstance.connection) {
          const [countRows] = await storageInstance.connection.execute(
            'SELECT COUNT(*) as total FROM messages WHERE sender = ? AND agent_id IS NOT NULL',
            ['assistant']
          );
          const totalWithAgentId = (countRows as any[])[0].total;
          console.log(`🔍 [DEBUG EXTRA] Total de mensagens assistant com agentId no MySQL: ${totalWithAgentId}`);
          
          if (totalWithAgentId > 0) {
            const [sampleRows] = await storageInstance.connection.execute(
              'SELECT agent_id, content, conversation_id FROM messages WHERE sender = ? AND agent_id IS NOT NULL LIMIT 5',
              ['assistant']
            );
            console.log(`🔍 [DEBUG EXTRA] Exemplos de mensagens com agentId:`, sampleRows);
          }
        }
      } catch (error) {
        console.error(`🔍 [DEBUG EXTRA] Erro ao contar mensagens:`, error);
      }
      
      // Converter Sets em contadores
      const stats = Object.values(totalStats).map((stat: any) => ({
        ...stat,
        conversationCount: stat.conversationCount.size
      }));
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching agent usage stats:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
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

  app.put("/api/ai-agents/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const agentData = insertAiAgentSchema.partial().parse(req.body);

      // Check if agent exists and belongs to user's company
      const existingAgent = await storage.getAiAgent(id);
      if (!existingAgent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }
      if (req.user?.role !== 'admin' && existingAgent.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
      }

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

  app.delete("/api/ai-agents/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Check if agent exists and belongs to user's company
      const existingAgent = await storage.getAiAgent(id);
      if (!existingAgent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }
      if (req.user?.role !== 'admin' && existingAgent.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
      }

      await storage.deleteAiAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete AI agent error:", error);
      res.status(500).json({ error: "Erro ao excluir agente" });
    }
  });

  // Generate AI agent response
  app.post("/api/ai-agents/:id/chat", authenticate, requireClient, async (req: AuthRequest, res) => {
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

      // Check company access
      if (req.user?.role !== 'admin' && agent.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
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
        agentTrainingContent: agent.trainingContent || undefined,
        temperatura: Number(agent.temperatura) || Number(aiConfig.temperatura) || 0.7,
        modelo: agent.modelo || aiConfig.modelo || "gpt-4o",
        numeroTokens: Number(agent.numeroTokens) || Number(aiConfig.numeroTokens) || 1000,
        agentType: (agent.agentType as "main" | "secondary") || 'main',
        delegationKeywords: Array.isArray(agent.delegationKeywords) ? agent.delegationKeywords : [],
        companyId: agent.companyId,
      });

      res.json({ response });
    } catch (error) {
      console.error("AI agent chat error:", error);
      res.status(500).json({ error: "Erro ao gerar resposta" });
    }
  });

  // Test AI agent
  app.post("/api/ai-agents/:id/test", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Get agent data
      const agent = await storage.getAiAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agente não encontrado" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && agent.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: não é possível acessar dados de outra empresa" });
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
        agentTrainingContent: agent.trainingContent || undefined,
        temperatura: Number(agent.temperatura) || Number(aiConfig.temperatura) || 0.7,
        modelo: agent.modelo || aiConfig.modelo || "gpt-4o",
        numeroTokens: Number(agent.numeroTokens) || Number(aiConfig.numeroTokens) || 1000,
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

      // Salvar instância no banco de dados local com o token da instância
      const instanceData = {
        name, // Nome original sem timestamp 
        phone,
        companyId: req.user.companyId,
        evolutionInstanceId: name.replace(/\s+/g, '_').toLowerCase(), // Mesmo nome sem timestamp
        evolutionToken: evolutionResponse.hash?.apikey || evolutionResponse.apikey,
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

      // Configurar webhook automaticamente quando vincular agente IA
      try {
        const globalConfig = await storage.getGlobalConfig();
        const evolutionConfig = await storage.getEvolutionApiConfiguration();
        
        if (globalConfig?.urlGlobalSistema && evolutionConfig && instance.evolutionInstanceId) {
          const evolutionService = new EvolutionApiService({
            baseURL: evolutionConfig.evolutionURL,
            token: evolutionConfig.evolutionToken
          });

          const webhookUrl = `${globalConfig.urlGlobalSistema}/api/webhook/messages`;
          const webhook = {
            webhook: {
              enabled: true,
              url: webhookUrl,
              headers: {
                "Content-Type": "application/json"
              },
              byEvents: true,
              base64: true,
              events: [
                "MESSAGES_UPSERT",
                "MESSAGE_UPSERT", 
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

          await evolutionService.setWebhook(instance.evolutionInstanceId, webhook);
          console.log(`✅ Webhook configurado automaticamente para instância: ${instance.evolutionInstanceId} (URL: ${webhookUrl})`);
        }
      } catch (webhookError) {
        console.error("⚠️ Erro ao configurar webhook (não crítico):", webhookError);
      }

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

  // Get WebShare proxies
  app.get("/api/whatsapp/proxy/list", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      console.log("🌐 Buscando proxies WebShare...");
      
      // Get global configuration to retrieve WebShare token
      const globalConfig = await storage.getGlobalConfiguration();
      if (!globalConfig?.webshare_token) {
        console.log("❌ Token WebShare não configurado");
        return res.status(400).json({ error: "Token WebShare não configurado no sistema" });
      }

      // Get query parameters for WebShare API
      const { 
        mode = 'direct',
        page = 1, 
        page_size = 25,
        country_code__in,
        search,
        ordering 
      } = req.query;

      // Build WebShare API URL
      const params = new URLSearchParams({
        mode: mode as string,
        page: page.toString(),
        page_size: page_size.toString(),
      });

      if (country_code__in) params.append('country_code__in', country_code__in as string);
      if (search) params.append('search', search as string);
      if (ordering) params.append('ordering', ordering as string);

      const webshareUrl = `https://proxy.webshare.io/api/v2/proxy/list/?${params.toString()}`;
      
      console.log("📡 Consultando WebShare API:", webshareUrl);

      // Make request to WebShare API
      const response = await fetch(webshareUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${globalConfig.webshare_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ Erro WebShare API: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error("Erro detalhes:", errorText);
        return res.status(response.status).json({ 
          error: "Erro ao consultar WebShare API",
          details: errorText
        });
      }

      const proxies = await response.json();
      console.log(`✅ ${proxies.results?.length || 0} proxies obtidos`);

      res.json(proxies);
    } catch (error) {
      console.error("Get WebShare proxies error:", error);
      res.status(500).json({ error: "Erro ao buscar proxies" });
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

  // Endpoints específicos para eventos da Evolution API
  app.post("/api/webhook/messages/messages-upsert", async (req, res) => {
    try {
      console.log("🔥🔥🔥 [MESSAGES-UPSERT] ================================");
      console.log("🔥🔥🔥 [MESSAGES-UPSERT] NEW MESSAGE IN UPSERT ENDPOINT!");
      console.log("🔥🔥🔥 [MESSAGES-UPSERT] ================================");
      console.log("🔍 [MESSAGES-UPSERT] Has data:", !!req.body.data);
      console.log("🔍 [MESSAGES-UPSERT] Has message:", !!req.body.data?.message);
      console.log("🔍 [MESSAGES-UPSERT] FromMe value:", req.body.data?.fromMe || req.body.data?.key?.fromMe);
      console.log("🔍 [MESSAGES-UPSERT] Message type:", req.body.data?.messageType);
      console.log("🔍 [MESSAGES-UPSERT] Available message fields:", Object.keys(req.body.data?.message || {}));
      console.log("🔍 [MESSAGES-UPSERT] Has imageMessage:", !!req.body.data?.message?.imageMessage);
      console.log("🔍 [MESSAGES-UPSERT] Has audioMessage:", !!req.body.data?.message?.audioMessage);
      console.log("🔍 [MESSAGES-UPSERT] Has conversation:", !!req.body.data?.message?.conversation);
      console.log("🔍 [MESSAGES-UPSERT] Has extendedTextMessage:", !!req.body.data?.message?.extendedTextMessage);
      
      // DEBUG ESPECIAL PARA ÁUDIO
      if (req.body.data?.message?.audioMessage) {
        console.log("🎤🎤🎤 [UPSERT] ÁUDIO DETECTADO NO ENDPOINT!");
        console.log("🎤 [UPSERT] AudioMessage:", JSON.stringify(req.body.data.message.audioMessage, null, 2));
      }
      console.log("🔥🔥🔥 [MESSAGES-UPSERT] Full request body:", JSON.stringify(req.body, null, 2));
      
      // Redirecionar para o processamento principal
      await whatsappWebhookService.handleEvolutionMessage(req.body);
      
      res.status(200).json({ 
        success: true, 
        processed: true, 
        type: "messages_upsert", 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error("❌ Error in messages-upsert webhook:", error);
      res.status(200).json({ success: true, processed: false });
    }
  });

  app.post("/api/webhook/messages/chats-update", async (req, res) => {
    console.log("💬 [CHATS-UPDATE] Chat update received (ignoring)");
    res.status(200).json({ success: true, processed: false, type: "chats_update" });
  });

  app.post("/api/webhook/messages/messages-update", async (req, res) => {
    console.log("📝 [MESSAGES-UPDATE] Message update received (ignoring)");
    res.status(200).json({ success: true, processed: false, type: "messages_update" });
  });

  app.post("/api/webhook/messages/send-message", async (req, res) => {
    console.log("📤 [SEND-MESSAGE] Send message confirmation received (ignoring)");
    res.status(200).json({ success: true, processed: false, type: "send_message" });
  });

  app.post("/api/webhook/messages/chats-upsert", async (req, res) => {
    console.log("💬 [CHATS-UPSERT] Chat upsert received (ignoring)");
    res.status(200).json({ success: true, processed: false, type: "chats_upsert" });
  });

  // Endpoint adicional para Evolution API (formato padrão)
  app.post("/api/webhook/messages", async (req, res) => {
    try {
      console.log("🔥 [WEBHOOK] ================================");
      console.log("🔥 [WEBHOOK] NEW MESSAGE RECEIVED!");
      console.log("🔥 [WEBHOOK] ================================");
      console.log("🔍 [WEBHOOK] Event type:", req.body.event);
      console.log("🔍 [WEBHOOK] Has message data:", !!req.body.data?.message);
      console.log("🔍 [WEBHOOK] FromMe value:", req.body.data?.fromMe || req.body.data?.key?.fromMe);
      console.log("🔍 [WEBHOOK] Message type:", req.body.data?.messageType);
      console.log("🔍 [WEBHOOK] Available message fields:", Object.keys(req.body.data?.message || {}));
      console.log("🔍 [WEBHOOK] Has imageMessage:", !!req.body.data?.message?.imageMessage);
      console.log("🔍 [WEBHOOK] Has conversation:", !!req.body.data?.message?.conversation);
      console.log("🔍 [WEBHOOK] Has extendedTextMessage:", !!req.body.data?.message?.extendedTextMessage);
      console.log("🔥 [WEBHOOK] Full request body:", JSON.stringify(req.body, null, 2));
      
      // Verificar se temos dados válidos
      if (!req.body.data || !req.body.sender) {
        console.log("❌ Invalid webhook format - missing data or sender");
        return res.status(400).json({ error: "Invalid webhook format" });
      }
      
      // Verificar se é uma mensagem enviada por nós (evitar loop infinito)
      // IMPORTANTE: Não filtrar por event === "send.message" pois inclui mensagens do usuário
      if ((req.body.data && req.body.data.fromMe === true) ||
          (req.body.data && req.body.data.key && req.body.data.key.fromMe === true)) {
        console.log("📤 Message sent by us, ignoring to prevent loop");
        return res.status(200).json({ 
          success: true, 
          type: "outgoing_message", 
          ignored: true,
          timestamp: new Date().toISOString() 
        });
      }
      
      // Verificar se tem conteúdo de mensagem (para evitar processar status updates)
      if (!req.body.data.message || 
          (!req.body.data.message.conversation && 
           !req.body.data.message.extendedTextMessage && 
           !req.body.data.message.imageMessage)) {
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

  // Fetch conversations directly from Evolution API
  app.get("/api/conversations/evolution/:instanceId", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;
      console.log(`🔍 [DEBUG] Fetching Evolution chats for instance: ${instanceId}`);
      
      // Get instance details to access Evolution API
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        console.log(`❌ [ERROR] Instance not found: ${instanceId}`);
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      console.log(`✅ [DEBUG] Instance found: ${instance.name}, companyId: ${instance.companyId}`);

      // Check if instance belongs to user's company
      if (instance.companyId !== req.user?.companyId) {
        console.log(`❌ [ERROR] Access denied for company ${req.user?.companyId}, instance belongs to ${instance.companyId}`);
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Get Evolution API configuration
      const config = await storage.getEvolutionApiConfiguration();
      if (!config) {
        console.log(`❌ [ERROR] Evolution API config not found`);
        return res.status(400).json({ 
          error: "Configuração da Evolution API não encontrada", 
          details: "Acesse a área Admin para configurar a Evolution API primeiro" 
        });
      }

      console.log(`🔧 [DEBUG] Evolution API Config: ${config.evolutionURL}`);
      
      // Use instance token if available, otherwise fallback to global token
      const tokenToUse = instance.evolutionToken || config.evolutionToken;
      console.log(`🔐 [DEBUG] Using token: ${tokenToUse ? 'Instance-specific token' : 'Global token'}`);

      const evolutionApi = new EvolutionApiService({
        baseURL: config.evolutionURL,
        token: tokenToUse
      });

      console.log(`📞 [DEBUG] Trying multiple approaches to get conversations...`);

      let conversations = [];
      let evolutionChats = null;

      // Use evolutionInstanceId if available, otherwise fallback to instance name
      const instanceNameToUse = instance.evolutionInstanceId || instance.name.replace(/\s+/g, '_').toLowerCase();
      console.log(`🔧 [DEBUG] Using instance name: ${instanceNameToUse}`);

      try {
        // Approach 1: Try to get chats directly
        console.log(`📞 [DEBUG] Approach 1: Calling getChats`);
        evolutionChats = await evolutionApi.getChats(instanceNameToUse);
        console.log(`📊 [DEBUG] getChats response:`, {
          type: typeof evolutionChats,
          isArray: Array.isArray(evolutionChats),
          keys: evolutionChats ? Object.keys(evolutionChats) : 'no keys'
        });
      } catch (error) {
        console.log(`⚠️ [DEBUG] getChats failed:`, error.message);
      }

      if (!evolutionChats || (Array.isArray(evolutionChats) && evolutionChats.length === 0)) {
        try {
          // Approach 2: Try to get all messages (which might include chat info)
          console.log(`📞 [DEBUG] Approach 2: Calling getAllMessages`);
          const allMessages = await evolutionApi.getAllMessages(instanceNameToUse);
          console.log(`📊 [DEBUG] getAllMessages response:`, {
            type: typeof allMessages,
            isArray: Array.isArray(allMessages),
            keys: allMessages ? Object.keys(allMessages) : 'no keys'
          });
          
          // Extract unique chats from messages
          if (allMessages && Array.isArray(allMessages)) {
            const uniqueChats = new Map();
            allMessages.forEach((message: any) => {
              const chatId = message.key?.remoteJid || message.remoteJid || message.chatId || message.from;
              if (chatId) {
                const existingChat = uniqueChats.get(chatId);
                // Update with the most recent pushName or keep existing
                const pushName = message.pushName || existingChat?.pushName || existingChat?.name;
                
                uniqueChats.set(chatId, {
                  id: chatId,
                  remoteJid: chatId,
                  pushName: pushName,
                  name: pushName,
                  lastMessage: { text: message.message?.conversation || message.text || existingChat?.lastMessage?.text || 'Mensagem' },
                  unreadCount: existingChat?.unreadCount || 0
                });
              }
            });
            evolutionChats = Array.from(uniqueChats.values());
            console.log(`📊 [DEBUG] Extracted ${evolutionChats.length} unique chats from messages`);
          } else if (allMessages && allMessages.messages && allMessages.messages.records && Array.isArray(allMessages.messages.records)) {
            // Handle paginated response from Evolution API v2
            const uniqueChats = new Map();
            allMessages.messages.records.forEach((message: any) => {
              const chatId = message.key?.remoteJid || message.remoteJid || message.chatId || message.from;
              if (chatId) {
                const existingChat = uniqueChats.get(chatId);
                const pushName = message.pushName || existingChat?.pushName || existingChat?.name;
                
                uniqueChats.set(chatId, {
                  id: chatId,
                  remoteJid: chatId,
                  pushName: pushName,
                  name: pushName,
                  lastMessage: { text: message.message?.conversation || message.text || existingChat?.lastMessage?.text || 'Mensagem' },
                  unreadCount: existingChat?.unreadCount || 0
                });
              }
            });
            evolutionChats = Array.from(uniqueChats.values());
            console.log(`📊 [DEBUG] Extracted ${evolutionChats.length} unique chats from paginated messages`);
          } else if (allMessages && allMessages.data && Array.isArray(allMessages.data)) {
            const uniqueChats = new Map();
            allMessages.data.forEach((message: any) => {
              const chatId = message.key?.remoteJid || message.remoteJid || message.chatId || message.from;
              if (chatId) {
                const existingChat = uniqueChats.get(chatId);
                const pushName = message.pushName || existingChat?.pushName || existingChat?.name;
                
                uniqueChats.set(chatId, {
                  id: chatId,
                  remoteJid: chatId,
                  pushName: pushName,
                  name: pushName,
                  lastMessage: { text: message.message?.conversation || message.text || existingChat?.lastMessage?.text || 'Mensagem' },
                  unreadCount: existingChat?.unreadCount || 0
                });
              }
            });
            evolutionChats = Array.from(uniqueChats.values());
            console.log(`📊 [DEBUG] Extracted ${evolutionChats.length} unique chats from messages data`);
          }
        } catch (error) {
          console.log(`⚠️ [DEBUG] getAllMessages failed:`, error.message);
        }
      }

      // Transform Evolution API response to our conversation format
      if (Array.isArray(evolutionChats)) {
        conversations = evolutionChats;
      } else if (evolutionChats && evolutionChats.data && Array.isArray(evolutionChats.data)) {
        conversations = evolutionChats.data;
      } else if (evolutionChats && evolutionChats.chats && Array.isArray(evolutionChats.chats)) {
        conversations = evolutionChats.chats;
      } else if (evolutionChats && typeof evolutionChats === 'object') {
        // Check for different possible response structures
        const possibleKeys = ['result', 'results', 'items', 'messages', 'conversations'];
        for (const key of possibleKeys) {
          if (evolutionChats[key] && Array.isArray(evolutionChats[key])) {
            conversations = evolutionChats[key];
            console.log(`📊 [DEBUG] Found conversations in key: ${key}`);
            break;
          }
        }
        
        // If still no conversations found and evolutionChats has keys, log them
        if (conversations.length === 0 && Object.keys(evolutionChats).length > 0) {
          console.log(`⚠️ [DEBUG] Unknown response structure. Keys found:`, Object.keys(evolutionChats));
          // Try to return the raw object as an array
          conversations = [evolutionChats];
        }
      }

      console.log(`✅ [DEBUG] Final conversations array:`, {
        length: conversations.length,
        firstItem: conversations[0] ? Object.keys(conversations[0]) : 'no items',
        sample: conversations.slice(0, 2)
      });
      
      // Return empty array if no conversations found
      res.json(conversations || []);
    } catch (error) {
      console.error("❌ [ERROR] Get Evolution conversations error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        error: "Erro ao buscar conversas da Evolution API",
        details: error.message 
      });
    }
  });

  // TEST DEBUG endpoint for Evolution API integration
  app.get("/api/conversations/evolution/:instanceId/test", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId } = req.params;
      console.log(`🧪 [TEST DEBUG] Starting Evolution API debug test for instance: ${instanceId}`);
      
      const debugResults: any = {
        step1_instanceLookup: null,
        step2_configLookup: null,
        step3_evolutionApiInit: null,
        step4_findChatsCall: null,
        step5_rawResponse: null,
        errors: []
      };

      // Step 1: Get instance details
      console.log(`🧪 [TEST DEBUG] Step 1: Looking up instance details...`);
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        const error = `Instance not found: ${instanceId}`;
        console.log(`❌ [TEST DEBUG] ${error}`);
        debugResults.errors.push(error);
        return res.status(404).json({ 
          error: "Instância não encontrada",
          debugResults 
        });
      }

      debugResults.step1_instanceLookup = {
        found: true,
        instanceId: instance.id,
        instanceName: instance.name,
        evolutionInstanceId: instance.evolutionInstanceId,
        companyId: instance.companyId,
        status: instance.status
      };
      console.log(`✅ [TEST DEBUG] Step 1 SUCCESS: Instance found`, debugResults.step1_instanceLookup);

      // Check company access
      if (instance.companyId !== req.user?.companyId) {
        const error = `Access denied for company ${req.user?.companyId}, instance belongs to ${instance.companyId}`;
        console.log(`❌ [TEST DEBUG] ${error}`);
        debugResults.errors.push(error);
        return res.status(403).json({ 
          error: "Acesso negado",
          debugResults 
        });
      }

      // Step 2: Get Evolution API configuration
      console.log(`🧪 [TEST DEBUG] Step 2: Getting Evolution API configuration...`);
      const config = await storage.getEvolutionApiConfiguration();
      if (!config) {
        const error = "Evolution API configuration not found";
        console.log(`❌ [TEST DEBUG] ${error}`);
        debugResults.errors.push(error);
        return res.status(400).json({ 
          error: "Configuração da Evolution API não encontrada",
          debugResults
        });
      }

      debugResults.step2_configLookup = {
        found: true,
        evolutionURL: config.evolutionURL,
        hasToken: !!config.evolutionToken,
        tokenLength: config.evolutionToken?.length || 0
      };
      console.log(`✅ [TEST DEBUG] Step 2 SUCCESS: Evolution API config found`, debugResults.step2_configLookup);

      // Step 3: Initialize Evolution API service
      console.log(`🧪 [TEST DEBUG] Step 3: Initializing Evolution API service...`);
      const evolutionApi = new EvolutionApiService({
        baseURL: config.evolutionURL,
        token: config.evolutionToken
      });

      debugResults.step3_evolutionApiInit = {
        success: true,
        baseURL: config.evolutionURL,
        tokenProvided: !!config.evolutionToken
      };
      console.log(`✅ [TEST DEBUG] Step 3 SUCCESS: Evolution API service initialized`, debugResults.step3_evolutionApiInit);

      // Step 4: Determine instance name to use
      const instanceNameToUse = instance.evolutionInstanceId || instance.name.replace(/\s+/g, '_').toLowerCase();
      console.log(`🧪 [TEST DEBUG] Step 4: Using instance name for Evolution API call: ${instanceNameToUse}`);
      
      debugResults.step4_findChatsCall = {
        originalInstanceName: instance.name,
        evolutionInstanceId: instance.evolutionInstanceId,
        finalInstanceName: instanceNameToUse
      };

      // Step 5: Make direct call to Evolution API findChats
      console.log(`🧪 [TEST DEBUG] Step 5: Making direct call to Evolution API findChats...`);
      try {
        const rawResponse = await evolutionApi.getChats(instanceNameToUse);
        
        debugResults.step5_rawResponse = {
          success: true,
          responseType: typeof rawResponse,
          isArray: Array.isArray(rawResponse),
          hasData: !!rawResponse,
          keys: rawResponse ? Object.keys(rawResponse) : [],
          length: Array.isArray(rawResponse) ? rawResponse.length : (rawResponse?.length || 'N/A'),
          sample: Array.isArray(rawResponse) ? rawResponse.slice(0, 2) : rawResponse
        };
        
        console.log(`✅ [TEST DEBUG] Step 5 SUCCESS: Raw Evolution API response:`, debugResults.step5_rawResponse);
        console.log(`📊 [TEST DEBUG] Full raw response structure:`, JSON.stringify(rawResponse, null, 2));
        
        // Return complete debug information
        res.json({
          success: true,
          message: "Evolution API debug test completed successfully",
          debugResults,
          fullRawResponse: rawResponse
        });
        
      } catch (evolutionError: any) {
        const error = `Evolution API findChats failed: ${evolutionError.message}`;
        console.log(`❌ [TEST DEBUG] Step 5 FAILED: ${error}`);
        console.error(`❌ [TEST DEBUG] Evolution API error details:`, evolutionError);
        
        debugResults.step5_rawResponse = {
          success: false,
          error: evolutionError.message,
          stack: evolutionError.stack
        };
        debugResults.errors.push(error);
        
        res.status(500).json({
          success: false,
          error: "Evolution API call failed",
          debugResults
        });
      }
      
    } catch (error: any) {
      console.error("❌ [TEST DEBUG] General error during debug test:", error);
      console.error("❌ [TEST DEBUG] Error stack:", error.stack);
      res.status(500).json({ 
        success: false,
        error: "Erro durante teste de debug da Evolution API",
        details: error.message,
        debugResults: debugResults || {}
      });
    }
  });

  // Test endpoint to debug Evolution API messages
  app.get("/api/conversations/evolution/:instanceId/:chatId/test-messages", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId, chatId } = req.params;
      
      // Get instance details
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Get Evolution API configuration
      const config = await storage.getEvolutionApiConfiguration();
      if (!config) {
        return res.status(400).json({ error: "Configuração da Evolution API não encontrada" });
      }

      const tokenToUse = instance.evolutionToken || config.evolutionToken;
      const instanceNameToUse = instance.evolutionInstanceId || instance.name.replace(/\s+/g, '_').toLowerCase();
      
      console.log(`🧪 [TEST] Testing messages for instance: ${instanceNameToUse}, chatId: ${chatId}`);
      
      const testResults = {
        instanceName: instanceNameToUse,
        chatId: chatId,
        tests: []
      };

      // Test 1: Try with original chatId
      try {
        const test1 = await fetch(`${config.evolutionURL}/chat/findMessages/${instanceNameToUse}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': tokenToUse
          },
          body: JSON.stringify({
            where: {
              key: {
                remoteJid: chatId
              }
            },
            limit: 10
          })
        });
        const result1 = await test1.json();
        testResults.tests.push({
          name: "Test 1: Original chatId with key.remoteJid",
          status: test1.status,
          response: result1
        });
      } catch (e) {
        testResults.tests.push({
          name: "Test 1: Original chatId with key.remoteJid",
          error: e.message
        });
      }

      // Test 2: Try with direct remoteJid
      try {
        const test2 = await fetch(`${config.evolutionURL}/chat/findMessages/${instanceNameToUse}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': tokenToUse
          },
          body: JSON.stringify({
            where: {
              remoteJid: chatId
            },
            limit: 10
          })
        });
        const result2 = await test2.json();
        testResults.tests.push({
          name: "Test 2: Original chatId with direct remoteJid",
          status: test2.status,
          response: result2
        });
      } catch (e) {
        testResults.tests.push({
          name: "Test 2: Original chatId with direct remoteJid",
          error: e.message
        });
      }

      // Test 3: Try without where clause (get all messages)
      try {
        const test3 = await fetch(`${config.evolutionURL}/chat/findMessages/${instanceNameToUse}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': tokenToUse
          },
          body: JSON.stringify({
            where: {},
            limit: 10
          })
        });
        const result3 = await test3.json();
        testResults.tests.push({
          name: "Test 3: Get all messages (empty where)",
          status: test3.status,
          response: result3,
          sampleMessage: Array.isArray(result3) && result3.length > 0 ? result3[0] : null
        });
      } catch (e) {
        testResults.tests.push({
          name: "Test 3: Get all messages (empty where)",
          error: e.message
        });
      }

      res.json(testResults);
    } catch (error) {
      console.error("Test messages error:", error);
      res.status(500).json({ error: "Erro no teste", details: error.message });
    }
  });

  // Fetch specific chat messages from Evolution API
  app.get("/api/conversations/evolution/:instanceId/:chatId/messages", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { instanceId, chatId } = req.params;
      
      // Get instance details to access Evolution API
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      // Check if instance belongs to user's company
      if (instance.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Get Evolution API configuration
      const config = await storage.getEvolutionApiConfiguration();
      if (!config) {
        console.log(`❌ [ERROR] Evolution API configuration not found`);
        return res.status(400).json({ 
          error: "Configuração da Evolution API não encontrada", 
          details: "Acesse a área Admin para configurar a Evolution API primeiro" 
        });
      }

      // Use instance token if available, otherwise fallback to global token
      const tokenToUse = instance.evolutionToken || config.evolutionToken;
      console.log(`🔐 [DEBUG] Using token: ${tokenToUse ? 'Instance-specific token' : 'Global token'} for messages`);

      const evolutionApi = new EvolutionApiService({
        baseURL: config.evolutionURL,
        token: tokenToUse
      });

      // Use evolutionInstanceId if available, otherwise fallback to instance name
      const instanceNameToUse = instance.evolutionInstanceId || instance.name.replace(/\s+/g, '_').toLowerCase();
      console.log(`🔧 [DEBUG] Using instance name: ${instanceNameToUse} for chat: ${chatId}`);
      console.log(`📱 [DEBUG] Full chatId/remoteJid: "${chatId}"`);

      // Fetch messages from specific chat
      const chatMessagesResponse = await evolutionApi.getChatMessages(instanceNameToUse, chatId);
      console.log(`📨 [DEBUG] Raw response from Evolution API:`, JSON.stringify(chatMessagesResponse, null, 2).substring(0, 500));
      
      // Ensure response is always an array
      let chatMessages = [];
      if (Array.isArray(chatMessagesResponse)) {
        chatMessages = chatMessagesResponse;
      } else if (chatMessagesResponse && chatMessagesResponse.messages && chatMessagesResponse.messages.records && Array.isArray(chatMessagesResponse.messages.records)) {
        // Evolution API v2 paginated response format
        chatMessages = chatMessagesResponse.messages.records;
        console.log(`📊 [DEBUG] Found ${chatMessages.length} messages in messages.records (page ${chatMessagesResponse.messages.currentPage}/${chatMessagesResponse.messages.pages})`);
      } else if (chatMessagesResponse && chatMessagesResponse.data && Array.isArray(chatMessagesResponse.data)) {
        chatMessages = chatMessagesResponse.data;
      } else if (chatMessagesResponse && chatMessagesResponse.messages && Array.isArray(chatMessagesResponse.messages)) {
        chatMessages = chatMessagesResponse.messages;
      } else if (chatMessagesResponse && chatMessagesResponse.result && Array.isArray(chatMessagesResponse.result)) {
        chatMessages = chatMessagesResponse.result;
      } else if (chatMessagesResponse && chatMessagesResponse.records && Array.isArray(chatMessagesResponse.records)) {
        chatMessages = chatMessagesResponse.records;
      } else if (chatMessagesResponse && typeof chatMessagesResponse === 'object') {
        // Log the structure to understand what we're getting
        console.log(`⚠️ [DEBUG] Unknown message response structure. Keys:`, Object.keys(chatMessagesResponse));
        // Try to find array in the response
        const possibleKeys = ['items', 'rows', 'content'];
        for (const key of possibleKeys) {
          if (chatMessagesResponse[key] && Array.isArray(chatMessagesResponse[key])) {
            chatMessages = chatMessagesResponse[key];
            console.log(`📊 [DEBUG] Found messages in key: ${key}`);
            break;
          }
        }
      }
      
      console.log(`✅ [DEBUG] Returning ${chatMessages.length} messages for chat ${chatId}`);
      res.json(chatMessages);
    } catch (error) {
      console.error("Get Evolution chat messages error:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens do chat da Evolution API" });
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

  // Contact Lists endpoints
  app.get("/api/contact-lists", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const contactLists = await storage.getContactListsByCompany(req.user.companyId);
      
      // For each list, get the contact items to provide complete data
      const listsWithContacts = await Promise.all(
        contactLists.map(async (list) => {
          const contacts = await storage.getContactListItems(list.id);
          return {
            ...list,
            contacts: contacts.map(contact => ({
              name: contact.name,
              phone: contact.phone,
              valid: contact.valid,
              error: contact.error
            }))
          };
        })
      );

      res.json(listsWithContacts);
    } catch (error) {
      console.error("Get contact lists error:", error);
      res.status(500).json({ error: "Erro ao buscar listas de contatos" });
    }
  });

  app.post("/api/contact-lists", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const { name, contacts } = req.body;
      
      if (!name || !contacts || !Array.isArray(contacts)) {
        return res.status(400).json({ error: "Nome e lista de contatos são obrigatórios" });
      }

      // Calculate statistics
      const totalContacts = contacts.length;
      const validContacts = contacts.filter((c: any) => c.valid).length;

      // Create the contact list
      const listData = {
        companyId: req.user.companyId,
        name,
        totalContacts,
        validContacts
      };

      const contactList = await storage.createContactList(listData);

      // Create contact list items
      for (const contact of contacts) {
        await storage.createContactListItem({
          contactListId: contactList.id,
          name: contact.name,
          phone: contact.phone,
          valid: contact.valid || false,
          error: contact.error || null
        });
      }

      // Get the complete list with contacts for response
      const contactItems = await storage.getContactListItems(contactList.id);
      const completeList = {
        ...contactList,
        contacts: contactItems.map(contact => ({
          name: contact.name,
          phone: contact.phone,
          valid: contact.valid,
          error: contact.error
        }))
      };

      res.status(201).json(completeList);
    } catch (error) {
      console.error("Create contact list error:", error);
      res.status(500).json({ error: "Erro ao criar lista de contatos" });
    }
  });

  app.get("/api/contact-lists/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const contactList = await storage.getContactList(id);

      if (!contactList) {
        return res.status(404).json({ error: "Lista de contatos não encontrada" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && contactList.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: lista não pertence à sua empresa" });
      }

      // Get contact items
      const contacts = await storage.getContactListItems(contactList.id);
      const completeList = {
        ...contactList,
        contacts: contacts.map(contact => ({
          name: contact.name,
          phone: contact.phone,
          valid: contact.valid,
          error: contact.error
        }))
      };

      res.json(completeList);
    } catch (error) {
      console.error("Get contact list error:", error);
      res.status(500).json({ error: "Erro ao buscar lista de contatos" });
    }
  });

  app.delete("/api/contact-lists/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const contactList = await storage.getContactList(id);

      if (!contactList) {
        return res.status(404).json({ error: "Lista de contatos não encontrada" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && contactList.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado: lista não pertence à sua empresa" });
      }

      await storage.deleteContactList(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete contact list error:", error);
      res.status(500).json({ error: "Erro ao excluir lista de contatos" });
    }
  });

  // Scheduled Messages endpoints
  app.post("/api/scheduled-messages", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const messageData = insertScheduledMessageSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      const scheduledMessage = await storage.createScheduledMessage(messageData);
      
      // If scheduled for immediate sending (within 1 minute), mark for processing
      const now = new Date();
      const scheduledTime = new Date(messageData.scheduledDateTime);
      
      if (scheduledTime <= new Date(now.getTime() + 60000)) { // 1 minute from now
        await storage.updateScheduledMessage(scheduledMessage.id, { 
          status: 'processing',
          startedAt: new Date()
        });
      }

      res.json(scheduledMessage);
    } catch (error) {
      console.error("Create scheduled message error:", error);
      res.status(500).json({ error: "Erro ao criar agendamento" });
    }
  });

  app.get("/api/scheduled-messages", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.companyId) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const scheduledMessages = await storage.getScheduledMessagesByCompany(req.user.companyId);
      res.json(scheduledMessages);
    } catch (error) {
      console.error("Get scheduled messages error:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
  });

  app.get("/api/scheduled-messages/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const scheduledMessage = await storage.getScheduledMessage(id);
      
      if (!scheduledMessage) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && scheduledMessage.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(scheduledMessage);
    } catch (error) {
      console.error("Get scheduled message error:", error);
      res.status(500).json({ error: "Erro ao buscar agendamento" });
    }
  });

  app.put("/api/scheduled-messages/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const scheduledMessage = await storage.getScheduledMessage(id);
      
      if (!scheduledMessage) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && scheduledMessage.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const updatedMessage = await storage.updateScheduledMessage(id, req.body);
      res.json(updatedMessage);
    } catch (error) {
      console.error("Update scheduled message error:", error);
      res.status(500).json({ error: "Erro ao atualizar agendamento" });
    }
  });

  app.delete("/api/scheduled-messages/:id", authenticate, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const scheduledMessage = await storage.getScheduledMessage(id);
      
      if (!scheduledMessage) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Check company access
      if (req.user?.role !== 'admin' && scheduledMessage.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Only allow deletion if not completed
      if (scheduledMessage.status === 'processing') {
        return res.status(400).json({ error: "Não é possível excluir agendamento em processamento" });
      }

      await storage.deleteScheduledMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete scheduled message error:", error);
      res.status(500).json({ error: "Erro ao excluir agendamento" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
