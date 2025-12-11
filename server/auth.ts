import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  console.log("=== AUTHENTICATE MIDDLEWARE ===");
  console.log("URL:", req.originalUrl);
  console.log("Authorization header exists:", !!req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("Authentication failed: no token found");
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    console.log("Verifying token...");
    const decoded = verifyToken(token);
    console.log("Token decoded successfully, user:", {
      id: decoded.id,
      role: decoded.role,
      companyId: decoded.companyId
    });
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Authentication failed: token verification error:", (error as Error).message);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado: requer permissões de administrador' });
  }
  next();
}

export function requireClient(req: AuthRequest, res: Response, next: NextFunction) {
  console.log("=== REQUIRE CLIENT MIDDLEWARE ===");
  console.log("User:", req.user ? { id: req.user.id, role: req.user.role } : null);
  
  if (!req.user || req.user.role !== 'client') {
    console.log("Client access denied - user role:", req.user?.role);
    return res.status(403).json({ error: 'Acesso negado: requer permissões de cliente' });
  }
  console.log("Client access granted");
  next();
}

export function requireCompanyAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const companyId = req.params.companyId || req.body.companyId;
  
  if (req.user?.role === 'admin') {
    return next(); // Admin can access all companies
  }
  
  if (req.user?.companyId !== companyId) {
    return res.status(403).json({ error: 'Acesso negado: não é possível acessar dados de outra empresa' });
  }
  
  next();
}
