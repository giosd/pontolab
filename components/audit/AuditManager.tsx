"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { AuditDetailsModal } from "@/components/audit/AuditDetailsModal";
import { AuditTable } from "@/components/audit/AuditTable";
import { Button } from "@/components/ui/Button";
import {
  getAuditExportDataAction,
  getAuditLogDetailAction,
  logAuditExportAction,
} from "@/lib/actions/audit";
import type {
  AuditFilters,
  AuditLogDetail,
  AuditLogListItem,
} from "@/types/audit";

interface AuditManagerProps {
  items: AuditLogListItem[];
  filters: AuditFilters;
  page: number;
  totalPages: number;
  total: number;
}

export function AuditManager({
  items,
  filters,
  page,
  totalPages,
  total,
}: AuditManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const handleSelect = (id: string) => {
    setModalOpen(true);
    setLoadingDetail(true);
    setDetail(null);

    startTransition(async () => {
      const result = await getAuditLogDetailAction(id);
      setDetail(result);
      setLoadingDetail(false);
    });
  };

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    startTransition(() => {
      router.push(`/auditoria?${params.toString()}`);
    });
  };

  const handleExport = async (formatType: "excel" | "pdf") => {
    setExporting(formatType);

    try {
      const { items: exportItems, summary } =
        await getAuditExportDataAction(filters);

      if (formatType === "excel") {
        const { exportAuditLogsToExcel } = await import(
          "@/lib/export/audit-export"
        );
        await exportAuditLogsToExcel(exportItems, summary, filters);
      } else {
        const { exportAuditLogsToPdf } = await import(
          "@/lib/export/audit-export"
        );
        await exportAuditLogsToPdf(exportItems, summary, filters);
      }

      void logAuditExportAction({
        format: formatType,
        filters,
        totalRows: exportItems.length,
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--app-text-muted)]">
          {total} evento(s) encontrado(s).
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={exporting !== null || total === 0}
            onClick={() => handleExport("excel")}
          >
            {exporting === "excel" ? "Exportando..." : "Exportar Excel"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={exporting !== null || total === 0}
            onClick={() => handleExport("pdf")}
          >
            {exporting === "pdf" ? "Exportando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <AuditTable items={items} onSelect={handleSelect} />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1 || isPending}
            onClick={() => goToPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-[var(--app-text-muted)]">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages || isPending}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <AuditDetailsModal
        open={modalOpen}
        loading={loadingDetail}
        detail={detail}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
