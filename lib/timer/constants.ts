export const TIMER_STATUS = {
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
  CANCELED: "CANCELED",
} as const;

export type TimerStatus = (typeof TIMER_STATUS)[keyof typeof TIMER_STATUS];

export const TIMER_STATUSES = Object.values(TIMER_STATUS) as TimerStatus[];

export const ACTIVE_TIMER_STATUSES: TimerStatus[] = [
  TIMER_STATUS.RUNNING,
  TIMER_STATUS.PAUSED,
];

export const TIMER_STATUS_LABELS: Record<TimerStatus, string> = {
  RUNNING: "Em andamento",
  PAUSED: "Pausado",
  STOPPED: "Finalizado",
  CANCELED: "Cancelado",
};

export const TIMER_STATUS_BADGE_CLASSES: Record<TimerStatus, string> = {
  RUNNING:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  PAUSED:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  STOPPED: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  CANCELED:
    "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function isTimerStatus(value: unknown): value is TimerStatus {
  return typeof value === "string" && value in TIMER_STATUS_LABELS;
}

export function getTimerStatusLabel(status: string): string {
  return isTimerStatus(status) ? TIMER_STATUS_LABELS[status] : status;
}

export const TIMER_ROUNDING_OPTIONS = [
  { value: 0, label: "Sem arredondamento" },
  { value: 5, label: "Arredondar para 5 minutos" },
  { value: 10, label: "Arredondar para 10 minutos" },
  { value: 15, label: "Arredondar para 15 minutos" },
] as const;

export const DEFAULT_TIMER_ROUNDING_MINUTES = 0;

export function getTimerRoundingLabel(minutes: number): string {
  return (
    TIMER_ROUNDING_OPTIONS.find((option) => option.value === minutes)?.label ??
    `${minutes} minutos`
  );
}

export const TIMER_HISTORY_LIMIT = 20;
