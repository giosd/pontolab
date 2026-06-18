import { endOfDay, parseISO, startOfDay } from "date-fns";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_PAGE_SIZE,
  CRITICAL_AUDIT_ACTIONS,
  type AuditAction,
  type AuditEntity,
} from "@/lib/audit/constants";
import { sanitizeAuditData } from "@/lib/audit/sanitize";
import { prisma } from "@/lib/prisma";
import type {
  AuditFilters,
  AuditLogDetail,
  AuditLogListItem,
  AuditLogsResult,
  AuditSummary,
} from "@/types/audit";

export interface AuditActor {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface AuditRequestInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface CreateAuditLogParams {
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string | null;
  description?: string | null;
  oldData?: unknown;
  newData?: unknown;
  user?: AuditActor | null;
  request?: AuditRequestInfo;
}

const listSelect = {
  id: true,
  createdAt: true,
  userName: true,
  userEmail: true,
  action: true,
  entityType: true,
  description: true,
  ipAddress: true,
} satisfies Prisma.AuditLogSelect;

export async function getRequestInfo(): Promise<AuditRequestInfo> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      null;
    const userAgent = headerList.get("user-agent");

    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  const sanitized = sanitizeAuditData(value);

  if (sanitized === null || sanitized === undefined) {
    return undefined;
  }

  return sanitized as Prisma.InputJsonValue;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const request = params.request ?? (await getRequestInfo());

    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        description: params.description ?? null,
        oldData: toJsonValue(params.oldData),
        newData: toJsonValue(params.newData),
        userId: params.user?.id ?? null,
        userName: params.user?.name ?? null,
        userEmail: params.user?.email ?? null,
        ipAddress: request.ipAddress ?? null,
        userAgent: request.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] Falha ao gravar log de auditoria:", error);
  }
}

interface EntityLogParams {
  entityId?: string | null;
  description?: string | null;
  oldData?: unknown;
  newData?: unknown;
  user?: AuditActor | null;
  request?: AuditRequestInfo;
}

export function logCreate(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.CREATE,
    entityType,
    ...params,
  });
}

export function logUpdate(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.UPDATE,
    entityType,
    ...params,
  });
}

export function logDelete(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.DELETE,
    entityType,
    ...params,
  });
}

export function logLogin(params: {
  user?: AuditActor | null;
  request?: AuditRequestInfo;
}): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.LOGIN,
    entityType: AUDIT_ENTITIES.AUTH,
    description: "Usuário realizou login.",
    ...params,
  });
}

export function logLogout(params: {
  user?: AuditActor | null;
  request?: AuditRequestInfo;
}): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.LOGOUT,
    entityType: AUDIT_ENTITIES.AUTH,
    description: "Usuário saiu do sistema.",
    ...params,
  });
}

export function logPasswordChange(params: {
  user?: AuditActor | null;
  request?: AuditRequestInfo;
}): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.CHANGE_PASSWORD,
    entityType: AUDIT_ENTITIES.USER,
    entityId: params.user?.id ?? null,
    description: "Senha alterada pelo próprio usuário.",
    ...params,
  });
}

export function logImport(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.IMPORT,
    entityType: AUDIT_ENTITIES.IMPORT_BATCH,
    description: "Arquivo importado.",
    ...params,
  });
}

export function logReplacePeriod(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.REPLACE_PERIOD,
    entityType: AUDIT_ENTITIES.IMPORT_BATCH,
    description: "Registros do período foram substituídos por importação.",
    ...params,
  });
}

export function logExport(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.EXPORT,
    entityType: AUDIT_ENTITIES.REPORT,
    description: "Relatório exportado.",
    ...params,
  });
}

export function logModulePermissionUpdate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.MODULE_PERMISSION_UPDATE,
    entityType: AUDIT_ENTITIES.MODULE_PERMISSION,
    ...params,
  });
}

export function logSubmit(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.SUBMIT,
    entityType,
    ...params,
  });
}

export function logApprove(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.APPROVE,
    entityType,
    ...params,
  });
}

export function logReject(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.REJECT,
    entityType,
    ...params,
  });
}

export function logReopen(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.REOPEN,
    entityType,
    ...params,
  });
}

