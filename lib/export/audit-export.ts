import { format } from "date-fns";

import {
  getActionLabel,
  getEntityLabel,
} from "@/lib/audit/constants";
import type { AuditFilters, AuditLogListItem, AuditSummary } from "@/types/audit";

import { downloadBlob } from "./utils";

function formatDateTime(value: Date | string): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm:ss");
}

function auditFileName(extension: string): string {
  return `auditoria-pontolab-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
}

function describeFilters(filters: AuditFilters): string[] {
  const lines: string[] = [];

  lines.push(
    `Período: ${filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy") : "Início"} a ${filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy") : "Hoje"}`,
  );

  if (filters.action) {
    lines.push(`Ação: ${getActionLabel(filters.action)}`);
  }

  if (filters.entityType) {
    lines.push(`Entidade: ${getEntityLabel(filters.entityType)}`);
  }

  if (filters.search) {
    lines.push(`Busca: ${filters.search}`);
  }

  return lines;
}

export async function exportAuditLogsToExcel(
  items: AuditLogListItem[],
  summary: AuditSummary,
  filters: AuditFilters,
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PontoLab";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.addRow(["Auditoria PontoLab"]);
  summarySheet.getCell("A1").font = { bold: true, size: 16 };
  summarySheet.addRow([]);

  for (const line of describeFilters(filters)) {
    const [label, ...rest] = line.split(": ");
    summarySheet.addRow([label, rest.join(": ")]);
  }

  summarySheet.addRow([]);
  summarySheet.addRow(["Total de eventos", summary.totalEvents]);
  summarySheet.addRow(["Eventos hoje", summary.eventsToday]);
  summarySheet.addRow(["Logins", summary.logins]);
  summarySheet.addRow(["Alterações críticas", summary.criticalChanges]);
  summarySheet.getColumn(1).width = 24;
  summarySheet.getColumn(2).width = 40;

  const eventsSheet = workbook.addWorksheet("Eventos");
  eventsSheet.addRow([
    "Data/hora",
    "Usuário",
    "E-mail",
    "Ação",
    "Entidade",
    "Descrição",
    "IP",
  ]);
  eventsSheet.getRow(1).font = { bold: true };

  for (const item of items) {
    eventsSheet.addRow([
      formatDateTime(item.createdAt),
      item.userName ?? "—",
      item.userEmail ?? "—",
      getActionLabel(item.action),
      getEntityLabel(item.entityType),
      item.description ?? "",
      item.ipAddress ?? "—",
    ]);
  }

  eventsSheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      maxLength = Math.max(maxLength, (cell.value?.toString().length ?? 0) + 2);
    });
    column.width = Math.min(maxLength, 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    buffer,
    auditFileName("xlsx"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export async function exportAuditLogsToPdf(
  items: AuditLogListItem[],
  summary: AuditSummary,
  filters: AuditFilters,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFontSize(18);
  doc.setTextColor(30, 95, 122);
  doc.text("Auditoria PontoLab", margin, 16);

  doc.setFontSize(10);
  doc.setTextColor(56, 168, 216);
  doc.text(`Gerado em: ${formatDateTime(new Date())}`, margin, 23);

  let y = 30;
  for (const line of describeFilters(filters)) {
    doc.text(line, margin, y);
    y += 5;
  }

  doc.setTextColor(30, 95, 122);
  doc.text(
    `Eventos: ${summary.totalEvents} | Hoje: ${summary.eventsToday} | Logins: ${summary.logins} | Críticos: ${summary.criticalChanges}`,
    margin,
    y + 2,
  );

  autoTable(doc, {
    startY: y + 8,
    head: [["Data/hora", "Usuário", "Ação", "Entidade", "Descrição", "IP"]],
    body: items.map((item) => [
      formatDateTime(item.createdAt),
      item.userName ?? "—",
      getActionLabel(item.action),
      getEntityLabel(item.entityType),
      item.description ?? "",
      item.ipAddress ?? "—",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [56, 168, 216], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    margin: { left: margin, right: margin },
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(56, 168, 216);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });
  }

  downloadBlob(doc.output("arraybuffer"), auditFileName("pdf"), "application/pdf");
}
