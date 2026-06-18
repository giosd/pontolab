"use server";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  getAuditLogById,
  getAuditLogsForExport,
  logExport,
} from "@/lib/services/audit.service";
import type { AuditFilters } from "@/types/audit";
import type { ExportFilters } from "@/types";

export async function logExportAction(params: {
  format: "excel" | "pdf";
  filters: ExportFilters;
  totalRows: number;
  totalHours: number;
}) {
  const session = await requireAuth();

  await logExport({
    description: `Relatório exportado (${params.format.toUpperCase()}).`,
    newData: {
      format: params.format,
      filters: params.filters,
      totalRows: params.totalRows,
      totalHours: params.totalHours,
    },
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
    },
  });
}

export async function getAuditLogDetailAction(id: string) {
  await requireAdmin();
  return getAuditLogById(id);
}

export async function getAuditExportDataAction(filters: AuditFilters) {
  await requireAdmin();
  return getAuditLogsForExport(filters);
}

export async function logAuditExportAction(params: {
  format: "excel" | "pdf";
  filters: AuditFilters;
  totalRows: number;
}) {
  const session = await requireAdmin();

  await logExport({
    description: `Auditoria exportada (${params.format.toUpperCase()}).`,
    newData: {
      format: params.format,
      filters: params.filters,
      totalRows: params.totalRows,
    },
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
    },
  });
}
