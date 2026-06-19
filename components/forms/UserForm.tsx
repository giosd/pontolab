"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { allowedRolesForCreator } from "@/lib/access-scope";
import {
  createUserAction,
  updateUserAction,
} from "@/lib/actions/users";
import { getUserRoleLabel, type UserRole } from "@/lib/constants";
import {
  getAssignableModules,
  getDefaultModulesForRole,
  type AppModuleKey,
} from "@/lib/modules";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "@/lib/validations";
import type { UserFormMode } from "@/lib/user-update-helpers";
import type { Team } from "@/types";

export interface UserFormInitialData {
  name: string;
  email: string;
  role: string;
  active: boolean;
  teamId: string | null;
}

interface UserFormProps {
  mode: UserFormMode;
  userId?: string;
  initialData?: UserFormInitialData;
  initialModules?: AppModuleKey[];
  currentUserRole: string;
  currentUserTeamId: string | null;
  teams: Team[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({
  mode,
  userId,
  initialData,
  initialModules,
  currentUserRole,
  currentUserTeamId,
  teams,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = mode === "edit";
  const isAdmin = currentUserRole === "ADMIN";

  const roleOptions = useMemo(() => {
    const allowed = allowedRolesForCreator(currentUserRole as UserRole);
    // Ao editar, garante que o papel atual apareça mesmo se fora do conjunto.
    if (initialData?.role && !allowed.includes(initialData.role as UserRole)) {
      return [initialData.role as UserRole, ...allowed];
    }
    return allowed;
  }, [currentUserRole, initialData?.role]);

  const defaultRole = (roleOptions[0] ?? "USER") as UserRole;

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    isAdmin
      ? (initialData?.teamId ?? "")
      : (currentUserTeamId ?? ""),
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues:
      isEditing && initialData
        ? {
            name: initialData.name,
            email: initialData.email ?? "",
            password: "",
            role: initialData.role as CreateUserFormData["role"],
            active: initialData.active,
          }
        : {
            name: "",
            email: "",
            password: "",
            role: defaultRole,
            active: true,
          },
  });

  const role = watch("role");

  const [selectedModules, setSelectedModules] = useState<AppModuleKey[]>(
    initialModules ?? getDefaultModulesForRole(defaultRole),
  );

  useEffect(() => {
    if (initialModules) {
      setSelectedModules(initialModules);
    }
  }, [initialModules]);

  const assignableModules = getAssignableModules(role);

  const toggleModule = (moduleKey: AppModuleKey) => {
    setSelectedModules((current) =>
      current.includes(moduleKey)
        ? current.filter((item) => item !== moduleKey)
        : [...current, moduleKey],
    );
  };

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const teamId = isAdmin
        ? selectedTeamId || null
        : (currentUserTeamId ?? null);

      const payload = {
        ...data,
        teamId,
        modules: role !== "ADMIN" ? selectedModules : undefined,
      };

      const result =
        isEditing && userId
          ? await updateUserAction(userId, payload as UpdateUserFormData)
          : await createUserAction(payload as CreateUserFormData);

      if (!result.success) {
        setError("root", { message: result.error });
        return;
      }

      onSuccess();
    });
  });

  const currentTeamName =
    teams.find((team) => team.id === (currentUserTeamId ?? ""))?.name ??
    "Sua equipe";

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

      <Input
        label={isEditing ? "Nova senha (opcional)" : "Senha"}
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
        disabled={isPending}
      />

      <Select
        label="Perfil"
        options={roleOptions.map((item) => ({
          value: item,
          label: getUserRoleLabel(item),
        }))}
        {...register("role")}
        error={errors.role?.message}
        disabled={isPending}
      />

      {isAdmin ? (
        <Select
          label="Equipe"
          options={[
            { value: "", label: "Sem equipe" },
            ...teams.map((team) => ({ value: team.id, label: team.name })),
          ]}
          value={selectedTeamId}
          onChange={(event) => setSelectedTeamId(event.target.value)}
          disabled={isPending}
        />
      ) : (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] p-3 text-sm text-[var(--app-text)]">
          Equipe: <span className="font-medium">{currentTeamName}</span>
        </div>
      )}

      {isEditing ? (
        <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
          <input
            type="checkbox"
            {...register("active")}
            disabled={isPending}
            className="h-4 w-4 rounded border-[var(--app-border)] text-[var(--app-primary)]"
          />
          Usuário ativo
        </label>
      ) : null}

      {role !== "ADMIN" ? (
        <div className="space-y-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] p-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text)]">
              Módulos liberados
            </h3>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              Perfil é sempre liberado automaticamente.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {assignableModules.map((module) => (
              <label
                key={module.key}
                className="flex items-center gap-2 text-sm text-[var(--app-text)]"
              >
                <input
                  type="checkbox"
                  checked={selectedModules.includes(module.key)}
                  onChange={() => toggleModule(module.key)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-[var(--app-border)] text-[var(--app-primary)]"
                />
                {module.label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--app-text-muted)]">
          Administradores possuem acesso total a todos os módulos.
        </p>
      )}

      {errors.root?.message ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
