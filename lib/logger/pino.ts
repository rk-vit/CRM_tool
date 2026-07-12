import pino from "pino";

export const logger =
  globalThis.logger ??
  pino({
    level: process.env.LOG_LEVEL ?? "info",
  });