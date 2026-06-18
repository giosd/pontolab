import { Card } from "@/components/ui/Card";
import { formatDateBR, formatHours } from "@/lib/dates";
import type { ReportPeriodSummary } from "@/types";

interface PeriodSummaryProps {
  summary: ReportPeriodSummary;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--app-border)] py-2 last:border-0">
      <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--app-text)]">{value}</span>
    </div>
  );
}

export function PeriodSummary({ summary }: PeriodSummaryProps) {
  return (
    <Card>
      <h2 className="text-base font-medium text-[var(--app-text)]">
        Resumo do período
      </h2>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        {summary.label} · {formatDateBR(summary.startDate)} →{" "}
        {formatDateBR(summary.endDate)}
      </p>

      <div className="mt-4">
        <Row label="Total de horas" value={formatHours(summary.totalHours)} />
        <Row label="Horas aprovadas" value={formatHours(summary.approvedHours)} />
        <Row label="Horas pendentes" value={formatHours(summary.pendingHours)} />
        <Row label="Horas rejeitadas" value={formatHours(summary.rejectedHours)} />
        <Row label="Horas em rascunho" value={formatHours(summary.draftHours)} />
        <Row label="Quantidade de registros" value={String(summary.totalEntries)} />
        <Row label="Quantidade de usuários" value={String(summary.totalUsers)} />
      </div>
    </Card>
  );
}
