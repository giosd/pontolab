import { Suspense } from "react";

import { RegistrosManager } from "@/components/registros/RegistrosManager";
import { isAdminOrManager } from "@/lib/auth";
import { getTimeEntries } from "@/lib/services/time-entries";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getScopedUsers } from "@/lib/services/users";
import type { TimeEntryFilters } from "@/types";

export const dynamic = "force-dynamic";

interface RegistrosPageProps {
  searchParams: Promise<{
    userId?: string;
    startDate?: string;
    endDate?: string;
    activity?: string;
    task?: string;
    status?: string;
  }>;
}

export default async function RegistrosPage({ searchParams }: RegistrosPageProps) {
  const session = await requireModuleAccess("REGISTROS");
  const params = await searchParams;
  const admin = isAdminOrManager(session);

  const filters: TimeEntryFilters = {
    userId: admin ? params.userId : undefined,
    startDate: params.startDate,
    endDate: params.endDate,
    activity: params.activity,
    task: params.task,
    status: params.status,
  };

  const [entries, users] = await Promise.all([
    getTimeEntries(filters, session),
    admin ? getScopedUsers(session) : Promise.resolve([]),
  ]);

  return (
    <Suspense fallback={<p className="text-[#38A8D8]">Carregando registros...</p>}>
      <RegistrosManager
        entries={entries}
        users={users}
        filters={filters}
        isAdmin={admin}
        currentUserId={session.userId}
      />
    </Suspense>
  );
}
