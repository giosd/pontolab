import { format } from "date-fns";

import { Card } from "@/components/ui/Card";
import { getActionLabel } from "@/lib/audit/constants";
import type { AuditLogListItem } from "@/types/audit";

interface RecentAuditEventsProps {
  events: AuditLogListItem[];
}

export function RecentAuditEvents({ events }: RecentAuditEventsProps) {
  return (
    <Card>
      <h2 className="text-base font-medium text-[var(--app-text)]">
        Últimos eventos
      </h2>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        Atividades recentes registradas pela auditoria.
      </p>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--app-text-muted)]">
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--app-border)]">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[var(--app-text)]">
                  {event.userName ?? event.userEmail ?? "Sistema"} ·{" "}
                  {getActionLabel(event.action)}
                </p>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {event.description ?? "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[var(--app-text-muted)]">
                {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
