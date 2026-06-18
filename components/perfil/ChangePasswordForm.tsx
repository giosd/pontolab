"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changePasswordAction } from "@/lib/actions/profile";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validations";

interface ChangePasswordFormProps {
  onSuccess: (message: string) => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await changePasswordAction(data);

      if (!result.success) {
        setError("root", { message: result.error });
        return;
      }

      reset();
      onSuccess(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        {...register("currentPassword")}
        error={errors.currentPassword?.message}
        disabled={isPending}
      />

      <Input
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        {...register("newPassword")}
        error={errors.newPassword?.message}
        disabled={isPending}
      />

      <Input
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
        disabled={isPending}
      />

      {errors.root?.message ? (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
