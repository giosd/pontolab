import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const PUBLIC_PATHS = ["/login"];
const PROTECTED_PATHS = [
  "/dashboard",
  "/registros",
  "/importar",
  "/importacoes",
  "/usuarios",
  "/equipes",
  "/configuracoes",
  "/perfil",
  "/forbidden",
  "/auditoria",
  "/relatorios",
  "/notificacoes",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/registros/:path*",
    "/importar/:path*",
    "/importacoes/:path*",
    "/usuarios/:path*",
    "/equipes/:path*",
    "/configuracoes/:path*",
    "/perfil/:path*",
    "/forbidden/:path*",
    "/auditoria/:path*",
    "/relatorios/:path*",
    "/notificacoes/:path*",
  ],
};
