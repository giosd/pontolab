"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/constants";
import { createAuditLog, logPasswordChange } from "@/lib/services/audit.service";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "@/lib/services/profile";
import type {
  ChangePasswordFormData,
  UpdateProfileFormData,
} from "@/lib/validations";

export async function updateProfileAction(data: UpdateProfileFormData) {
  try {
    const before = await getProfile();
    const updated = await updateProfile(data);
    revalidatePath("/perfil");

    await createAuditLog({
      action: AUDIT_ACTIONS.PROFILE_UPDATE,
      entityType: AUDIT_ENTITIES.PROFILE,
      entityId: updated.id,
      description: "Perfil atualizado pelo próprio usuário.",
      oldData: { name: before.name, email: before.email },
      newData: { name: updated.name, email: updated.email },
      user: { id: updated.id, name: updated.name, email: updated.email },
    });

    return { success: true as const, message: "Perfil atualizado com sucesso." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao atualizar perfil.",
    };
  }
}

export async function changePasswordAction(data: ChangePasswordFormData) {
  try {
    await changePassword(data);
    revalidatePath("/perfil");

    const session = await getCurrentUser();

    if (session) {
      await logPasswordChange({
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
        },
      });
    }

    return { success: true as const, message: "Senha alterada com sucesso." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao alterar senha.",
    };
  }
}
