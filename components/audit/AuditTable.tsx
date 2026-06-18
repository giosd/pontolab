"use client";

import { format } from "date-fns";

import {
  getActionLabel,
  getEntityLabel,
  isCriticalAction,
} from "@/lib/audit/constants";
import type { AuditLogListItem } from "@/types/audit";

interface AuditTableProps {
  items: AuditLogListItem[];
  onSelect: (id: string) => void;
}

export function AuditTable({ items, onSelect }: AuditTableProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-8 text-center text-sm text-[var(--app-text-muted)]">
        Nenhum evento de auditoria encontrado para os filtros aplicados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)]">
      <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
        <thead className="bg-[var(--app-card-secondary)]">
          <tr>
            {["Data/hora", "Usuário", "Ação", "Entidade", "Descrição", "IP"].map(
              (header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-semibold text-[var(--app-text)]"
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--app-border)] bg-[var(--app-card)]">
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="cursor-pointer transition-colors hover:bg-[var(--app-card-secondary)]"
            >
              <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-4 py-3 text-[var(--app-text)]">
                {item.userName ?? item.userEmail ?? "Sistema"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    isCriticalAction(item.action)
                      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-[var(--app-card-secondary)] text-[var(--app-text)]"
                  }`}
                >
                  {getActionLabel(item.action)}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--app-text)]">
                {getEntityLabel(item.entityType)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-[var(--app-text)]">
                {item.description ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text-muted)]">
                {item.ipAddress ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