export function logBulkAction(
  entityType: AuditEntity,
  params: EntityLogParams,
): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.BULK_ACTION,
    entityType,
    ...params,
  });
}

export function logGoalUpdate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.UPDATE_GOAL,
    entityType: AUDIT_ENTITIES.GOAL,
    ...params,
  });
}

export function logRecalculateBalance(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.RECALCULATE_BALANCE,
    entityType: AUDIT_ENTITIES.HOUR_BALANCE,
    ...params,
  });
}

export function logReopenApproved(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.REOPEN_APPROVED,
    entityType: AUDIT_ENTITIES.TIME_ENTRY,
    ...params,
  });
}

export function logPeriodReplacement(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.PERIOD_REPLACEMENT,
    entityType: AUDIT_ENTITIES.TIME_ENTRY,
    ...params,
  });
}

export function logApprovedPreserved(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.APPROVED_PRESERVED,
    entityType: AUDIT_ENTITIES.TIME_ENTRY,
    ...params,
  });
}

export function logTeamCreate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.TEAM_CREATE,
    entityType: AUDIT_ENTITIES.TEAM,
    ...params,
  });
}

export function logTeamUpdate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.TEAM_UPDATE,
    entityType: AUDIT_ENTITIES.TEAM,
    ...params,
  });
}

export function logTeamDeactivate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.TEAM_DEACTIVATE,
    entityType: AUDIT_ENTITIES.TEAM,
    ...params,
  });
}

export function logManagerCreate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.MANAGER_CREATE,
    entityType: AUDIT_ENTITIES.USER,
    ...params,
  });
}

export function logScopeDenied(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.USER_SCOPE_DENIED,
    entityType: AUDIT_ENTITIES.USER,
    ...params,
  });
}

export function logTeamAssignmentUpdate(params: EntityLogParams): Promise<void> {
  return createAuditLog({
    action: AUDIT_ACTIONS.TEAM_ASSIGNMENT_UPDATE,
    entityType: AUDIT_ENTITIES.USER,
    ...params,
  });
}

function buildAuditWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};

    if (filters.startDate) {
      where.createdAt.gte = startOfDay(parseISO(filters.startDate));
    }

    if (filters.endDate) {
      where.createdAt.lte = endOfDay(parseISO(filters.endDate));
    }
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.search) {
    const term = filters.search.trim();

    if (term) {
      where.OR = [
        { description: { contains: term } },
        { userName: { contains: term } },
        { userEmail: { contains: term } },
        { action: { contains: term } },
        { entityType: { contains: term } },
      ];
    }
  }

  return where;
}

export async function getAuditLogs(
  filters: AuditFilters = {},
): Promise<AuditLogsResult> {
  const where = buildAuditWhere(filters);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = AUDIT_PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAuditLogById(
  id: string,
): Promise<AuditLogDetail | null> {
  const log = await prisma.auditLog.findUnique({
    where: { id },
  });

  if (!log) {
    return null;
  }

  return {
    id: log.id,
    createdAt: log.createdAt,
    userId: log.userId,
    userName: log.userName,
    userEmail: log.userEmail,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    oldData: log.oldData,
    newData: log.newData,
  };
}

export async function getAuditSummary(
  filters: AuditFilters = {},
): Promise<AuditSummary> {
  const where = buildAuditWhere(filters);
  const todayStart = startOfDay(new Date());

  const [totalEvents, eventsToday, logins, criticalChanges] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: { AND: [where, { createdAt: { gte: todayStart } }] },
    }),
    prisma.auditLog.count({
      where: { AND: [where, { action: AUDIT_ACTIONS.LOGIN }] },
    }),
    prisma.auditLog.count({
      where: { AND: [where, { action: { in: CRITICAL_AUDIT_ACTIONS } }] },
    }),
  ]);

  return { totalEvents, eventsToday, logins, criticalChanges };
}

export async function getRecentAuditLogs(
  limit = 10,
): Promise<AuditLogListItem[]> {
  return prisma.auditLog.findMany({
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAuditLogsForExport(
  filters: AuditFilters = {},
): Promise<{ items: AuditLogListItem[]; summary: AuditSummary }> {
  const where = buildAuditWhere(filters);

  const [items, summary] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    getAuditSummary(filters),
  ]);

  return { items, summary };
}
