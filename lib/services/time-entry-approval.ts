import { isAdminOrManager, type SessionUser } from "@/lib/auth";
import { canApproveTimeEntry, canViewTimeEntry } from "@/lib/access-scope";
import { prisma } from "@/lib/prisma";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";

const entryInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      teamId: true,
    },
  },
} as const;

export const REJECTION_REASON_MIN_LENGTH = 3;

function normalizeReason(reason: string): string {
  const trimmed = reason?.trim() ?? "";

  if (trimmed.length < REJECTION_REASON_MIN_LENGTH) {
    throw new Error(
      `Informe um motivo com pelo menos ${REJECTION_REASON_MIN_LENGTH} caracteres.`,
    );
  }

  return trimmed;
}

async function loadEntry(id: string) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    include: entryInclude,
  });

  if (!entry) {
    throw new Error("Registro não encontrado.");
  }

  return entry;
}

type EntryWithOwner = {
  userId: string;
  user: { teamId: string | null };
};

function ownerOf(entry: EntryWithOwner) {
  return { id: entry.userId, teamId: entry.user.teamId ?? null };
}

function assertOwnerOrAdmin(entry: EntryWithOwner, session: SessionUser) {
  if (!canViewTimeEntry(session, ownerOf(entry))) {
    throw new Error("Você não tem permissão para alterar este registro.");
  }
}

function assertCanApprove(entry: EntryWithOwner, session: SessionUser) {
  if (!canApproveTimeEntry(session, ownerOf(entry))) {
    throw new Error("Sem permissão para aprovar registros fora da sua equipe.");
  }
}

function assertModerator(session: SessionUser) {
  if (!isAdminOrManager(session)) {
    throw new Error("Apenas administradores e gestores podem executar esta ação.");
  }
}

export async function submitTimeEntry(id: string, session: SessionUser) {
  const entry = await loadEntry(id);
  assertOwnerOrAdmin(entry, session);

  if (
    entry.status !== TIME_ENTRY_STATUS.DRAFT &&
    entry.status !== TIME_ENTRY_STATUS.REJECTED
  ) {
    throw new Error(
      "Apenas registros em rascunho ou rejeitados podem ser enviados para aprovação.",
    );
  }

  return prisma.timeEntry.update({
    where: { id },
    data: {
      status: TIME_ENTRY_STATUS.SUBMITTED,
      submittedAt: new Date(),
      submittedById: session.userId,
    },
    include: entryInclude,
  });
}

export async function approveTimeEntry(id: string, session: SessionUser) {
  const entry = await loadEntry(id);
  assertCanApprove(entry, session);

  if (entry.status !== TIME_ENTRY_STATUS.SUBMITTED) {
    throw new Error("Apenas registros enviados podem ser aprovados.");
  }

  return prisma.timeEntry.update({
    where: { id },
    data: {
      status: TIME_ENTRY_STATUS.APPROVED,
      approvedAt: new Date(),
      approvedById: session.userId,
    },
    include: entryInclude,
  });
}

export async function rejectTimeEntry(
  id: string,
  reason: string,
  session: SessionUser,
) {
  const normalizedReason = normalizeReason(reason);
  const entry = await loadEntry(id);
  assertCanApprove(entry, session);

  if (entry.status !== TIME_ENTRY_STATUS.SUBMITTED) {
    throw new Error("Apenas registros enviados podem ser rejeitados.");
  }

  return prisma.timeEntry.update({
    where: { id },
    data: {
      status: TIME_ENTRY_STATUS.REJECTED,
      rejectedAt: new Date(),
      rejectedById: session.userId,
      rejectionReason: normalizedReason,
    },
    include: entryInclude,
  });
}

export async function reopenTimeEntry(
  id: string,
  reason: string,
  session: SessionUser,
) {
  const normalizedReason = normalizeReason(reason);
  const entry = await loadEntry(id);
  assertCanApprove(entry, session);

  if (entry.status !== TIME_ENTRY_STATUS.APPROVED) {
    throw new Error("Apenas registros aprovados podem ser reabertos.");
  }

  return prisma.timeEntry.update({
    where: { id },
    data: {
      status: TIME_ENTRY_STATUS.DRAFT,
      approvedAt: null,
      approvedById: null,
      rejectionReason: normalizedReason,
    },
    include: entryInclude,
  });
}

export interface BulkActionResult {
  updatedCount: number;
  updatedIds: string[];
  errors: { id: string; error: string }[];
}

async function runBulk(
  ids: string[],
  handler: (id: string) => Promise<{ id: string }>,
): Promise<BulkActionResult> {
  const uniqueIds = Array.from(new Set(ids));
  const result: BulkActionResult = {
    updatedCount: 0,
    updatedIds: [],
    errors: [],
  };

  for (const id of uniqueIds) {
    try {
      const entry = await handler(id);
      result.updatedCount += 1;
      result.updatedIds.push(entry.id);
    } catch (error) {
      result.errors.push({
        id,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  }

  if (result.updatedCount === 0) {
    const firstError = result.errors[0]?.error;
    throw new Error(
      firstError ?? "Nenhum registro pôde ser atualizado.",
    );
  }

  return result;
}

export function submitTimeEntries(ids: string[], session: SessionUser) {
  return runBulk(ids, (id) => submitTimeEntry(id, session));
}

export function approveTimeEntries(ids: string[], session: SessionUser) {
  assertModerator(session);
  return runBulk(ids, (id) => approveTimeEntry(id, session));
}

export function rejectTimeEntries(
  ids: string[],
  reason: string,
  session: SessionUser,
) {
  assertModerator(session);
  normalizeReason(reason);
  return runBulk(ids, (id) => rejectTimeEntry(id, reason, session));
}

export function reopenTimeEntries(
  ids: string[],
  reason: string,
  session: SessionUser,
) {
  assertModerator(session);
  normalizeReason(reason);
  return runBulk(ids, (id) => reopenTimeEntry(id, reason, session));
}
