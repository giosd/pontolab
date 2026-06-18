import { Card } from "@/components/ui/Card";

interface CurrentPeriodCardProps {
  label: string;
  startLabel: string;
  endLabel: string;
}

export function CurrentPeriodCard({
  label,
  startLabel,
  endLabel,
}: CurrentPeriodCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-[var(--app-text-muted)]">
        Período Atual
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--app-text)]">
        {startLabel} → {endLabel}
      </p>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{label}</p>
    </Card>
  );
}
