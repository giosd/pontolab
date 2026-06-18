import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/notifications/constants";
import type { NotificationItem, NotificationFilters } from "@/types";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

function mapNotification(row: {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  readAt: Date | null;
}): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}

/** Cria uma notificação. Nunca lança — falha de notificação não quebra o fluxo. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
      },
    });
  } catch {
    // Notificação é best-effort.
  }
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
): Promise<void> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  if (unique.length === 0) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        title: input.title,
        message: input.message,
        type: input.type,
      })),
    });
  } catch {
    // best-effort
  }
}

export async function getNotifications(
  userId: string,
  filters: NotificationFilters = {},
): Promise<NotificationItem[]> {
  const where: {
    userId: string;
    read?: boolean;
    type?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = { userId };

  if (filters.read === "read") {
    where.read = true;
  } else if (filters.read === "unread") {
    where.read = false;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(`${filters.startDate}T00:00:00`);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(`${filters.endDate}T23:59:59`);
    }
  }

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });

  return rows.map(mapNotification);
}

export async function getRecentNotifications(
  userId: string,
  limit = 8,
): Promise<NotificationItem[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id, userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  return result.count > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  return result.count;
}
