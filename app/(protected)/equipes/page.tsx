import { redirect } from "next/navigation";

import { EquipesManager } from "@/components/equipes/EquipesManager";
import { isAdmin } from "@/lib/auth";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getTeams } from "@/lib/services/teams";

export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const session = await requireModuleAccess("EQUIPES");

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  const teams = await getTeams();

  return <EquipesManager teams={teams} />;
}
