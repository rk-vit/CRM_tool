import "pino-loki";
import pino from "pino";

const enableGrafanaLogs = process.env.ENABLE_GRAFANA_LOGS === "true";
const isProduction = process.env.NODE_ENV === "production";
const shouldSendToLoki = enableGrafanaLogs || isProduction;
const rawLokiHost =
  process.env.GRAFANA_LOKI_HOST ?? process.env.GRAFANA_LOKI_URL ?? "";
const lokiHost = rawLokiHost.replace(/\/loki\/api\/v1\/push\/?$/, "");

const transport =
  shouldSendToLoki && lokiHost
    ? pino.transport({
        target: "pino-loki",
        options: {
          host: lokiHost,
          basicAuth: {
            username: process.env.GRAFANA_LOKI_USERNAME,
            password: process.env.GRAFANA_LOKI_PASSWORD,
          },
          labels: {
            job: "crm",
            environment: process.env.NODE_ENV,
          },
          batching: false,
          silenceErrors: false,
        },
      })
    : undefined;

transport?.on("error", (err: Error) => {
  console.error("Loki transport error:", err);
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      service: "crm",
    },
  },
  transport
);
