import { AuditFilters } from "@/components/audit/AuditFilters";
import { AuditManager } from "@/components/audit/AuditManager";
import { AuditSummaryCards } from "@/components/audit/AuditSummaryCards";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth";
import {
  getAuditLogs,
  getAuditSummary,
} from "@/lib/services/audit.service";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getUsers } from "@/lib/services/users";
import type { AuditFilters as AuditFiltersType } from "@/types/audit";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: AuditPageProps) {
  await requireModuleAccess("AUDITORIA");
  await requireAdmin();

  const params = await searchParams;

  const filters: AuditFiltersType = {
    startDate: params.startDate,
    endDate: params.endDate,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  };

  const [result, summary, users] = await Promise.all([
    getAuditLogs(filters),
    getAuditSummary(filters),
    getUsers(),
  ]);

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Histórico completo de eventos e alterações do sistema."
      />

      <AuditSummaryCards summary={summary} />

      <AuditFilters
        users={users.map((user) => ({ id: user.id, name: user.name }))}
      />

      <AuditManager
        items={result.items}
        filters={filters}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </>
  );
}
