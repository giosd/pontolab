"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ACTIVITIES } from "@/lib/constants";
import { DASHBOARD_PERIODS, type DashboardPeriodValue } from "@/lib/dashboard-periods";
import type { User } from "@/types";

interface DashboardFiltersProps {
  users: User[];
  isAdmin: boolean;
}

export function DashboardFilters({ users, isAdmin }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialPeriod =
    (searchParams.get("period") as DashboardPeriodValue) || "week";
  const [period, setPeriod] = useState<DashboardPeriodValue>(initialPeriod);

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
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setPeriod("week");
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mb-6 grid gap-4 rounded-2xl border border-[#D6EEF8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 ${isPending ? "opacity-70" : ""}`}
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
        label="Período"
        name="period"
        defaultValue={initialPeriod}
        options={DASHBOARD_PERIODS.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
        disabled={isPending}
        onChange={(event) => setPeriod(event.target.value as DashboardPeriodValue)}
      />

      {period === "custom" ? (
        <>
          <Input
            label="Data inicial"
            name="startDate"
            type="date"
            defaultValue={searchParams.get("startDate") ?? ""}
            disabled={isPending}
            required
          />
          <Input
            label="Data final"
            name="endDate"
            type="date"
            defaultValue={searchParams.get("endDate") ?? ""}
            disabled={isPending}
            required
          />
        </>
      ) : null}

      <div
        className={`flex items-end gap-2 ${period === "custom" ? "sm:col-span-2 lg:col-span-4" : "sm:col-span-2 lg:col-span-1"}`}
      >
        <Button type="submit" className="flex-1" disabled={isPending}>
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
