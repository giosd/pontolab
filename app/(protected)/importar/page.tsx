import { ImportManager } from "@/components/import/ImportManager";
import { isAdmin, isAdminOrManager, requireAuth } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getScopedUsers } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  await requireModuleAccess("IMPORTAR");
  const session = await requireAuth();
  const admin = isAdmin(session);
  const canSelectUser = isAdminOrManager(session);
  const users = canSelectUser ? await getScopedUsers(session) : [];

  return (
    <div className="min-h-full bg-[var(--app-bg)]">
      <ImportManager
        isAdmin={admin}
        canSelectUser={canSelectUser}
        currentUserId={session.userId}
        currentUserName={session.name}
        users={users}
      />
    </div>
  );
}
