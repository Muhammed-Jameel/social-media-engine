import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

const secretKeyPattern = /(authorization|cookie|token|secret|password|api[-_]?key|credential|signed[-_]?url)/i;
const secretValuePatterns = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bAIza[A-Za-z0-9_-]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
];

export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    return secretValuePatterns.reduce((current, pattern) => current.replace(pattern, "[REDACTED]"), value);
  }
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, secretKeyPattern.test(key) ? "[REDACTED]" : redact(entry, seen)]),
  );
}

export function createTraceId(): string {
  return randomUUID();
}

export function createLogger(context: Record<string, unknown> = {}) {
  function write(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    const entry = redact({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...data,
    });
    const serialized = JSON.stringify(entry);
    if (level === "error") console.error(serialized);
    else if (level === "warn") console.warn(serialized);
    else console.log(serialized);
  }

  return {
    debug: (message: string, data?: Record<string, unknown>) => write("debug", message, data),
    info: (message: string, data?: Record<string, unknown>) => write("info", message, data),
    warn: (message: string, data?: Record<string, unknown>) => write("warn", message, data),
    error: (message: string, data?: Record<string, unknown>) => write("error", message, data),
    child: (childContext: Record<string, unknown>) => createLogger({ ...context, ...childContext }),
  };
}

