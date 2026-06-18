import { Card } from "@/components/ui/Card";
import { formatSignedHours } from "@/lib/dates";
import type { BalanceOverviewUser } from "@/types";

interface BalanceRankCardProps {
  title: string;
  users: BalanceOverviewUser[];
  emptyLabel: string;
}

export function BalanceRankCard({
  title,
  users,
  emptyLabel,
}: BalanceRankCardProps) {
  return (
    <Card>
      <h2 className="text-base font-medium text-[var(--app-text)]">{title}</h2>
      {users.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--app-text-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--app-border)]">
          {users.map((user) => (
            <li
              key={user.userId}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-[var(--app-text)]">{user.userName}</span>
              <span
                className={
                  user.balanceHours > 0
                    ? "font-medium text-green-600 dark:text-green-400"
                    : user.balanceHours < 0
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-[var(--app-text-muted)]"
                }
              >
                {formatSignedHours(user.balanceHours)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
