"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { APP_VERSION } from "@/lib/constants";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function AppInfoCard() {
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setInstalled(standalone);

      if (typeof Notification === "undefined") {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission as PermissionState);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  };

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-3 py-2">
          <dt className="text-xs text-[var(--app-text-muted)]">Versão</dt>
          <dd className="text-sm font-medium text-[var(--app-text)]">
            {APP_VERSION}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-3 py-2">
          <dt className="text-xs text-[var(--app-text-muted)]">
            Aplicativo instalado
          </dt>
          <dd className="text-sm font-medium text-[var(--app-text)]">
            {installed ? "Sim" : "Não"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <InstallPrompt variant="desktop" />
        {!installed ? (
          <span className="text-xs text-[var(--app-text-muted)]">
            Use &quot;Instalar Aplicativo&quot; quando disponível no seu
            navegador.
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--app-border)] p-3">
        <p className="text-sm font-medium text-[var(--app-text)]">
          Permitir notificações
        </p>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
          {permission === "granted"
            ? "Notificações permitidas neste dispositivo."
            : permission === "denied"
              ? "Notificações bloqueadas nas configurações do navegador."
              : permission === "unsupported"
                ? "Este navegador não suporta notificações."
                : "Permita notificações para alertas do sistema."}
        </p>
        {permission === "default" ? (
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={requestPermission}>
              Permitir notificações
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--app-border)] p-3">
        <p className="text-sm font-medium text-[var(--app-text)]">Tema</p>
        <p className="mt-1 mb-3 text-xs text-[var(--app-text-muted)]">
          Claro, escuro ou conforme o sistema.
        </p>
        <ThemeToggle />
      </div>
    </div>
  );
}
