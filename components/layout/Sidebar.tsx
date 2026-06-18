"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { APP_NAME, getUserRoleLabel } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { APP_MODULES, type AppModuleKey } from "@/lib/modules";

interface SidebarProps {
  user: SessionUser;
  allowedModules: AppModuleKey[];
  teamName?: string | null;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({
  user,
  allowedModules,
  teamName = null,
  onNavigate,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = APP_MODULES.filter((module) => {
    if (module.adminOnly && user.role !== "ADMIN") {
      return false;
    }

    return allowedModules.includes(module.key);
  });

  return (
    <aside
      className={`flex h-full flex-col border-r border-[var(--app-border)] bg-[var(--app-card)] ${className}`}
    >
      <div className="border-b border-[var(--app-border)] px-6 py-5">
        <p className="text-lg font-semibold tracking-tight text-[var(--app-text)]">
          {APP_NAME}
        </p>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">Registro de tempo</p>
        <div className="mt-3">
          <p className="text-sm font-medium text-[var(--app-text)]">{user.name}</p>
          <p className="text-xs text-[var(--app-text-muted)]">{user.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-[var(--app-card-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--app-text)]">
            {getUserRoleLabel(user.role)}
          </span>
          {user.role === "GESTOR" && teamName ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              Equipe: <span className="font-medium text-[var(--app-text)]">{teamName}</span>
            </p>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--app-primary)] text-white"
                  : "text-[var(--app-text)] hover:bg-[var(--app-card-secondary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--app-border)] p-4 lg:hidden">
        <InstallPrompt variant="mobile" />
      </div>

      <div className="space-y-1 border-t border-[var(--app-border)] p-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
