"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfileAction } from "@/lib/actions/profile";
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/validations";
import type { SafeUser } from "@/types";

interface ProfileFormProps {
  profile: SafeUser;
  onSuccess: (message: string) => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name,
      email: profile.email ?? "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await updateProfileAction(data);

      if (!result.success) {
        setError("root", { message: result.error });
        return;
      }

      onSuccess(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Nome"
        {...register("name")}
        error={errors.name?.message}
        disabled={isPending}
      />

      <Input
        label="E-mail"
        type="email"
        {...register("email")}
        error={errors.email?.message}
        disabled={isPending}
      />

      {errors.root?.message ? (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
