import { endOfMonth, format, parseISO, startOfDay, endOfDay } from "date-fns";

import { isAdmin, isAdminOrManager, type SessionUser } from "@/lib/auth";
import {
  DEFAULT_GOALS,
  resolveBalanceStatuses,
  type BalanceScope,
} from "@/lib/balance";
import {
  eachDayInRange,
  formatDateBR,
  getBusinessDays,
  isBusinessDay,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type {
  BalanceOverview,
  BalanceOverviewUser,
  HourBalanceData,
  HourBalanceDailyRow,
  MonthlyBalanceSummary,
  UserGoals,
} from "@/types";
import {
  userGoalsSchema,
  type UserGoalsFormData as GoalsInput,
} from "@/lib/validations";

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function settingsToGoals(settings: {
  dailyGoalHours: number;
  weeklyGoalHours: number;
  monthlyGoalHours: number;
  allowNegativeBalance: boolean;
  timerRoundingMinutes: number;
} | null): UserGoals {
  return {
    dailyGoalHours: settings?.dailyGoalHours ?? DEFAULT_GOALS.dailyGoalHours,
    weeklyGoalHours: settings?.weeklyGoalHours ?? DEFAULT_GOALS.weeklyGoalHours,
    monthlyGoalHours:
      settings?.monthlyGoalHours ?? DEFAULT_GOALS.monthlyGoalHours,
    allowNegativeBalance:
      settings?.allowNegativeBalance ?? DEFAULT_GOALS.allowNegativeBalance,
    timerRoundingMinutes:
      settings?.timerRoundingMinutes ?? DEFAULT_GOALS.timerRoundingMinutes,
  };
}

export async function getUserGoals(userId: string): Promise<UserGoals> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return settingsToGoals(settings);
}

function assertGoalsAccess(targetUserId: string, session: SessionUser) {
  if (!isAdmin(session) && targetUserId !== session.userId) {
    throw new Error("Você só pode alterar as suas próprias metas.");
  }
}

export async function updateUserGoals(
  targetUserId: string,
  data: GoalsInput,
  session: SessionUser,
): Promise<UserGoals> {
  assertGoalsAccess(targetUserId, session);
  const parsed = userGoalsSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: targetUserId },
    create: {
      userId: targetUserId,
      dailyGoalHours: parsed.dailyGoalHours,
      weeklyGoalHours: parsed.weeklyGoalHours,
      monthlyGoalHours: parsed.monthlyGoalHours,
      timerRoundingMinutes: parsed.timerRoundingMinutes,
    },
    update: {
      dailyGoalHours: parsed.dailyGoalHours,
      weeklyGoalHours: parsed.weeklyGoalHours,
      monthlyGoalHours: parsed.monthlyGoalHours,
      timerRoundingMinutes: parsed.timerRoundingMinutes,
    },
  });

  return settingsToGoals(settings);
}

async function getWorkedHoursByDay(
  userId: string,
  start: Date,
  end: Date,
  statuses: string[],
): Promise<Map<string, number>> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      status: { in: statuses },
      date: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    select: { date: true, hours: true },
  });

  const map = new Map<string, number>();

  for (const entry of entries) {
    const key = dayKey(entry.date);
    map.set(key, (map.get(key) ?? 0) + entry.hours);
  }

  return map;
}

function buildDailyRows(
  start: Date,
  end: Date,
  dailyGoal: number,
  workedByDay: Map<string, number>,
): HourBalanceDailyRow[] {
  const rows: HourBalanceDailyRow[] = [];
  let cumulative = 0;

  for (const day of eachDayInRange(start, end)) {
    const key = dayKey(day);
    const business = isBusinessDay(day);
    const expected = business ? dailyGoal : 0;
    const worked = roundHours(workedByDay.get(key) ?? 0);
    const difference = roundHours(worked - expected);
    cumulative = roundHours(cumulative + difference);

    rows.push({
      date: key,
      label: formatDateBR(day, "dd/MM"),
      isBusinessDay: business,
      expectedHours: roundHours(expected),
      workedHours: worked,
      differenceHours: difference,
      cumulativeHours: cumulative,
    });
  }

  return rows;
}

