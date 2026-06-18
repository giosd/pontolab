"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  getCurrentUser,
  logout,
  verifyPassword,
} from "@/lib/auth";
import { logLogin, logLogout } from "@/lib/services/audit.service";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export async function loginAction(
  _prevState: { error: string },
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email ou senha inválidos." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.active || !user.passwordHash || !user.email) {
    return { error: "Email ou senha inválidos." };
  }

  const passwordValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { error: "Email ou senha inválidos." };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession({
    userId: updated.id,
    name: updated.name,
    email: updated.email!,
    role: updated.role as "ADMIN" | "GESTOR" | "USER",
    teamId: updated.teamId ?? null,
    sessionVersion: updated.sessionVersion,
  });

  await logLogin({
    user: { id: updated.id, name: updated.name, email: updated.email },
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getCurrentUser();

  if (session) {
    await logLogout({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
      },
    });
  }

  await logout();
  redirect("/login");
}
