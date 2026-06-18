import { Card } from "@/components/ui/Card";
import { formatDateBR, formatHours } from "@/lib/dates";
import type { DashboardSummaryEntry } from "@/types";

interface DashboardSummaryTableProps {
  entries: DashboardSummaryEntry[];
}

export function DashboardSummaryTable({ entries }: DashboardSummaryTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[#D6EEF8] px-5 py-4">
        <h2 className="text-base font-medium text-[#1E5F7A]">Resumo do período</h2>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#38A8D8]">
          Nenhum registro encontrado para o período selecionado.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-[#D6EEF8] text-sm">
              <thead className="bg-[#F0F8FF]">
                <tr>
                  {["Data", "Usuário", "Tarefa", "Atividade", "Horas"].map(
                    (column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-[#38A8D8]"
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6EEF8] bg-white">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F0F8FF]/60">
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {formatDateBR(entry.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {entry.userName}
                    </td>
                    <td className="px-4 py-3 text-[#1E5F7A]">{entry.task}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {entry.activity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {formatHours(entry.hours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[#D6EEF8] bg-[#F0F8FF]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#1E5F7A]">{entry.task}</p>
                    <p className="mt-1 text-sm text-[#38A8D8]">{entry.userName}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#1E5F7A]">
                    {formatHours(entry.hours)}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[#38A8D8]">Data</dt>
                    <dd className="text-[#1E5F7A]">{formatDateBR(entry.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#38A8D8]">Atividade</dt>
                    <dd className="text-[#1E5F7A]">{entry.activity}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
