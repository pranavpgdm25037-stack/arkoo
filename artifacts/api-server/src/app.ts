import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Configure standard CORS & Private Network Access preflights (critical for file:// preview compatibility in Chrome/Edge)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Serve the landing page statically at /landing to bypass browser file:// CORS restrictions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const landingPath = path.resolve(__dirname, "../../../landing_page");
app.use("/landing", express.static(landingPath));

const uploadsPath = path.resolve(__dirname, "../../../uploads");
app.use("/uploads", express.static(uploadsPath));

// Capture raw body bytes for webhook signature verification (LinkedIn HMAC-SHA256)
app.use("/api/webhooks/linkedin", express.raw({ type: "application/json" }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as any).rawBody = req.body;
    req.body = JSON.parse(req.body.toString("utf-8"));
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

// Serve React CRM frontend static files from the build output directory
const frontendPath = path.resolve(__dirname, "../../arkoo-crm-frontend/dist/public");
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for client-side routing (e.g. /apply, /contacts, etc.)
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/landing") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) {
      next();
    }
  });
});

export default app;
