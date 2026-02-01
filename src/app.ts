import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import pagosRoutes from "./routes/pagos";
import userRoutes from "./routes/user";
import departamentosRoutes from "./routes/departamentos";
import inquilinosRoutes from "./routes/inquilinos";
import contratosRoutes from "./routes/contratos";
import reportesRoutes from "./routes/reportes";
import estadosPagoRoutes from "./routes/estadosPago";
import tiposPagoRoutes from "./routes/tiposPago";
import { storageConfig } from "./config/storage";
import multer from "multer";

// 👇 Esto convierte BigInt automáticamente en string para JSON.stringify
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};


dotenv.config();

const app = express();
// CORS
// - In production, set CORS_ORIGIN (single) or CORS_ORIGINS (comma-separated)
//   to your frontend URL(s), e.g. https://tu-app.netlify.app
// - If not set, it falls back to permissive CORS (current behavior).
const corsOriginsRaw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginsRaw
  ? corsOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, Postman)
      if (!origin) return callback(null, true);

      // Backwards compatible default: allow all if not configured
      if (!allowedOrigins || allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Maintenance mode: short-circuit all requests except healthcheck.
// Enable by setting MAINTENANCE_MODE=true in the environment.
app.use((req, res, next) => {
  const maintenance = String(process.env.MAINTENANCE_MODE || "").toLowerCase();
  if (maintenance !== "true") return next();

  // Keep health endpoint responding for Railway / uptime checks
  if (req.path === "/api/health") return next();

  return res.status(503).json({
    error: "maintenance",
    message: "Servicio en mantenimiento. Intenta más tarde.",
  });
});

// Servir archivos subidos (comprobantes)
if (storageConfig.provider === "local") {
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
}

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

app.use("/api/auth", authRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departamentos", departamentosRoutes);
app.use("/api/inquilinos", inquilinosRoutes);
app.use("/api/contratos", contratosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/estadospago", estadosPagoRoutes);
app.use("/api/tipospago", tiposPagoRoutes);

app.get("/", (req, res) => res.send("API Alquileres - funcionando"));

// Error handler (incluye errores de multer)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    // https://github.com/expressjs/multer#error-handling
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(413).json({ error: "Archivo demasiado grande", code: err.code });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({ error: "Archivo/campo no permitido (verifica nombre del campo y que sea imagen)", code: err.code, field: err.field });
      default:
        return res.status(400).json({ error: "Error subiendo archivo", code: err.code });
    }
  }

  // Errores genéricos
  if (err && typeof err === "object" && "message" in err) {
    return res.status(500).json({ error: "Error interno", detalle: String((err as any).message) });
  }

  return res.status(500).json({ error: "Error interno" });
});

export default app;
