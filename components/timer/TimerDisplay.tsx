"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/timer/format";
import { TIMER_STATUS } from "@/lib/timer/constants";

interface TimerDisplayProps {
  status: string;
  baseElapsedSeconds: number;
  className?: string;
}

/**
 * Exibe o tempo em tempo real no frontend. O cálculo definitivo das horas é
 * sempre feito no servidor; aqui apenas estimamos a contagem visual a partir do
 * valor base recebido do servidor. Use uma `key` no componente pai (ex.: status
 * + segundos base) para reiniciar a contagem quando o servidor enviar um novo
 * valor.
 */
export function TimerDisplay({
  status,
  baseElapsedSeconds,
  className = "",
}: TimerDisplayProps) {
  const [displaySeconds, setDisplaySeconds] = useState(baseElapsedSeconds);

  useEffect(() => {
    if (status !== TIMER_STATUS.RUNNING) {
      return;
    }

    const anchor = Date.now();

    const interval = setInterval(() => {
      const extra = Math.floor((Date.now() - anchor) / 1000);
      setDisplaySeconds(baseElapsedSeconds + extra);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, baseElapsedSeconds]);

  return (
    <p
      className={`font-mono tabular-nums tracking-tight text-[var(--app-text)] ${className}`}
    >
      {formatDuration(displaySeconds)}
    </p>
  );
}
