type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Chaves que nunca devem ser registradas em log. */
const REDACTED_KEYS = [
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "cookie",
  "authorization",
  "secret",
  "sessionsecret",
  "database_url",
  "databaseurl",
  "connectionstring",
];

const REDACTED_VALUE = "[REDACTED]";
const MAX_DEPTH = 4;

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

/** Remove recursivamente valores de chaves sensíveis. Exportado para testes. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return "[TRUNCATED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (REDACTED_KEYS.includes(key.toLowerCase())) {
        output[key] = REDACTED_VALUE;
      } else {
        output[key] = redact(val, depth + 1);
      }
    }
    return output;
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  return value;
}

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

function normalize(
  payload: string | LogPayload,
): LogPayload {
  if (typeof payload === "string") {
    return { message: payload };
  }
  return payload;
}

function emit(level: LogLevel, payload: string | LogPayload) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[resolveLevel()]) {
    return;
  }

  const { message, context, meta } = normalize(payload);
  const timestamp = new Date().toISOString();

  const record = {
    level,
    message,
    timestamp,
    context: (redact(context ?? {}) as Record<string, unknown>),
    meta: (redact(meta ?? {}) as Record<string, unknown>),
  };

  const isProduction = process.env.NODE_ENV === "production";
  const writer =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  if (isProduction) {
    writer(JSON.stringify(record));
    return;
  }

  const hasContext = Object.keys(record.context).length > 0;
  const hasMeta = Object.keys(record.meta).length > 0;
  const extras: Record<string, unknown> = {};
  if (hasContext) extras.context = record.context;
  if (hasMeta) extras.meta = record.meta;

  writer(
    `[${timestamp}] ${level.toUpperCase()} ${message}`,
    Object.keys(extras).length > 0 ? extras : "",
  );
}

export const logger = {
  debug: (payload: string | LogPayload) => emit("debug", payload),
  info: (payload: string | LogPayload) => emit("info", payload),
  warn: (payload: string | LogPayload) => emit("warn", payload),
  error: (payload: string | LogPayload) => emit("error", payload),
};