async function getAccumulatedBalance(
  userId: string,
  untilDate: Date,
  statuses: string[],
  dailyGoal: number,
): Promise<number> {
  const firstEntry = await prisma.timeEntry.findFirst({
    where: { userId, status: { in: statuses } },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  if (!firstEntry) {
    return 0;
  }

  const anchor = startOfDay(firstEntry.date);

  if (anchor > untilDate) {
    return 0;
  }

  const aggregate = await prisma.timeEntry.aggregate({
    where: {
      userId,
      status: { in: statuses },
      date: { gte: anchor, lte: endOfDay(untilDate) },
    },
    _sum: { hours: true },
  });

  const worked = aggregate._sum.hours ?? 0;
  const expected = getBusinessDays(anchor, untilDate) * dailyGoal;

  return roundHours(worked - expected);
}

export async function getHourBalanceData(options: {
  userId: string;
  userName: string;
  start: Date;
  end: Date;
  scope: BalanceScope;
}): Promise<HourBalanceData> {
  const { userId, userName, start, end, scope } = options;
  const statuses = resolveBalanceStatuses(scope);
  const goals = await getUserGoals(userId);

  const workedByDay = await getWorkedHoursByDay(userId, start, end, statuses);
  const dailyRows = buildDailyRows(start, end, goals.dailyGoalHours, workedByDay);

  const businessDays = getBusinessDays(start, end);
  const expectedHours = roundHours(businessDays * goals.dailyGoalHours);
  const workedHours = roundHours(
    dailyRows.reduce((sum, row) => sum + row.workedHours, 0),
  );
  const balanceHours = roundHours(workedHours - expectedHours);

  const accumulatedBalanceHours = await getAccumulatedBalance(
    userId,
    end,
    statuses,
    goals.dailyGoalHours,
  );

  const cumulativeSeries = dailyRows.map((row) => ({
    date: row.date,
    label: row.label,
    balance: row.cumulativeHours,
  }));

  return {
    userId,
    userName,
    goals,
    businessDays,
    expectedHours,
    workedHours,
    balanceHours,
    accumulatedBalanceHours,
    dailyRows,
    cumulativeSeries,
  };
}

export async function getMonthlyBalanceSummary(
  userId: string,
  year: number,
  scope: BalanceScope,
): Promise<MonthlyBalanceSummary> {
  const statuses = resolveBalanceStatuses(scope);
  const goals = await getUserGoals(userId);

  const yearStart = startOfDay(new Date(year, 0, 1));
  const yearEnd = endOfDay(new Date(year, 11, 31));

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      status: { in: statuses },
      date: { gte: yearStart, lte: yearEnd },
    },
    select: { date: true, hours: true },
  });

  const workedByMonth = new Array(12).fill(0);

  for (const entry of entries) {
    workedByMonth[entry.date.getMonth()] += entry.hours;
  }

  const monthLabels = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const rows = monthLabels.map((label, month) => {
    const monthStart = startOfDay(new Date(year, month, 1));
    const monthEnd = endOfMonth(monthStart);
    const businessDays = getBusinessDays(monthStart, monthEnd);
    const expectedHours = roundHours(businessDays * goals.dailyGoalHours);
    const workedHours = roundHours(workedByMonth[month]);
    const balanceHours = roundHours(workedHours - expectedHours);

    return { month, label, expectedHours, workedHours, balanceHours };
  });

  return {
    year,
    rows,
    totalExpectedHours: roundHours(
      rows.reduce((sum, row) => sum + row.expectedHours, 0),
    ),
    totalWorkedHours: roundHours(
      rows.reduce((sum, row) => sum + row.workedHours, 0),
    ),
    totalBalanceHours: roundHours(
      rows.reduce((sum, row) => sum + row.balanceHours, 0),
    ),
  };
}

