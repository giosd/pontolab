"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { updateUserGoalsAction } from "@/lib/actions/hour-balance";
import { TIMER_ROUNDING_OPTIONS } from "@/lib/timer/constants";
import { userGoalsSchema, type UserGoalsFormData } from "@/lib/validations";
import type { UserGoals, User } from "@/types";

interface GoalsSettingsFormProps {
  goals: UserGoals;
  isAdmin: boolean;
  users: User[];
  selectedUserId: string;
}

export function GoalsSettingsForm({
  goals,
  isAdmin,
  users,
  selectedUserId,
}: GoalsSettingsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<UserGoalsFormData>({
    resolver: zodResolver(userGoalsSchema),
    defaultValues: {
      dailyGoalHours: goals.dailyGoalHours,
      weeklyGoalHours: goals.weeklyGoalHours,
      monthlyGoalHours: goals.monthlyGoalHours,
      timerRoundingMinutes: goals.timerRoundingMinutes,
    },
  });

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = event.target.value;
    if (value) {
      params.set("userId", value);
    } else {
      params.delete("userId");
    }
    startNavigation(() => {
      router.push(`/configuracoes?${params.toString()}`);
    });
  };

  const onSubmit = handleSubmit((data) => {
    setMessage(null);
    startSaving(async () => {
      const result = await updateUserGoalsAction(selectedUserId, data);
      if (!result.success) {
        setError("root", { message: result.error });
        return;
      }
      setMessage(result.message ?? "Metas atualizadas.");
    });
  });

  const disabled = isSaving || isNavigating;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isAdmin ? (
        <Select
          label="Usuário"
          options={users.map((user) => ({ value: user.id, label: user.name }))}
          value={selectedUserId}
          onChange={handleUserChange}
          disabled={disabled}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Meta diária (h)"
          type="number"
          step="0.5"
          min="0"
          max="24"
          {...register("dailyGoalHours", { valueAsNumber: true })}
          error={errors.dailyGoalHours?.message}
          disabled={disabled}
        />
        <Input
          label="Meta semanal (h)"
          type="number"
          step="0.5"
          min="0"
          max="168"
          {...register("weeklyGoalHours", { valueAsNumber: true })}
          error={errors.weeklyGoalHours?.message}
          disabled={disabled}
        />
        <Input
          label="Meta mensal (h)"
          type="number"
          step="0.5"
          min="0"
          max="744"
          {...register("monthlyGoalHours", { valueAsNumber: true })}
          error={errors.monthlyGoalHours?.message}
          disabled={disabled}
        />
      </div>

      <Select
        label="Arredondamento do timer"
        options={TIMER_ROUNDING_OPTIONS.map((option) => ({
          value: String(option.value),
          label: option.label,
        }))}
        {...register("timerRoundingMinutes", { valueAsNumber: true })}
        error={errors.timerRoundingMinutes?.message}
        disabled={disabled}
      />

      {errors.root?.message ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {isSaving ? "Salvando..." : "Salvar metas"}
        </Button>
      </div>
    </form>
  );
}
