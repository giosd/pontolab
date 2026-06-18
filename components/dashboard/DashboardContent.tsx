import { HoursByActivityChart } from "@/components/charts/HoursByActivityChart";
import { HoursByDayChart } from "@/components/charts/HoursByDayChart";
import { HoursByUserChart } from "@/components/charts/HoursByUserChart";
import { TopTasksChart } from "@/components/charts/TopTasksChart";
import { BalanceRankCard } from "@/components/balance/BalanceRankCard";
import { BalanceStatCard } from "@/components/balance/BalanceStatCard";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { DashboardSummaryTable } from "@/components/dashboard/DashboardSummaryTable";
import { ExportButtons } from "@/components/export/ExportButtons";
import { CurrentPeriodCard } from "@/components/reports/CurrentPeriodCard";
import { TimerDashboardCard } from "@/components/timer/TimerDashboardCard";
import { Card, StatCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatHours } from "@/lib/dates";
import type {
  ActiveTimer,
  DashboardData,
  ExportBalanceSummary,
  ExportFilters,
} from "@/types";

interface DashboardCurrentPeriod {
  label: string;
  startLabel: string;
  endLabel: string;
}

interface DashboardContentProps {
  data: DashboardData;
  exportFilters: ExportFilters;
  activeTimer?: ActiveTimer | null;
  currentPeriod?: DashboardCurrentPeriod | null;
}

export function DashboardContent({
  data,
  exportFilters,
  activeTimer = null,
  currentPeriod = null,
}: DashboardContentProps) {
  const hasData = data.totalEntries > 0;

  const exportSummary = {
    totalHours: data.totalHours,
    totalEntries: data.totalEntries,
    averageHoursPerDay: data.averageHoursPerDay,
  };

  const exportBalance: ExportBalanceSummary | null = data.balance
    ? {
        userName: exportFilters.userName || "Todos",
        periodLabel: exportFilters.periodLabel
          ? exportFilters.periodLabel
          : "Período selecionado",
        expectedHours: data.balance.expectedHours,
        workedHours: data.balance.workedHours,
        balanceHours: data.balance.differenceHours,
        accumulatedBalanceHours: data.balance.accumulatedBalanceHours,
      }
    : null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral das horas registradas no período."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {currentPeriod ? (
          <CurrentPeriodCard
            label={currentPeriod.label}
            startLabel={currentPeriod.startLabel}
            endLabel={currentPeriod.endLabel}
          />
        ) : null}
        <TimerDashboardCard timer={activeTimer} />
      </div>

      <div className="mb-6">
        <ExportButtons
          data={data.entries}
          summary={exportSummary}
          filters={exportFilters}
          balance={exportBalance}
          disabled={!hasData}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de horas" value={formatHours(data.totalHours)} />
        <StatCard
          label="Total de registros"
          value={String(data.totalEntries)}
        />
        <StatCard
          label="Média por dia"
          value={formatHours(data.averageHoursPerDay)}
        />
        <StatCard label="Horas hoje" value={formatHours(data.hoursToday)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Horas em rascunho"
          value={formatHours(data.hoursByStatus.draft)}
        />
        <StatCard
          label="Horas enviadas"
          value={formatHours(data.hoursByStatus.submitted)}
        />
        <StatCard
          label="Horas aprovadas"
          value={formatHours(data.hoursByStatus.approved)}
        />
        <StatCard
          label="Horas rejeitadas"
          value={formatHours(data.hoursByStatus.rejected)}
        />
      </div>

      {data.balance ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <BalanceStatCard
              label="Saldo atual"
              hours={data.balance.accumulatedBalanceHours}
            />
            <StatCard
              label="Horas previstas"
              value={formatHours(data.balance.expectedHours)}
            />
            <StatCard
              label="Horas realizadas"
              value={formatHours(data.balance.workedHours)}
            />
            <BalanceStatCard
              label="Diferença"
              hours={data.balance.differenceHours}
            />
          </div>

          <div className="mt-6">
            <BalanceChart data={data.balance.cumulativeSeries} />
          </div>
        </>
      ) : null}

      {data.balanceOverview ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BalanceRankCard
            title="Top saldos positivos"
            users={data.balanceOverview.topPositive}
            emptyLabel="Nenhum saldo positivo no período."
          />
          <BalanceRankCard
            title="Top saldos negativos"
            users={data.balanceOverview.topNegative}
            emptyLabel="Nenhum saldo negativo no período."
          />
          <BalanceRankCard
            title="Usuários abaixo da meta"
            users={data.balanceOverview.belowGoal}
            emptyLabel="Todos os usuários atingiram a meta."
          />
          <BalanceRankCard
            title="Usuários acima da meta"
            users={data.balanceOverview.aboveGoal}
            emptyLabel="Nenhum usuário acima da meta."
          />
        </div>
      ) : null}

      {data.pendingApprovals ? (
        <div className="mt-6">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              Pendências de aprovação
            </h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Registros enviados aguardando análise.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] p-4">
                <p className="text-sm font-medium text-[var(--app-text-muted)]">
                  Registros enviados
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--app-text)]">
                  {data.pendingApprovals.totalEntries}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] p-4">
                <p className="text-sm font-medium text-[var(--app-text-muted)]">
                  Horas enviadas
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--app-text)]">
                  {formatHours(data.pendingApprovals.totalHours)}
                </p>
              </div>
            </div>

            {data.pendingApprovals.topUsers.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-[var(--app-text-muted)]">
                  Usuários com mais pendências
                </p>
                <ul className="mt-2 divide-y divide-[var(--app-border)]">
                  {data.pendingApprovals.topUsers.map((user) => (
                    <li
                      key={user.userName}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-[var(--app-text)]">
                        {user.userName}
                      </span>
                      <span className="text-[var(--app-text-muted)]">
                        {user.count} registro(s) · {formatHours(user.hours)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--app-text-muted)]">
                Nenhuma pendência de aprovação no momento.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {!hasData ? (
        <div className="mt-6 rounded-2xl border border-[#D6EEF8] bg-white p-8 text-center">
          <p className="text-sm text-[#1E5F7A]">
            Nenhum registro encontrado para o período selecionado.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <HoursByDayChart data={data.hoursByDay} />
        <HoursByActivityChart data={data.hoursByActivity} />
        <HoursByUserChart data={data.hoursByUser} />
        <TopTasksChart data={data.topTasks} />
      </div>

      <div className="mt-6">
        <DashboardSummaryTable entries={data.entries} />
      </div>
    </>
  );
}
