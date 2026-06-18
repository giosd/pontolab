"use client";

import { format } from "date-fns";

import type { ImportBatchRecord } from "@/types/import";

interface ImportHistoryTableProps {
  batches: ImportBatchRecord[];
  showUser?: boolean;
}

export function ImportHistoryTable({
  batches,
  showUser = true,
}: ImportHistoryTableProps) {
  if (batches.length === 0) {
    return (
      <p className="text-sm text-[#38A8D8]">
        Nenhuma importação registrada até o momento.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9EEF9]">
      <table className="min-w-full divide-y divide-[#D9EEF9] text-sm">
        <thead className="bg-[#F5FBFF]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
              Data
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
              Arquivo
            </th>
            {showUser ? (
              <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
                Usuário
              </th>
            ) : null}
            <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
              Linhas
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
              Importadas
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#1E5F7A]">
              Erros
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9EEF9] bg-white">
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td className="px-4 py-3 text-[#1E5F7A]">
                {format(batch.createdAt, "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-4 py-3 text-[#1E5F7A]">{batch.fileName}</td>
              {showUser ? (
                <td className="px-4 py-3 text-[#1E5F7A]">
                  {batch.createdBy.name}
                </td>
              ) : null}
              <td className="px-4 py-3 text-[#1E5F7A]">{batch.totalRows}</td>
              <td className="px-4 py-3 text-[#1E5F7A]">{batch.importedRows}</td>
              <td className="px-4 py-3 text-[#1E5F7A]">{batch.errorRows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
