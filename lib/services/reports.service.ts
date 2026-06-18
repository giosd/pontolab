import { endOfDay, parseISO, startOfDay } from "date-fns";

import type { SessionUser } from "@/lib/auth";
import { scopeTimeEntryWhere } from "@/lib/access-scope";
import { getAccountingPeriodName } from "@/lib/accounting-period";
import { prisma } from "@/lib/prisma";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";
import type {
  PeriodReport,
  ReportActivityHours,
  ReportFilters,
  ReportPeriodSummary,
  ReportTaskHours,
  ReportUserHours,
} from "@/types";

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

type ReportEntry = {
  id: string;
  userId: string;
  userName: string;
  activity: string;
  task: string;
  hours: number;
  status: string;
};

async function loadEntries(
  filters: ReportFilters,
  session: SessionUser,
): Promise<ReportEntry[]> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(scopeTimeEntryWhere(session, filters.userId) as Record<string, never>),
      date: {
        gte: startOfDay(parseISO(filters.startDate)),
        lte: endOfDay(parseISO(filters.endDate)),
      },
      ...(filters.activity ? { activity: filters.activity } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return entries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.name,
    activity: entry.activity,
    task: entry.task,
    hours: entry.hours,
    status: entry.status,
  }));
}

function buildSummary(
  entries: ReportEntry[],
  filters: ReportFilters,
): ReportPeriodSummary {
  let approvedHours = 0;
  let pendingHours = 0;
  let rejectedHours = 0;
  let draftHours = 0;
  let totalHours = 0;
  const users = new Set<string>();

  for (const entry of entries) {
    totalHours += entry.hours;
    users.add(entry.userId);

    switch (entry.status) {
      case TIME_ENTRY_STATUS.APPROVED:
        approvedHours += entry.hours;
        break;
      case TIME_ENTRY_STATUS.SUBMITTED:
        pendingHours += entry.hours;
        break;
      case TIME_ENTRY_STATUS.REJECTED:
        rejectedHours += entry.hours;
        break;
      case TIME_ENTRY_STATUS.DRAFT:
        draftHours += entry.hours;
        break;
    }
  }

  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    label: getAccountingPeriodName(filters.startDate, filters.endDate),
    totalHours: roundHours(totalHours),
    approvedHours: roundHours(approvedHours),
    pendingHours: roundHours(pendingHours),
    rejectedHours: roundHours(rejectedHours),
    draftHours: roundHours(draftHours),
    totalEntries: entries.length,
    totalUsers: users.size,
  };
}

function buildByUser(entries: ReportEntry[]): ReportUserHours[] {
  const map = new Map<string, ReportUserHours>();

  for (const entry of entries) {
    const current =
      map.get(entry.userId) ??
      ({
        userId: entry.userId,
        userName: entry.userName,
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        rejectedHours: 0,
        balanceHours: 0,
      } satisfies ReportUserHours);

    current.totalHours += entry.hours;

    switch (entry.status) {
      case TIME_ENTRY_STATUS.APPROVED:
        current.approvedHours += entry.hours;
        break;
      case TIME_ENTRY_STATUS.SUBMITTED:
        current.pendingHours += entry.hours;
        break;
      case TIME_ENTRY_STATUS.REJECTED:
        current.rejectedHours += entry.hours;
        break;
    }

    map.set(entry.userId, current);
  }

  return Array.from(map.values())
    .map((user) => ({
      ...user,
      totalHours: roundHours(user.totalHours),
      approvedHours: roundHours(user.approvedHours),
      pendingHours: roundHours(user.pendingHours),
      rejectedHours: roundHours(user.rejectedHours),
      // Saldo: horas que efetivamente contam (total menos rejeitadas).
      balanceHours: roundHours(user.totalHours - user.rejectedHours),
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

function buildByActivity(entries: ReportEntry[]): ReportActivityHours[] {
  const map = new Map<string, number>();
  let total = 0;

  for (const entry of entries) {
    map.set(entry.activity, (map.get(entry.activity) ?? 0) + entry.hours);
    total += entry.hours;
  }

  return Array.from(map.entries())
    .map(([activity, hours]) => ({
      activity,
      hours: roundHours(hours),
      percentage: total > 0 ? Math.round((hours / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.hours - a.hours);
}

function buildByTask(entries: ReportEntry[]): ReportTaskHours[] {
  const map = new Map<string, { hours: number; count: number }>();

  for (const entry of entries) {
    const current = map.get(entry.task) ?? { hours: 0, count: 0 };
    current.hours += entry.hours;
    current.count += 1;
    map.set(entry.task, current);
  }

  return Array.from(map.entries())
    .map(([task, value]) => ({
      task,
      hours: roundHours(value.hours),
      count: value.count,
    }))
    .sort((a, b) => b.hours - a.hours);
}

export async function getPeriodSummary(
  filters: ReportFilters,
  session: SessionUser,
): Promise<ReportPeriodSummary> {
  const entries = await loadEntries(filters, session);
  return buildSummary(entries, filters);
}

export async function getHoursByUser(
  filters: ReportFilters,
  session: SessionUser,
): Promise<ReportUserHours[]> {
  const entries = await loadEntries(filters, session);
  return buildByUser(entries);
}

export async function getHoursByActivity(
  filters: ReportFilters,
  session: SessionUser,
): Promise<ReportActivityHours[]> {
  const entries = await loadEntries(filters, session);
  return buildByActivity(entries);
}

export async function getHoursByTask(
  filters: ReportFilters,
  session: SessionUser,
): Promise<ReportTaskHours[]> {
  const entries = await loadEntries(filters, session);
  return buildByTask(entries);
}

export async function getPeriodReport(
  filters: ReportFilters,
  session: SessionUser,
): Promise<PeriodReport> {
  const entries = await loadEntries(filters, session);

  return {
    summary: buildSummary(entries, filters),
    byUser: buildByUser(entries),
    byActivity: buildByActivity(entries),
    byTask: buildByTask(entries),
  };
}
