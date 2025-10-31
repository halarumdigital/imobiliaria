import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { login, logout, getCurrentUser, requireAuth } from "./auth";
import { db } from "./db";
import { users, insertUserSchema, updateUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          password: false,
        },
      });
      res.json(allUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.params.id),
        columns: {
          id: true,
          username: true,
          password: false,
        },
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: fromZodError(validation.error).message 
        });
      }

      const { username, password } = validation.data;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [newUser] = await db.insert(users).values({
        username,
        password: hashedPassword,
      });

      res.status(201).json({ id: newUser.insertId, username });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const validation = updateUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: fromZodError(validation.error).message 
        });
      }

      const { username, password } = validation.data;

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.params.id),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (username && username !== user.username) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.params.id));

      res.json({ id: user.id, username: username || user.username });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.params.id),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.delete(users).where(eq(users.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Properties routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { type, location, minPrice, maxPrice, keyword } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type as string;
      if (location) filters.location = location as string;
      if (minPrice) filters.minPrice = parseInt(minPrice as string);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
      if (keyword) filters.keyword = keyword as string;

      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
