import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '50mb' })); // Aumentar limite para imagens
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Capturar TODAS as requisições para encontrar mensagens de entrada
app.use((req, res, next) => {
  // Log detalhado para qualquer POST que possa conter mensagens
  if (req.method === 'POST') {
    console.log(`🔍🔍🔍 [ALL-REQUESTS] POST to: ${req.path}`);
    console.log(`🔍 [ALL-REQUESTS] Content-Type: ${req.headers['content-type']}`);
    
    if (req.body && typeof req.body === 'object') {
      console.log(`🔍 [ALL-REQUESTS] Has body data`);
      console.log(`🔍 [ALL-REQUESTS] Body keys:`, Object.keys(req.body));
      
      // Buscar por QUALQUER coisa relacionada a imagem
      const bodyStr = JSON.stringify(req.body).toLowerCase();
      if (bodyStr.includes('image') || bodyStr.includes('base64') || bodyStr.includes('jpeg') || bodyStr.includes('png')) {
        console.log(`🎯🖼️🖼️🖼️ [ALL-REQUESTS] IMAGE-RELATED DATA DETECTED!`);
        console.log(`🎯🖼️ [ALL-REQUESTS] Full body:`, JSON.stringify(req.body, null, 2));
      }
      
      // Verificar se é mensagem da Evolution API
      if (req.body.data && req.body.data.message) {
        console.log(`🎯🎯🎯 [ALL-REQUESTS] FOUND MESSAGE DATA!`);
        console.log(`🎯 [ALL-REQUESTS] FromMe:`, req.body.data.key?.fromMe);
        console.log(`🎯 [ALL-REQUESTS] MessageType:`, req.body.data.messageType);
        console.log(`🎯 [ALL-REQUESTS] Available message fields:`, Object.keys(req.body.data.message));
        console.log(`🎯 [ALL-REQUESTS] Has imageMessage:`, !!req.body.data.message.imageMessage);
        
        // Log da mensagem completa se não for fromMe (mensagem do usuário)
        if (req.body.data.key?.fromMe !== true) {
          console.log(`🎯📨 [ALL-REQUESTS] USER MESSAGE (not fromMe):`, JSON.stringify(req.body.data.message, null, 2));
        }
        
        if (req.body.data.message.imageMessage) {
          console.log(`🎯🖼️ [ALL-REQUESTS] IMAGE MESSAGE FOUND!`);
          console.log(`🎯🖼️ [ALL-REQUESTS] Image message keys:`, Object.keys(req.body.data.message.imageMessage));
          console.log(`🎯🖼️ [ALL-REQUESTS] Full imageMessage:`, JSON.stringify(req.body.data.message.imageMessage, null, 2));
          
          // Verificar se tem base64 diretamente
          if (req.body.data.message.imageMessage.base64) {
            console.log(`🎯📄 [ALL-REQUESTS] BASE64 FOUND! Length:`, req.body.data.message.imageMessage.base64.length);
          }
          if (req.body.data.message.imageMessage.jpegThumbnail) {
            console.log(`🎯📄 [ALL-REQUESTS] JPEG THUMBNAIL FOUND! Length:`, req.body.data.message.imageMessage.jpegThumbnail.length);
          }
        }
      }
    }
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Special logging for QR requests
      if (path.includes('/qr')) {
        console.log("🔍 QR REQUEST INTERCEPTED:", {
          method: req.method,
          path: path,
          status: res.statusCode,
          duration: duration + "ms",
          hasAuth: !!req.headers.authorization
        });
      }
      
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Middleware global para capturar mensagens de imagem
app.use('/api/webhook', (req, res, next) => {
  console.log(`🌐🌐🌐 [GLOBAL-WEBHOOK] Request to: ${req.method} ${req.path}`);
  console.log(`🌐 [GLOBAL-WEBHOOK] Content-Type: ${req.headers['content-type']}`);
  
  if (req.body && req.body.data && req.body.data.message) {
    console.log(`🌐🌐🌐 [GLOBAL-WEBHOOK] HAS MESSAGE DATA!`);
    console.log(`🌐 [GLOBAL-WEBHOOK] Available message fields:`, Object.keys(req.body.data.message));
    console.log(`🌐 [GLOBAL-WEBHOOK] Has imageMessage:`, !!req.body.data.message.imageMessage);
    console.log(`🌐 [GLOBAL-WEBHOOK] MessageType:`, req.body.data.messageType);
    console.log(`🌐 [GLOBAL-WEBHOOK] FromMe:`, req.body.data.key?.fromMe);
    
    if (req.body.data.message.imageMessage) {
      console.log(`🌐🖼️ [GLOBAL-WEBHOOK] IMAGE MESSAGE DETECTED!`);
      console.log(`🌐🖼️ [GLOBAL-WEBHOOK] Image URL:`, req.body.data.message.imageMessage.url);
      console.log(`🌐🖼️ [GLOBAL-WEBHOOK] Image mimetype:`, req.body.data.message.imageMessage.mimetype);
      console.log(`🌐🖼️ [GLOBAL-WEBHOOK] Image caption:`, req.body.data.message.imageMessage.caption);
    }
  }
  
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
