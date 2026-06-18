import { ProfileManager } from "@/components/perfil/ProfileManager";
import { requireModuleAccess } from "@/lib/services/module-permissions";
import { getProfile } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  await requireModuleAccess("PERFIL");
  const profile = await getProfile();

  return <ProfileManager profile={profile} />;
}
