import type { Metadata } from "next";

import { OfflineRetry } from "@/components/pwa/OfflineRetry";

export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--app-bg)] px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--app-card-secondary)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-10 w-10 text-[var(--app-text-muted)]"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-[var(--app-text)]">
          Sem conexão com a internet
        </h1>
        <p className="max-w-sm text-sm text-[var(--app-text-muted)]">
          Não foi possível carregar o PontoLab. Verifique sua conexão e tente
          novamente.
        </p>
      </div>

      <OfflineRetry />
    </main>
  );
}
