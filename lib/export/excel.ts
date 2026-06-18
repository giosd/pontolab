import ExcelJS from "exceljs";

import { formatDateBR, formatHours, formatSignedHours } from "@/lib/dates";
import { getTimeEntryStatusLabel } from "@/lib/time-entry-status";
import type {
  ExportBalanceSummary,
  ExportFilters,
  ExportSummary,
  ExportTimeEntry,
  PeriodReport,
} from "@/types";

import {
  aggregateHoursByActivity,
  aggregateHoursByUser,
  downloadBlob,
  getExportFileName,
} from "./utils";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF38A8D8" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 22;
}

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 12;

    if (column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value?.toString() ?? "";
        maxLength = Math.max(maxLength, value.length + 2);
      });
    }

    column.width = Math.min(maxLength, 48);
  });
}

function formatPeriodLabel(filters: ExportFilters): string {
  if (filters.periodLabel && filters.startDate && filters.endDate) {
    return `${filters.periodLabel} (${formatDateBR(filters.startDate)} a ${formatDateBR(filters.endDate)})`;
  }

  if (filters.startDate && filters.endDate) {
    return `${formatDateBR(filters.startDate)} a ${formatDateBR(filters.endDate)}`;
  }

  return "Todos os períodos";
}

function addBalanceSheet(
  workbook: ExcelJS.Workbook,
  balance: ExportBalanceSummary,
) {
  const sheet = workbook.addWorksheet("Banco de Horas");

  sheet.addRow(["Banco de Horas"]);
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E5F7A" } };
  sheet.addRow([]);
  sheet.addRow(["Usuário", balance.userName]);
  sheet.addRow(["Período", balance.periodLabel]);
  sheet.addRow(["Horas esperadas", formatHours(balance.expectedHours)]);
  sheet.addRow(["Horas realizadas", formatHours(balance.workedHours)]);
  sheet.addRow(["Diferença no período", formatSignedHours(balance.balanceHours)]);
  sheet.addRow([
    "Saldo acumulado",
    formatSignedHours(balance.accumulatedBalanceHours),
  ]);
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 28;

  if (balance.dailyRows && balance.dailyRows.length > 0) {
    sheet.addRow([]);
    const headerRowIndex = sheet.rowCount + 1;
    sheet.addRow([
      "Data",
      "Previsto",
      "Realizado",
      "Diferença",
      "Saldo acumulado",
    ]);
    styleHeaderRow(sheet.getRow(headerRowIndex));

    for (const row of balance.dailyRows) {
      sheet.addRow([
        formatDateBR(row.date),
        formatHours(row.expectedHours),
        formatHours(row.workedHours),
        formatSignedHours(row.differenceHours),
        formatSignedHours(row.cumulativeHours),
      ]);
    }
  }

  if (balance.monthly && balance.monthly.rows.length > 0) {
    sheet.addRow([]);
    const headerRowIndex = sheet.rowCount + 1;
    sheet.addRow(["Mês", "Esperado", "Realizado", "Saldo"]);
    styleHeaderRow(sheet.getRow(headerRowIndex));

    for (const row of balance.monthly.rows) {
      sheet.addRow([
        row.label,
        formatHours(row.expectedHours),
        formatHours(row.workedHours),
        formatSignedHours(row.balanceHours),
      ]);
    }

    sheet.addRow([
      "Total",
      formatHours(balance.monthly.totalExpectedHours),
      formatHours(balance.monthly.totalWorkedHours),
      formatSignedHours(balance.monthly.totalBalanceHours),
    ]);
  }
}

