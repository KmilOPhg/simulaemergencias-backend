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
                           TokenRecuperacion, Recurso (módulo de ejemplo),
                           Grupo, Estudiante, EjercicioEmergencia, VerificacionEstudiante
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
    estudiantes.*            HU-01, HU-02 y HU-03. Listado, búsqueda y filtro por grupo
    grupos.*                 HU-03 y HU-06. Grupos y estudiantes del grupo
    ejercicios.*             HU-04, HU-06 y HU-14. Alta, selección de grupo y consulta
    verificaciones.*         HU-07 y HU-14. Registro y consulta de verificaciones
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

El rol `user` puede consultar estudiantes y grupos, registrar y consultar ejercicios, seleccionar el grupo del ejercicio y registrar o consultar verificaciones. El rol `admin` tiene todos los permisos.

## SimulaEmergencias (flujo Must have)

Estas historias cubren la consulta de participantes, el alta del ejercicio, la selección del grupo y la verificación que queda guardada. Los estudiantes y grupos del seed son ficticios: no uses datos reales de menores sin autorización de Ágape School.

### Reglas de negocio

- El listado y la búsqueda solo muestran `id`, `codigoUnico`, `nombres`, `apellidos` y el grupo. No se devuelven documento, contacto ni otros datos personales.
- El código único vigente es `AGAPE-001`. También se acepta el código anterior `AGP-1001`. Si el formato es inválido, la búsqueda responde `400`. Si el código no existe, responde `404` y no crea registros.
- Un grupo sin estudiantes responde `200` con la lista vacía y el mensaje «El grupo no tiene estudiantes asociados».
- Un ejercicio exige nombre, fecha (`AAAA-MM-DD`) y tipo de escenario: `SISMO`, `INCENDIO` o `INTRUSO`. Lugar, descripción y hora de inicio (`HH:mm`) son opcionales.
- Antes de verificar hay que seleccionar el grupo del ejercicio. Sin esa selección, la verificación responde `400`.
- El `grupoId` de la verificación debe ser un grupo ya seleccionado y el grupo actual del estudiante.
- Solo puede existir una verificación por estudiante en cada ejercicio. Un segundo intento responde `409`.
- `VERIFICADO` significa que el responsable registró el chequeo. No significa, por sí mismo, que el estudiante estuviera presente o ausente. Pendiente es la ausencia de esa fila y no debe leerse como inasistencia.
- El listado también acepta `?grupoId=` para ver solo un grupo. Si el grupo no existe responde `404`. Si no tiene estudiantes, el mensaje lo indica y `datos` llega vacío.
- Ejercicios, grupos seleccionados y verificaciones quedan en PostgreSQL y se vuelven a consultar con los `GET`. Si todavía no hay ejercicios, la consulta lo informa. Si el guardado falla, la API responde el error y no deja el registro a medias.

### Endpoints

Todos requieren `Authorization: Bearer <token>`.

| Historia | Método y ruta | Permiso |
| --- | --- | --- |
| HU-01 | `GET /api/estudiantes?page=1&limit=20` | `estudiantes.consultar` |
| HU-02 | `GET /api/estudiantes/codigo/AGAPE-001` | `estudiantes.consultar` |
| HU-03 | `GET /api/estudiantes?grupoId=1` y `GET /api/grupos/{grupoId}/estudiantes` | `estudiantes.consultar` |
| HU-06 | `GET /api/grupos` | `grupos.consultar` |
| HU-04 | `POST /api/ejercicios` | `ejercicios.crear` |
| HU-06 | `POST /api/ejercicios/{ejercicioId}/grupos` | `ejercicios.seleccionarGrupo` |
| HU-07 | `POST /api/ejercicios/{ejercicioId}/verificaciones` | `verificaciones.registrar` |
| HU-14 | `GET /api/ejercicios`, `GET /api/ejercicios/{id}`, `GET /api/ejercicios/{ejercicioId}/grupos`, `GET /api/ejercicios/{ejercicioId}/verificaciones` | `ejercicios.consultar` o `verificaciones.consultar` |

Registrar un ejercicio:

```json
POST /api/ejercicios
{
  "nombre": "Simulacro de sismo — bloque primaria",
  "fecha": "2026-10-26",
  "horaInicio": "09:30",
  "tipoEscenario": "SISMO",
  "lugar": "Sede principal",
  "descripcion": "Evacuación hacia el punto de encuentro del patio central."
}
```

Seleccionar el grupo que se va a verificar:

```json
POST /api/ejercicios/1/grupos
{ "grupoId": 1 }
```

Registrar la verificación de un estudiante de ese grupo. `estudianteId` y `grupoId` salen del listado; `ejercicioId` sale del ejercicio creado.

```json
POST /api/ejercicios/1/verificaciones
{
  "estudianteId": 1,
  "grupoId": 1,
  "observacion": "Chequeo registrado en el punto de encuentro."
}
```

También se puede filtrar el listado o buscar por código. El `grupoId` sale de `GET /api/grupos`:

```
GET /api/estudiantes?grupoId=1
GET /api/estudiantes/codigo/AGAPE-001
```

La semilla crea los grupos `1A` (Primero A), `3B` (Tercero B) y `5A` (Quinto A), con cuatro estudiantes ficticios en cada uno. Sus códigos van de `AGAPE-001` a `AGAPE-012`. Si ya existían los códigos `AGP-1001` a `AGP-5004`, el seed los renombra.

La documentación interactiva de estos contratos está en [http://localhost:1206/api-docs](http://localhost:1206/api-docs).

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
