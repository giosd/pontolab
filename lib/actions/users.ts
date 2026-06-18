"use server";

import { revalidatePath } from "next/cache";

import { requireAdminOrManager } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/constants";
import {
  createAuditLog,
  logCreate,
  logManagerCreate,
  logModulePermissionUpdate,
  logScopeDenied,
  logUpdate,
} from "@/lib/services/audit.service";
import { getUserModules } from "@/lib/services/module-permissions";
import {
  ScopeError,
  createUser,
  deactivateUser,
  updateUser,
} from "@/lib/services/users";
import { canManageUser } from "@/lib/access-scope";
import { createNotification } from "@/lib/services/notification.service";
import { NOTIFICATION_TYPES } from "@/lib/notifications/constants";
import { prisma } from "@/lib/prisma";
import type { CreateUserFormData, UpdateUserFormData } from "@/lib/validations";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  teamId: true,
} as const;

function actorFrom(currentUser: {
  userId: string;
  name: string;
  email: string;
}) {
  return {
    id: currentUser.userId,
    name: currentUser.name,
    email: currentUser.email,
  };
}

export async function getUserModulesAction(userId: string) {
  const session = await requireAdminOrManager();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });

  if (!target || !canManageUser(session, target)) {
    throw new ScopeError("Sem permissão para acessar este usuário.");
  }

  return getUserModules(userId);
}

export async function createUserAction(
  data: CreateUserFormData & { teamId?: string | null },
) {
  let currentUser;
  try {
    currentUser = await requireAdminOrManager();
    const user = await createUser(data, currentUser);
    revalidatePath("/usuarios");
    revalidatePath("/registros");

    await logCreate(AUDIT_ENTITIES.USER, {
      entityId: user.id,
      description: `Usuário ${user.name} criado.`,
      newData: user,
      user: actorFrom(currentUser),
    });

    if (user.role === "GESTOR") {
      await logManagerCreate({
        entityId: user.id,
        description: `Gestor ${user.name} criado.`,
        newData: { teamId: user.teamId },
        user: actorFrom(currentUser),
      });
    }

    if (user.role !== "ADMIN") {
      const modules = await getUserModules(user.id);
      await logModulePermissionUpdate({
        entityId: user.id,
        description: `Módulos definidos para ${user.name}.`,
        oldData: null,
        newData: { modules },
        user: actorFrom(currentUser),
      });
    }

    await createNotification({
      userId: user.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "Bem-vindo ao PontoLab",
      message: "Sua conta foi criada. Comece a registrar suas horas.",
    });

    return { success: true as const };
  } catch (error) {
    if (error instanceof ScopeError && currentUser) {
      await logScopeDenied({
        description: `Tentativa de criação de usuário fora do escopo: ${error.message}`,
        newData: { role: data.role, teamId: data.teamId ?? null },
        user: actorFrom(currentUser),
      });
    }

    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao criar usuário",
    };
  }
}

export async function updateUserAction(
  id: string,
  data: UpdateUserFormData & { teamId?: string | null },
) {
  let currentUser;
  try {
    currentUser = await requireAdminOrManager();

    const [beforeUser, beforeModules] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: safeUserSelect }),
      getUserModules(id),
    ]);

    const user = await updateUser(id, data, currentUser);
    revalidatePath("/usuarios");
    revalidatePath("/registros");

    await logUpdate(AUDIT_ENTITIES.USER, {
      entityId: user.id,
      description: `Usuário ${user.name} atualizado.`,
      oldData: beforeUser,
      newData: user,
      user: actorFrom(currentUser),
    });

    if (beforeUser && beforeUser.teamId !== user.teamId) {
      await createAuditLog({
        action: AUDIT_ACTIONS.TEAM_ASSIGNMENT_UPDATE,
        entityType: AUDIT_ENTITIES.USER,
        entityId: user.id,
        description: `Equipe de ${user.name} atualizada.`,
        oldData: { teamId: beforeUser.teamId },
        newData: { teamId: user.teamId },
        user: actorFrom(currentUser),
      });
    }

    if (user.role !== "ADMIN") {
      const afterModules = await getUserModules(id);
      const changed =
        JSON.stringify([...beforeModules].sort()) !==
        JSON.stringify([...afterModules].sort());

      if (changed) {
        await logModulePermissionUpdate({
          entityId: user.id,
          description: `Módulos liberados de ${user.name} atualizados.`,
          oldData: { modules: beforeModules },
          newData: { modules: afterModules },
          user: actorFrom(currentUser),
        });

        await createNotification({
          userId: user.id,
          type: NOTIFICATION_TYPES.INFO,
          title: "Módulos atualizados",
          message: "Seus módulos de acesso foram atualizados.",
        });
      }
    }

    return { success: true as const };
  } catch (error) {
    if (error instanceof ScopeError && currentUser) {
      await logScopeDenied({
        entityId: id,
        description: `Tentativa de edição de usuário fora do escopo: ${error.message}`,
        user: actorFrom(currentUser),
      });
    }

    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao atualizar usuário",
    };
  }
}

export async function deactivateUserAction(id: string) {
  let currentUser;
  try {
    currentUser = await requireAdminOrManager();
    const beforeUser = await prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    const user = await deactivateUser(id, currentUser);
    revalidatePath("/usuarios");

    await createAuditLog({
      action: AUDIT_ACTIONS.DEACTIVATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      description: `Usuário ${beforeUser?.name ?? ""} inativado.`.trim(),
      oldData: beforeUser,
      newData: user,
      user: actorFrom(currentUser),
    });

    return { success: true as const };
  } catch (error) {
    if (error instanceof ScopeError && currentUser) {
      await logScopeDenied({
        entityId: id,
        description: `Tentativa de inativação fora do escopo: ${error.message}`,
        user: actorFrom(currentUser),
      });
    }

    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao inativar usuário",
    };
  }
}
