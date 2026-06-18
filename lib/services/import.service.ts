import { endOfDay, parse, startOfDay, isValid } from "date-fns";

import {
  isAdmin,
  isAdminOrManager,
  requireAuth,
  type SessionUser,
} from "@/lib/auth";
import { ACTIVITIES } from "@/lib/constants";
import { formatHours } from "@/lib/dates";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";
import {
  isValidImportedHours,
  parseImportedHours,
} from "@/lib/import/parse-hours";
import { prisma } from "@/lib/prisma";
import type {
  ImportBatchRecord,
  ImportPreviewResult,
  ImportValidationOptions,
  ImportValidationSummary,
  MappedImportRow,
  ValidatedImportRow,
} from "@/types/import";

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseImportDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const formats = ["dd/MM/yyyy", "yyyy-MM-dd", "dd-MM-yyyy"];

  for (const pattern of formats) {
    const parsed = parse(trimmed, pattern, new Date());

    if (isValid(parsed)) {
      return startOfDay(parsed);
    }
  }

  const isoParsed = new Date(trimmed);

  if (isValid(isoParsed)) {
    return startOfDay(isoParsed);
  }

  return null;
}

function resolveTaskAndComment(
  task: string,
  comment: string,
): { task: string; comment: string | null } {
  const trimmedTask = task.trim();
  const trimmedComment = comment.trim();

  if (trimmedTask) {
    return {
      task: trimmedTask,
      comment: trimmedComment || null,
    };
  }

  if (trimmedComment) {
    return {
      task: trimmedComment,
      comment: trimmedComment,
    };
  }

  return {
    task: "Registro importado",
    comment: null,
  };
}

function findActivityMatch(value: string): string | null {
  const normalized = normalizeKey(value);
  const match = ACTIVITIES.find(
    (activity) => normalizeKey(activity) === normalized,
  );

  return match ?? null;
}

function buildSummary(rows: ValidatedImportRow[]): ImportValidationSummary {
  const validRows = rows.filter((row) => row.status === "valid");
  const errorRows = rows.filter((row) => row.status === "error");
  const duplicatedRows = rows.filter((row) => row.status === "duplicate");

  const validDates = validRows
    .map((row) => row.date)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    errorRows: errorRows.length,
    duplicatedRows: duplicatedRows.length,
    totalValidHours: validRows.reduce((sum, row) => sum + (row.hours ?? 0), 0),
    minDate: validDates[0] ?? null,
    maxDate: validDates.at(-1) ?? null,
  };
}

export async function findDuplicates(
  rows: ValidatedImportRow[],
): Promise<ValidatedImportRow[]> {
  const candidates = rows.filter(
    (row) =>
      row.status !== "error" &&
      row.userId &&
      row.date &&
      row.hours !== null &&
      row.activity &&
      row.task,
  );

  if (candidates.length === 0) {
    return rows;
  }

  const userIds = [...new Set(candidates.map((row) => row.userId!))];
  const dates = candidates.map((row) => startOfDay(new Date(row.date!)));
  const minDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())));

  const existing = await prisma.timeEntry.findMany({
    where: {
      userId: { in: userIds },
      date: {
        gte: startOfDay(minDate),
        lte: endOfDay(maxDate),
      },
    },
    select: {
      userId: true,
      date: true,
      activity: true,
      task: true,
      hours: true,
    },
  });

  const existingKeys = new Set(
    existing.map(
      (entry) =>
        `${entry.userId}|${startOfDay(entry.date).toISOString()}|${normalizeKey(entry.activity)}|${normalizeKey(entry.task)}|${entry.hours}`,
    ),
  );

  return rows.map((row) => {
    if (row.status === "error" || !row.userId || !row.date || row.hours === null) {
      return row;
    }

    const key = `${row.userId}|${startOfDay(new Date(row.date)).toISOString()}|${normalizeKey(row.activity)}|${normalizeKey(row.task)}|${row.hours}`;

    if (existingKeys.has(key)) {
      return {
        ...row,
        status: "duplicate",
        message: "Possível registro já existente.",
      };
    }

    return row;
  });
}