function addPeriodSummarySheet(
  workbook: ExcelJS.Workbook,
  report: PeriodReport,
) {
  const sheet = workbook.addWorksheet("Resumo Período");

  sheet.addRow(["Resumo do Período"]);
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E5F7A" } };
  sheet.addRow([]);
  sheet.addRow(["Período", report.summary.label]);
  sheet.addRow(["Total de horas", formatHours(report.summary.totalHours)]);
  sheet.addRow(["Horas aprovadas", formatHours(report.summary.approvedHours)]);
  sheet.addRow(["Horas pendentes", formatHours(report.summary.pendingHours)]);
  sheet.addRow(["Horas rejeitadas", formatHours(report.summary.rejectedHours)]);
  sheet.addRow(["Horas em rascunho", formatHours(report.summary.draftHours)]);
  sheet.addRow(["Quantidade de registros", report.summary.totalEntries]);
  sheet.addRow(["Quantidade de usuários", report.summary.totalUsers]);
  sheet.getColumn(1).width = 26;
  sheet.getColumn(2).width = 24;

  if (report.byUser.length > 0) {
    sheet.addRow([]);
    const headerIndex = sheet.rowCount + 1;
    sheet.addRow(["Usuário", "Totais", "Aprovadas", "Pendentes", "Rejeitadas", "Saldo"]);
    styleHeaderRow(sheet.getRow(headerIndex));

    for (const user of report.byUser) {
      sheet.addRow([
        user.userName,
        formatHours(user.totalHours),
        formatHours(user.approvedHours),
        formatHours(user.pendingHours),
        formatHours(user.rejectedHours),
        formatHours(user.balanceHours),
      ]);
    }
  }

  if (report.byActivity.length > 0) {
    sheet.addRow([]);
    const headerIndex = sheet.rowCount + 1;
    sheet.addRow(["Atividade", "Horas", "%"]);
    styleHeaderRow(sheet.getRow(headerIndex));

    for (const activity of report.byActivity) {
      sheet.addRow([
        activity.activity,
        formatHours(activity.hours),
        `${activity.percentage}%`,
      ]);
    }
  }
}

export async function exportTimeEntriesToExcel(
  data: ExportTimeEntry[],
  summary: ExportSummary,
  filters: ExportFilters,
  balance?: ExportBalanceSummary | null,
  periodReport?: PeriodReport | null,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PontoLab";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.addRow(["Relatório PontoLab"]);
  summarySheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF1E5F7A" } };
  summarySheet.addRow([]);
  summarySheet.addRow(["Período", formatPeriodLabel(filters)]);
  summarySheet.addRow(["Usuário", filters.userName || "Todos"]);
  summarySheet.addRow(["Atividade", filters.activity || "Todas"]);
  if (filters.task) {
    summarySheet.addRow(["Tarefa", filters.task]);
  }
  summarySheet.addRow([]);
  summarySheet.addRow(["Total de horas", summary.totalHours]);
  summarySheet.addRow(["Total de registros", summary.totalEntries]);
  summarySheet.addRow(["Média por dia", summary.averageHoursPerDay]);
  summarySheet.getColumn(1).width = 22;
  summarySheet.getColumn(2).width = 36;

  const entriesSheet = workbook.addWorksheet("Registros");
  entriesSheet.addRow([
    "Data",
    "Usuário",
    "Tarefa",
    "Atividade",
    "Status",
    "Horas",
    "Horas formatadas",
    "Comentário",
  ]);
  styleHeaderRow(entriesSheet.getRow(1));

  for (const entry of data) {
    const row = entriesSheet.addRow([
      formatDateBR(entry.date),
      entry.userName,
      entry.task,
      entry.activity,
      entry.status ? getTimeEntryStatusLabel(entry.status) : "",
      entry.hours,
      formatHours(entry.hours),
      entry.comment ?? "",
    ]);
    row.getCell(6).numFmt = "0.00";
  }

  autoFitColumns(entriesSheet);

  const activitySheet = workbook.addWorksheet("Resumo por atividade");
  activitySheet.addRow(["Atividade", "Total de horas"]);
  styleHeaderRow(activitySheet.getRow(1));

  for (const item of aggregateHoursByActivity(data)) {
    const row = activitySheet.addRow([item.activity, item.hours]);
    row.getCell(2).numFmt = "0.00";
  }

  autoFitColumns(activitySheet);

  const userSheet = workbook.addWorksheet("Resumo por usuário");
  userSheet.addRow(["Usuário", "Total de horas"]);
  styleHeaderRow(userSheet.getRow(1));

  for (const item of aggregateHoursByUser(data)) {
    const row = userSheet.addRow([item.userName, item.hours]);
    row.getCell(2).numFmt = "0.00";
  }

  autoFitColumns(userSheet);

  if (balance) {
    addBalanceSheet(workbook, balance);
  }

  if (periodReport) {
    addPeriodSummarySheet(workbook, periodReport);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    buffer,
    getExportFileName("xlsx"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
