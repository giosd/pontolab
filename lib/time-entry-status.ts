export const TIME_ENTRY_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type TimeEntryStatus =
  (typeof TIME_ENTRY_STATUS)[keyof typeof TIME_ENTRY_STATUS];

export const TIME_ENTRY_STATUSES = Object.values(
  TIME_ENTRY_STATUS,
) as TimeEntryStatus[];

export const TIME_ENTRY_STATUS_LABELS: Record<TimeEntryStatus, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export const TIME_ENTRY_STATUS_COLORS: Record<TimeEntryStatus, string> = {
  DRAFT: "gray",
  SUBMITTED: "blue",
  APPROVED: "green",
  REJECTED: "red",
};

/**
 * Tailwind classes for the status badge. Each variant works in both light and
 * dark themes.
 */
export const TIME_ENTRY_STATUS_BADGE_CLASSES: Record<TimeEntryStatus, string> = {
  DRAFT:
    "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600",
  SUBMITTED:
    "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800",
  APPROVED:
    "bg-green-100 text-green-700 ring-1 ring-inset ring-green-300 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-800",
  REJECTED:
    "bg-red-100 text-red-700 ring-1 ring-inset ring-red-300 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800",
};

export function isTimeEntryStatus(value: unknown): value is TimeEntryStatus {
  return (
    typeof value === "string" &&
    (TIME_ENTRY_STATUSES as string[]).includes(value)
  );
}

export function getTimeEntryStatusLabel(status: string): string {
  return isTimeEntryStatus(status)
    ? TIME_ENTRY_STATUS_LABELS[status]
    : status;
}

export const TIME_ENTRY_STATUS_FILTER_OPTIONS = TIME_ENTRY_STATUSES.map(
  (status) => ({
    value: status,
    label: TIME_ENTRY_STATUS_LABELS[status],
  }),
);
