import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";

import { USER_ROLES, type UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { generateSessionSecretCheck } from "@/lib/security";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session-constants";

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  sessionVersion: number;
}

interface SessionPayload extends SessionUser {
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  generateSessionSecretCheck();

  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET não configurada");
  }

  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

function encodeSession(session: SessionUser): string {
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    ...session,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    ) as SessionPayload;

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    if (
      !payload.userId ||
      !payload.name ||
      !payload.email ||
      !payload.role ||
      typeof payload.sessionVersion !== "number"
    ) {
      return null;
    }

    if (!USER_ROLES.includes(payload.role)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const token = encodeSession(user);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const decoded = decodeSession(token);

  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      active: true,
      sessionVersion: true,
    },
  });

  if (!user?.active || !user.email) {
    return null;
  }

  if (user.sessionVersion !== decoded.sessionVersion) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    teamId: user.teamId ?? null,
    sessionVersion: user.sessionVersion,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdminOrManager(): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "GESTOR") {
    redirect("/dashboard");
  }

  return user;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function isManager(user: SessionUser): boolean {
  return user.role === "GESTOR";
}

export function isAdminOrManager(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.role === "GESTOR";
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}