export async function getBalanceOverview(options: {
  start: Date;
  end: Date;
  scope: BalanceScope;
  session: SessionUser;
}): Promise<BalanceOverview> {
  if (!isAdminOrManager(options.session)) {
    throw new Error("Apenas administradores e gestores podem consultar o panorama.");
  }

  const { start, end, scope, session } = options;
  const statuses = resolveBalanceStatuses(scope);
  const businessDays = getBusinessDays(start, end);

  const teamFilter =
    session.role === "GESTOR" && session.teamId
      ? { teamId: session.teamId }
      : {};

  const users = await prisma.user.findMany({
    where: { active: true, ...teamFilter },
    select: {
      id: true,
      name: true,
      settings: { select: { dailyGoalHours: true } },
    },
    orderBy: { name: "asc" },
  });

  const grouped = await prisma.timeEntry.groupBy({
    by: ["userId"],
    where: {
      status: { in: statuses },
      date: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    _sum: { hours: true },
  });

  const workedByUser = new Map<string, number>();
  for (const item of grouped) {
    workedByUser.set(item.userId, item._sum.hours ?? 0);
  }

  const overviewUsers: BalanceOverviewUser[] = users.map((user) => {
    const dailyGoal =
      user.settings?.dailyGoalHours ?? DEFAULT_GOALS.dailyGoalHours;
    const expectedHours = roundHours(businessDays * dailyGoal);
    const workedHours = roundHours(workedByUser.get(user.id) ?? 0);
    const balanceHours = roundHours(workedHours - expectedHours);

    return {
      userId: user.id,
      userName: user.name,
      expectedHours,
      workedHours,
      balanceHours,
    };
  });

  const byBalanceDesc = [...overviewUsers].sort(
    (a, b) => b.balanceHours - a.balanceHours,
  );
  const byBalanceAsc = [...overviewUsers].sort(
    (a, b) => a.balanceHours - b.balanceHours,
  );

  return {
    users: overviewUsers,
    topPositive: byBalanceDesc.filter((u) => u.balanceHours > 0).slice(0, 5),
    topNegative: byBalanceAsc.filter((u) => u.balanceHours < 0).slice(0, 5),
    belowGoal: byBalanceAsc.filter((u) => u.balanceHours < 0),
    aboveGoal: byBalanceDesc.filter((u) => u.balanceHours > 0),
  };
}

export async function recalculateBalance(options: {
  userId: string;
  start: Date;
  end: Date;
  scope: BalanceScope;
  session: SessionUser;
}) {
  const { userId, start, end, scope, session } = options;

  if (!isAdmin(session) && userId !== session.userId) {
    throw new Error("Você só pode recalcular o seu próprio banco de horas.");
  }

  const goals = await getUserGoals(userId);
  const statuses = resolveBalanceStatuses(scope);

  const aggregate = await prisma.timeEntry.aggregate({
    where: {
      userId,
      status: { in: statuses },
      date: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    _sum: { hours: true },
  });

  const workedHours = roundHours(aggregate._sum.hours ?? 0);
  const expectedHours = roundHours(
    getBusinessDays(start, end) * goals.dailyGoalHours,
  );
  const balanceHours = roundHours(workedHours - expectedHours);

  const periodStart = startOfDay(start);
  const periodEnd = endOfDay(end);

  const existing = await prisma.hourBalance.findFirst({
    where: { userId, periodStart, periodEnd },
    select: { id: true },
  });

  if (existing) {
    return prisma.hourBalance.update({
      where: { id: existing.id },
      data: { expectedHours, workedHours, balanceHours },
    });
  }

  return prisma.hourBalance.create({
    data: {
      userId,
      periodStart,
      periodEnd,
      expectedHours,
      workedHours,
      balanceHours,
    },
  });
}

export async function getBalanceExportEntries(options: {
  userId: string;
  start: Date;
  end: Date;
  scope: BalanceScope;
}) {
  const { userId, start, end, scope } = options;
  const statuses = resolveBalanceStatuses(scope);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      status: { in: statuses },
      date: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return entries.map((entry) => ({
    date: entry.date,
    userName: entry.user.name,
    task: entry.task,
    activity: entry.activity,
    hours: entry.hours,
    comment: entry.comment,
    status: entry.status,
  }));
}

export function parseYearFromDate(value?: string): number {
  if (value) {
    const parsed = parseISO(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
  }

  return new Date().getFullYear();
}
