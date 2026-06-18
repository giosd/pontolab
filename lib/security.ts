import type { UserRole } from "@/lib/constants";

const DEFAULT_SESSION_SECRET = "troque-essa-chave-em-producao";

type UserWithSensitiveFields = {
  passwordHash?: string | null;
  sessionVersion?: number;
};

export function generateSessionSecretCheck(): void {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    console.warn(
      "[PontoLab] SESSION_SECRET não configurada. Defina uma chave segura no .env.",
    );
    return;
  }

  if (secret === DEFAULT_SESSION_SECRET) {
    console.warn(
      "[PontoLab] SESSION_SECRET está com valor padrão. Troque em produção.",
    );
  }
}

export function safeUser<T extends UserWithSensitiveFields>(
  user: T,
): Omit<T, "passwordHash" | "sessionVersion"> {
  const { passwordHash: _passwordHash, sessionVersion: _sessionVersion, ...safe } =
    user;

  return safe;
}

export function assertSameUserOrAdmin(
  targetUserId: string,
  currentUser: { userId: string; role: UserRole },
): void {
  if (currentUser.role !== "ADMIN" && currentUser.userId !== targetUserId) {
    throw new Error("Você não tem permissão para esta ação.");
  }
}
