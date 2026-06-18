import { redirect } from "next/navigation";

import { UsersManager } from "@/components/usuarios/UsersManager";
import { isAdmin, isAdminOrManager } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getActiveTeams } from "@/lib/services/teams";
import { getUsers } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await requireModuleAccess("USUARIOS");

  if (!isAdminOrManager(session)) {
    redirect("/dashboard");
  }

  const admin = isAdmin(session);
  const [users, teams] = await Promise.all([
    getUsers(session),
    admin ? getActiveTeams() : Promise.resolve([]),
  ]);

  return (
    <UsersManager
      users={users}
      currentUserId={session.userId}
      currentUserRole={session.role}
      currentUserTeamId={session.teamId}
      teams={teams}
    />
  );
}
