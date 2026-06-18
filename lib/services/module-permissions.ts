import { redirect } from "next/navigation";

import { isAdmin, requireAuth } from "@/lib/auth";
import {
  ALWAYS_ENABLED_MODULES,
  APP_MODULES,
  getDefaultModulesForRole,
  type AppModuleKey,
} from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export async function getUserModules(userId: string): Promise<AppModuleKey[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return [...ALWAYS_ENABLED_MODULES];
  }

  if (user.role === "ADMIN") {
    return APP_MODULES.map((module) => module.key);
  }

  const permissions = await prisma.userModulePermission.findMany({
    where: { userId, enabled: true },
    select: { module: true },
  });

  if (permissions.length === 0) {
    return getDefaultModulesForRole(user.role);
  }

  const modules = new Set<AppModuleKey>(
    permissions.map((permission) => permission.module as AppModuleKey),
  );

  for (const moduleKey of ALWAYS_ENABLED_MODULES) {
    modules.add(moduleKey);
  }

  return Array.from(modules);
}

export async function userCanAccessModule(
  userId: string,
  module: AppModuleKey,
  role?: string,
): Promise<boolean> {
  if (ALWAYS_ENABLED_MODULES.includes(module)) {
    return true;
  }

  if (role === "ADMIN") {
    return true;
  }

  const moduleConfig = APP_MODULES.find((item) => item.key === module);

  if (moduleConfig?.adminOnly) {
    return false;
  }

  const permission = await prisma.userModulePermission.findUnique({
    where: {
      userId_module: {
        userId,
        module,
      },
    },
    select: { enabled: true },
  });

  if (permission) {
    return permission.enabled;
  }

  return getDefaultModulesForRole(role ?? "USER").includes(module);
}

export async function updateUserModules(
  userId: string,
  modules: AppModuleKey[],
  options?: {
    editorUserId?: string;
    editorRole?: string;
  },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (user.role === "ADMIN") {
    return;
  }

  const enabledModules = new Set(modules);

  for (const moduleKey of ALWAYS_ENABLED_MODULES) {
    enabledModules.add(moduleKey);
  }

  if (
    options?.editorUserId === userId &&
    options.editorRole === "ADMIN" &&
    !enabledModules.has("USUARIOS")
  ) {
    throw new Error("Não é possível remover acessos críticos do próprio usuário.");
  }

  const assignableModules = APP_MODULES.filter(
    (module) => !ALWAYS_ENABLED_MODULES.includes(module.key),
  );

  await prisma.$transaction(
    assignableModules.map((module) =>
      prisma.userModulePermission.upsert({
        where: {
          userId_module: {
            userId,
            module: module.key,
          },
        },
        create: {
          userId,
          module: module.key,
          enabled: enabledModules.has(module.key),
        },
        update: {
          enabled: enabledModules.has(module.key),
        },
      }),
    ),
  );
}

export async function createDefaultUserModules(userId: string) {
  await updateUserModules(userId, getDefaultModulesForRole("USER"));
}

export async function createDefaultModulesForRole(userId: string, role: string) {
  await updateUserModules(userId, getDefaultModulesForRole(role));
}

export async function requireModuleAccess(module: AppModuleKey) {
  const session = await requireAuth();

  if (isAdmin(session)) {
    return session;
  }

  const canAccess = await userCanAccessModule(
    session.userId,
    module,
    session.role,
  );

  if (!canAccess) {
    redirect("/forbidden");
  }

  return session;
}
