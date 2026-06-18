"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { logExportAction } from "@/lib/actions/audit";
import type {
  ExportBalanceSummary,
  ExportFilters,
  ExportSummary,
  ExportTimeEntry,
  PeriodReport,
} from "@/types";

interface ExportButtonsProps {
  data: ExportTimeEntry[];
  summary: ExportSummary;
  filters: ExportFilters;
  balance?: ExportBalanceSummary | null;
  periodReport?: PeriodReport | null;
  disabled?: boolean;
}

export function ExportButtons({
  data,
  summary,
  filters,
  balance = null,
  periodReport = null,
  disabled = false,
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = disabled || data.length === 0 || loading !== null;

  const handleExcel = async () => {
    setError(null);
    setLoading("excel");

    try {
      const { exportTimeEntriesToExcel } = await import("@/lib/export/excel");
      await exportTimeEntriesToExcel(data, summary, filters, balance, periodReport);
      void logExportAction({
        format: "excel",
        filters,
        totalRows: data.length,
        totalHours: summary.totalHours,
      });
    } catch {
      setError("Não foi possível exportar o Excel. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  const handlePdf = async () => {
    setError(null);
    setLoading("pdf");

    try {
      const { exportTimeEntriesToPdf } = await import("@/lib/export/pdf");
      exportTimeEntriesToPdf(data, summary, filters, balance, periodReport);
      void logExportAction({
        format: "pdf",
        filters,
        totalRows: data.length,
        totalHours: summary.totalHours,
      });
    } catch {
      setError("Não foi possível exportar o PDF. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          onClick={handleExcel}
          disabled={isDisabled}
          className="sm:flex-1"
        >
          {loading === "excel" ? "Exportando Excel..." : "Exportar Excel"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handlePdf}
          disabled={isDisabled}
          className="sm:flex-1"
        >
          {loading === "pdf" ? "Exportando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {data.length === 0 ? (
        <p className="text-xs text-[var(--app-text-muted)]">
          Exportação disponível quando houver registros no período filtrado.
        </p>
      ) : null}
    </div>
  );
}
