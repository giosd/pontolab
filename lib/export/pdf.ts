import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatDateBR, formatHours, formatSignedHours } from "@/lib/dates";
import { getTimeEntryStatusLabel } from "@/lib/time-entry-status";
import type {
  ExportBalanceSummary,
  ExportFilters,
  ExportSummary,
  ExportTimeEntry,
  PeriodReport,
} from "@/types";

import { downloadBlob, getExportFileName } from "./utils";

const COLORS = {
  primary: [30, 95, 122] as [number, number, number],
  accent: [56, 168, 216] as [number, number, number],
  light: [240, 248, 255] as [number, number, number],
  border: [214, 238, 248] as [number, number, number],
};

function formatPeriodLabel(filters: ExportFilters): string {
  if (filters.periodLabel && filters.startDate && filters.endDate) {
    return `${filters.periodLabel} (${formatDateBR(filters.startDate)} a ${formatDateBR(filters.endDate)})`;
  }

  if (filters.startDate && filters.endDate) {
    return `${formatDateBR(filters.startDate)} a ${formatDateBR(filters.endDate)}`;
  }

  return "Todos os períodos";
}

function formatAppliedFilters(filters: ExportFilters): string[] {
  const lines = [
    `Período: ${formatPeriodLabel(filters)}`,
    `Usuário: ${filters.userName || "Todos"}`,
    `Atividade: ${filters.activity || "Todas"}`,
  ];

  if (filters.task) {
    lines.push(`Tarefa: ${filters.task}`);
  }

  return lines;
}

export function exportTimeEntriesToPdf(
  data: ExportTimeEntry[],
  summary: ExportSummary,
  filters: ExportFilters,
  balance?: ExportBalanceSummary | null,
  periodReport?: PeriodReport | null,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFillColor(...COLORS.light);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(18);
  doc.text("Relatório PontoLab", margin, 16);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text(`Gerado em: ${formatDateBR(new Date())}`, margin, 24);

  let y = 30;
  for (const line of formatAppliedFilters(filters)) {
    doc.text(line, margin, y);
    y += 5;
  }

  const summaryY = 50;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, summaryY, pageWidth - margin * 2, 22, 3, 3, "FD");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.text(`Total de horas: ${formatHours(summary.totalHours)}`, margin + 4, summaryY + 9);
  doc.text(`Total de registros: ${summary.totalEntries}`, margin + 70, summaryY + 9);
  doc.text(
    `Média por dia: ${formatHours(summary.averageHoursPerDay)}`,
    margin + 130,
    summaryY + 9,
  );

  autoTable(doc, {
    startY: summaryY + 30,
    head: [
      ["Data", "Usuário", "Tarefa", "Atividade", "Status", "Horas", "Comentário"],
    ],
    body: data.map((entry) => [
      formatDateBR(entry.date),
      entry.userName,
      entry.task,
      entry.activity,
      entry.status ? getTimeEntryStatusLabel(entry.status) : "",
      formatHours(entry.hours),
      entry.comment ?? "",
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: COLORS.primary,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.accent,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    margin: { left: margin, right: margin },
  });

  if (balance) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.text("Resumo do Banco de Horas", margin, 18);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.accent);
    doc.text(`Usuário: ${balance.userName}`, margin, 26);
    doc.text(`Período: ${balance.periodLabel}`, margin, 31);

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(11);
    doc.text(
      `Esperado: ${formatHours(balance.expectedHours)}   Realizado: ${formatHours(balance.workedHours)}   Diferença: ${formatSignedHours(balance.balanceHours)}   Saldo acumulado: ${formatSignedHours(balance.accumulatedBalanceHours)}`,
      margin,
      40,
    );

    if (balance.dailyRows && balance.dailyRows.length > 0) {
      autoTable(doc, {
        startY: 46,
        head: [["Data", "Previsto", "Realizado", "Diferença", "Saldo acumulado"]],
        body: balance.dailyRows.map((row) => [
          formatDateBR(row.date),
          formatHours(row.expectedHours),
          formatHours(row.workedHours),
          formatSignedHours(row.differenceHours),
          formatSignedHours(row.cumulativeHours),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: COLORS.primary,
          lineColor: COLORS.border,
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: COLORS.accent,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: COLORS.light },
        margin: { left: margin, right: margin },
      });
    }
  }

  if (periodReport) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.text("Resumo executivo do período", margin, 18);

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.accent);
    doc.text(`Período: ${periodReport.summary.label}`, margin, 26);

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(11);
    doc.text(
      `Total: ${formatHours(periodReport.summary.totalHours)}   Aprovadas: ${formatHours(periodReport.summary.approvedHours)}   Pendentes: ${formatHours(periodReport.summary.pendingHours)}   Rejeitadas: ${formatHours(periodReport.summary.rejectedHours)}   Rascunho: ${formatHours(periodReport.summary.draftHours)}`,
      margin,
      34,
    );
    doc.text(
      `Registros: ${periodReport.summary.totalEntries}   Usuários: ${periodReport.summary.totalUsers}`,
      margin,
      40,
    );

    if (periodReport.byUser.length > 0) {
      autoTable(doc, {
        startY: 46,
        head: [["Usuário", "Totais", "Aprovadas", "Pendentes", "Rejeitadas", "Saldo"]],
        body: periodReport.byUser.map((user) => [
          user.userName,
          formatHours(user.totalHours),
          formatHours(user.approvedHours),
          formatHours(user.pendingHours),
          formatHours(user.rejectedHours),
          formatHours(user.balanceHours),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: COLORS.primary,
          lineColor: COLORS.border,
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: COLORS.accent,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: COLORS.light },
        margin: { left: margin, right: margin },
      });
    }
  }

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });
  }

  const pdfOutput = doc.output("arraybuffer");
  downloadBlob(pdfOutput, getExportFileName("pdf"), "application/pdf");
}
