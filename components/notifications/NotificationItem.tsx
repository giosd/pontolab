"use client";

import { getNotificationTypeLabel } from "@/lib/notifications/constants";
import type { NotificationItem as NotificationItemType } from "@/types";

const TYPE_STYLES: Record<string, string> = {
  INFO: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  SUCCESS:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  WARNING:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  APPROVAL:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  REJECTION: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  IMPORT: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  SYSTEM:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const typeStyle = TYPE_STYLES[notification.type] ?? TYPE_STYLES.INFO;

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        notification.read
          ? "border-[var(--app-border)] bg-[var(--app-card)]"
          : "border-[var(--app-primary)]/40 bg-[var(--app-card-secondary)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyle}`}
          >
            {getNotificationTypeLabel(notification.type)}
          </span>
          {!notification.read ? (
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--app-primary)]" />
          ) : null}
        </div>
        <span className="shrink-0 text-[11px] text-[var(--app-text-muted)]">
          {formatDateTime(notification.createdAt)}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
        {notification.title}
      </p>
      <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">
        {notification.message}
      </p>

      {!notification.read && onMarkRead ? (
        <button
          type="button"
          onClick={() => onMarkRead(notification.id)}
          className="mt-2 text-xs font-medium text-[var(--app-primary)] hover:underline"
        >
          Marcar como lida
        </button>
      ) : null}
    </div>
  );
}
