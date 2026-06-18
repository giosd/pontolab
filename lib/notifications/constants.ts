export const NOTIFICATION_TYPES = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
  APPROVAL: "APPROVAL",
  REJECTION: "REJECTION",
  IMPORT: "IMPORT",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  INFO: "Informação",
  SUCCESS: "Sucesso",
  WARNING: "Atenção",
  ERROR: "Erro",
  APPROVAL: "Aprovação",
  REJECTION: "Rejeição",
  IMPORT: "Importação",
  SYSTEM: "Sistema",
};

export function getNotificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type as NotificationType] ?? type;
}
