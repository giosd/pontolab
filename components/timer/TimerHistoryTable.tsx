import { Card } from "@/components/ui/Card";
import { formatDateBR } from "@/lib/dates";
import {
  TIMER_STATUS_BADGE_CLASSES,
  getTimerStatusLabel,
  isTimerStatus,
} from "@/lib/timer/constants";
import { formatDuration } from "@/lib/timer/format";
import type { TimerHistoryItem } from "@/types";

interface TimerHistoryTableProps {
  items: TimerHistoryItem[];
}

const COLUMNS = ["Data", "Tarefa", "Atividade", "Tempo", "Status", "Registro"];

export function TimerHistoryTable({ items }: TimerHistoryTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--app-border)] px-5 py-4">
        <h2 className="text-base font-medium text-[var(--app-text)]">
          Histórico recente
        </h2>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Últimos {items.length} timers.
        </p>
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
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center text-[var(--app-text-muted)]"
                >
                  Nenhum timer registrado ainda.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatDateBR(item.startedAt, "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--app-text)]">
                    {item.task}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text-muted)]">
                    {item.activity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[var(--app-text)]">
                    {formatDuration(item.elapsedSeconds)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        isTimerStatus(item.status)
                          ? TIMER_STATUS_BADGE_CLASSES[item.status]
                          : ""
                      }`}
                    >
                      {getTimerStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text-muted)]">
                    {item.createdTimeEntryId ? "Sim" : "—"}
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
