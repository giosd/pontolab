"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useConfirm } from "@/hooks/useConfirm";
import {
  createTeamAction,
  deactivateTeamAction,
  updateTeamAction,
} from "@/lib/actions/teams";
import type { Team } from "@/types";

interface EquipesManagerProps {
  teams: Team[];
}

export function EquipesManager({ teams }: EquipesManagerProps) {
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditingTeam(undefined);
    setName("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTeam(undefined);
    setName("");
    setError(null);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = editingTeam
        ? await updateTeamAction(editingTeam.id, { name })
        : await createTeamAction({ name });

      if (!result.success) {
        setError(result.error);
        return;
      }

      closeModal();
    });
  };

  const handleDeactivate = async (team: Team) => {
    const confirmed = await confirm({
      title: "Inativar equipe",
      description: `Deseja realmente inativar a equipe ${team.name}?`,
      confirmText: "Inativar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    startTransition(async () => {
      await deactivateTeamAction(team.id);
    });
  };

  return (
    <>
      <PageHeader
        title="Equipes"
        description="Organize usuários e gestores em equipes."
        action={
          <Button type="button" onClick={openCreate}>
            Nova equipe
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
            <thead className="bg-[var(--app-card-secondary)]">
              <tr>
                {["Equipe", "Gestores", "Usuários", "Status", "Ações"].map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-left font-medium text-[var(--app-text-muted)]"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {teams.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[var(--app-text-muted)]"
                  >
                    Nenhuma equipe cadastrada.
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--app-text)]">
                      {team.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                      {team.managerCount ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">
                      {team.userCount ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          team.active
                            ? "bg-[var(--app-card-secondary)] text-[var(--app-text)]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {team.active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1.5"
                          onClick={() => openEdit(team)}
                          disabled={isPending}
                        >
                          Editar
                        </Button>
                        {team.active ? (
                          <Button
                            type="button"
                            variant="danger"
                            className="px-2 py-1.5"
                            onClick={() => handleDeactivate(team)}
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
      </Card>

      <Modal
        open={modalOpen}
        title={editingTeam ? "Editar equipe" : "Nova equipe"}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <Input
            label="Nome da equipe"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
          />

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Salvando..."
                : editingTeam
                  ? "Salvar"
                  : "Criar equipe"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
