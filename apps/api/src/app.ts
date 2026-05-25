import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { setupExpressErrorHandler } from "./lib/sentry.js";
import { logger } from "./lib/logger";

const app = express();

app.use(helmet());
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Setup Sentry error handler only if SENTRY_DSN is configured.
// The implementation dynamically imports `@sentry/node` to avoid
// pulling optional OpenTelemetry instrumentations at startup.
setupExpressErrorHandler(app);

export default app;
