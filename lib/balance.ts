import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";

export const DEFAULT_GOALS = {
  dailyGoalHours: 8,
  weeklyGoalHours: 40,
  monthlyGoalHours: 176,
  allowNegativeBalance: true,
  timerRoundingMinutes: 0,
} as const;

export const BALANCE_PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "fortnight", label: "Quinzena" },
  { value: "month", label: "Mês" },
  { value: "24to24", label: "Período 24 a 24" },
  { value: "custom", label: "Personalizado" },
] as const;

export type BalancePeriodValue = (typeof BALANCE_PERIODS)[number]["value"];

export function getBalancePeriodLabel(period: string): string {
  return BALANCE_PERIODS.find((item) => item.value === period)?.label ?? period;
}

/**
 * Escopo de aprovação considerado no cálculo do banco de horas.
 * - approved (padrão): apenas registros aprovados.
 * - submitted: aprovados + enviados (apenas ADMIN).
 * - all: aprovados + enviados + rascunhos (apenas ADMIN).
 * Registros rejeitados nunca entram no cálculo.
 */
export const BALANCE_SCOPES = [
  { value: "approved", label: "Somente aprovados" },
  { value: "submitted", label: "Considerar enviados" },
  { value: "all", label: "Considerar rascunhos" },
] as const;

export type BalanceScope = (typeof BALANCE_SCOPES)[number]["value"];

export const DEFAULT_BALANCE_SCOPE: BalanceScope = "approved";

export function getBalanceScopeLabel(scope: string): string {
  return BALANCE_SCOPES.find((item) => item.value === scope)?.label ?? scope;
}

export function isBalanceScope(value: unknown): value is BalanceScope {
  return (
    typeof value === "string" &&
    BALANCE_SCOPES.some((item) => item.value === value)
  );
}

export function resolveBalanceStatuses(scope: BalanceScope): string[] {
  switch (scope) {
    case "all":
      return [
        TIME_ENTRY_STATUS.APPROVED,
        TIME_ENTRY_STATUS.SUBMITTED,
        TIME_ENTRY_STATUS.DRAFT,
      ];
    case "submitted":
      return [TIME_ENTRY_STATUS.APPROVED, TIME_ENTRY_STATUS.SUBMITTED];
    case "approved":
    default:
      return [TIME_ENTRY_STATUS.APPROVED];
  }
}

/** USER só pode usar o escopo padrão (aprovados). */
export function normalizeBalanceScope(
  scope: string | undefined,
  isAdmin: boolean,
): BalanceScope {
  if (!isAdmin) {
    return DEFAULT_BALANCE_SCOPE;
  }

  return isBalanceScope(scope) ? scope : DEFAULT_BALANCE_SCOPE;
}
