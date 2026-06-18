"use client";

import { APP_NAME, getUserRoleLabel } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { NotificationItem } from "@/types";

interface MobileHeaderProps {
  user: SessionUser;
  onMenuToggle: () => void;
  notifications?: { items: NotificationItem[]; unread: number };
}

export function MobileHeader({
  user,
  onMenuToggle,
  notifications = { items: [], unread: 0 },
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 lg:hidden">
      <div>
        <p className="text-base font-semibold text-[var(--app-text)]">{APP_NAME}</p>
        <p className="text-xs text-[var(--app-text-muted)]">{user.name}</p>
        <p className="text-[10px] text-[var(--app-text-muted)]">
          {getUserRoleLabel(user.role)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell
          initialItems={notifications.items}
          initialUnread={notifications.unread}
        />

        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-text)] transition-colors hover:bg-[var(--app-card-secondary)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
