"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  BALANCE_PERIODS,
  BALANCE_SCOPES,
  type BalancePeriodValue,
} from "@/lib/balance";
import type { User } from "@/types";

interface BancoHorasFiltersProps {
  users: User[];
  isAdmin: boolean;
}

export function BancoHorasFilters({ users, isAdmin }: BancoHorasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialPeriod =
    (searchParams.get("period") as BalancePeriodValue) || "month";
  const [period, setPeriod] = useState<BalancePeriodValue>(initialPeriod);

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
      router.push(`/banco-horas?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setPeriod("month");
    startTransition(() => {
      router.push("/banco-horas");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mb-6 grid gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 sm:grid-cols-2 lg:grid-cols-4 ${isPending ? "opacity-70" : ""}`}
    >
      {isAdmin ? (
        <Select
          label="Usuário"
          name="userId"
          placeholder="Todos (panorama geral)"
          defaultValue={searchParams.get("userId") ?? ""}
          options={users.map((user) => ({ value: user.id, label: user.name }))}
          disabled={isPending}
        />
      ) : null}

      <Select
        label="Período"
        name="period"
        defaultValue={initialPeriod}
        options={BALANCE_PERIODS.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
        disabled={isPending}
        onChange={(event) =>
          setPeriod(event.target.value as BalancePeriodValue)
        }
      />

      {isAdmin ? (
        <Select
          label="Status de aprovação"
          name="scope"
          defaultValue={searchParams.get("scope") ?? "approved"}
          options={BALANCE_SCOPES.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
          disabled={isPending}
        />
      ) : null}

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

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Carregando..." : "Aplicar"}
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
