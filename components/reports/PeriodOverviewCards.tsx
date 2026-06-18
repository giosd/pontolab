import { StatCard } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { ReportPeriodSummary } from "@/types";

interface PeriodOverviewCardsProps {
  summary: ReportPeriodSummary;
}

export function PeriodOverviewCards({ summary }: PeriodOverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total do período" value={formatHours(summary.totalHours)} />
      <StatCard label="Horas aprovadas" value={formatHours(summary.approvedHours)} />
      <StatCard label="Horas pendentes" value={formatHours(summary.pendingHours)} />
      <StatCard label="Horas rejeitadas" value={formatHours(summary.rejectedHours)} />
      <StatCard label="Horas em rascunho" value={formatHours(summary.draftHours)} />
    </div>
  );
}
