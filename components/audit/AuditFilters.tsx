"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  getActionLabel,
  getEntityLabel,
} from "@/lib/audit/constants";
import type { AuditUserOption } from "@/types/audit";

interface AuditFiltersProps {
  users: AuditUserOption[];
}

const actionOptions = Object.values(AUDIT_ACTIONS).map((action) => ({
  value: action,
  label: getActionLabel(action),
}));

const entityOptions = Object.values(AUDIT_ENTITIES).map((entity) => ({
  value: entity,
  label: getEntityLabel(entity),
}));

export function AuditFilters({ users }: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim()) {
        params.set(key, value.trim());
      }
    }

    startTransition(() => {
      router.push(`/auditoria?${params.toString()}`);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push("/auditoria");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mb-6 grid gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 sm:grid-cols-2 lg:grid-cols-3 ${isPending ? "opacity-70" : ""}`}
    >
      <Input
        label="Data inicial"
        name="startDate"
        type="date"
        defaultValue={searchParams.get("startDate") ?? ""}
        disabled={isPending}
      />
      <Input
        label="Data final"
        name="endDate"
        type="date"
        defaultValue={searchParams.get("endDate") ?? ""}
        disabled={isPending}
      />
      <Select
        label="Usuário"
        name="userId"
        placeholder="Todos"
        defaultValue={searchParams.get("userId") ?? ""}
        options={users.map((user) => ({ value: user.id, label: user.name }))}
        disabled={isPending}
      />
      <Select
        label="Ação"
        name="action"
        placeholder="Todas"
        defaultValue={searchParams.get("action") ?? ""}
        options={actionOptions}
        disabled={isPending}
      />
      <Select
        label="Entidade"
        name="entityType"
        placeholder="Todas"
        defaultValue={searchParams.get("entityType") ?? ""}
        options={entityOptions}
        disabled={isPending}
      />
      <Input
        label="Texto livre"
        name="search"
        placeholder="Descrição, usuário, ação..."
        defaultValue={searchParams.get("search") ?? ""}
        disabled={isPending}
      />

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Carregando..." : "Aplicar filtros"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          disabled={isPending}
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}
