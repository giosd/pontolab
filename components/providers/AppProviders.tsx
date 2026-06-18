"use client";

import type { ReactNode } from "react";

import { ConfirmProvider } from "@/hooks/useConfirm";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  );
}
