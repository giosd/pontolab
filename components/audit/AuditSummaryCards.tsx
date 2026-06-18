import { StatCard } from "@/components/ui/Card";
import type { AuditSummary } from "@/types/audit";

interface AuditSummaryCardsProps {
  summary: AuditSummary;
}

export function AuditSummaryCards({ summary }: AuditSummaryCardsProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total de eventos" value={String(summary.totalEvents)} />
      <StatCard label="Eventos hoje" value={String(summary.eventsToday)} />
      <StatCard label="Logins" value={String(summary.logins)} />
      <StatCard
        label="Alterações críticas"
        value={String(summary.criticalChanges)}
      />
    </div>
  );
}
