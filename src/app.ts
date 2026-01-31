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
app.use(cors());
app.use(express.json());

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
