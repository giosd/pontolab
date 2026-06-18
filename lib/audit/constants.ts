export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
  IMPORT: "IMPORT",
  EXPORT: "EXPORT",
  RESTORE: "RESTORE",
  REPLACE_PERIOD: "REPLACE_PERIOD",
  DEACTIVATE: "DEACTIVATE",
  ACTIVATE: "ACTIVATE",
  MODULE_PERMISSION_UPDATE: "MODULE_PERMISSION_UPDATE",
  PROFILE_UPDATE: "PROFILE_UPDATE",
  CONFIG_UPDATE: "CONFIG_UPDATE",
  SUBMIT: "SUBMIT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REOPEN: "REOPEN",
  BULK_ACTION: "BULK_ACTION",
  UPDATE_GOAL: "UPDATE_GOAL",
  RECALCULATE_BALANCE: "RECALCULATE_BALANCE",
  TIMER_START: "TIMER_START",
  TIMER_PAUSE: "TIMER_PAUSE",
  TIMER_RESUME: "TIMER_RESUME",
  TIMER_STOP: "TIMER_STOP",
  TIMER_CANCEL: "TIMER_CANCEL",
  TIME_ENTRY_CREATE_FROM_TIMER: "TIME_ENTRY_CREATE_FROM_TIMER",
  REOPEN_APPROVED: "REOPEN_APPROVED",
  PERIOD_REPLACEMENT: "PERIOD_REPLACEMENT",
  APPROVED_PRESERVED: "APPROVED_PRESERVED",
  TEAM_CREATE: "TEAM_CREATE",
  TEAM_UPDATE: "TEAM_UPDATE",
  TEAM_DEACTIVATE: "TEAM_DEACTIVATE",
  MANAGER_CREATE: "MANAGER_CREATE",
  USER_SCOPE_DENIED: "USER_SCOPE_DENIED",
  TEAM_ASSIGNMENT_UPDATE: "TEAM_ASSIGNMENT_UPDATE",
  PWA_INSTALL: "PWA_INSTALL",
  NOTIFICATION_READ: "NOTIFICATION_READ",
  NOTIFICATION_MARK_ALL: "NOTIFICATION_MARK_ALL",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITIES = {
  USER: "USER",
  TIME_ENTRY: "TIME_ENTRY",
  IMPORT_BATCH: "IMPORT_BATCH",
  AUTH: "AUTH",
  SYSTEM: "SYSTEM",
  CONFIGURATION: "CONFIGURATION",
  MODULE_PERMISSION: "MODULE_PERMISSION",
  PROFILE: "PROFILE",
  REPORT: "REPORT",
  GOAL: "GOAL",
  HOUR_BALANCE: "HOUR_BALANCE",
  TIMER: "TIMER",
  TEAM: "TEAM",
  NOTIFICATION: "NOTIFICATION",
} as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];

export const CRITICAL_AUDIT_ACTIONS: AuditAction[] = [
  AUDIT_ACTIONS.DELETE,
  AUDIT_ACTIONS.DEACTIVATE,
  AUDIT_ACTIONS.CHANGE_PASSWORD,
  AUDIT_ACTIONS.REPLACE_PERIOD,
  AUDIT_ACTIONS.MODULE_PERMISSION_UPDATE,
  AUDIT_ACTIONS.REOPEN,
  AUDIT_ACTIONS.REOPEN_APPROVED,
  AUDIT_ACTIONS.PERIOD_REPLACEMENT,
  AUDIT_ACTIONS.TEAM_DEACTIVATE,
  AUDIT_ACTIONS.USER_SCOPE_DENIED,
];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGOUT: "Logout",
  CHANGE_PASSWORD: "Troca de senha",
  IMPORT: "Importação",
  EXPORT: "Exportação",
  RESTORE: "Restauração",
  REPLACE_PERIOD: "Substituição de período",
  DEACTIVATE: "Inativação",
  ACTIVATE: "Ativação",
  MODULE_PERMISSION_UPDATE: "Atualização de módulos",
  PROFILE_UPDATE: "Atualização de perfil",
  CONFIG_UPDATE: "Atualização de configuração",
  SUBMIT: "Envio para aprovação",
  APPROVE: "Aprovação",
  REJECT: "Rejeição",
  REOPEN: "Reabertura",
  BULK_ACTION: "Ação em lote",
  UPDATE_GOAL: "Atualização de metas",
  RECALCULATE_BALANCE: "Recálculo de banco de horas",
  TIMER_START: "Timer iniciado",
  TIMER_PAUSE: "Timer pausado",
  TIMER_RESUME: "Timer retomado",
  TIMER_STOP: "Timer finalizado",
  TIMER_CANCEL: "Timer cancelado",
  TIME_ENTRY_CREATE_FROM_TIMER: "Registro criado via timer",
  REOPEN_APPROVED: "Reabertura de aprovados",
  PERIOD_REPLACEMENT: "Substituição de período",
  APPROVED_PRESERVED: "Aprovados preservados",
  TEAM_CREATE: "Equipe criada",
  TEAM_UPDATE: "Equipe atualizada",
  TEAM_DEACTIVATE: "Equipe inativada",
  MANAGER_CREATE: "Gestor criado",
  USER_SCOPE_DENIED: "Acesso fora do escopo negado",
  TEAM_ASSIGNMENT_UPDATE: "Atribuição de equipe atualizada",
  PWA_INSTALL: "Aplicativo instalado",
  NOTIFICATION_READ: "Notificação lida",
  NOTIFICATION_MARK_ALL: "Notificações marcadas como lidas",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  USER: "Usuário",
  TIME_ENTRY: "Registro",
  IMPORT_BATCH: "Importação",
  AUTH: "Autenticação",
  SYSTEM: "Sistema",
  CONFIGURATION: "Configuração",
  MODULE_PERMISSION: "Módulos",
  PROFILE: "Perfil",
  REPORT: "Relatório",
  GOAL: "Metas",
  HOUR_BALANCE: "Banco de horas",
  TIMER: "Timer",
  TEAM: "Equipe",
  NOTIFICATION: "Notificação",
};

export const AUDIT_RETENTION_DAYS = 365;

export const AUDIT_PAGE_SIZE = 20;

export function getActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function getEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

export function isCriticalAction(action: string): boolean {
  return CRITICAL_AUDIT_ACTIONS.includes(action as AuditAction);
}
