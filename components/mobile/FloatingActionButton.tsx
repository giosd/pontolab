"use client";

import Link from "next/link";

interface FloatingActionButtonProps {
  visible?: boolean;
}

export function FloatingActionButton({
  visible = true,
}: FloatingActionButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <Link
      href="/registros?new=1"
      aria-label="Novo registro"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-primary)] text-white shadow-lg shadow-[var(--app-primary)]/30 transition-transform active:scale-95 lg:hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}
