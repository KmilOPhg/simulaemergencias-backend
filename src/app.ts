import express from "express";
import router from "./routes/index.routes";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";

// Crear una instancia de Express
const app = express();

// Middleware para registrar las solicitudes HTTP
app.use(morgan("combined"));

const normalizarOrigen = (valor?: string) => (valor || "").replace(/\/$/, "").toLowerCase();

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]
    .filter(Boolean)
    .map((origen) => normalizarOrigen(origen as string))
);

// Habilitar CORS para permitir solicitudes desde el frontend
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permite requests sin Origin (ej: Postman, apps móviles, curl)
    if (!origin) {
      return callback(null, true);
    }

    const originNormalizado = normalizarOrigen(origin);
    if (allowedOrigins.has(originNormalizado)) {
      return callback(null, true);
    }

    // En desarrollo, permitir cualquier IP de red local en el puerto del frontend
    if (
      process.env.NODE_ENV !== "production" &&
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/.test(originNormalizado)
    ) {
      return callback(null, true);
    }

    return callback(new Error("No permitido por CORS"));
  },
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// JSON: el default de express (~100kb) puede romper cargas grandes. Ajustable por env.
export const jsonBodyLimit = process.env.BODY_JSON_LIMIT ?? "50mb";
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

// Documentacion OpenAPI (Swagger UI)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerDocument);
});

// Todo lo que empiece por /api va al archivo routes/index.routes.ts
app.use("/api", router);

app.use(errorMiddleware);

export default app;