export async function validateRows(
  rows: MappedImportRow[],
  session: SessionUser,
  options: ImportValidationOptions,
): Promise<ImportPreviewResult> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, teamId: true },
  });

  const { userMode, selectedUserId } = options;

  if (userMode === "selected" && !selectedUserId) {
    throw new Error("Selecione o usuário de destino da importação.");
  }

  // Apenas USER comum fica restrito a si mesmo. Gestores importam para a equipe.
  if (!isAdminOrManager(session) && userMode !== "logged_in") {
    throw new Error("Sem permissão para importar para outro usuário.");
  }

  const canImportForUser = (targetTeamId: string | null | undefined) => {
    if (isAdmin(session)) {
      return true;
    }

    if (session.role === "GESTOR" && session.teamId) {
      return targetTeamId === session.teamId;
    }

    return false;
  };

  const destinationUser =
    userMode === "logged_in"
      ? users.find((user) => user.id === session.userId)
      : userMode === "selected"
        ? users.find((user) => user.id === selectedUserId)
        : null;

  if (userMode !== "from_file" && !destinationUser) {
    throw new Error("Usuário de destino não encontrado.");
  }

  if (
    destinationUser &&
    !canImportForUser(destinationUser.teamId) &&
    destinationUser.id !== session.userId
  ) {
    throw new Error("Sem permissão para importar para este usuário.");
  }

  const validated: ValidatedImportRow[] = rows.map((row) => {
    const errors: string[] = [];
    const hoursOriginal = row.hours.trim();

    const parsedDate = parseImportDate(row.date);

    if (!parsedDate) {
      errors.push("Data inválida.");
    }

    let matchedUser = destinationUser;

    if (userMode === "from_file") {
      const userName = row.user.trim();

      if (!userName) {
        errors.push("Usuário obrigatório.");
      }

      matchedUser =
        users.find(
          (user) =>
            normalizeKey(user.name) === normalizeKey(userName) ||
            (user.email && normalizeKey(user.email) === normalizeKey(userName)),
        ) ?? null;

      if (userName && !matchedUser) {
        errors.push("Usuário não encontrado.");
      }

      if (
        matchedUser &&
        matchedUser.id !== session.userId &&
        !canImportForUser(matchedUser.teamId)
      ) {
        errors.push("Sem permissão para importar para este usuário.");
      }
    }

    const activity = row.activity.trim();

    if (!activity) {
      errors.push("Atividade obrigatória.");
    }

    const matchedActivity = activity ? findActivityMatch(activity) : null;

    if (activity && !matchedActivity) {
      errors.push("Atividade inválida.");
    }

    const { task, comment } = resolveTaskAndComment(row.task, row.comment);

    const hours = parseImportedHours(hoursOriginal);
    const hoursDisplay =
      isValidImportedHours(hours) ? formatHours(hours) : null;

    if (!hoursOriginal) {
      errors.push("Horas inválidas.");
    } else if (!isValidImportedHours(hours)) {
      errors.push("Horas devem ser maiores que 0 e menores ou iguais a 24.");
    }

    if (errors.length > 0) {
      return {
        lineNumber: row.lineNumber,
        date: parsedDate ? parsedDate.toISOString() : null,
        userId: matchedUser?.id ?? null,
        userName: (matchedUser?.name ?? row.user.trim()) || "—",
        activity: matchedActivity ?? activity,
        task,
        comment,
        hours: isValidImportedHours(hours) ? hours : null,
        hoursOriginal: hoursOriginal || null,
        hoursDisplay,
        status: "error",
        message: errors.join(" "),
      };
    }

    return {
      lineNumber: row.lineNumber,
      date: parsedDate!.toISOString(),
      userId: matchedUser!.id,
      userName: matchedUser!.name,
      activity: matchedActivity!,
      task,
      comment,
      hours,
      hoursOriginal: hoursOriginal || null,
      hoursDisplay: hoursDisplay!,
      status: "valid",
    };
  });

  const withDuplicates = await findDuplicates(validated);

  return {
    rows: withDuplicates,
    summary: buildSummary(withDuplicates),
  };
}

