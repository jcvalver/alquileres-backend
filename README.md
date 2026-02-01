# Alquileres Backend

Backend Node.js + TypeScript + Express + Prisma (PostgreSQL).

Este proyecto está preparado para desplegarse como **MVP** usando opciones gratuitas:

- **Backend**: Railway
- **Base de datos**: Railway Postgres
- **Storage de imágenes** (recibos/comprobantes): Supabase Storage

## Quick start (local)

1) Crea tu archivo `.env` (ejemplo mínimo):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_SECRET="cambia-esto"
STORAGE_PROVIDER="local"
```

2) Instala dependencias y arranca:

```bash
npm install
npm run prisma:generate
npm run dev
```

## Deploy en Railway (paso a paso)

## ✅ Checklist detallado (Railway + Railway Postgres + Supabase Storage public)

### 0) Prerrequisitos

- Repo en GitHub (Railway despliega desde GitHub fácilmente).
- Tu backend compila local:
  - `npm install`
  - `npm run build`

### 1) Preparación de Supabase (Storage)

1. Crear proyecto en Supabase.
2. Ir a **Storage** → **Create bucket**.
  - Bucket sugerido: `alquileres`.
  - Marcar como **Public** (MVP).
3. Ir a **Project Settings → API** y copiar:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (service role key)

Notas:
- La `SUPABASE_SERVICE_ROLE_KEY` **solo** va en backend (Railway). Nunca en frontend.
- Al ser bucket public, tu backend guarda un `publicUrl` que el frontend puede consumir directo.

### 2) Crear Railway Project (backend)

1. Railway → New Project → Deploy from GitHub Repo.
2. Seleccionar el repo del backend.
3. Confirmar que Railway detecta Node.js.

### 3) Agregar Railway Postgres

1. Dentro del proyecto en Railway → **Add** → **Database** → **PostgreSQL**.
2. Copiar `DATABASE_URL` que expone Railway para esa DB.
  - Si Railway muestra variables separadas (host/user/pass), usa el helper de Railway/Docs para formar `DATABASE_URL`.

Checklist de compatibilidad Prisma:
- `DATABASE_URL` debe apuntar a `postgresql://...`.
- (Recomendado) agregar `?schema=public` al final si no viene.

### 4) Configurar variables de entorno (Railway → Service → Variables)

Obligatorias:
- `NODE_ENV=production`
- `DATABASE_URL=...` (Railway Postgres)
- `JWT_SECRET=...` (mínimo 32+ chars)

Storage (Supabase public):
- `STORAGE_PROVIDER=supabase`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_BUCKET=alquileres`

Opcionales recomendadas:
- `PORT` (Railway lo setea; si no, tu app usa 4000 por defecto)

### Variables de entorno (CORS)
- `CORS_ORIGIN` (opcional)
  - Origen permitido para el frontend en producción (ej. Netlify)
  - Ejemplo: `https://tu-app.netlify.app`
- `CORS_ORIGINS` (opcional)
  - Lista separada por comas si tienes múltiples dominios
  - Ejemplo: `https://tu-app.netlify.app,http://localhost:5173`

> Nota: si no configuras `CORS_ORIGIN(S)`, el backend permite cualquier origen (comportamiento permisivo, útil para desarrollo).

### 5) Prisma migrations en producción (buena práctica)

Este repo está configurado para:

- Build: `prisma generate && tsc`
- Start: `prisma migrate deploy && node dist/server.js`

También puedes ejecutar migraciones manualmente si lo necesitas:

- Migrate (manual): `npm run migrate:deploy`

Checklist:
- Asegúrate de **commitear** la carpeta `prisma/migrations/`.
- En producción se usa `migrate deploy` (no `migrate dev`).
- Si ya aplicaste cambios manuales en la DB (schema drift), considera:
  - Crear una migración “create-only” para dejar registro, o
  - Resolver el estado con `prisma migrate resolve`.

En Railway puedes correr la migración manualmente desde:
- **Service (backend)** → **Run Command** → `npm run migrate:deploy`

### 6) Verificación post-deploy

1. Healthcheck:
  - `GET https://<tu-dominio-railway>/api/health`
  - Debe responder `{ "status": "ok" }`.
2. Endpoint base:
  - `GET https://<tu-dominio-railway>/` → `API Alquileres - funcionando`
3. Prueba de carga de imágenes (pagos):
  - `POST /api/pagos` con `multipart/form-data`
    - Campo archivo `recibo` (opcional)
    - Campo archivo `comprobante` (opcional)
  - Verifica que `recibo_pago` o `comprobante_pago` se guarden como URL de Supabase.
4. Verifica en Supabase Storage que el objeto existe en:
  - `recibos/...` o `comprobantes/...`

### 7) Checklist de seguridad MVP (mínimo)

- CORS: restringir orígenes en producción (no dejar `*` si ya tienes dominio del frontend).
- JWT: `JWT_SECRET` fuerte (no usar valores por defecto).
- Logs: evitar imprimir secretos / `DATABASE_URL`.
- Rate limiting (opcional MVP): considerar si expones auth pública.

### 8) Checklist operativo

- Re-deploy: los archivos **no** se pierden porque viven en Supabase Storage.
- Backups: habilitar backups en Railway Postgres (si el plan lo soporta) o export periódico.
- Observabilidad: revisar logs en Railway luego de subir archivos (errores de Supabase, etc.).

### 1) Crear proyecto

1. Railway → New Project → Deploy from GitHub Repo.
2. Selecciona este repo (o la carpeta del backend).

### 2) Agregar Postgres en Railway

1. Dentro del proyecto → Add → Database → PostgreSQL.
2. Copia la variable `DATABASE_URL` (Railway suele exponerla directamente).

### 3) Configurar variables de entorno (Railway → Service → Variables)

- `DATABASE_URL` = (la URL del Postgres de Railway)
- `JWT_SECRET` = una cadena larga
- `NODE_ENV` = `production`

Para **Supabase Storage**:
- `STORAGE_PROVIDER` = `supabase`
- `SUPABASE_URL` = URL del proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` = service role key (solo backend)
- `SUPABASE_BUCKET` = nombre del bucket (por defecto: `alquileres`)

### 4) Build y Start

Este repo ya incluye scripts aptos para Railway:

- `npm run build` → `prisma generate && tsc`
- `npm start` → `prisma migrate deploy && node dist/server.js`

Eso asegura que en producción se apliquen migraciones con `migrate deploy` (buena práctica).

### 5) Validación

Una vez desplegado:

- `GET /api/health` debe responder `{ "status": "ok" }`

## Upload/Download de imágenes (producción)

En **producción** (Railway) no se recomienda guardar archivos en disco (`/uploads`) porque el filesystem es efímero.

Con `STORAGE_PROVIDER=supabase`:

- El backend recibe el archivo con `multer`.
- Valida que sea imagen (magic-bytes con `file-type`).
- Sube el archivo a **Supabase Storage**.
- Guarda en BD el **publicUrl** en `comprobante_pago` / `recibo_pago`.

El frontend debe consumir estas URLs directamente.

## Endpoints útiles

- `GET /api/health`
- `POST /api/pagos` (multipart/form-data)
  - archivo: `comprobante` (opcional)
  - archivo: `recibo` (opcional)

