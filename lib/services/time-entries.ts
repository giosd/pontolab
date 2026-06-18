import { parseISO, startOfDay, endOfDay } from "date-fns";

import {
  isAdmin,
  isAdminOrManager,
  isManager,
  type SessionUser,
} from "@/lib/auth";
import { canViewTimeEntry, scopeTimeEntryWhere } from "@/lib/access-scope";
import { prisma } from "@/lib/prisma";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";
import { timeEntrySchema, type TimeEntryFormData } from "@/lib/validations";
import type { TimeEntryFilters } from "@/types";

function parseEntryDate(date: string) {
  return startOfDay(parseISO(date));
}

async function assertEntryAccess(entryId: string, session: SessionUser) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    select: { userId: true, status: true, user: { select: { teamId: true } } },
  });

  if (!entry) {
    throw new Error("Registro não encontrado.");
  }

  const canAccess = canViewTimeEntry(session, {
    id: entry.userId,
    teamId: entry.user.teamId ?? null,
  });

  if (!canAccess) {
    throw new Error("Você não tem permissão para alterar este registro.");
  }

  return entry;
}

/** Garante que o userId alvo está dentro do escopo do gestor/usuário. */
async function resolveTargetUserId(
  requestedUserId: string,
  session: SessionUser,
): Promise<string> {
  if (isAdmin(session)) {
    return requestedUserId;
  }

  if (isManager(session) && session.teamId) {
    if (requestedUserId === session.userId) {
      return requestedUserId;
    }

    const target = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { teamId: true },
    });

    if (target?.teamId === session.teamId) {
      return requestedUserId;
    }

    throw new Error("Usuário fora da sua equipe.");
  }

  return session.userId;
}

export async function getTimeEntries(
  filters: TimeEntryFilters = {},
  session: SessionUser,
) {
  const where: {
    userId?: string;
    activity?: string;
    task?: { contains: string };
    date?: { gte?: Date; lte?: Date };
    status?: string;
    user?: { teamId: string };
  } = {
    ...(scopeTimeEntryWhere(session, filters.userId) as Record<string, never>),
  };

  if (filters.activity) {
    where.activity = filters.activity;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.task) {
    where.task = { contains: filters.task };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};

    if (filters.startDate) {
      where.date.gte = startOfDay(parseISO(filters.startDate));
    }

    if (filters.endDate) {
      where.date.lte = endOfDay(parseISO(filters.endDate));
    }
  }

  return prisma.timeEntry.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function createTimeEntry(
  data: TimeEntryFormData,
  session: SessionUser,
) {
  const parsed = timeEntrySchema.parse(data);
  const userId = await resolveTargetUserId(parsed.userId, session);

  return prisma.timeEntry.create({
    data: {
      task: parsed.task.trim(),
      userId,
      date: parseEntryDate(parsed.date),
      hours: parsed.hours,
      comment: parsed.comment?.trim() || null,
      activity: parsed.activity,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } } },
  });
}

export async function updateTimeEntry(
  id: string,
  data: TimeEntryFormData,
  session: SessionUser,
) {
  const current = await assertEntryAccess(id, session);

  if (current.status === TIME_ENTRY_STATUS.APPROVED) {
    throw new Error(
      "Registro aprovado não pode ser editado. Reabra o registro antes.",
    );
  }

  if (current.status === TIME_ENTRY_STATUS.SUBMITTED && !isAdminOrManager(session)) {
    throw new Error(
      "Registro enviado para aprovação não pode ser editado.",
    );
  }

  const parsed = timeEntrySchema.parse(data);
  const userId = await resolveTargetUserId(parsed.userId, session);

  return prisma.timeEntry.update({
    where: { id },
    data: {
      task: parsed.task.trim(),
      userId,
      date: parseEntryDate(parsed.date),
      hours: parsed.hours,
      comment: parsed.comment?.trim() || null,
      activity: parsed.activity,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } } },
  });
}

export async function deleteTimeEntry(id: string, session: SessionUser) {
  const current = await assertEntryAccess(id, session);

  if (current.status === TIME_ENTRY_STATUS.APPROVED) {
    throw new Error(
      "Registro aprovado não pode ser excluído. Reabra o registro antes.",
    );
  }

  if (!isAdminOrManager(session) && current.status !== TIME_ENTRY_STATUS.DRAFT) {
    throw new Error("Apenas registros em rascunho podem ser excluídos.");
  }

  return prisma.timeEntry.delete({
    where: { id },
  });
}
