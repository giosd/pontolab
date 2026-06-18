import { NotificationsPageContent } from "@/components/notifications/NotificationsPageContent";
import { requireAuth } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
} from "@/lib/services/notification.service";
import type { NotificationFilters } from "@/types";

export const dynamic = "force-dynamic";

interface NotificacoesPageProps {
  searchParams: Promise<{
    read?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function NotificacoesPage({
  searchParams,
}: NotificacoesPageProps) {
  const session = await requireAuth();
  const params = await searchParams;

  const read = (params.read as NotificationFilters["read"]) || "all";

  const filters: NotificationFilters = {
    read,
    type: params.type,
    startDate: params.startDate,
    endDate: params.endDate,
    limit: 200,
  };

  const [items, unread] = await Promise.all([
    getNotifications(session.userId, filters),
    getUnreadCount(session.userId),
  ]);

  return (
    <NotificationsPageContent
      items={items}
      unread={unread}
      filters={{
        read: read ?? "all",
        type: params.type ?? "",
        startDate: params.startDate ?? "",
        endDate: params.endDate ?? "",
      }}
    />
  );
}
