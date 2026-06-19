"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSession,
  getCurrentUser,
  logout,
  verifyPassword,
} from "@/lib/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logLogin, logLogout } from "@/lib/services/audit.service";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

const GENERIC_LOGIN_ERROR = "Email ou senha inválidos.";
const RATE_LIMITED_ERROR =
  "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

export async function loginAction(
  _prevState: { error: string },
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const requestHeaders = await headers();
  const clientIp = getClientIp(requestHeaders);

  const email = parsed.success
    ? parsed.data.email.trim().toLowerCase()
    : String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();

  // Limita por IP e por email normalizado (qualquer um excedido bloqueia).
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`login:ip:${clientIp}`),
    email ? checkRateLimit(`login:email:${email}`) : null,
  ]);

  if (!ipLimit.allowed || (emailLimit && !emailLimit.allowed)) {
    logger.warn({
      message: "login_rate_limited",
      context: { ip: clientIp },
    });
    return { error: RATE_LIMITED_ERROR };
  }

  if (!parsed.success) {
    logger.info({ message: "login_invalid_credentials", context: { ip: clientIp } });
    return { error: GENERIC_LOGIN_ERROR };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.active || !user.passwordHash || !user.email) {
    logger.info({ message: "login_invalid_credentials", context: { ip: clientIp } });
    return { error: GENERIC_LOGIN_ERROR };
  }

  const passwordValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    logger.info({ message: "login_invalid_credentials", context: { ip: clientIp } });
    return { error: GENERIC_LOGIN_ERROR };
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

  logger.info({ message: "login_success", context: { userId: updated.id } });

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
