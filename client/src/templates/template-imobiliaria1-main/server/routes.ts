import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);

      if (!user) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Erro ao fazer login" });
    }
  });


  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Check session route
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    return res.json({
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
    });
  });

  // Middleware to check if user is admin
  const requireAdmin = (req: Request, res: Response, next: any) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }
    next();
  };

  // Create user (admin only)
  app.post("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const newUser = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        role: validatedData.role || "user",
      });

      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Erro ao criar usuário" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      return res.json(usersWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Erro ao listar usuários" });
    }
  });

  // Get single user (admin only)
  app.get("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Erro ao buscar usuário" });
    }
  });

  // Update user (admin only)
  app.put("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const updateData: any = {};
      
      if (req.body.username) {
        const duplicateUser = await storage.getUserByUsername(req.body.username);
        if (duplicateUser && duplicateUser.id !== req.params.id) {
          return res.status(400).json({ message: "Nome de usuário já existe" });
        }
        updateData.username = req.body.username;
      }
      if (req.body.role && (req.body.role === "admin" || req.body.role === "user")) {
        updateData.role = req.body.role;
      }
      if (req.body.password && req.body.password.length > 0) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Erro ao atualizar usuário" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ message: "Você não pode deletar seu próprio usuário" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.deleteUser(req.params.id);
      return res.json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Erro ao deletar usuário" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