export interface ReplacePeriodInfo {
  startDate: string;
  endDate: string;
  affectedUsers: string[];
  deletedRows: number;
  preservedApprovedCount: number;
  preservedApprovedHours: number;
  reopenedApprovedCount: number;
}

function resolveReplaceRange(rows: ValidatedImportRow[], session: SessionUser) {
  const validRows = rows.filter(
    (row) => row.status === "valid" || row.status === "duplicate",
  );

  if (validRows.length === 0) {
    return null;
  }

  const dates = validRows
    .map((row) => (row.date ? new Date(row.date) : null))
    .filter((date): date is Date => date !== null);

  if (dates.length === 0) {
    return null;
  }

  const minDate = startOfDay(
    new Date(Math.min(...dates.map((date) => date.getTime()))),
  );
  const maxDate = endOfDay(
    new Date(Math.max(...dates.map((date) => date.getTime()))),
  );

  const userIds = isAdminOrManager(session)
    ? [...new Set(validRows.map((row) => row.userId!).filter(Boolean))]
    : [session.userId];

  return { minDate, maxDate, userIds };
}

export interface ApprovedInPeriodInfo {
  startDate: string;
  endDate: string;
  count: number;
  hours: number;
}

/**
 * Informa quantos registros APPROVED existem no período que seria substituído,
 * para exibir o aviso antes da substituição. Não altera nada.
 */
export async function getApprovedInPeriodInfo(
  rows: ValidatedImportRow[],
  session: SessionUser,
): Promise<ApprovedInPeriodInfo | null> {
  const resolved = resolveReplaceRange(rows, session);

  if (!resolved) {
    return null;
  }

  const { minDate, maxDate, userIds } = resolved;

  const approved = await prisma.timeEntry.findMany({
    where: {
      userId: { in: userIds },
      status: TIME_ENTRY_STATUS.APPROVED,
      date: { gte: minDate, lte: maxDate },
    },
    select: { hours: true },
  });

  return {
    startDate: minDate.toISOString(),
    endDate: maxDate.toISOString(),
    count: approved.length,
    hours: approved.reduce((sum, entry) => sum + entry.hours, 0),
  };
}

export async function replacePeriodData(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  rows: ValidatedImportRow[],
  session: SessionUser,
  options: { reopenApproved: boolean },
): Promise<ReplacePeriodInfo | null> {
  const resolved = resolveReplaceRange(rows, session);

  if (!resolved) {
    return null;
  }

  const { minDate, maxDate, userIds } = resolved;

  const approved = await tx.timeEntry.findMany({
    where: {
      userId: { in: userIds },
      status: TIME_ENTRY_STATUS.APPROVED,
      date: { gte: minDate, lte: maxDate },
    },
    select: { id: true, hours: true },
  });

  const reopenApproved = options.reopenApproved && isAdmin(session);
  let reopenedApprovedCount = 0;

  if (reopenApproved && approved.length > 0) {
    // Reabre os aprovados (voltam a DRAFT) para que possam ser substituídos.
    await tx.timeEntry.updateMany({
      where: { id: { in: approved.map((entry) => entry.id) } },
      data: {
        status: TIME_ENTRY_STATUS.DRAFT,
        approvedAt: null,
        approvedById: null,
      },
    });
    reopenedApprovedCount = approved.length;
  }

  // Sem reabertura: preserva os aprovados (não exclui).
  const deleted = await tx.timeEntry.deleteMany({
    where: {
      userId: { in: userIds },
      date: { gte: minDate, lte: maxDate },
      ...(reopenApproved ? {} : { status: { not: TIME_ENTRY_STATUS.APPROVED } }),
    },
  });

  return {
    startDate: minDate.toISOString(),
    endDate: maxDate.toISOString(),
    affectedUsers: userIds,
    deletedRows: deleted.count,
    preservedApprovedCount: reopenApproved ? 0 : approved.length,
    preservedApprovedHours: reopenApproved
      ? 0
      : approved.reduce((sum, entry) => sum + entry.hours, 0),
    reopenedApprovedCount,
  };
}

