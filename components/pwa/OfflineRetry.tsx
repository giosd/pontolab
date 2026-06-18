"use client";

import { Button } from "@/components/ui/Button";

export function OfflineRetry() {
  return (
    <Button type="button" onClick={() => window.location.reload()}>
      Tentar novamente
    </Button>
  );
}
