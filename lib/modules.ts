export type AppModuleKey =
  | "DASHBOARD"
  | "REGISTROS"
  | "TIMER"
  | "BANCO_HORAS"
  | "IMPORTAR"
  | "IMPORTACOES"
  | "USUARIOS"
  | "EQUIPES"
  | "CONFIGURACOES"
  | "PERFIL"
  | "AUDITORIA"
  | "RELATORIOS";

export interface AppModule {
  key: AppModuleKey;
  label: string;
  path: string;
  adminOnly: boolean;
}

export const APP_MODULES: AppModule[] = [
  {
    key: "DASHBOARD",
    label: "Dashboard",
    path: "/dashboard",
    adminOnly: false,
  },
  {
    key: "REGISTROS",
    label: "Registros",
    path: "/registros",
    adminOnly: false,
  },
  {
    key: "TIMER",
    label: "Timer",
    path: "/timer",
    adminOnly: false,
  },
  {
    key: "BANCO_HORAS",
    label: "Banco de Horas",
    path: "/banco-horas",
    adminOnly: false,
  },
  {
    key: "IMPORTAR",
    label: "Importar",
    path: "/importar",
    adminOnly: false,
  },
  {
    key: "RELATORIOS",
    label: "Relatórios",
    path: "/relatorios",
    adminOnly: false,
  },
  {
    key: "IMPORTACOES",
    label: "Importações",
    path: "/importacoes",
    adminOnly: false,
  },
  {
    key: "USUARIOS",
    label: "Usuários",
    path: "/usuarios",
    adminOnly: false,
  },
  {
    key: "EQUIPES",
    label: "Equipes",
    path: "/equipes",
    adminOnly: true,
  },
  {
    key: "CONFIGURACOES",
    label: "Configurações",
    path: "/configuracoes",
    adminOnly: false,
  },
  {
    key: "PERFIL",
    label: "Perfil",
    path: "/perfil",
    adminOnly: false,
  },
  {
    key: "AUDITORIA",
    label: "Auditoria",
    path: "/auditoria",
    adminOnly: true,
  },
];

export const DEFAULT_USER_MODULES: AppModuleKey[] = [
  "DASHBOARD",
  "REGISTROS",
  "TIMER",
  "BANCO_HORAS",
  "IMPORTAR",
  "RELATORIOS",
  "PERFIL",
];

export const DEFAULT_MANAGER_MODULES: AppModuleKey[] = [
  "DASHBOARD",
  "REGISTROS",
  "TIMER",
  "BANCO_HORAS",
  "IMPORTAR",
  "RELATORIOS",
  "USUARIOS",
  "PERFIL",
];

export function getDefaultModulesForRole(role: string): AppModuleKey[] {
  if (role === "GESTOR") {
    return [...DEFAULT_MANAGER_MODULES];
  }

  return [...DEFAULT_USER_MODULES];
}

export const ALWAYS_ENABLED_MODULES: AppModuleKey[] = ["PERFIL"];

export function getModuleByPath(pathname: string): AppModule | undefined {
  return APP_MODULES.find(
    (module) =>
      pathname === module.path || pathname.startsWith(`${module.path}/`),
  );
}

export function getAssignableModules(targetRole: string): AppModule[] {
  return APP_MODULES.filter((module) => {
    if (ALWAYS_ENABLED_MODULES.includes(module.key)) {
      return false;
    }

    // Módulos exclusivos de administrador nunca são atribuídos via toggle.
    if (module.adminOnly) {
      return false;
    }

    // USUARIOS só faz sentido para gestores.
    if (module.key === "USUARIOS") {
      return targetRole === "GESTOR";
    }

    return true;
  });
}
