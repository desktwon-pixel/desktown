
import "dotenv/config";
import dns from "dns";

// Force IPv4 for database connections
dns.setDefaultResultOrder('ipv4first');

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "../static";
import { createServer } from "http";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
});

app.use(apiLimiter);

app.use(
  express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', type: 'standalone' });
});

export function log(message: string, source = "express-standalone") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  log(`Incoming Request: ${req.method} ${req.path}`);
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
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });
  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Fallback for unmatched API routes to prevent HTML responses
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Standalone Server Error:", err);
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("../vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.STANDALONE_PORT || "5001", 10);
  
  console.log("--- Standalone API Starting ---");
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Port: ${port}`);
  
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`Standalone API serving on port ${port}`);
  });
})();
