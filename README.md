# simulaemergencias

Backend generado con **create-node-app** (variante sin R2), basado en la arquitectura de `sicalp-vehicular-backend`.

## Stack

- Node.js + TypeScript (ESM)
- Express 5
- Prisma ORM (PostgreSQL, vía `@prisma/adapter-pg`)
- Autenticación JWT + roles y permisos (multi-rol)
- Recuperación de contraseña por correo (nodemailer)
- Documentación OpenAPI/Swagger en `/api-docs`
- Manejo de errores centralizado (`AppError`, errores de Prisma traducidos, Multer, body-parser)

## Estructura

```
lib/prisma.ts            Cliente Prisma (driver adapter pg)
prisma/schema.prisma      Modelos: Rol, Permiso, RolPermiso, Usuario, UsuarioRol,
                           TokenRecuperacion, Recurso (módulo de ejemplo)
src/
  app.ts                  Express app: cors, json, swagger, rutas, error middleware
  index.ts                Punto de entrada (arranca el servidor)
  server.ts               Conexión a la base de datos
  middlewares/
    auth.middleware.ts    JWT, validaciones, permisos (checkPermissions, checkAnyPermissions...)
    error.middleware.ts   Manejo centralizado de errores
  utils/                  AppError, JSONResponse, PrismaErrors, paginación, mailer, permisos...
  constants/              Constantes del sistema (rol admin fijo)
  docs/swagger.ts          Documento OpenAPI (edítalo al agregar módulos)
  routes|controllers|services/
    auth.*                Login, registro, usuarios, permisos de sesión, cambio de contraseña
    rol.*                  Roles y catálogo de permisos
    recuperacion.*          Recuperación de contraseña
    sistema.*               Healthcheck
    recursos.*               Módulo de ejemplo (CRUD) — úsalo como plantilla
  scripts/seed.ts          Roles, permisos, usuario admin inicial
```

## Puesta en marcha

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`.

3. Crea la base de datos y aplica las migraciones:

   ```bash
   npm run db:migrate
   ```

4. Siembra roles, permisos y el usuario administrador inicial:

   ```bash
   npm run db:seed
   ```

   Por defecto crea `admin@example.com` / `Admin123` (rol `admin`, todos los permisos). Cámbialo con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` en el `.env` **antes** de correr el seed.

5. Levanta el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

6. Documentación interactiva: [http://localhost:1206/api-docs](http://localhost:1206/api-docs)

## Login de prueba

```
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

Usa el `token` devuelto como `Authorization: Bearer <token>` en las demás peticiones.

## Cómo agregar un nuevo módulo (patrón CRUD)

Usa el módulo `recursos` como plantilla:

1. **Prisma**: agrega el modelo en `prisma/schema.prisma` y corre `npm run db:migrate`.
2. **Types**: `src/types/<modulo>.types.ts`.
3. **Service**: `src/services/<modulo>.ts` (lógica de negocio + Prisma).
4. **Controller**: `src/controllers/<modulo>.controller.ts` (parsea `req`, llama al service, responde con `sendSuccessResponse`).
5. **Routes**: `src/routes/<modulo>.routes.ts` (validaciones con `express-validator`, `authenticateToken`, `checkPermissions([...])`).
6. Registra el router en `src/routes/index.routes.ts`.
7. Agrega los permisos del módulo en `src/scripts/seed.ts` y asígnalos al rol que corresponda.
8. Documenta las rutas nuevas en `src/docs/swagger.ts`.

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor en desarrollo con recarga automática |
| `npm run build` | Compila a `dist/` (genera Prisma Client primero) |
| `npm run prod` | Ejecuta el build compilado |
| `npm run typecheck` | Verifica tipos sin emitir archivos |
| `npm run db:migrate` | Crea/aplica una migración de Prisma |
| `npm run db:reset` | Reinicia la base de datos (¡borra datos!) |
| `npm run db:seed` | Siembra roles, permisos y usuario admin |
| `npm run deploy` | Aplica migraciones en producción + seed |

## ¿Necesitas subir archivos (imágenes, PDFs, etc.)?

Esta variante no incluye almacenamiento de archivos. Si tu proyecto lo necesita, genera la variante con R2:

```bash
create-node-app-r2 mi-api
```
