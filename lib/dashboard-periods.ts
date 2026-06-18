export const DASHBOARD_PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana atual" },
  { value: "fortnight", label: "Quinzena atual" },
  { value: "24to24", label: "Período 24 a 24" },
  { value: "custom", label: "Personalizado" },
] as const;

export type DashboardPeriodValue = (typeof DASHBOARD_PERIODS)[number]["value"];

export function getPeriodLabel(period: DashboardPeriodValue): string {
  return DASHBOARD_PERIODS.find((item) => item.value === period)?.label ?? period;
}
