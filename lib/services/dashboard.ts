import { endOfDay, format, parseISO, startOfDay } from "date-fns";

import { isAdminOrManager, type SessionUser } from "@/lib/auth";
import { scopeTimeEntryWhere } from "@/lib/access-scope";
import {
  countDaysInRange,
  formatDateBR,
  getTodayRange,
} from "@/lib/dates";
import { DEFAULT_BALANCE_SCOPE } from "@/lib/balance";
import { prisma } from "@/lib/prisma";
import {
  getBalanceOverview,
  getHourBalanceData,
} from "@/lib/services/hour-balance";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";
import type {
  BalanceOverview,
  DashboardBalanceSummary,
  DashboardData,
  DashboardFilters,
  DashboardSummaryEntry,
  HoursByStatus,
  PendingApprovalsSummary,
} from "@/types";

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getDashboardData(
  filters: DashboardFilters,
  session: SessionUser,
): Promise<DashboardData> {
  const start = startOfDay(parseISO(filters.startDate));
  const end = endOfDay(parseISO(filters.endDate));
  const todayRange = getTodayRange();
  const scopeWhere = scopeTimeEntryWhere(session, filters.userId) as Record<
    string,
    never
  >;

  // Usuário concreto em foco (para saldo pessoal), respeitando escopo.
  const focusedUserId = isAdminOrManager(session)
    ? filters.userId
    : session.userId;

  const where = {
    ...scopeWhere,
    date: { gte: start, lte: end },
    ...(filters.activity ? { activity: filters.activity } : {}),
  };

  const entries = await prisma.timeEntry.findMany({
    where,
    include: { user: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const todayWhere = {
    ...scopeWhere,
    date: { gte: todayRange.start, lte: todayRange.end },
    ...(filters.activity ? { activity: filters.activity } : {}),
  };

  const todayEntries = await prisma.timeEntry.findMany({
    where: todayWhere,
    select: { hours: true },
  });

  const totalHours = roundHours(
    entries.reduce((sum, entry) => sum + entry.hours, 0),
  );
  const totalEntries = entries.length;
  const daysInRange = countDaysInRange(start, end);
  const averageHoursPerDay = roundHours(
    daysInRange > 0 ? totalHours / daysInRange : 0,
  );
  const hoursToday = roundHours(
    todayEntries.reduce((sum, entry) => sum + entry.hours, 0),
  );

  const hoursByDayMap = new Map<string, number>();
  const hoursByActivityMap = new Map<string, number>();
  const hoursByUserMap = new Map<string, number>();
  const hoursByTaskMap = new Map<string, number>();

  for (const entry of entries) {
    const dateKey = format(entry.date, "yyyy-MM-dd");
    hoursByDayMap.set(dateKey, roundHours((hoursByDayMap.get(dateKey) ?? 0) + entry.hours));
    hoursByActivityMap.set(
      entry.activity,
      roundHours((hoursByActivityMap.get(entry.activity) ?? 0) + entry.hours),
    );
    hoursByUserMap.set(
      entry.user.name,
      roundHours((hoursByUserMap.get(entry.user.name) ?? 0) + entry.hours),
    );
    hoursByTaskMap.set(
      entry.task,
      roundHours((hoursByTaskMap.get(entry.task) ?? 0) + entry.hours),
    );
  }

  const hoursByDay = Array.from(hoursByDayMap.entries())
    .map(([date, hours]) => ({
      date,
      label: formatDateBR(date, "dd/MM"),
      hours,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hoursByActivity = Array.from(hoursByActivityMap.entries())
    .map(([activity, hours]) => ({ activity, hours }))
    .sort((a, b) => b.hours - a.hours);

  const hoursByUser = Array.from(hoursByUserMap.entries())
    .map(([userName, hours]) => ({ userName, hours }))
    .sort((a, b) => b.hours - a.hours);

  const topTasks = Array.from(hoursByTaskMap.entries())
    .map(([task, hours]) => ({ task, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  const summaryEntries: DashboardSummaryEntry[] = entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userName: entry.user.name,
    task: entry.task,
    activity: entry.activity,
    hours: entry.hours,
    comment: entry.comment,
    status: entry.status,
  }));

  const hoursByStatus: HoursByStatus = {
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  };

  for (const entry of entries) {
    switch (entry.status) {
      case TIME_ENTRY_STATUS.DRAFT:
        hoursByStatus.draft += entry.hours;
        break;
      case TIME_ENTRY_STATUS.SUBMITTED:
        hoursByStatus.submitted += entry.hours;
        break;
      case TIME_ENTRY_STATUS.APPROVED:
        hoursByStatus.approved += entry.hours;
        break;
      case TIME_ENTRY_STATUS.REJECTED:
        hoursByStatus.rejected += entry.hours;
        break;
    }
  }

  hoursByStatus.draft = roundHours(hoursByStatus.draft);
  hoursByStatus.submitted = roundHours(hoursByStatus.submitted);
  hoursByStatus.approved = roundHours(hoursByStatus.approved);
  hoursByStatus.rejected = roundHours(hoursByStatus.rejected);

  let pendingApprovals: PendingApprovalsSummary | null = null;

  if (isAdminOrManager(session)) {
    const pendingEntries = await prisma.timeEntry.findMany({
      where: {
        ...scopeWhere,
        status: TIME_ENTRY_STATUS.SUBMITTED,
        ...(filters.activity ? { activity: filters.activity } : {}),
      },
      include: { user: { select: { name: true } } },
    });

    const pendingByUser = new Map<string, { count: number; hours: number }>();

    for (const entry of pendingEntries) {
      const current = pendingByUser.get(entry.user.name) ?? {
        count: 0,
        hours: 0,
      };
      current.count += 1;
      current.hours += entry.hours;
      pendingByUser.set(entry.user.name, current);
    }

    const topUsers = Array.from(pendingByUser.entries())
      .map(([userName, value]) => ({
        userName,
        count: value.count,
        hours: roundHours(value.hours),
      }))
      .sort((a, b) => b.count - a.count || b.hours - a.hours)
      .slice(0, 5);

    pendingApprovals = {
      totalEntries: pendingEntries.length,
      totalHours: roundHours(
        pendingEntries.reduce((sum, entry) => sum + entry.hours, 0),
      ),
      topUsers,
    };
  }

  let balance: DashboardBalanceSummary | null = null;
  let balanceOverview: BalanceOverview | null = null;

  if (focusedUserId) {
    const hb = await getHourBalanceData({
      userId: focusedUserId,
      userName: "",
      start,
      end,
      scope: DEFAULT_BALANCE_SCOPE,
    });

    balance = {
      expectedHours: hb.expectedHours,
      workedHours: hb.workedHours,
      differenceHours: hb.balanceHours,
      accumulatedBalanceHours: hb.accumulatedBalanceHours,
      cumulativeSeries: hb.cumulativeSeries,
    };
  } else if (isAdminOrManager(session)) {
    balanceOverview = await getBalanceOverview({
      start,
      end,
      scope: DEFAULT_BALANCE_SCOPE,
      session,
    });
  }

  return {
    totalHours,
    totalEntries,
    averageHoursPerDay,
    hoursToday,
    hoursByDay,
    hoursByActivity,
    hoursByUser,
    topTasks,
    entries: summaryEntries,
    hoursByStatus,
    pendingApprovals,
    balance,
    balanceOverview,
  };
}
