import { Suspense } from "react";

import { RecentAuditEvents } from "@/components/audit/RecentAuditEvents";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { getCurrentAccountingPeriod } from "@/lib/accounting-period";
import { isAdmin, isAdminOrManager } from "@/lib/auth";
import { getPeriodLabel } from "@/lib/dashboard-periods";
import { formatDateBR, resolveDashboardDateRange, type DashboardPeriod } from "@/lib/dates";
import { getRecentAuditLogs } from "@/lib/services/audit.service";
import { getDashboardData } from "@/lib/services/dashboard";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getActiveTimer } from "@/lib/services/timer";
import { getScopedUsers } from "@/lib/services/users";
import type { ExportFilters } from "@/types";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    userId?: string;
    activity?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireModuleAccess("DASHBOARD");
  const params = await searchParams;
  const period = (params.period as DashboardPeriod) || "week";
  const admin = isAdmin(session);
  const canFilterUsers = isAdminOrManager(session);

  const range = resolveDashboardDateRange(
    period,
    params.startDate,
    params.endDate,
  );

  const dashboardFilters = {
    userId: canFilterUsers ? params.userId : session.userId,
    activity: params.activity,
    startDate: range.startDate,
    endDate: range.endDate,
  };

  const [users, data, recentEvents, activeTimer] = await Promise.all([
    canFilterUsers ? getScopedUsers(session) : Promise.resolve([]),
    getDashboardData(dashboardFilters, session),
    admin ? getRecentAuditLogs(10) : Promise.resolve([]),
    getActiveTimer(session.userId),
  ]);

  const exportFilters: ExportFilters = {
    startDate: range.startDate,
    endDate: range.endDate,
    userName: admin
      ? users.find((user) => user.id === params.userId)?.name
      : session.name,
    activity: params.activity,
    periodLabel: getPeriodLabel(period),
  };

  const accountingPeriod = getCurrentAccountingPeriod();
  const currentPeriod = {
    label: accountingPeriod.label,
    startLabel: formatDateBR(accountingPeriod.startDate),
    endLabel: formatDateBR(accountingPeriod.endDate),
  };

  return (
    <>
      <Suspense
        fallback={
          <div className="mb-6 h-32 animate-pulse rounded-2xl border border-[#D6EEF8] bg-white" />
        }
      >
        <DashboardFilters users={users} isAdmin={canFilterUsers} />
      </Suspense>

      <DashboardContent
        data={data}
        exportFilters={exportFilters}
        activeTimer={activeTimer}
        currentPeriod={currentPeriod}
      />

      {admin ? (
        <div className="mt-6">
          <RecentAuditEvents events={recentEvents} />
        </div>
      ) : null}
    </>
  );
}
