export async function initSentry() {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) return;

  const Sentry = await import("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env["NODE_ENV"] ?? "production",
    tracesSampleRate: 0.2,
  });
}

export async function setupExpressErrorHandler(app: any) {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) return;
  const Sentry = await import("@sentry/node");
  if (typeof Sentry.setupExpressErrorHandler === "function") {
    // Some Sentry versions ship helpers
    (Sentry as any).setupExpressErrorHandler(app);
  } else if (Sentry.Handlers && typeof Sentry.Handlers.errorHandler === "function") {
    app.use(Sentry.Handlers.errorHandler());
  }
}
