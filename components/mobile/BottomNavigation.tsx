"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppModuleKey } from "@/lib/modules";

interface BottomNavItem {
  key: AppModuleKey;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ICON_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true,
  className: "h-5 w-5",
} as const;

const NAV_ITEMS: BottomNavItem[] = [
  {
    key: "DASHBOARD",
    label: "Início",
    href: "/dashboard",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"
        />
      </svg>
    ),
  },
  {
    key: "REGISTROS",
    label: "Registros",
    href: "/registros",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01"
        />
      </svg>
    ),
  },
  {
    key: "TIMER",
    label: "Timer",
    href: "/timer",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    key: "RELATORIOS",
    label: "Relatórios",
    href: "/relatorios",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4"
        />
      </svg>
    ),
  },
  {
    key: "PERFIL",
    label: "Perfil",
    href: "/perfil",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
        />
      </svg>
    ),
  },
];

interface BottomNavigationProps {
  allowedModules: AppModuleKey[];
}

export function BottomNavigation({ allowedModules }: BottomNavigationProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => allowedModules.includes(item.key));

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--app-border)] bg-[var(--app-card)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--app-primary)]"
                  : "text-[var(--app-text-muted)]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
