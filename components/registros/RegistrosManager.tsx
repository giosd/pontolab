"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { TimeEntryFilters as TimeEntryFiltersForm } from "@/components/forms/TimeEntryFilters";
import { TimeEntryForm } from "@/components/forms/TimeEntryForm";
import { ExportButtons } from "@/components/export/ExportButtons";
import { RejectTimeEntryModal } from "@/components/time-entries/RejectTimeEntryModal";
import { TimeEntryStatusBadge } from "@/components/time-entries/TimeEntryStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteTimeEntryAction } from "@/lib/actions/time-entries";
import {
  approveTimeEntriesAction,
  approveTimeEntryAction,
  rejectTimeEntriesAction,
  rejectTimeEntryAction,
  reopenTimeEntriesAction,
  reopenTimeEntryAction,
  submitTimeEntriesAction,
  submitTimeEntryAction,
} from "@/lib/actions/time-entry-approval";
import { useConfirm } from "@/hooks/useConfirm";
import { formatDate, formatHours } from "@/lib/dates";
import { buildExportSummary } from "@/lib/export/utils";
import {
  TIME_ENTRY_STATUS,
  getTimeEntryStatusLabel,
} from "@/lib/time-entry-status";
import type { ExportFilters, TimeEntry, TimeEntryFilters, User } from "@/types";

type TimeEntryWithUser = TimeEntry & { user: User };

interface RegistrosManagerProps {
  entries: TimeEntryWithUser[];
  users: User[];
  filters: TimeEntryFilters;
  isAdmin: boolean;
  currentUserId: string;
}

interface EntryPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReopen: boolean;
  canViewReason: boolean;
}

function getPermissions(
  entry: TimeEntryWithUser,
  isAdmin: boolean,
  currentUserId: string,
): EntryPermissions {
  const isOwner = entry.userId === currentUserId;
  const { status } = entry;

  return {
    canEdit:
      status !== TIME_ENTRY_STATUS.APPROVED &&
      (isAdmin || (isOwner && status !== TIME_ENTRY_STATUS.SUBMITTED)),
    canDelete:
      status !== TIME_ENTRY_STATUS.APPROVED &&
      (isAdmin || (isOwner && status === TIME_ENTRY_STATUS.DRAFT)),
    canSubmit:
      (isAdmin || isOwner) &&
      (status === TIME_ENTRY_STATUS.DRAFT ||
        status === TIME_ENTRY_STATUS.REJECTED),
    canApprove: isAdmin && status === TIME_ENTRY_STATUS.SUBMITTED,
    canReject: isAdmin && status === TIME_ENTRY_STATUS.SUBMITTED,
    canReopen: isAdmin && status === TIME_ENTRY_STATUS.APPROVED,
    canViewReason:
      status === TIME_ENTRY_STATUS.REJECTED && Boolean(entry.rejectionReason),
  };
}

type ReasonModalState =
  | { open: false }
  | {
      open: true;
      kind: "reject" | "reopen";
      ids: string[];
    };

