"use client";

import { Card, StatCard } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { ImportValidationSummary } from "@/types/import";

interface ImportSummaryProps {
  summary: ImportValidationSummary;
}

export function ImportSummary({ summary }: ImportSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total de linhas" value={String(summary.totalRows)} />
      <StatCard label="Linhas válidas" value={String(summary.validRows)} />
      <StatCard label="Linhas com erro" value={String(summary.errorRows)} />
      <StatCard label="Linhas duplicadas" value={String(summary.duplicatedRows)} />
      <StatCard
        label="Total de horas válidas"
        value={formatHours(summary.totalValidHours)}
      />
    </div>
  );
}

interface ImportPeriodCardProps {
  minDate: string | null;
  maxDate: string | null;
}

export function ImportPeriodCard({ minDate, maxDate }: ImportPeriodCardProps) {
  if (!minDate || !maxDate) {
    return null;
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR");

  return (
    <Card className="border-[#D9EEF9] bg-[#F5FBFF]">
      <p className="text-sm font-medium text-[#1E5F7A]">Período identificado</p>
      <p className="mt-2 text-base text-[#38A8D8]">
        {formatDate(minDate)} até {formatDate(maxDate)}
      </p>
    </Card>
  );
}
