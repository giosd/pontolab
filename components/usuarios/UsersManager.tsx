"use client";

import { useState, useTransition } from "react";

import { UserForm } from "@/components/forms/UserForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useConfirm } from "@/hooks/useConfirm";
import {
  deactivateUserAction,
  getUserModulesAction,
} from "@/lib/actions/users";
import { getDefaultModulesForRole, type AppModuleKey } from "@/lib/modules";
import { getUserRoleLabel } from "@/lib/constants";
import type { Team, User } from "@/types";

interface UsersManagerProps {
  users: User[];
  currentUserId: string;
  currentUserRole: string;
  currentUserTeamId: string | null;
  teams: Team[];
}

export function UsersManager({
  users,
  currentUserId,
  currentUserRole,
  currentUserTeamId,
  teams,
}: UsersManagerProps) {
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [editingModules, setEditingModules] = useState<AppModuleKey[] | undefined>();
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditingUser(undefined);
    setEditingModules(getDefaultModulesForRole("USER"));
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    // Abre imediatamente em modo edição com os dados já disponíveis.
    setEditingUser(user);
    setEditingModules(undefined);
    setModalOpen(true);

    // Carrega os módulos do usuário em segundo plano (não-admin).
    if (user.role !== "ADMIN") {
      startTransition(async () => {
        const modules = await getUserModulesAction(user.id);
        setEditingModules(modules);
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(undefined);
    setEditingModules(undefined);
  };

  const handleDeactivate = async (user: User) => {
    const confirmed = await confirm({
      title: "Inativar usuário",
      description: `Deseja realmente inativar o usuário ${user.name}?`,
      confirmText: "Inativar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    startTransition(async () => {
      await deactivateUserAction(user.id);
    });
  };

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários que registram tempo no sistema."
        action={
          <Button type="button" onClick={openCreate}>
            Novo usuário
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-[#D6EEF8] text-sm">
            <thead className="bg-[#F0F8FF]">
              <tr>
                {["Nome", "E-mail", "Perfil", "Status", "Ações"].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 text-left font-medium text-[#38A8D8]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6EEF8] bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#38A8D8]">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F0F8FF]/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#1E5F7A]">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {user.email || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {getUserRoleLabel(user.role)}
                      {user.teamName ? (
                        <span className="block text-xs text-[#38A8D8]">
                          {user.teamName}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge active={user.active} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1.5"
                          onClick={() => openEdit(user)}
                          disabled={isPending}
                        >
                          Editar
                        </Button>
                        {user.active && user.id !== currentUserId ? (
                          <Button
                            type="button"
                            variant="danger"
                            className="px-2 py-1.5"
                            onClick={() => handleDeactivate(user)}
                            disabled={isPending}
                          >
                            Inativar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {users.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#38A8D8]">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-[#D6EEF8] bg-[#F0F8FF]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#1E5F7A]">{user.name}</p>
                    <p className="mt-1 text-sm text-[#38A8D8]">
                      {user.email || "Sem e-mail"} ·{" "}
                      {getUserRoleLabel(user.role)}
                      {user.teamName ? ` · ${user.teamName}` : ""}
                    </p>
                  </div>
                  <StatusBadge active={user.active} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => openEdit(user)}
                    disabled={isPending}
                  >
                    Editar
                  </Button>
                  {user.active && user.id !== currentUserId ? (
                    <Button
                      type="button"
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleDeactivate(user)}
                      disabled={isPending}
                    >
                      Inativar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingUser ? "Editar usuário" : "Novo usuário"}
        onClose={closeModal}
      >
        <UserForm
          key={editingUser?.id ?? "new"}
          mode={editingUser ? "edit" : "create"}
          userId={editingUser?.id}
          initialData={
            editingUser
              ? {
                  name: editingUser.name,
                  email: editingUser.email ?? "",
                  role: editingUser.role,
                  active: editingUser.active,
                  teamId: editingUser.teamId ?? null,
                }
              : undefined
          }
          initialModules={editingModules}
          currentUserRole={currentUserRole}
          currentUserTeamId={currentUserTeamId}
          teams={teams}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>
    </>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-[#D6EEF8] text-[#1E5F7A]"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
