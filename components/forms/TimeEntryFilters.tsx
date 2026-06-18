"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ACTIVITIES } from "@/lib/constants";
import { TIME_ENTRY_STATUS_FILTER_OPTIONS } from "@/lib/time-entry-status";
import type { User } from "@/types";

interface TimeEntryFiltersProps {
  users: User[];
  isAdmin: boolean;
}

export function TimeEntryFilters({ users, isAdmin }: TimeEntryFiltersProps) {
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
      router.push(`/registros?${params.toString()}`);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push("/registros");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid gap-4 rounded-2xl border border-[#D6EEF8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {isAdmin ? (
        <Select
          label="Usuário"
          name="userId"
          placeholder="Todos"
          defaultValue={searchParams.get("userId") ?? ""}
          options={users.map((user) => ({
            value: user.id,
            label: user.name,
          }))}
          disabled={isPending}
        />
      ) : null}

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
        label="Atividade"
        name="activity"
        placeholder="Todas"
        defaultValue={searchParams.get("activity") ?? ""}
        options={ACTIVITIES.map((activity) => ({
          value: activity,
          label: activity,
        }))}
        disabled={isPending}
      />

      <Select
        label="Status"
        name="status"
        placeholder="Todos"
        defaultValue={searchParams.get("status") ?? ""}
        options={TIME_ENTRY_STATUS_FILTER_OPTIONS}
        disabled={isPending}
      />

      <Input
        label="Tarefa"
        name="task"
        placeholder="Buscar por tarefa"
        defaultValue={searchParams.get("task") ?? ""}
        disabled={isPending}
      />

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Filtrando..." : "Filtrar"}
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
