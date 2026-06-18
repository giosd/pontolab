import { AppInfoCard } from "@/components/settings/AppInfoCard";
import { GoalsSettingsForm } from "@/components/settings/GoalsSettingsForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { isAdmin } from "@/lib/auth";
import { ACTIVITIES } from "@/lib/constants";
import { getUserGoals } from "@/lib/services/hour-balance";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getUsers } from "@/lib/services/users";

export const dynamic = "force-dynamic";

interface ConfiguracoesPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function ConfiguracoesPage({
  searchParams,
}: ConfiguracoesPageProps) {
  const session = await requireModuleAccess("CONFIGURACOES");
  const params = await searchParams;
  const admin = isAdmin(session);

  const selectedUserId = admin
    ? params.userId || session.userId
    : session.userId;

  const [goals, users] = await Promise.all([
    getUserGoals(selectedUserId),
    admin ? getUsers() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Preferências do sistema e atividades disponíveis para classificação dos registros."
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-base font-medium text-[var(--app-text)]">
            Aplicativo
          </h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Instalação, notificações e tema do PontoLab.
          </p>
          <div className="mt-4">
            <AppInfoCard />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-medium text-[var(--app-text)]">Aparência</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Escolha como o PontoLab deve ser exibido para você.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-medium text-[var(--app-text)]">Metas</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {admin
              ? "Defina as metas de jornada de qualquer usuário."
              : "Defina as suas metas de jornada de trabalho."}
          </p>
          <div className="mt-4">
            <GoalsSettingsForm
              goals={goals}
              isAdmin={admin}
              users={users}
              selectedUserId={selectedUserId}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-medium text-[var(--app-text)]">
            Atividades cadastradas
          </h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {ACTIVITIES.length} atividades configuradas no sistema.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVITIES.map((activity) => (
              <li
                key={activity}
                className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-3 py-2 text-sm text-[var(--app-text)]"
              >
                {activity}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
