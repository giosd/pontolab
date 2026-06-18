"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { AUDIT_ENTITIES } from "@/lib/audit/constants";
import {
  logCreate,
  logDelete,
  logUpdate,
} from "@/lib/services/audit.service";
import {
  createTimeEntry,
  deleteTimeEntry,
  updateTimeEntry,
} from "@/lib/services/time-entries";
import { prisma } from "@/lib/prisma";
import type { TimeEntryFormData } from "@/lib/validations";

function actorFrom(session: { userId: string; name: string; email: string }) {
  return { id: session.userId, name: session.name, email: session.email };
}

function toAuditEntry(entry: {
  id: string;
  task: string;
  activity: string;
  date: Date;
  hours: number;
  comment: string | null;
  userId: string;
  user?: { name: string } | null;
}) {
  return {
    id: entry.id,
    task: entry.task,
    activity: entry.activity,
    date: entry.date,
    hours: entry.hours,
    comment: entry.comment,
    userId: entry.userId,
    userName: entry.user?.name ?? null,
  };
}

export async function createTimeEntryAction(data: TimeEntryFormData) {
  try {
    const session = await requireAuth();
    const entry = await createTimeEntry(data, session);
    revalidatePath("/registros");
    revalidatePath("/dashboard");

    await logCreate(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" criado.`,
      newData: toAuditEntry(entry),
      user: actorFrom(session),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao criar registro",
    };
  }
}

export async function updateTimeEntryAction(id: string, data: TimeEntryFormData) {
  try {
    const session = await requireAuth();
    const before = await prisma.timeEntry.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    const entry = await updateTimeEntry(id, data, session);
    revalidatePath("/registros");
    revalidatePath("/dashboard");

    await logUpdate(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" atualizado.`,
      oldData: before ? toAuditEntry(before) : null,
      newData: toAuditEntry(entry),
      user: actorFrom(session),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao atualizar registro",
    };
  }
}

export async function deleteTimeEntryAction(id: string) {
  try {
    const session = await requireAuth();
    const before = await prisma.timeEntry.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    await deleteTimeEntry(id, session);
    revalidatePath("/registros");
    revalidatePath("/dashboard");

    await logDelete(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: id,
      description: `Registro "${before?.task ?? ""}" excluído.`.trim(),
      oldData: before ? toAuditEntry(before) : null,
      user: actorFrom(session),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao excluir registro",
    };
  }
}
