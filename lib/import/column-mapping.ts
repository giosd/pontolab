import type { ColumnMapping, ImportField, MappedImportRow, RawImportRow } from "@/types/import";
import { COLUMN_ALIASES, IMPORT_FIELD_LABELS } from "@/types/import";

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function mapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeKey(header),
  }));

  for (const field of Object.keys(COLUMN_ALIASES) as ImportField[]) {
    const officialLabel = normalizeKey(IMPORT_FIELD_LABELS[field]);
    const aliases = COLUMN_ALIASES[field].map(normalizeKey);

    const match = normalizedHeaders.find(
      (header) =>
        header.normalized === officialLabel || aliases.includes(header.normalized),
    );

    if (match) {
      mapping[field] = match.original;
    }
  }

  return mapping;
}

export function applyColumnMapping(
  rows: RawImportRow[],
  mapping: ColumnMapping,
): MappedImportRow[] {
  return rows.map((row) => ({
    lineNumber: row.lineNumber,
    date: mapping.date ? row.values[mapping.date] ?? "" : "",
    user: mapping.user ? row.values[mapping.user] ?? "" : "",
    activity: mapping.activity ? row.values[mapping.activity] ?? "" : "",
    task: mapping.task ? row.values[mapping.task] ?? "" : "",
    comment: mapping.comment ? row.values[mapping.comment] ?? "" : "",
    hours: mapping.hours ? row.values[mapping.hours] ?? "" : "",
  }));
}
