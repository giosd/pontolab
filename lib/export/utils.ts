import { endOfDay, max, min, parseISO, startOfDay } from "date-fns";

import { countDaysInRange } from "@/lib/dates";
import type { ExportSummary, ExportTimeEntry, TimeEntryFilters } from "@/types";

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildExportSummary(
  entries: Pick<ExportTimeEntry, "hours" | "date">[],
  filters: Pick<TimeEntryFilters, "startDate" | "endDate">,
): ExportSummary {
  const totalHours = roundHours(entries.reduce((sum, entry) => sum + entry.hours, 0));
  const totalEntries = entries.length;

  let daysInRange = 1;

  if (filters.startDate && filters.endDate) {
    daysInRange = countDaysInRange(
      startOfDay(parseISO(filters.startDate)),
      endOfDay(parseISO(filters.endDate)),
    );
  } else if (entries.length > 0) {
    const dates = entries.map((entry) =>
      startOfDay(typeof entry.date === "string" ? parseISO(entry.date) : entry.date),
    );
    daysInRange = countDaysInRange(min(dates), max(dates));
  }

  const averageHoursPerDay = roundHours(
    daysInRange > 0 ? totalHours / daysInRange : 0,
  );

  return { totalHours, totalEntries, averageHoursPerDay };
}

export function aggregateHoursByActivity(entries: ExportTimeEntry[]) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    map.set(entry.activity, roundHours((map.get(entry.activity) ?? 0) + entry.hours));
  }

  return Array.from(map.entries())
    .map(([activity, hours]) => ({ activity, hours }))
    .sort((a, b) => b.hours - a.hours);
}

export function aggregateHoursByUser(entries: ExportTimeEntry[]) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    map.set(entry.userName, roundHours((map.get(entry.userName) ?? 0) + entry.hours));
  }

  return Array.from(map.entries())
    .map(([userName, hours]) => ({ userName, hours }))
    .sort((a, b) => b.hours - a.hours);
}

import { formatFileDate } from "@/lib/dates";

export function getExportFileName(extension: "xlsx" | "pdf"): string {
  return `pontolab-relatorio-${formatFileDate()}.${extension}`;
}

export function downloadBlob(buffer: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
