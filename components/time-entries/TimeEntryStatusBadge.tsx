import {
  TIME_ENTRY_STATUS_BADGE_CLASSES,
  getTimeEntryStatusLabel,
  isTimeEntryStatus,
} from "@/lib/time-entry-status";

interface TimeEntryStatusBadgeProps {
  status: string;
  className?: string;
}

export function TimeEntryStatusBadge({
  status,
  className = "",
}: TimeEntryStatusBadgeProps) {
  const badgeClass = isTimeEntryStatus(status)
    ? TIME_ENTRY_STATUS_BADGE_CLASSES[status]
    : "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass} ${className}`}
    >
      {getTimeEntryStatusLabel(status)}
    </span>
  );
}
