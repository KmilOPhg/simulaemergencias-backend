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
      "API de SimulaEmergencias para Ágape School. Incluye autenticación JWT, roles y permisos, el listado de estudiantes (HU-01), el registro de ejercicios de emergencia (HU-04) y la verificación de estudiantes durante un ejercicio (HU-07). Los datos de estudiantes sembrados son ficticios.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Auth", description: "Autenticación, usuarios y sesión" },
    { name: "Roles", description: "Roles y catálogo de permisos" },
    { name: "Recuperacion", description: "Recuperación de contraseña por correo" },
    { name: "Sistema", description: "Monitoreo / healthcheck" },
    { name: "Recursos", description: "Módulo de ejemplo (CRUD)" },
    { name: "Estudiantes", description: "HU-01. Listado de estudiantes de la institución" },
    { name: "Ejercicios", description: "HU-04. Registro de ejercicios de emergencia" },
    { name: "Verificaciones", description: "HU-07. Verificación de estudiantes durante un ejercicio" },
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
      GrupoResumen: {
        type: "object",
        properties: {
          id: { type: "integer" },
          codigo: { type: "string", example: "5A" },
          nombre: { type: "string", example: "Quinto A" },
        },
      },
      EstudianteListado: {
        type: "object",
        description: "Campos aprobados para identificar a un participante. No incluye datos personales adicionales.",
        properties: {
          id: { type: "integer" },
          codigoUnico: { type: "string", example: "AGP-5001" },
          nombres: { type: "string", example: "Camila" },
          apellidos: { type: "string", example: "Restrepo Gil" },
          grupo: { $ref: "#/components/schemas/GrupoResumen" },
        },
      },
      TipoEscenario: {
        type: "string",
        enum: ["SISMO", "INCENDIO", "INTRUSO"],
        description: "Escenarios aprobados para el ejercicio: sismo, incendio e intruso.",
      },
      EjercicioEmergencia: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string", example: "Simulacro de sismo — bloque primaria" },
          fecha: { type: "string", format: "date", example: "2026-10-26" },
          horaInicio: { type: "string", nullable: true, example: "09:30", description: "Hora local HH:mm. No cambia el día guardado en fecha." },
          tipoEscenario: { $ref: "#/components/schemas/TipoEscenario" },
          lugar: { type: "string", nullable: true, example: "Sede principal" },
          descripcion: { type: "string", nullable: true },
          creadoEn: { type: "string", format: "date-time" },
          registradoPor: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
            },
          },
        },
      },
      VerificacionEstudiante: {
        type: "object",
        description:
          "Un registro VERIFICADO significa que el responsable autorizado registró el chequeo de ese estudiante en el ejercicio. No indica por sí mismo presencia o ausencia física. El estado pendiente no se almacena: es la ausencia de este registro y no debe interpretarse como inasistencia.",
        properties: {
          id: { type: "integer" },
          estado: { type: "string", enum: ["VERIFICADO"] },
          observacion: { type: "string", nullable: true },
          verificadoEn: { type: "string", format: "date-time" },
          estudiante: {
            type: "object",
            properties: {
              id: { type: "integer" },
              codigoUnico: { type: "string" },
              nombres: { type: "string" },
              apellidos: { type: "string" },
            },
          },
          grupo: { $ref: "#/components/schemas/GrupoResumen" },
          ejercicio: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
              fecha: { type: "string", format: "date" },
              tipoEscenario: { $ref: "#/components/schemas/TipoEscenario" },
            },
          },
          registradoPor: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
            },
          },
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
    "/estudiantes": {
      get: {
        tags: ["Estudiantes"],
        summary: "HU-01. Consultar el listado de estudiantes",
        description:
          "Requiere `estudiantes.consultar`. Devuelve solo estudiantes activos, ordenados por apellido y nombre. Cada registro incluye el código único, los nombres y el grupo. No expone documento, contacto ni otros datos personales. El rol operativo `user` y el rol `admin` tienen este permiso.",
        security: bearerAuth,
        parameters: paramsPagina,
        responses: {
          "200": {
            description: "Listado obtenido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    msg: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        datos: { type: "array", items: { $ref: "#/components/schemas/EstudianteListado" } },
                        total: { type: "integer" },
                        pagina: { type: "integer" },
                        limite: { type: "integer" },
                        totalPaginas: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": respuestaError,
          "403": respuestaError,
        },
      },
    },
    "/ejercicios": {
      post: {
        tags: ["Ejercicios"],
        summary: "HU-04. Registrar un ejercicio de emergencia",
        description:
          "Requiere `ejercicios.crear`. Guarda la actividad cuyos resultados se van a gestionar. Los escenarios permitidos son SISMO, INCENDIO e INTRUSO. El responsable se toma del token y no se envía en el cuerpo.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "fecha", "tipoEscenario"],
                properties: {
                  nombre: { type: "string", minLength: 3, maxLength: 150, example: "Simulacro de sismo — bloque primaria" },
                  fecha: { type: "string", format: "date", example: "2026-10-26", description: "Día del ejercicio, formato AAAA-MM-DD." },
                  tipoEscenario: { $ref: "#/components/schemas/TipoEscenario" },
                  horaInicio: { type: "string", example: "09:30", description: "Opcional. Formato HH:mm de 24 horas." },
                  lugar: { type: "string", maxLength: 200, example: "Sede principal" },
                  descripcion: { type: "string", maxLength: 2000 },
                },
              },
              examples: {
                sismo: {
                  summary: "Sismo",
                  value: {
                    nombre: "Simulacro de sismo — bloque primaria",
                    fecha: "2026-10-26",
                    horaInicio: "09:30",
                    tipoEscenario: "SISMO",
                    lugar: "Sede principal",
                    descripcion: "Evacuación hacia el punto de encuentro del patio central.",
                  },
                },
                incendio: {
                  summary: "Incendio",
                  value: { nombre: "Simulacro de incendio", fecha: "2026-11-04", tipoEscenario: "INCENDIO" },
                },
                intruso: {
                  summary: "Intruso",
                  value: { nombre: "Simulacro de intruso", fecha: "2026-11-18", tipoEscenario: "INTRUSO" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Ejercicio registrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    msg: { type: "string" },
                    data: { $ref: "#/components/schemas/EjercicioEmergencia" },
                  },
                },
              },
            },
          },
          "400": respuestaError,
          "401": respuestaError,
          "403": respuestaError,
        },
      },
    },
    "/ejercicios/{ejercicioId}/verificaciones": {
      post: {
        tags: ["Verificaciones"],
        summary: "HU-07. Registrar la verificación de un estudiante",
        description:
          "Requiere `verificaciones.registrar`. Asocia la verificación al estudiante, a su grupo y al ejercicio. El grupo enviado debe coincidir con el grupo del estudiante. No se permite una segunda verificación del mismo estudiante en el mismo ejercicio (409). El resultado queda en estado VERIFICADO. Un estudiante sin este registro está pendiente de verificación; pendiente no se guarda como fila y no significa que el estudiante esté ausente.",
        security: bearerAuth,
        parameters: [
          { name: "ejercicioId", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estudianteId", "grupoId"],
                properties: {
                  estudianteId: { type: "integer", minimum: 1, example: 1 },
                  grupoId: { type: "integer", minimum: 1, example: 1, description: "Debe ser el grupo al que pertenece el estudiante." },
                  observacion: { type: "string", maxLength: 500, description: "Nota opcional del responsable. No clasifica asistencia." },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Verificación registrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    msg: { type: "string" },
                    data: { $ref: "#/components/schemas/VerificacionEstudiante" },
                  },
                },
              },
            },
          },
          "400": respuestaError,
          "401": respuestaError,
          "403": respuestaError,
          "404": respuestaError,
          "409": respuestaError,
        },
      },
    },
  },
};