export function RegistrosManager({
  entries,
  users,
  filters,
  isAdmin,
  currentUserId,
}: RegistrosManagerProps) {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(
    searchParams.get("new") === "1",
  );
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithUser | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasonModal, setReasonModal] = useState<ReasonModalState>({ open: false });
  const [viewReasonEntry, setViewReasonEntry] =
    useState<TimeEntryWithUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditingEntry(undefined);
    setModalOpen(true);
  };

  const openEdit = (entry: TimeEntryWithUser) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(undefined);
  };

  const runAction = (
    action: () => Promise<{ success: boolean; error?: string }>,
    onSuccess?: () => void,
  ) => {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setActionError(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      onSuccess?.();
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectableIds = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (selectableIds.every((id) => current.has(id))) {
        return new Set();
      }
      return new Set(selectableIds);
    });
  };

  const handleDelete = async (entry: TimeEntryWithUser) => {
    const confirmed = await confirm({
      title: "Excluir registro",
      description: `Deseja excluir o registro "${entry.task}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    runAction(() => deleteTimeEntryAction(entry.id));
  };

  const handleSubmit = async (entry: TimeEntryWithUser) => {
    const confirmed = await confirm({
      title: "Enviar para aprovação",
      description: `Deseja enviar o registro "${entry.task}" para aprovação?`,
      confirmText: "Enviar",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!confirmed) return;

    runAction(() => submitTimeEntryAction(entry.id));
  };

  const handleApprove = async (entry: TimeEntryWithUser) => {
    const confirmed = await confirm({
      title: "Aprovar registro",
      description: `Deseja aprovar o registro "${entry.task}"?`,
      confirmText: "Aprovar",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!confirmed) return;

    runAction(() => approveTimeEntryAction(entry.id));
  };

  const handleReject = (entry: TimeEntryWithUser) => {
    setReasonModal({ open: true, kind: "reject", ids: [entry.id] });
  };

  const handleReopen = (entry: TimeEntryWithUser) => {
    setReasonModal({ open: true, kind: "reopen", ids: [entry.id] });
  };

  const handleBulkSubmit = async () => {
    const ids = [...selectedIds];
    const confirmed = await confirm({
      title: "Enviar selecionados",
      description: `Deseja enviar ${ids.length} registro(s) para aprovação? Apenas rascunhos e rejeitados serão enviados.`,
      confirmText: "Enviar",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!confirmed) return;

    runAction(() => submitTimeEntriesAction(ids), clearSelection);
  };

  const handleBulkApprove = async () => {
    const ids = [...selectedIds];
    const confirmed = await confirm({
      title: "Aprovar selecionados",
      description: `Deseja aprovar ${ids.length} registro(s)? Apenas registros enviados serão aprovados.`,
      confirmText: "Aprovar",
      cancelText: "Cancelar",
      variant: "info",
    });

    if (!confirmed) return;

    runAction(() => approveTimeEntriesAction(ids), clearSelection);
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonModal.open) return;
    const { kind, ids } = reasonModal;
    const isBulk = ids.length > 1;

    const action = () => {
      if (kind === "reject") {
        return isBulk
          ? rejectTimeEntriesAction(ids, reason)
          : rejectTimeEntryAction(ids[0], reason);
      }
      return isBulk
        ? reopenTimeEntriesAction(ids, reason)
        : reopenTimeEntryAction(ids[0], reason);
    };

    runAction(action, () => {
      clearSelection();
      setReasonModal({ open: false });
    });
  };

  const exportData = entries.map((entry) => ({
    date: entry.date,
    userName: entry.user.name,
    task: entry.task,
    activity: entry.activity,
    hours: entry.hours,
    comment: entry.comment,
    status: entry.status,
  }));

  const exportSummary = buildExportSummary(exportData, filters);

  const exportFilters: ExportFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    userName: users.find((user) => user.id === filters.userId)?.name,
    activity: filters.activity,
    task: filters.task,
  };

  const selectionCount = selectedIds.size;

  const renderRowActions = (entry: TimeEntryWithUser, layout: "table" | "card") => {
    const permissions = getPermissions(entry, isAdmin, currentUserId);
    const buttonClass = layout === "table" ? "px-2 py-1.5" : "flex-1";

    const buttons: ReactNode[] = [];

    if (permissions.canEdit) {
      buttons.push(
        <Button
          key="edit"
          type="button"
          variant={layout === "table" ? "ghost" : "secondary"}
          className={buttonClass}
          onClick={() => openEdit(entry)}
          disabled={isPending}
        >
          Editar
        </Button>,
      );
    }

    if (permissions.canSubmit) {
      buttons.push(
        <Button
          key="submit"
          type="button"
          variant="submit"
          className={buttonClass}
          onClick={() => handleSubmit(entry)}
          disabled={isPending}
        >
          {entry.status === TIME_ENTRY_STATUS.REJECTED ? "Reenviar" : "Enviar"}
        </Button>,
      );
    }

    if (permissions.canApprove) {
      buttons.push(
        <Button
          key="approve"
          type="button"
          variant="approve"
          className={buttonClass}
          onClick={() => handleApprove(entry)}
          disabled={isPending}
        >
          Aprovar
        </Button>,
      );
    }

    if (permissions.canReject) {
      buttons.push(
        <Button
          key="reject"
          type="button"
          variant="danger"
          className={buttonClass}
          onClick={() => handleReject(entry)}
          disabled={isPending}
        >
          Rejeitar
        </Button>,
      );
    }

    if (permissions.canReopen) {
      buttons.push(
        <Button
          key="reopen"
          type="button"
          variant="reopen"
          className={buttonClass}
          onClick={() => handleReopen(entry)}
          disabled={isPending}
        >
          Reabrir
        </Button>,
      );
    }

    if (permissions.canViewReason) {
      buttons.push(
        <Button
          key="reason"
          type="button"
          variant={layout === "table" ? "ghost" : "secondary"}
          className={buttonClass}
          onClick={() => setViewReasonEntry(entry)}
          disabled={isPending}
        >
          Ver motivo
        </Button>,
      );
    }

    if (permissions.canDelete) {
      buttons.push(
        <Button
          key="delete"
          type="button"
          variant="danger"
          className={buttonClass}
          onClick={() => handleDelete(entry)}
          disabled={isPending}
        >
          Excluir
        </Button>,
      );
    }

    if (buttons.length === 0) {
      return (
        <span className="text-xs text-[#38A8D8]">Sem ações disponíveis</span>
      );
    }

    return buttons;
  };

  return (
    <>
      <PageHeader
        title="Registros de tempo"
        description="Consulte e gerencie os lançamentos de horas da equipe."
        action={
          <Button type="button" onClick={openCreate}>
            Novo registro
          </Button>
        }
      />

      <TimeEntryFiltersForm users={users} isAdmin={isAdmin} />

      <div className="mb-4">
        <ExportButtons
          data={exportData}
          summary={exportSummary}
          filters={exportFilters}
          disabled={entries.length === 0}
        />
      </div>

      {actionError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      ) : null}

      {selectionCount > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#D6EEF8] bg-[#F0F8FF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#1E5F7A]">
            {selectionCount} registro(s) selecionado(s)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="submit"
              className="px-3 py-1.5"
              onClick={handleBulkSubmit}
              disabled={isPending}
            >
              Enviar selecionados
            </Button>
            {isAdmin ? (
              <>
                <Button
                  type="button"
                  variant="approve"
                  className="px-3 py-1.5"
                  onClick={handleBulkApprove}
                  disabled={isPending}
                >
                  Aprovar selecionados
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="px-3 py-1.5"
                  onClick={() =>
                    setReasonModal({
                      open: true,
                      kind: "reject",
                      ids: [...selectedIds],
                    })
                  }
                  disabled={isPending}
                >
                  Rejeitar selecionados
                </Button>
                <Button
                  type="button"
                  variant="reopen"
                  className="px-3 py-1.5"
                  onClick={() =>
                    setReasonModal({
                      open: true,
                      kind: "reopen",
                      ids: [...selectedIds],
                    })
                  }
                  disabled={isPending}
                >
                  Reabrir selecionados
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1.5"
              onClick={clearSelection}
              disabled={isPending}
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-[#D6EEF8] text-sm">
            <thead className="bg-[#F0F8FF]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={entries.length === 0}
                    className="h-4 w-4 rounded border-[#D6EEF8] text-[#38A8D8]"
                  />
                </th>
                {[
                  "Data",
                  "Usuário",
                  "Tarefa",
                  "Atividade",
                  "Horas",
                  "Status",
                  "Comentário",
                  "Ações",
                ].map((column) => (
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
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#38A8D8]">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F0F8FF]/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${entry.task}`}
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelection(entry.id)}
                        className="h-4 w-4 rounded border-[#D6EEF8] text-[#38A8D8]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {formatDate(entry.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {entry.user.name}
                    </td>
                    <td className="px-4 py-3 text-[#1E5F7A]">{entry.task}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {entry.activity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#1E5F7A]">
                      {formatHours(entry.hours)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <TimeEntryStatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-3 text-[#38A8D8]">
                      {entry.comment || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {renderRowActions(entry, "table")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#38A8D8]">
              Nenhum registro encontrado.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[#D6EEF8] bg-[#F0F8FF]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${entry.task}`}
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleSelection(entry.id)}
                      className="mt-1 h-4 w-4 rounded border-[#D6EEF8] text-[#38A8D8]"
                    />
                    <span>
                      <span className="block font-medium text-[#1E5F7A]">
                        {entry.task}
                      </span>
                      <span className="mt-1 block text-sm text-[#38A8D8]">
                        {entry.user.name}
                      </span>
                    </span>
                  </label>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#1E5F7A]">
                    {formatHours(entry.hours)}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[#38A8D8]">Data</dt>
                    <dd className="text-[#1E5F7A]">{formatDate(entry.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#38A8D8]">Atividade</dt>
                    <dd className="text-[#1E5F7A]">{entry.activity}</dd>
                  </div>
                  <div>
                    <dt className="text-[#38A8D8]">Status</dt>
                    <dd className="mt-0.5">
                      <TimeEntryStatusBadge status={entry.status} />
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[#38A8D8]">Comentário</dt>
                    <dd className="text-[#1E5F7A]">{entry.comment || "—"}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap gap-2">
                  {renderRowActions(entry, "card")}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingEntry ? "Editar registro" : "Novo registro"}
        onClose={closeModal}
      >
        <TimeEntryForm
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          entry={editingEntry}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      {reasonModal.open ? (
        <RejectTimeEntryModal
          open
          title={
            reasonModal.kind === "reopen" ? "Reabrir registro" : "Rejeitar registro"
          }
          description={
            reasonModal.kind === "reopen"
              ? "Informe o motivo da reabertura. O registro voltará para rascunho."
              : "Informe o motivo da rejeição. Ele ficará visível para o usuário."
          }
          label={
            reasonModal.kind === "reopen"
              ? "Motivo da reabertura"
              : "Motivo da rejeição"
          }
          confirmText={reasonModal.kind === "reopen" ? "Reabrir" : "Rejeitar"}
          confirmVariant={reasonModal.kind === "reopen" ? "primary" : "danger"}
          loading={isPending}
          onConfirm={handleReasonConfirm}
          onCancel={() => setReasonModal({ open: false })}
        />
      ) : null}

      <Modal
        open={viewReasonEntry !== null}
        title="Motivo da rejeição"
        onClose={() => setViewReasonEntry(null)}
      >
        <div className="space-y-3">
          {viewReasonEntry ? (
            <>
              <p className="text-sm text-[var(--app-text-muted)]">
                Registro:{" "}
                <span className="font-medium text-[var(--app-text)]">
                  {viewReasonEntry.task}
                </span>{" "}
                ({getTimeEntryStatusLabel(viewReasonEntry.status)})
              </p>
              <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-3 py-2.5 text-sm text-[var(--app-text)]">
                {viewReasonEntry.rejectionReason}
              </p>
            </>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setViewReasonEntry(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
