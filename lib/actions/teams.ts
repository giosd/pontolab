"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  logTeamCreate,
  logTeamDeactivate,
  logTeamUpdate,
} from "@/lib/services/audit.service";
import {
  createTeam,
  deactivateTeam,
  updateTeam,
} from "@/lib/services/teams";
import type { TeamFormData } from "@/lib/validations";

function actorFrom(currentUser: {
  userId: string;
  name: string;
  email: string;
}) {
  return {
    id: currentUser.userId,
    name: currentUser.name,
    email: currentUser.email,
  };
}

export async function createTeamAction(data: TeamFormData) {
  try {
    const currentUser = await requireAdmin();
    const team = await createTeam(data, currentUser);
    revalidatePath("/equipes");
    revalidatePath("/usuarios");

    await logTeamCreate({
      entityId: team.id,
      description: `Equipe ${team.name} criada.`,
      newData: team,
      user: actorFrom(currentUser),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao criar equipe",
    };
  }
}

export async function updateTeamAction(id: string, data: TeamFormData) {
  try {
    const currentUser = await requireAdmin();
    const team = await updateTeam(id, data, currentUser);
    revalidatePath("/equipes");
    revalidatePath("/usuarios");

    await logTeamUpdate({
      entityId: team.id,
      description: `Equipe ${team.name} atualizada.`,
      newData: team,
      user: actorFrom(currentUser),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao atualizar equipe",
    };
  }
}

export async function deactivateTeamAction(id: string) {
  try {
    const currentUser = await requireAdmin();
    const team = await deactivateTeam(id, currentUser);
    revalidatePath("/equipes");

    await logTeamDeactivate({
      entityId: team.id,
      description: `Equipe ${team.name} inativada.`,
      newData: team,
      user: actorFrom(currentUser),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao inativar equipe",
    };
  }
}
