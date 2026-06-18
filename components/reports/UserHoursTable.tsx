import { Card } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { ReportUserHours } from "@/types";

interface UserHoursTableProps {
  rows: ReportUserHours[];
}

const COLUMNS = [
  "Usuário",
  "Horas totais",
  "Aprovadas",
  "Pendentes",
  "Rejeitadas",
  "Saldo",
];

export function UserHoursTable({ rows }: UserHoursTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--app-border)] px-5 py-4">
        <h2 className="text-base font-medium text-[var(--app-text)]">
          Horas por usuário
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
          <thead className="bg-[var(--app-card-secondary)]">
            <tr>
              {COLUMNS.map((column) => (
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
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center text-[var(--app-text-muted)]"
                >
                  Nenhum registro no período.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-2.5 text-[var(--app-text)]">
                    {row.userName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.totalHours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.approvedHours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.pendingHours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.rejectedHours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[var(--app-text)]">
                    {formatHours(row.balanceHours)}
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