export async function importRows(options: {
  fileName: string;
  rows: ValidatedImportRow[];
  importDuplicates: boolean;
  replacePeriod: boolean;
  reopenApproved?: boolean;
  importAsApproved?: boolean;
  session: SessionUser;
}) {
  const {
    fileName,
    rows,
    importDuplicates,
    replacePeriod,
    reopenApproved = false,
    importAsApproved = false,
    session,
  } = options;

  if (importAsApproved && !isAdmin(session)) {
    throw new Error("Sem permissão para importar registros como aprovados.");
  }

  const rowsToImport = rows.filter((row) => {
    if (row.status === "error") {
      return false;
    }

    if (row.status === "duplicate" && !importDuplicates) {
      return false;
    }

    return row.status === "valid" || row.status === "duplicate";
  });

  if (rowsToImport.length === 0) {
    throw new Error("Nenhuma linha válida para importar.");
  }

  const summary = buildSummary(rows);
  let replaceInfo: ReplacePeriodInfo | null = null;
  const approvalData = importAsApproved
    ? {
        status: TIME_ENTRY_STATUS.APPROVED,
        approvedAt: new Date(),
        approvedById: session.userId,
      }
    : {};

  const batch = await prisma.$transaction(async (tx) => {
    if (replacePeriod) {
      replaceInfo = await replacePeriodData(tx, rows, session, {
        reopenApproved: reopenApproved && isAdmin(session),
      });
    }

    for (const row of rowsToImport) {
      await tx.timeEntry.create({
        data: {
          task: row.task,
          userId: row.userId!,
          date: startOfDay(new Date(row.date!)),
          hours: row.hours!,
          comment: row.comment,
          activity: row.activity,
          ...approvalData,
        },
      });
    }

    return tx.importBatch.create({
      data: {
        fileName,
        totalRows: summary.totalRows,
        validRows: summary.validRows,
        errorRows: summary.errorRows,
        duplicatedRows: summary.duplicatedRows,
        importedRows: rowsToImport.length,
        createdById: session.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  });

  return {
    batch,
    replaceInfo: replaceInfo as ReplacePeriodInfo | null,
    importedRows: rowsToImport.length,
    totalValidHours: summary.totalValidHours,
  };
}

export async function createImportBatch(
  data: Omit<ImportBatchRecord, "id" | "createdAt" | "createdBy"> & {
    createdById: string;
  },
) {
  return prisma.importBatch.create({ data });
}

export async function getImportHistory(
  session: SessionUser,
): Promise<ImportBatchRecord[]> {
  const batches = await prisma.importBatch.findMany({
    where: isAdmin(session) ? {} : { createdById: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  return batches.map((batch) => ({
    id: batch.id,
    fileName: batch.fileName,
    totalRows: batch.totalRows,
    validRows: batch.validRows,
    errorRows: batch.errorRows,
    duplicatedRows: batch.duplicatedRows,
    importedRows: batch.importedRows,
    createdAt: batch.createdAt,
    createdBy: batch.createdBy,
  }));
}

export async function validateImportPreview(
  rows: MappedImportRow[],
  options: ImportValidationOptions,
): Promise<ImportPreviewResult> {
  const session = await requireAuth();
  return validateRows(rows, session, options);
}

export { detectDelimiter, parseFile } from "@/lib/import/parse-file";
export { applyColumnMapping, mapColumns } from "@/lib/import/column-mapping";
