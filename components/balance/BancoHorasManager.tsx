"use client";

import { useState, useTransition } from "react";

import { BalanceChart } from "@/components/charts/BalanceChart";
import { BalanceRankCard } from "@/components/balance/BalanceRankCard";
import { BalanceStatCard } from "@/components/balance/BalanceStatCard";
import { BancoHorasFilters } from "@/components/balance/BancoHorasFilters";
import { ExportButtons } from "@/components/export/ExportButtons";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { recalculateBalanceAction } from "@/lib/actions/hour-balance";
import { formatDateBR, formatHours, formatSignedHours } from "@/lib/dates";
import { buildExportSummary } from "@/lib/export/utils";
import type {
  BalanceOverview,
  ExportBalanceSummary,
  ExportFilters,
  ExportTimeEntry,
  HourBalanceData,
  MonthlyBalanceSummary,
  User,
} from "@/types";

interface RecalcParams {
  userId: string;
  startDate: string;
  endDate: string;
  scope: string;
}

interface BancoHorasManagerProps {
  balance: HourBalanceData;
  monthly: MonthlyBalanceSummary;
  overview: BalanceOverview | null;
  users: User[];
  isAdmin: boolean;
  exportEntries: ExportTimeEntry[];
  exportBalance: ExportBalanceSummary;
  exportFilters: ExportFilters;
  recalcParams: RecalcParams;
}

function signedClass(hours: number) {
  if (hours > 0) return "text-green-600 dark:text-green-400";
  if (hours < 0) return "text-red-600 dark:text-red-400";
  return "text-[var(--app-text)]";
}

export function BancoHorasManager({
  balance,
  monthly,
  overview,
  users,
  isAdmin,
  exportEntries,
  exportBalance,
  exportFilters,
  recalcParams,
}: BancoHorasManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportSummary = buildExportSummary(exportEntries, {
    startDate: exportFilters.startDate,
    endDate: exportFilters.endDate,
  });

  const handleRecalculate = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await recalculateBalanceAction(recalcParams);
      if (!result.success) {
        setError(result.error ?? "Erro ao recalcular.");
        return;
      }
      setMessage(result.message ?? "Banco de horas recalculado.");
    });
  };

  return (
    <>
      <PageHeader
        title="Banco de Horas"
        description={`Controle de jornada de ${balance.userName} • meta diária de ${formatHours(balance.goals.dailyGoalHours)}.`}
        action={
          <Button type="button" onClick={handleRecalculate} disabled={isPending}>
            {isPending ? "Recalculando..." : "Recalcular"}
          </Button>
        }
      />

      <BancoHorasFilters users={users} isAdmin={isAdmin} />

      {message ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mb-4">
        <ExportButtons
          data={exportEntries}
          summary={exportSummary}
          filters={exportFilters}
          balance={exportBalance}
          disabled={exportEntries.length === 0}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceStatCard
          label="Saldo Atual"
          hours={balance.accumulatedBalanceHours}
        />
        <StatCard
          label="Horas Trabalhadas"
          value={formatHours(balance.workedHours)}
        />
        <StatCard
          label="Horas Esperadas"
          value={formatHours(balance.expectedHours)}
        />
        <BalanceStatCard label="Diferença" hours={balance.balanceHours} />
      </div>

      <div className="mt-6">
        <BalanceChart data={balance.cumulativeSeries} />
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] px-5 py-4">
          <h2 className="text-base font-medium text-[var(--app-text)]">
            Detalhamento diário
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
            <thead className="bg-[var(--app-card-secondary)]">
              <tr>
                {["Data", "Previsto", "Realizado", "Diferença", "Saldo acumulado"].map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-left font-medium text-[var(--app-text-muted)]"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {balance.dailyRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[var(--app-text-muted)]"
                  >
                    Nenhum dia no período selecionado.
                  </td>
                </tr>
              ) : (
                balance.dailyRows.map((row) => (
                  <tr key={row.date}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                      {formatDateBR(row.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                      {row.expectedHours > 0 ? formatHours(row.expectedHours) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                      {formatHours(row.workedHours)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 font-medium ${signedClass(row.differenceHours)}`}
                    >
                      {formatSignedHours(row.differenceHours)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 font-medium ${signedClass(row.cumulativeHours)}`}
                    >
                      {formatSignedHours(row.cumulativeHours)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] px-5 py-4">
          <h2 className="text-base font-medium text-[var(--app-text)]">
            Resumo mensal • {monthly.year}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
            <thead className="bg-[var(--app-card-secondary)]">
              <tr>
                {["Mês", "Total esperado", "Total realizado", "Saldo"].map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-left font-medium text-[var(--app-text-muted)]"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {monthly.rows.map((row) => (
                <tr key={row.month}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.expectedHours)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--app-text)]">
                    {formatHours(row.workedHours)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2.5 font-medium ${signedClass(row.balanceHours)}`}
                  >
                    {formatSignedHours(row.balanceHours)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--app-border)] bg-[var(--app-card-secondary)] font-medium">
                <td className="px-4 py-3 text-[var(--app-text)]">Total</td>
                <td className="px-4 py-3 text-[var(--app-text)]">
                  {formatHours(monthly.totalExpectedHours)}
                </td>
                <td className="px-4 py-3 text-[var(--app-text)]">
                  {formatHours(monthly.totalWorkedHours)}
                </td>
                <td className={`px-4 py-3 ${signedClass(monthly.totalBalanceHours)}`}>
                  {formatSignedHours(monthly.totalBalanceHours)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {overview ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BalanceRankCard
            title="Top saldos positivos"
            users={overview.topPositive}
            emptyLabel="Nenhum saldo positivo no período."
          />
          <BalanceRankCard
            title="Top saldos negativos"
            users={overview.topNegative}
            emptyLabel="Nenhum saldo negativo no período."
          />
          <BalanceRankCard
            title="Usuários abaixo da meta"
            users={overview.belowGoal}
            emptyLabel="Todos os usuários atingiram a meta."
          />
          <BalanceRankCard
            title="Usuários acima da meta"
            users={overview.aboveGoal}
            emptyLabel="Nenhum usuário acima da meta."
          />
        </div>
      ) : null}
    </>
  );
}
