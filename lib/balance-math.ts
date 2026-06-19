// Helpers puros de cálculo do banco de horas (sem dependências internas).
// Mantidos isolados para serem facilmente testáveis.

/** Arredonda horas para 2 casas decimais (centésimos). */
export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Horas esperadas = dias úteis * meta diária (arredondado). */
export function computeExpectedHours(
  businessDays: number,
  dailyGoalHours: number,
): number {
  return roundHours(businessDays * dailyGoalHours);
}

/** Saldo = horas trabalhadas - horas esperadas (arredondado). */
export function computeBalanceHours(
  workedHours: number,
  expectedHours: number,
): number {
  return roundHours(workedHours - expectedHours);
}
