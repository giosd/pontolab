"use client";

import { useEffect, useState } from "react";

import { logPwaInstallAction } from "@/lib/actions/notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export function InstallPrompt({
  variant = "desktop",
  className = "",
}: InstallPromptProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;

      if (standalone) {
        setInstalled(true);
      }
    });

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      void logPwaInstallAction();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;

    await deferred.prompt();
    const choice = await deferred.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
      void logPwaInstallAction();
    }

    setDeferred(null);
  };

  if (installed || !deferred) {
    return null;
  }

  const base =
    variant === "mobile"
      ? "flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-3 py-2.5 text-sm font-medium text-white"
      : "inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90";

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={`${base} ${className}`}
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
        />
      </svg>
      Instalar Aplicativo
    </button>
  );
}
