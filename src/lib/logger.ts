// Structured logger for API routes
// Outputs JSON-formatted logs for Vercel's log drain / monitoring

interface LogContext {
  route: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

export function logInfo(message: string, ctx: LogContext) {
  console.log(JSON.stringify({
    level: "info",
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  }));
}

export function logError(message: string, error: unknown, ctx: LogContext) {
  console.error(JSON.stringify({
    level: "error",
    message,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 3).join(" | ") } : String(error),
    timestamp: new Date().toISOString(),
    ...ctx,
  }));
}

export function logWarn(message: string, ctx: LogContext) {
  console.warn(JSON.stringify({
    level: "warn",
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  }));
}
