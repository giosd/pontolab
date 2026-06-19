export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos até a janela reiniciar (apenas quando bloqueado). */
  retryAfterSeconds: number;
  limit: number;
}

interface RateLimitConfig {
  enabled: boolean;
  max: number;
  windowMs: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

/** Store em memória (fallback). Persiste por instância do processo. */
const memoryStore = new Map<string, WindowState>();

export function getRateLimitConfig(): RateLimitConfig {
  const enabled = (process.env.RATE_LIMIT_ENABLED ?? "true") !== "false";
  const max = Number.parseInt(process.env.RATE_LIMIT_MAX ?? "5", 10);
  const windowSeconds = Number.parseInt(
    process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600",
    10,
  );

  return {
    enabled,
    max: Number.isFinite(max) && max > 0 ? max : 5,
    windowMs:
      (Number.isFinite(windowSeconds) && windowSeconds > 0
        ? windowSeconds
        : 600) * 1000,
  };
}

/**
 * Avalia a janela em memória de forma pura (testável).
 * Conta a tentativa atual e retorna o resultado.
 */
export function evaluateMemory(
  store: Map<string, WindowState>,
  key: string,
  now: number,
  max: number,
  windowMs: number,
): RateLimitResult {
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0, limit: max };
  }

  if (current.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      limit: max,
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, max - current.count),
    retryAfterSeconds: 0,
    limit: max,
  };
}

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/**
 * Rate limit via Upstash Redis REST (opcional). Best-effort: em caso de
 * qualquer falha, retorna null para que o chamador use o fallback em memória.
 */
async function evaluateUpstash(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSeconds = Math.ceil(windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  try {
    // INCR e, se for a primeira ocorrência, define expiração da janela.
    const pipeline = [
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSeconds), "NX"],
      ["TTL", redisKey],
    ];

    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 0);
    const ttl = Number(data[2]?.result ?? windowSeconds);

    if (count > max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : windowSeconds),
        limit: max,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, max - count),
      retryAfterSeconds: 0,
      limit: max,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica e contabiliza uma tentativa para a chave informada.
 * Usa Upstash se configurado; caso contrário, store em memória.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const config = getRateLimitConfig();

  if (!config.enabled) {
    return {
      allowed: true,
      remaining: config.max,
      retryAfterSeconds: 0,
      limit: config.max,
    };
  }

  if (isUpstashConfigured()) {
    const result = await evaluateUpstash(key, config.max, config.windowMs);
    if (result) return result;
  }

  return evaluateMemory(memoryStore, key, Date.now(), config.max, config.windowMs);
}

/**
 * Extrai o IP do cliente a partir dos headers (compatível com Vercel/proxies).
 * Retorna "unknown" quando não for possível determinar.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/** Limpa o store em memória (uso em testes). */
export function __resetMemoryStore() {
  memoryStore.clear();
}
