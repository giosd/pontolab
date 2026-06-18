import { hashPassword, type SessionUser } from "@/lib/auth";
import {
  canCreateUserWithRole,
  canManageUser,
  scopeUserWhere,
} from "@/lib/access-scope";
import {
  createDefaultModulesForRole,
  updateUserModules,
} from "@/lib/services/module-permissions";
import { prisma } from "@/lib/prisma";
import type { AppModuleKey } from "@/lib/modules";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "@/lib/validations";
import type { User } from "@/types";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  teamId: true,
  team: { select: { id: true, name: true } },
} as const;

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  teamId: string | null;
  team: { id: string; name: string } | null;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt,
    teamId: row.teamId,
    teamName: row.team?.name ?? null,
  };
}

export class ScopeError extends Error {}

export async function getUsers(session?: SessionUser): Promise<User[]> {
  const where = session ? scopeUserWhere(session) : {};

  const rows = await prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { name: "asc" },
  });

  return rows.map(mapUser);
}

/** Usuários atribuíveis como destino de importação/filtros, conforme escopo. */
export async function getScopedUsers(session: SessionUser): Promise<User[]> {
  return getUsers(session);
}

function resolveTeamForWrite(
  session: SessionUser,
  requestedTeamId: string | null | undefined,
): string | null {
  // Gestor só pode operar dentro da própria equipe.
  if (session.role === "GESTOR") {
    return session.teamId ?? null;
  }

  // Admin escolhe a equipe (ou nenhuma).
  return requestedTeamId ?? null;
}

export async function createUser(
  data: CreateUserFormData & { teamId?: string | null },
  session: SessionUser,
): Promise<User> {
  const parsed = createUserSchema.parse(data);

  if (!canCreateUserWithRole(session, parsed.role)) {
    throw new ScopeError("Sem permissão para criar usuário com este perfil.");
  }

  const teamId = resolveTeamForWrite(session, data.teamId ?? null);

  if (session.role === "GESTOR" && !teamId) {
    throw new ScopeError("Gestor sem equipe não pode criar usuários.");
  }

  const passwordHash = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
      passwordHash,
      role: parsed.role,
      active: parsed.active ?? true,
      teamId,
      createdById: session.userId,
    },
    select: userSelect,
  });

  if (user.role !== "ADMIN") {
    const modules = parsed.modules as AppModuleKey[] | undefined;

    if (modules) {
      await updateUserModules(user.id, modules);
    } else {
      await createDefaultModulesForRole(user.id, user.role);
    }
  }

  return mapUser(user);
}

export async function updateUser(
  id: string,
  data: UpdateUserFormData & { teamId?: string | null },
  session: SessionUser,
): Promise<User> {
  const parsed = updateUserSchema.parse(data);

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, teamId: true },
  });

  if (!target) {
    throw new ScopeError("Usuário não encontrado.");
  }

  if (!canManageUser(session, target)) {
    throw new ScopeError("Sem permissão para editar este usuário.");
  }

  // Mudança de papel precisa ser permitida ao editor.
  if (parsed.role !== target.role && !canCreateUserWithRole(session, parsed.role)) {
    throw new ScopeError("Sem permissão para atribuir este perfil.");
  }

  // Gestor nunca rebaixa/eleva para ADMIN nem move de equipe.
  if (session.role === "GESTOR" && parsed.role === "ADMIN") {
    throw new ScopeError("Gestor não pode atribuir o perfil de administrador.");
  }

  const teamId =
    session.role === "GESTOR"
      ? (session.teamId ?? null)
      : (data.teamId !== undefined ? data.teamId : target.teamId);

  const password = parsed.password?.trim();

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
      role: parsed.role,
      active: parsed.active ?? true,
      teamId,
      ...(password
        ? {
            passwordHash: await hashPassword(password),
            sessionVersion: { increment: 1 },
          }
        : {}),
    },
    select: userSelect,
  });

  if (user.role !== "ADMIN" && parsed.modules) {
    await updateUserModules(id, parsed.modules as AppModuleKey[], {
      editorUserId: session.userId,
      editorRole: session.role,
    });
  }

  return mapUser(user);
}

export async function deactivateUser(
  id: string,
  session: SessionUser,
): Promise<User> {
  if (id === session.userId) {
    throw new Error("Não é possível inativar o próprio usuário.");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, teamId: true },
  });

  if (!target) {
    throw new ScopeError("Usuário não encontrado.");
  }

  if (!canManageUser(session, target)) {
    throw new ScopeError("Sem permissão para inativar este usuário.");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      active: false,
      sessionVersion: { increment: 1 },
    },
    select: userSelect,
  });

  return mapUser(user);
}

export async function getUserForEdit(
  id: string,
  session: SessionUser,
): Promise<User | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!row) {
    return null;
  }

  if (!canManageUser(session, row)) {
    throw new ScopeError("Sem permissão para acessar este usuário.");
  }

  return mapUser(row);
}
