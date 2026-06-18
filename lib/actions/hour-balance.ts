"use server";

import { endOfDay, parseISO, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import { isAdmin, requireAuth } from "@/lib/auth";
import { normalizeBalanceScope } from "@/lib/balance";
import {
  logGoalUpdate,
  logRecalculateBalance,
} from "@/lib/services/audit.service";
import {
  getUserGoals,
  recalculateBalance,
  updateUserGoals,
} from "@/lib/services/hour-balance";
import { prisma } from "@/lib/prisma";
import type { UserGoalsFormData } from "@/lib/validations";

function actorFrom(session: { userId: string; name: string; email: string }) {
  return { id: session.userId, name: session.name, email: session.email };
}

export async function updateUserGoalsAction(
  targetUserId: string,
  data: UserGoalsFormData,
) {
  try {
    const session = await requireAuth();
    const userId = isAdmin(session) ? targetUserId : session.userId;

    const before = await getUserGoals(userId);
    const goals = await updateUserGoals(userId, data, session);

    revalidatePath("/configuracoes");
    revalidatePath("/banco-horas");
    revalidatePath("/dashboard");
    revalidatePath("/timer");

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await logGoalUpdate({
      entityId: userId,
      description: `Metas atualizadas para ${targetUser?.name ?? "usuário"}.`,
      oldData: before,
      newData: goals,
      user: actorFrom(session),
    });

    return { success: true as const, message: "Metas atualizadas com sucesso." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao atualizar metas.",
    };
  }
}

export async function recalculateBalanceAction(options: {
  userId: string;
  startDate: string;
  endDate: string;
  scope?: string;
}) {
  try {
    const session = await requireAuth();
    const userId = isAdmin(session) ? options.userId : session.userId;
    const scope = normalizeBalanceScope(options.scope, isAdmin(session));

    const start = startOfDay(parseISO(options.startDate));
    const end = endOfDay(parseISO(options.endDate));

    const balance = await recalculateBalance({
      userId,
      start,
      end,
      scope,
      session,
    });

    revalidatePath("/banco-horas");
    revalidatePath("/dashboard");

    await logRecalculateBalance({
      entityId: balance.id,
      description: "Banco de horas recalculado.",
      newData: {
        userId,
        periodStart: balance.periodStart,
        periodEnd: balance.periodEnd,
        expectedHours: balance.expectedHours,
        workedHours: balance.workedHours,
        balanceHours: balance.balanceHours,
      },
      user: actorFrom(session),
    });

    return {
      success: true as const,
      message: "Banco de horas recalculado com sucesso.",
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao recalcular o banco de horas.",
    };
  }
}
