import { ImportHistoryTable } from "@/components/import/ImportHistoryTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdmin, requireAuth } from "@/lib/auth";
import { getImportHistory } from "@/lib/services/import.service";
import { requireModuleAccess } from "@/lib/services/module-permissions";

export const dynamic = "force-dynamic";

export default async function ImportacoesPage() {
  await requireModuleAccess("IMPORTACOES");
  const session = await requireAuth();
  const batches = await getImportHistory(session);
  const admin = isAdmin(session);

  return (
    <div className="space-y-6 bg-[#F5FBFF]">
      <PageHeader
        title="Histórico de importações"
        description="Acompanhe os arquivos importados e o resultado de cada lote."
      />

      <ImportHistoryTable batches={batches} showUser={admin} />
    </div>
  );
}
