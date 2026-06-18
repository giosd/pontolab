"use client";

import { useEffect, useState, useTransition } from "react";

import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import {
  getNotificationsSummaryAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { NotificationItem } from "@/types";

interface NotificationBellProps {
  initialItems: NotificationItem[];
  initialUnread: number;
  className?: string;
}

export function NotificationBell({
  initialItems,
  initialUnread,
  className = "",
}: NotificationBellProps) {
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const summary = await getNotificationsSummaryAction();
      setItems(summary.items);
      setUnread(summary.unread);
    });
  };

  // Poll leve a cada 60s para atualizar o contador.
  useEffect(() => {
    const interval = setInterval(() => {
      void getNotificationsSummaryAction().then((summary) => {
        setItems(summary.items);
        setUnread(summary.unread);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    refresh();
  };

  const handleMarkRead = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAll = () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notificações"
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-text)] transition-colors hover:bg-[var(--app-card-secondary)] ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      <NotificationDrawer
        open={open}
        items={items}
        unread={unread}
        pending={isPending}
        onClose={() => setOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAll={handleMarkAll}
      />
    </>
  );
}
