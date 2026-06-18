"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/constants";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  getRecentNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/services/notification.service";

function actorFrom(session: { userId: string; name: string; email: string }) {
  return { id: session.userId, name: session.name, email: session.email };
}

export async function getNotificationsSummaryAction() {
  const session = await requireAuth();
  const [items, unread] = await Promise.all([
    getRecentNotifications(session.userId, 8),
    getUnreadCount(session.userId),
  ]);

  return { items, unread };
}

export async function markNotificationReadAction(id: string) {
  try {
    const session = await requireAuth();
    const changed = await markAsRead(id, session.userId);

    if (changed) {
      revalidatePath("/notificacoes");
      await createAuditLog({
        action: AUDIT_ACTIONS.NOTIFICATION_READ,
        entityType: AUDIT_ENTITIES.NOTIFICATION,
        entityId: id,
        description: "Notificação marcada como lida.",
        user: actorFrom(session),
      });
    }

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao marcar notificação",
    };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await requireAuth();
    const count = await markAllAsRead(session.userId);
    revalidatePath("/notificacoes");

    if (count > 0) {
      await createAuditLog({
        action: AUDIT_ACTIONS.NOTIFICATION_MARK_ALL,
        entityType: AUDIT_ENTITIES.NOTIFICATION,
        description: `${count} notificação(ões) marcada(s) como lida(s).`,
        newData: { count },
        user: actorFrom(session),
      });
    }

    return { success: true as const, count };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao marcar notificações",
    };
  }
}

export async function logPwaInstallAction() {
  try {
    const session = await requireAuth();
    await createAuditLog({
      action: AUDIT_ACTIONS.PWA_INSTALL,
      entityType: AUDIT_ENTITIES.SYSTEM,
      description: "Aplicativo instalado (PWA).",
      user: actorFrom(session),
    });
    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}
