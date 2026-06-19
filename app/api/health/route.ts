import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    // Loga sem expor detalhes internos (DATABASE_URL, host, stacktrace bruto).
    logger.error({
      message: "healthcheck_failed",
      context: {
        reason: error instanceof Error ? error.name : "unknown",
      },
    });

    return NextResponse.json(
      {
        status: "error",
        database: "error",
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
