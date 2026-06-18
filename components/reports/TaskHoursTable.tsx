import { Card } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { ReportTaskHours } from "@/types";

interface TaskHoursTableProps {
  rows: ReportTaskHours[];
}

export function TaskHoursTable({ rows }: TaskHoursTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--app-border)] px-5 py-4">
        <h2 className="text-base font-medium text-[var(--app-text)]">
          Horas por tarefa
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
          <thead className="bg-[var(--app-card-secondary)]">
            <tr>
              {["Tarefa", "Horas", "Lançamentos"].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-[var(--app-text-muted)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-[var(--app-text-muted)]"
                >
                  Nenhum registro no período.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.task}>
                  <td className="px-4 py-2.5 text-[var(--app-text)]">{row.task}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.hours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text-muted)]">
                    {row.count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
