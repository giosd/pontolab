import { Suspense } from "react";

import { BancoHorasManager } from "@/components/balance/BancoHorasManager";
import { isAdmin } from "@/lib/auth";
import {
  getBalancePeriodLabel,
  normalizeBalanceScope,
  type BalancePeriodValue,
} from "@/lib/balance";
import { formatDateBR, resolveBalanceDateRange } from "@/lib/dates";
import {
  getBalanceExportEntries,
  getBalanceOverview,
  getHourBalanceData,
  getMonthlyBalanceSummary,
  parseYearFromDate,
} from "@/lib/services/hour-balance";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getUsers } from "@/lib/services/users";
import { prisma } from "@/lib/prisma";
import type { ExportBalanceSummary, ExportFilters } from "@/types";

export const dynamic = "force-dynamic";

interface BancoHorasPageProps {
  searchParams: Promise<{
    userId?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
  }>;
}

export default async function BancoHorasPage({
  searchParams,
}: BancoHorasPageProps) {
  const session = await requireModuleAccess("BANCO_HORAS");
  const params = await searchParams;
  const admin = isAdmin(session);

  const period = (params.period as BalancePeriodValue) || "month";
  const range = resolveBalanceDateRange(period, params.startDate, params.endDate);
  const scope = normalizeBalanceScope(params.scope, admin);

  const selectedUserId = admin
    ? params.userId || session.userId
    : session.userId;
  const showOverview = admin && !params.userId;

  let userName = session.name;
  if (selectedUserId !== session.userId) {
    const target = await prisma.user.findUnique({
      where: { id: selectedUserId },
      select: { name: true },
    });
    userName = target?.name ?? "Usuário";
  }

  const year = parseYearFromDate(range.endDate);

  const [balance, monthly, overview, users, exportEntries] = await Promise.all([
    getHourBalanceData({
      userId: selectedUserId,
      userName,
      start: range.start,
      end: range.end,
      scope,
    }),
    getMonthlyBalanceSummary(selectedUserId, year, scope),
    showOverview
      ? getBalanceOverview({
          start: range.start,
          end: range.end,
          scope,
          session,
        })
      : Promise.resolve(null),
    admin ? getUsers() : Promise.resolve([]),
    getBalanceExportEntries({
      userId: selectedUserId,
      start: range.start,
      end: range.end,
      scope,
    }),
  ]);

  const periodLabel = `${getBalancePeriodLabel(period)} (${formatDateBR(range.startDate)} a ${formatDateBR(range.endDate)})`;

  const exportFilters: ExportFilters = {
    startDate: range.startDate,
    endDate: range.endDate,
    userName,
    periodLabel: getBalancePeriodLabel(period),
  };

  const exportBalance: ExportBalanceSummary = {
    userName,
    periodLabel,
    expectedHours: balance.expectedHours,
    workedHours: balance.workedHours,
    balanceHours: balance.balanceHours,
    accumulatedBalanceHours: balance.accumulatedBalanceHours,
    dailyRows: balance.dailyRows,
    monthly,
  };

  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)]" />
      }
    >
      <BancoHorasManager
        balance={balance}
        monthly={monthly}
        overview={overview}
        users={users}
        isAdmin={admin}
        exportEntries={exportEntries}
        exportBalance={exportBalance}
        exportFilters={exportFilters}
        recalcParams={{
          userId: selectedUserId,
          startDate: range.startDate,
          endDate: range.endDate,
          scope,
        }}
      />
    </Suspense>
  );
}
