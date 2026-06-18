import { Suspense } from "react";

import { ExportButtons } from "@/components/export/ExportButtons";
import { ActivityHoursTable } from "@/components/reports/ActivityHoursTable";
import { PeriodOverviewCards } from "@/components/reports/PeriodOverviewCards";
import { PeriodSelector } from "@/components/reports/PeriodSelector";
import { PeriodSummary } from "@/components/reports/PeriodSummary";
import { TaskHoursTable } from "@/components/reports/TaskHoursTable";
import { UserHoursTable } from "@/components/reports/UserHoursTable";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  resolveReportDateRange,
  type ReportPeriodValue,
} from "@/lib/accounting-period";
import { isAdminOrManager } from "@/lib/auth";
import { buildExportSummary } from "@/lib/export/utils";
import { getPeriodReport } from "@/lib/services/reports.service";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getTimeEntries } from "@/lib/services/time-entries";
import { getScopedUsers } from "@/lib/services/users";
import type { ExportFilters, ReportFilters } from "@/types";

export const dynamic = "force-dynamic";

interface RelatoriosPageProps {
  searchParams: Promise<{
    userId?: string;
    activity?: string;
    status?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function RelatoriosPage({
  searchParams,
}: RelatoriosPageProps) {
  const session = await requireModuleAccess("RELATORIOS");
  const params = await searchParams;
  const admin = isAdminOrManager(session);

  const period = (params.period as ReportPeriodValue) || "period_current";
  const range = resolveReportDateRange(period, params.startDate, params.endDate);

  const filters: ReportFilters = {
    userId: admin ? params.userId : session.userId,
    activity: params.activity,
    status: params.status,
    startDate: range.startDate,
    endDate: range.endDate,
  };

  const [report, users, entries] = await Promise.all([
    getPeriodReport(filters, session),
    admin ? getScopedUsers(session) : Promise.resolve([]),
    getTimeEntries(
      {
        userId: filters.userId,
        activity: filters.activity,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      session,
    ),
  ]);

  const exportData = entries.map((entry) => ({
    date: entry.date,
    userName: entry.user.name,
    task: entry.task,
    activity: entry.activity,
    hours: entry.hours,
    comment: entry.comment,
    status: entry.status,
  }));

  const exportSummary = buildExportSummary(exportData, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const exportFilters: ExportFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    userName: admin
      ? users.find((user) => user.id === params.userId)?.name
      : session.name,
    activity: filters.activity,
    periodLabel: range.label,
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Período ${range.label} · ${range.startDate} → ${range.endDate}`}
      />

      <Suspense
        fallback={
          <div className="mb-6 h-32 animate-pulse rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)]" />
        }
      >
        <PeriodSelector users={users} isAdmin={admin} />
      </Suspense>

      <div className="mb-6">
        <ExportButtons
          data={exportData}
          summary={exportSummary}
          filters={exportFilters}
          periodReport={report}
          disabled={report.summary.totalEntries === 0}
        />
      </div>

      <PeriodOverviewCards summary={report.summary} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PeriodSummary summary={report.summary} />
        <ActivityHoursTable rows={report.byActivity} />
      </div>

      <div className="mt-6">
        <UserHoursTable rows={report.byUser} />
      </div>

      <div className="mt-6">
        <TaskHoursTable rows={report.byTask} />
      </div>
    </>
  );
}
