const SENSITIVE_KEYS = [
  "passwordhash",
  "password",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "sessionversion",
  "session_secret",
  "sessionsecret",
  "token",
  "secret",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_-]/g, "");
  return SENSITIVE_KEYS.some((sensitive) =>
    normalized.includes(sensitive.replace(/[_-]/g, "")),
  );
}

export function sanitizeAuditData<T>(data: T): T | null {
  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item)) as unknown as T;
  }

  if (data instanceof Date) {
    return data;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        continue;
      }

      result[key] = sanitizeAuditData(value);
    }

    return result as unknown as T;
  }

  return data;
}
