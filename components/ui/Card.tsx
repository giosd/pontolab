import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--app-text)]">
        {value}
      </p>
    </Card>
  );
}
