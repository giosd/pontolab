import { AppShell } from "@/components/layout/AppShell";
import { getCurrentAccountingPeriod } from "@/lib/accounting-period";
import { requireAuth } from "@/lib/auth";
import { formatDateBR } from "@/lib/dates";
import { getUserModules } from "@/lib/services/module-permissions";
import {
  getRecentNotifications,
  getUnreadCount,
} from "@/lib/services/notification.service";
import { prisma } from "@/lib/prisma";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuth();
  const allowedModules = await getUserModules(user.userId);

  const [team, notificationItems, unreadCount] = await Promise.all([
    user.teamId
      ? prisma.team.findUnique({
          where: { id: user.teamId },
          select: { name: true },
        })
      : Promise.resolve(null),
    getRecentNotifications(user.userId, 8),
    getUnreadCount(user.userId),
  ]);

  const period = getCurrentAccountingPeriod();
  const currentPeriod = {
    label: period.label,
    range: `${formatDateBR(period.startDate)} → ${formatDateBR(period.endDate)}`,
  };

  return (
    <AppShell
      user={user}
      allowedModules={allowedModules}
      currentPeriod={currentPeriod}
      teamName={team?.name ?? null}
      notifications={{ items: notificationItems, unread: unreadCount }}
    >
      {children}
    </AppShell>
  );
}
