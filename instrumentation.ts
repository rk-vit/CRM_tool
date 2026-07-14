import { registerOTel } from "@vercel/otel";
import type { Logger } from "pino";

declare global {
  // eslint-disable-next-line no-var
  var logger: Logger | undefined;
}




export async function register() {
 const hasLoki =
    !!process.env.GRAFANA_LOKI_HOST &&
    !!process.env.GRAFANA_LOKI_USERNAME &&
    !!process.env.GRAFANA_LOKI_PASSWORD;  
    
  const hasOtel = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&  
                  !!process.env.OTEL_EXPORTER_OTLP_HEADERS;


  // 1. Register OpenTelemetry for traces
  if(hasOtel) {
    console.log("In Prod environment,Registering OTEL");
    registerOTel({
    serviceName: "crm-app",
    });
  }


  // 2. Registering Pini - Loki for Logs from production environment
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const pino = (await import("pino")).default;
  const pinoLoki = (await import("pino-loki")).default;

  if (!hasLoki) {
    console.log("Running with local console logging");
    globalThis.logger = pino({
      level: process.env.LOG_LEVEL ?? "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
    return;
  }

  console.log("In Prod environment,Registering Grafana Loki logger");
  const stream = pinoLoki({
    host: process.env.GRAFANA_LOKI_HOST!,
    basicAuth: {
      username: process.env.GRAFANA_LOKI_USERNAME!,
      password: process.env.GRAFANA_LOKI_PASSWORD!,
    },
    batching:false,
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