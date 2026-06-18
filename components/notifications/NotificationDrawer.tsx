"use client";

import Link from "next/link";

import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { NotificationItem as NotificationItemType } from "@/types";

interface NotificationDrawerProps {
  open: boolean;
  items: NotificationItemType[];
  unread: number;
  pending: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
}

export function NotificationDrawer({
  open,
  items,
  unread,
  pending,
  onClose,
  onMarkRead,
  onMarkAll,
}: NotificationDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar notificações"
        className="absolute inset-0 bg-[var(--app-overlay)]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-[88vw] max-w-sm flex-col border-l border-[var(--app-border)] bg-[var(--app-card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
          <div>
            <p className="text-base font-semibold text-[var(--app-text)]">
              Notificações
            </p>
            <p className="text-xs text-[var(--app-text-muted)]">
              {unread > 0 ? `${unread} não lida(s)` : "Tudo em dia"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-text)] hover:bg-[var(--app-card-secondary)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-2">
          <button
            type="button"
            onClick={onMarkAll}
            disabled={pending || unread === 0}
            className="text-xs font-medium text-[var(--app-primary)] hover:underline disabled:opacity-40"
          >
            Marcar todas como lidas
          </button>
          <Link
            href="/notificacoes"
            onClick={onClose}
            className="text-xs font-medium text-[var(--app-text-muted)] hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--app-text-muted)]">
              Nenhuma notificação.
            </p>
          ) : (
            items.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkRead={onMarkRead}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
