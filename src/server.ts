import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 4000;

function logDatabaseTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.warn("[startup] DATABASE_URL is missing or empty");
    return;
  }

  try {
    const u = new URL(raw);
    const user = u.username ? u.username : "(none)";
    const host = u.hostname || "(empty)";
    const port = u.port || "(default)";
    const db = u.pathname?.replace(/^\//, "") || "(empty)";
    console.log(`[startup] DB target host=${host} port=${port} db=${db} user=${user}`);

    // Ayuda para detectar configuración equivocada de Railway
    if (host.endsWith("railway.internal") && host !== "postgres.railway.internal") {
      console.log("[startup] DB uses railway.internal hostname (OK for same project/env). ");
    }
    if (!host || host === "(empty)") {
      console.warn("[startup] DB host parsed as empty. Check DATABASE_URL formatting.");
    }
  } catch (e) {
    console.warn("[startup] DATABASE_URL is not a valid URL string");
  }
}

logDatabaseTarget();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
