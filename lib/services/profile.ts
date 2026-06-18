import {
  createSession,
  hashPassword,
  requireAuth,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeUser } from "@/lib/security";
import { createNotification } from "@/lib/services/notification.service";
import { NOTIFICATION_TYPES } from "@/lib/notifications/constants";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from "@/lib/validations";
import type { SafeUser } from "@/types";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  lastLoginAt: true,
  passwordHash: true,
  sessionVersion: true,
} as const;

export async function getProfile(): Promise<SafeUser> {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: profileSelect,
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  return safeUser(user) as SafeUser;
}

export async function updateProfile(data: UpdateProfileFormData): Promise<SafeUser> {
  const session = await requireAuth();
  const parsed = updateProfileSchema.parse(data);

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
    },
    select: profileSelect,
  });

  await createSession({
    userId: updated.id,
    name: updated.name,
    email: updated.email!,
    role: updated.role as SessionUser["role"],
    teamId: session.teamId,
    sessionVersion: updated.sessionVersion,
  });

  return safeUser(updated) as SafeUser;
}

export async function changePassword(data: ChangePasswordFormData): Promise<void> {
  const session = await requireAuth();
  const parsed = changePasswordSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      sessionVersion: true,
    },
  });

  if (!user?.passwordHash || !user.email) {
    throw new Error("Não foi possível alterar a senha.");
  }

  const currentValid = await verifyPassword(
    parsed.currentPassword,
    user.passwordHash,
  );

  if (!currentValid) {
    throw new Error("Senha atual incorreta.");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.newPassword),
      sessionVersion: { increment: 1 },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sessionVersion: true,
    },
  });

  await createSession({
    userId: updated.id,
    name: updated.name,
    email: updated.email!,
    role: updated.role as SessionUser["role"],
    teamId: session.teamId,
    sessionVersion: updated.sessionVersion,
  });

  await createNotification({
    userId: updated.id,
    type: NOTIFICATION_TYPES.WARNING,
    title: "Senha alterada",
    message: "Sua senha foi alterada com sucesso.",
  });
}
