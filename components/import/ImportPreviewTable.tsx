"use client";

import { format } from "date-fns";

import type { ValidatedImportRow } from "@/types/import";

interface ImportPreviewTableProps {
  rows: ValidatedImportRow[];
}

const statusStyles = {
  valid: "bg-green-50 text-[#22C55E]",
  duplicate: "bg-amber-50 text-[#F59E0B]",
  error: "bg-red-50 text-[#EF4444]",
} as const;

const statusLabels = {
  valid: "Válido",
  duplicate: "Duplicado",
  error: "Erro",
} as const;

function formatRowDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return format(new Date(value), "dd/MM/yyyy");
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9EEF9]">
      <table className="min-w-full divide-y divide-[#D9EEF9] text-sm">
        <thead className="bg-[#F5FBFF]">
          <tr>
            {[
              "Linha",
              "Data",
              "Usuário",
              "Atividade",
              "Tarefa",
              "Comentário",
              "Horas",
              "Status",
            ].map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left font-semibold text-[#1E5F7A]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9EEF9] bg-white">
          {rows.map((row) => (
            <tr key={row.lineNumber}>
              <td className="px-4 py-3 text-[#1E5F7A]">{row.lineNumber}</td>
              <td className="px-4 py-3 text-[#1E5F7A]">
                {formatRowDate(row.date)}
              </td>
              <td className="px-4 py-3 text-[#1E5F7A]">{row.userName}</td>
              <td className="px-4 py-3 text-[#1E5F7A]">{row.activity || "—"}</td>
              <td className="px-4 py-3 text-[#1E5F7A]">{row.task || "—"}</td>
              <td className="max-w-xs truncate px-4 py-3 text-[#1E5F7A]">
                {row.comment || "—"}
              </td>
              <td className="px-4 py-3 text-[#1E5F7A]">
                <div>
                  <span>{row.hoursOriginal || "—"}</span>
                  {row.hoursDisplay &&
                  row.hoursOriginal &&
                  row.hoursDisplay !== row.hoursOriginal ? (
                    <span className="mt-0.5 block text-xs text-[#38A8D8]">
                      {row.hoursDisplay}
                    </span>
                  ) : row.hoursDisplay ? (
                    <span className="mt-0.5 block text-xs text-[#38A8D8]">
                      {row.hoursDisplay}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}
                  >
                    {statusLabels[row.status]}
                  </span>
                  {row.message ? (
                    <p className="text-xs text-[#EF4444]">{row.message}</p>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
