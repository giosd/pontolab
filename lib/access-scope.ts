import type { SessionUser } from "@/lib/auth";
import type { UserRole } from "@/lib/constants";

export type AccessScope = "ALL" | "TEAM" | "SELF";

export interface ScopedUser {
  id: string;
  role: string;
  teamId: string | null;
}

export interface ScopedEntryOwner {
  id: string;
  teamId: string | null;
}

export function getUserScope(user: Pick<SessionUser, "role">): AccessScope {
  if (user.role === "ADMIN") {
    return "ALL";
  }

  if (user.role === "GESTOR") {
    return "TEAM";
  }

  return "SELF";
}

/** Gestor só tem escopo de equipe se possuir teamId definido. */
function managerHasTeam(user: Pick<SessionUser, "teamId">): boolean {
  return Boolean(user.teamId);
}

export function canViewUser(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
  target: ScopedUser,
): boolean {
  switch (getUserScope(current)) {
    case "ALL":
      return true;
    case "TEAM":
      return managerHasTeam(current) && target.teamId === current.teamId;
    default:
      return target.id === current.userId;
  }
}

export function canManageUser(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
  target: ScopedUser,
): boolean {
  if (current.role === "ADMIN") {
    return true;
  }

  if (current.role === "GESTOR") {
    // Gestor não gerencia ADMIN e só gerencia membros da própria equipe.
    return (
      managerHasTeam(current) &&
      target.role !== "ADMIN" &&
      target.teamId === current.teamId
    );
  }

  return false;
}

export function canCreateUserWithRole(
  current: Pick<SessionUser, "role" | "teamId">,
  role: string,
): boolean {
  if (current.role === "ADMIN") {
    return role === "ADMIN" || role === "GESTOR" || role === "USER";
  }

  if (current.role === "GESTOR") {
    return managerHasTeam(current) && (role === "GESTOR" || role === "USER");
  }

  return false;
}

export function canViewTimeEntry(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
  owner: ScopedEntryOwner,
): boolean {
  switch (getUserScope(current)) {
    case "ALL":
      return true;
    case "TEAM":
      return managerHasTeam(current) && owner.teamId === current.teamId;
    default:
      return owner.id === current.userId;
  }
}

export function canApproveTimeEntry(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
  owner: ScopedEntryOwner,
): boolean {
  if (current.role === "ADMIN") {
    return true;
  }

  if (current.role === "GESTOR") {
    return managerHasTeam(current) && owner.teamId === current.teamId;
  }

  return false;
}

export function canManageTeam(
  current: Pick<SessionUser, "role">,
  _teamId?: string,
): boolean {
  void _teamId;
  return current.role === "ADMIN";
}

export function allowedRolesForCreator(role: UserRole): UserRole[] {
  if (role === "ADMIN") {
    return ["ADMIN", "GESTOR", "USER"];
  }

  if (role === "GESTOR") {
    return ["GESTOR", "USER"];
  }

  return [];
}

/**
 * Filtro Prisma (UserWhereInput) para listar usuários conforme o escopo.
 * Gestor sem equipe não enxerga ninguém além de si mesmo.
 */
export function scopeUserWhere(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
): Record<string, unknown> {
  if (current.role === "ADMIN") {
    return {};
  }

  if (current.role === "GESTOR" && current.teamId) {
    return { teamId: current.teamId };
  }

  return { id: current.userId };
}

/**
 * Fragmento de where para TimeEntry conforme escopo.
 * `requestedUserId` (opcional) aplica filtro adicional por usuário,
 * sempre respeitando o escopo de equipe/self.
 */
export function scopeTimeEntryWhere(
  current: Pick<SessionUser, "userId" | "role" | "teamId">,
  requestedUserId?: string,
): Record<string, unknown> {
  if (current.role === "ADMIN") {
    return requestedUserId ? { userId: requestedUserId } : {};
  }

  if (current.role === "GESTOR" && current.teamId) {
    return {
      user: { teamId: current.teamId },
      ...(requestedUserId ? { userId: requestedUserId } : {}),
    };
  }

  return { userId: current.userId };
}
