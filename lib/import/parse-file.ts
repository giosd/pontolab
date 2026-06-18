import Papa from "papaparse";
import * as XLSX from "xlsx";

import type { ParseFileResult, RawImportRow } from "@/types/import";

export function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;

  return semicolons > commas ? ";" : ",";
}

function decodeCsvContent(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  if (utf8.includes("\uFFFD") && buffer.byteLength > 0) {
    try {
      return new TextDecoder("iso-8859-1").decode(buffer);
    } catch {
      return utf8;
    }
  }

  if (utf8.charCodeAt(0) === 0xfeff) {
    return utf8.slice(1);
  }

  return utf8;
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header, index) => {
    const trimmed = header?.trim();
    return trimmed || `Coluna ${index + 1}`;
  });
}

function rowsFromMatrix(matrix: string[][]): ParseFileResult {
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = normalizeHeaders(matrix[0].map((cell) => String(cell ?? "")));
  const rows: RawImportRow[] = matrix
    .slice(1)
    .map((row, index) => {
      const values: Record<string, string> = {};

      headers.forEach((header, columnIndex) => {
        values[header] = String(row[columnIndex] ?? "").trim();
      });

      const hasContent = Object.values(values).some((value) => value.length > 0);

      if (!hasContent) {
        return null;
      }

      return {
        lineNumber: index + 2,
        values,
      };
    })
    .filter((row): row is RawImportRow => row !== null);

  return { headers, rows };
}

export function parseCsvFile(file: File): Promise<ParseFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const content = decodeCsvContent(buffer);
        const delimiter = detectDelimiter(content);

        const parsed = Papa.parse<string[]>(content, {
          delimiter,
          skipEmptyLines: true,
        });

        if (parsed.errors.length > 0 && parsed.data.length === 0) {
          reject(new Error("Não foi possível ler o arquivo CSV."));
          return;
        }

        const result = rowsFromMatrix(parsed.data as string[][]);
        resolve({ ...result, delimiter });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler o arquivo CSV."));
    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelFile(file: File): Promise<ParseFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: false });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
          header: 1,
          defval: "",
          raw: false,
        }) as string[][];

        resolve(rowsFromMatrix(matrix));
      } catch {
        reject(new Error("Não foi possível ler o arquivo Excel."));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler o arquivo Excel."));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<ParseFileResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsvFile(file);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseExcelFile(file);
  }

  throw new Error("Formato não suportado. Use CSV, XLSX ou XLS.");
}

export function generateTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const data = [
    ["Data", "Usuário", "Atividade", "Tarefa", "Comentário", "Horas"],
    [
      "24/04/2026",
      "Giovanni",
      "Desenvolvimento",
      "Dashboard Financeiro",
      "Ajuste gráfico",
      "2.50",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, "Modelo");

  return workbook;
}

export function downloadImportTemplate() {
  const workbook = generateTemplateWorkbook();
  XLSX.writeFile(workbook, "pontolab-modelo-importacao.xlsx");
}
