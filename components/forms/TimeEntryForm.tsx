"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createTimeEntryAction,
  updateTimeEntryAction,
} from "@/lib/actions/time-entries";
import { ACTIVITIES } from "@/lib/constants";
import { timeEntrySchema, type TimeEntryFormData } from "@/lib/validations";
import type { TimeEntry, User } from "@/types";

interface TimeEntryFormProps {
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  entry?: TimeEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TimeEntryForm({
  users,
  currentUserId,
  isAdmin,
  entry,
  onSuccess,
  onCancel,
}: TimeEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(entry);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      task: entry?.task ?? "",
      userId: entry?.userId ?? currentUserId,
      date: entry?.date
        ? format(new Date(entry.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      hours: entry?.hours ?? undefined,
      comment: entry?.comment ?? "",
      activity: entry?.activity ?? "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const payload = {
        ...data,
        userId: isAdmin ? data.userId : currentUserId,
      };

      const result = isEditing
        ? await updateTimeEntryAction(entry!.id, payload)
        : await createTimeEntryAction(payload);

      if (!result.success) {
        setError("root", { message: result.error });
        return;
      }

      onSuccess();
    });
  });

  const activeUsers = users.filter((user) => user.active);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Tarefa"
        {...register("task")}
        error={errors.task?.message}
        disabled={isPending}
      />

      {isAdmin ? (
        <Select
          label="Usuário"
          placeholder="Selecione um usuário"
          options={activeUsers.map((user) => ({
            value: user.id,
            label: user.name,
          }))}
          {...register("userId")}
          error={errors.userId?.message}
          disabled={isPending}
        />
      ) : (
        <input type="hidden" {...register("userId")} />
      )}

      <Input
        label="Data"
        type="date"
        {...register("date")}
        error={errors.date?.message}
        disabled={isPending}
      />

      <Input
        label="Horas"
        type="number"
        step="0.25"
        min="0.25"
        max="24"
        {...register("hours", { valueAsNumber: true })}
        error={errors.hours?.message}
        disabled={isPending}
      />

      <Select
        label="Atividade"
        placeholder="Selecione uma atividade"
        options={ACTIVITIES.map((activity) => ({
          value: activity,
          label: activity,
        }))}
        {...register("activity")}
        error={errors.activity?.message}
        disabled={isPending}
      />

      <div className="space-y-1.5">
        <label htmlFor="comment" className="block text-sm font-medium text-[#1E5F7A]">
          Comentário
        </label>
        <textarea
          id="comment"
          rows={3}
          {...register("comment")}
          disabled={isPending}
          className="w-full rounded-xl border border-[#D6EEF8] bg-white px-3 py-2.5 text-sm text-[#1E5F7A] outline-none transition-colors placeholder:text-[#7CC7E8] focus:border-[#7CC7E8] focus:ring-2 focus:ring-[#7CC7E8]/30"
        />
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar registro"}
        </Button>
      </div>
    </form>
  );
}
