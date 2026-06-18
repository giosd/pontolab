import { Card } from "@/components/ui/Card";
import { formatSignedHours } from "@/lib/dates";

interface BalanceStatCardProps {
  label: string;
  hours: number;
}

export function BalanceStatCard({ label, hours }: BalanceStatCardProps) {
  const colorClass =
    hours > 0
      ? "text-green-600 dark:text-green-400"
      : hours < 0
        ? "text-red-600 dark:text-red-400"
        : "text-[var(--app-text)]";

  return (
    <Card>
      <p className="text-sm font-medium text-[var(--app-text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colorClass}`}>
        {formatSignedHours(hours)}
      </p>
    </Card>
  );
}
