import { registerOTel } from "@vercel/otel";
import type { Logger } from "pino";

declare global {
  // eslint-disable-next-line no-var
  var logger: Logger | undefined;
}

export async function register() {
  // 1. Register OpenTelemetry (keep this!)
  registerOTel({
    serviceName: "crm-app",
  });

  // 2. Only initialize Pino on the Node runtime
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const pino = (await import("pino")).default;
  const pinoLoki = (await import("pino-loki")).default;

  const stream = pinoLoki({
    host: process.env.GRAFANA_LOKI_HOST!,
    basicAuth: {
      username: process.env.GRAFANA_LOKI_USERNAME!,
      password: process.env.GRAFANA_LOKI_PASSWORD!,
    },
    batching: {
      interval: 5,
    },
    labels: {
      app: "crm",
      environment: process.env.NODE_ENV,
    },
  });

  globalThis.logger = pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
      base: {
        service: "crm-app",
      },
    },
    stream
  );
}