/**
 * Documento OpenAPI 3.0 servido en /api-docs (Swagger UI) y /api-docs.json.
 * Se define como objeto plano (sin swagger-jsdoc) para tener control total del contenido
 * y no depender de comentarios JSDoc dispersos en las rutas.
 *
 * Al agregar un módulo nuevo: crea sus rutas/controller/service y añade aquí su entrada
 * en `paths` (y, si aplica, su schema en `components.schemas`).
 */

const bearerAuth = [{ bearerAuth: [] }];

const paramsPagina = [
  { name: "page", in: "query" as const, required: false, description: "Página (defecto 1)", schema: { type: "integer", minimum: 1 } },
  { name: "limit", in: "query" as const, required: false, description: "Ítems por página (defecto 20, máx 100)", schema: { type: "integer", minimum: 1, maximum: 100 } },
];

const respuestaError = {
  description: "Error",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
};

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "simulaemergencias API",
    version: "1.0.0",
    description:
      "API generada con create-node-app. Incluye autenticación JWT, roles y permisos, manejo centralizado de errores y un módulo de ejemplo (`recursos`).",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Auth", description: "Autenticación, usuarios y sesión" },
    { name: "Roles", description: "Roles y catálogo de permisos" },
    { name: "Recuperacion", description: "Recuperación de contraseña por correo" },
    { name: "Sistema", description: "Monitoreo / healthcheck" },
    { name: "Recursos", description: "Módulo de ejemplo (CRUD)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          msg: { type: "string" },
          errors: { type: "array", items: {} },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          msg: { type: "string" },
          data: {},
        },
      },
      Recurso: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          descripcion: { type: "string", nullable: true },
          activo: { type: "boolean" },
          creadoEn: { type: "string", format: "date-time" },
          actualizadoEn: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        description: "Endpoint público. Devuelve un JWT y los permisos efectivos del usuario.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login correcto", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": respuestaError,
          "404": respuestaError,
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión",
        security: bearerAuth,
        responses: { "200": { description: "Sesión cerrada" }, "401": respuestaError },
      },
    },
    "/auth/me/permisos": {
      get: {
        tags: ["Auth"],
        summary: "Permisos del usuario autenticado",
        security: bearerAuth,
        responses: { "200": { description: "Permisos obtenidos" }, "401": respuestaError },
      },
    },
    "/auth/me/contrasena": {
      patch: {
        tags: ["Auth"],
        summary: "Cambiar la propia contraseña",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["passwordActual", "passwordNueva", "confirmPassword"],
                properties: {
                  passwordActual: { type: "string" },
                  passwordNueva: { type: "string", minLength: 8 },
                  confirmPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Contraseña actualizada" }, "400": respuestaError },
      },
    },
    "/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "Listar usuarios",
        description: "Requiere el permiso `usuarios.consultar`.",
        security: bearerAuth,
        parameters: paramsPagina,
        responses: { "200": { description: "Usuarios obtenidos" }, "403": respuestaError },
      },
    },
    "/auth/users/{id}": {
      get: {
        tags: ["Auth"],
        summary: "Obtener un usuario",
        description: "Requiere `usuarios.consultar`, o que el `id` sea el propio usuario autenticado.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Usuario obtenido" }, "403": respuestaError, "404": respuestaError },
      },
      put: {
        tags: ["Auth"],
        summary: "Actualizar un usuario",
        description: "Requiere `usuarios.actualizar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Usuario actualizado" }, "403": respuestaError },
      },
    },
    "/auth/users/{id}/disable": {
      patch: {
        tags: ["Auth"],
        summary: "Habilitar / deshabilitar un usuario (toggle)",
        description: "Requiere `usuarios.deshabilitar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Usuario actualizado" }, "403": respuestaError },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar un usuario",
        description: "Requiere `usuarios.crear`. Acepta `rolIds` (arreglo, multi-rol) o `rolId` singular.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "email", "password", "confirmPassword", "rolIds"],
                properties: {
                  nombre: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  confirmPassword: { type: "string" },
                  rolIds: { type: "array", items: { type: "integer" } },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Registro correcto" }, "400": respuestaError, "403": respuestaError },
      },
    },
    "/rol/permisos": {
      get: {
        tags: ["Roles"],
        summary: "Catálogo de permisos agrupado por módulo",
        description: "Requiere `roles.consultar`.",
        security: bearerAuth,
        responses: { "200": { description: "Permisos obtenidos" }, "403": respuestaError },
      },
    },
    "/rol/roles": {
      get: {
        tags: ["Roles"],
        summary: "Listar roles con sus permisos",
        description: "Requiere `roles.consultar`.",
        security: bearerAuth,
        parameters: paramsPagina,
        responses: { "200": { description: "Roles obtenidos" }, "403": respuestaError },
      },
      post: {
        tags: ["Roles"],
        summary: "Crear un rol con permisos",
        description: "Requiere `roles.crear`.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "descripcion", "permisos"],
                properties: {
                  nombre: { type: "string" },
                  descripcion: { type: "string" },
                  permisos: { type: "array", items: { type: "string" }, description: "Códigos de permiso, ej: recursos.consultar" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Rol creado" }, "403": respuestaError },
      },
    },
    "/rol/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Obtener un rol con sus permisos",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Rol obtenido" }, "404": respuestaError },
      },
      put: {
        tags: ["Roles"],
        summary: "Actualizar un rol y sus permisos",
        description: "Requiere `roles.actualizar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Rol actualizado" }, "403": respuestaError },
      },
    },
    "/rol/roles/{id}/disable": {
      patch: {
        tags: ["Roles"],
        summary: "Activar / inhabilitar un rol (toggle)",
        description: "Requiere `roles.inhabilitar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Rol actualizado" }, "403": respuestaError },
      },
    },
    "/recuperacion/solicitar": {
      post: {
        tags: ["Recuperacion"],
        summary: "Solicitar recuperación de contraseña",
        description: "Público. Envía un correo con el token si el email existe (siempre responde el mismo mensaje genérico).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "html"],
                properties: {
                  email: { type: "string", format: "email" },
                  html: { type: "string", description: "Plantilla HTML del correo (usa placeholders {{token}}, {{link}}, etc.)" },
                  subject: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Solicitud procesada" } },
      },
    },
    "/recuperacion/restablecer": {
      post: {
        tags: ["Recuperacion"],
        summary: "Restablecer contraseña con token",
        description: "Público.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "nuevaContrasena"],
                properties: {
                  token: { type: "string" },
                  nuevaContrasena: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Contraseña restablecida" }, "400": respuestaError },
      },
    },
    "/sistema/health": {
      get: {
        tags: ["Sistema"],
        summary: "Healthcheck",
        description: "Público. Verifica que la API y la base de datos estén activas.",
        responses: { "200": { description: "Servicio activo" } },
      },
    },
    "/recursos": {
      get: {
        tags: ["Recursos"],
        summary: "Listar recursos",
        description: "Requiere `recursos.consultar`.",
        security: bearerAuth,
        parameters: paramsPagina,
        responses: { "200": { description: "Recursos obtenidos" }, "403": respuestaError },
      },
      post: {
        tags: ["Recursos"],
        summary: "Crear un recurso",
        description: "Requiere `recursos.crear`.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre"],
                properties: { nombre: { type: "string" }, descripcion: { type: "string" } },
              },
            },
          },
        },
        responses: { "201": { description: "Recurso creado" }, "403": respuestaError },
      },
    },
    "/recursos/{id}": {
      get: {
        tags: ["Recursos"],
        summary: "Obtener un recurso",
        description: "Requiere `recursos.consultar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Recurso obtenido" }, "404": respuestaError },
      },
      put: {
        tags: ["Recursos"],
        summary: "Actualizar un recurso",
        description: "Requiere `recursos.actualizar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Recurso actualizado" }, "403": respuestaError },
      },
    },
    "/recursos/{id}/disable": {
      patch: {
        tags: ["Recursos"],
        summary: "Activar / inhabilitar un recurso (toggle)",
        description: "Requiere `recursos.deshabilitar`.",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Recurso actualizado" }, "403": respuestaError },
      },
    },
  },
};
