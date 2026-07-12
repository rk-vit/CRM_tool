import pino from "pino";
import { logger } from "./pino";

type LogLevel = "info" | "warn" | "error";

type ApiLogContext = {
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  requestId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  error?: unknown;
};



function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

function emit(level: LogLevel, event: string, context: ApiLogContext) {
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    method: context.method,
    path: context.path,
    status: context.status,
    durationMs: context.durationMs,
    requestId: context.requestId,
    userId: context.userId,
    details: context.details,
    error: context.error ? normalizeError(context.error) : undefined,
  };

  if (level === "error") {
    logger.error(payload, event);
  } else if (level === "warn") {
    logger.warn(payload, event);
  } else {
    logger.info(payload, event);
  }
}

export function createApiLogger(request: Request, routePath?: string) {
  const url = new URL(request.url);
  const method = request.method;
  const path = routePath ?? url.pathname;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const startedAt = Date.now();

  return {
    start(details?: Record<string, unknown>) {
      emit("info", "api_request_started", {
        method,
        path,
        requestId,
        details,
      });
    },
    success(status: number, details?: Record<string, unknown>) {
      emit("info", "api_request_completed", {
        method,
        path,
        requestId,
        status,
        durationMs: Date.now() - startedAt,
        details,
      });
    },
    warn(status: number, details?: Record<string, unknown>) {
      emit("warn", "api_request_warned", {
        method,
        path,
        requestId,
        status,
        durationMs: Date.now() - startedAt,
        details,
      });
    },
    error(error: unknown, status = 500, details?: Record<string, unknown>) {
      emit("error", "api_request_failed", {
        method,
        path,
        requestId,
        status,
        durationMs: Date.now() - startedAt,
        details,
        error,
      });
    },
  };
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
