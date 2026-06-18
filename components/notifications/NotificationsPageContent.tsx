"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/constants";
import type { NotificationItem as NotificationItemType } from "@/types";

interface NotificationsPageContentProps {
  items: NotificationItemType[];
  filters: {
    read: string;
    type: string;
    startDate: string;
    endDate: string;
  };
  unread: number;
}

export function NotificationsPageContent({
  items,
  filters,
  unread,
}: NotificationsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/notificacoes?${params.toString()}`);
    });
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Notificações"
        description={
          unread > 0
            ? `${unread} notificação(ões) não lida(s).`
            : "Você está em dia."
        }
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={handleMarkAll}
            disabled={isPending || unread === 0}
          >
            Marcar todas como lidas
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Status"
            value={filters.read}
            onChange={(event) => updateParam("read", event.target.value)}
            options={[
              { value: "all", label: "Todas" },
              { value: "unread", label: "Não lidas" },
              { value: "read", label: "Lidas" },
            ]}
          />
          <Select
            label="Tipo"
            value={filters.type}
            onChange={(event) => updateParam("type", event.target.value)}
            options={[
              { value: "", label: "Todos" },
              ...Object.entries(NOTIFICATION_TYPE_LABELS).map(
                ([value, label]) => ({ value, label }),
              ),
            ]}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              Data inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => updateParam("startDate", event.target.value)}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2 text-sm text-[var(--app-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">
              Data final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => updateParam("endDate", event.target.value)}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2 text-sm text-[var(--app-text)]"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-[var(--app-text-muted)]">
              Nenhuma notificação encontrada.
            </p>
          </Card>
        ) : (
          items.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>
    </>
  );
}
