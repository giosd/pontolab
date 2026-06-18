export const APP_NAME = "PontoLab";

export const APP_VERSION = "0.1.0";

export const ACTIVITIES = [
  "Acesso Remoto",
  "Aculturamento",
  "Administrativa",
  "Análise de dados",
  "Análise Fiscal",
  "Análise de Requisitos",
  "Apoio Técnico",
  "Atendimento",
  "Comunicação",
  "Desenvolvimento",
  "Documentação",
  "Estratégico",
  "Improdutivo",
  "Operacional",
  "Reunião",
  "Treinamentos",
  "Tempo em reunião",
  "Testes",
] as const;

export type Activity = (typeof ACTIVITIES)[number];

export const USER_ROLES = ["ADMIN", "GESTOR", "USER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  USER: "Usuário",
};

export function getUserRoleLabel(role: string): string {
  return USER_ROLE_LABELS[role as UserRole] ?? role;
}

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Registros", href: "/registros" },
  { label: "Importar", href: "/importar" },
  { label: "Usuários", href: "/usuarios", adminOnly: true },
  { label: "Configurações", href: "/configuracoes" },
  { label: "Perfil", href: "/perfil" },
] as const;
