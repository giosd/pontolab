"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { SessionUser } from "@/lib/auth";
import type { AppModuleKey } from "@/lib/modules";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import type { NotificationItem } from "@/types";

import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";

interface AppShellCurrentPeriod {
  label: string;
  range: string;
}

interface AppShellNotifications {
  items: NotificationItem[];
  unread: number;
}

interface AppShellProps {
  children: ReactNode;
  user: SessionUser;
  allowedModules: AppModuleKey[];
  currentPeriod?: AppShellCurrentPeriod | null;
  teamName?: string | null;
  notifications?: AppShellNotifications;
}

export function AppShell({
  children,
  user,
  allowedModules,
  currentPeriod = null,
  teamName = null,
  notifications = { items: [], unread: 0 },
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showTeam = user.role === "GESTOR" && Boolean(teamName);
  const canCreateEntry = allowedModules.includes("REGISTROS");

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      <div className="hidden w-64 shrink-0 lg:block">
        <Sidebar
          user={user}
          allowedModules={allowedModules}
          teamName={teamName}
          className="fixed inset-y-0 left-0 w-64"
        />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-[var(--app-overlay)]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            user={user}
            allowedModules={allowedModules}
            teamName={teamName}
            className="relative z-50 w-72 max-w-[85vw] shadow-xl"
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <MobileHeader
          user={user}
          onMenuToggle={() => setMobileMenuOpen(true)}
          notifications={notifications}
        />

        <div className="hidden items-center justify-end gap-2 border-b border-[var(--app-border)] bg-[var(--app-card)] px-6 py-2 lg:flex lg:px-8">
          <InstallPrompt variant="desktop" />
          <NotificationBell
            initialItems={notifications.items}
            initialUnread={notifications.unread}
          />
        </div>

        {currentPeriod || showTeam ? (
          <div className="border-b border-[var(--app-border)] bg-[var(--app-card)] px-4 py-2 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
              {showTeam ? (
                <span className="mr-3 inline-flex items-center gap-1 rounded-full bg-[var(--app-card-secondary)] px-2.5 py-1 font-medium text-[var(--app-text)]">
                  Equipe: {teamName}
                </span>
              ) : null}
              {currentPeriod ? (
                <>
                  <span className="font-medium text-[var(--app-text-muted)]">
                    Período Atual:
                  </span>
                  <span className="font-semibold text-[var(--app-text)]">
                    {currentPeriod.range}
                  </span>
                  <span className="text-[var(--app-text-muted)]">
                    · {currentPeriod.label}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <FloatingActionButton visible={canCreateEntry} />
      <BottomNavigation allowedModules={allowedModules} />
    </div>
  );
}
